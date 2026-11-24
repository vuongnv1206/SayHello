// Mở thử thiệp mẫu bản 2 trong Chromium khổ điện thoại, ở từng mức chuyển động.
//   node tests/thiep-v2.mjs [gốc=http://localhost:3000] [thư mục ảnh chụp]
// Cần: `npm run dev:legacy` (ảnh mẫu) và Next đang chạy. Báo lỗi khi có lỗi JS, thiếu file, bìa không mở,
// thiếu cảnh, tên khách không được điền, gửi xác nhận / lời chúc không thành công.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const SHOTS = process.argv[3] || '';
const THEMES = ['cuon-phim'];
const GUEST = 'Chị Lan';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const failures = [];

for (const id of THEMES) for (const tier of ['cinematic', 'standard', 'lite']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(vietqr|fonts)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  const shot = async name => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${id}-${tier}-${name}.png`) }); };

  await page.goto(`${BASE}/v2/demo/${id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 }).catch(() => errors.push('runtime không khởi động (thiếu sh-ready)'));
  if ((await page.getAttribute('html', 'data-motion')) !== tier) errors.push(`mức chuyển động là ${await page.getAttribute('html', 'data-motion')}, mong đợi ${tier}`);
  const guestText = await page.textContent('.sh-gate [data-guest]').catch(() => '');
  if (guestText !== GUEST) errors.push(`tên khách trên bìa là "${guestText}"`);
  await page.waitForTimeout(600);
  await shot('0-bia');

  // Kéo cần máy chiếu (chạm), chờ thiệp mở
  await page.click('.lever');
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-open'), null, { timeout: 6000 }).catch(() => errors.push('bìa không mở sau khi kéo cần'));
  await page.waitForTimeout(tier === 'lite' ? 400 : 1600);
  if (!(await page.$eval('.sh-gate', g => g.hidden).catch(() => false))) errors.push('bìa không ẩn sau khi mở');

  // Cuộn qua toàn bộ thiệp như khách thật, chụp mỗi cảnh
  const scenes = await page.$$eval('[data-scene]', els => els.map(e => e.id));
  for (const need of ['mo-man', 've-moi', 'giu-ghe', 'danh-de']) if (!scenes.includes(need)) errors.push('thiếu cảnh ' + need);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const marks = await page.$$eval('.sh-scene', els => els.map(e => ({ id: e.id, y: e.getBoundingClientRect().top + scrollY })));
  let next = 0;
  for (let y = 0; y <= total; y += 300) {
    await page.evaluate(y => scrollTo(0, y), y);
    await page.waitForTimeout(70);
    while (next < marks.length && y >= marks[next].y) { await page.waitForTimeout(250); await shot(`${next + 1}-${marks[next].id}`); next++; }
  }
  // Ghim cảnh làm trang dài ra sau khi GSAP chạy: chụp lại vị trí mới của từng cảnh
  if (tier !== 'lite') {  // standard và cinematic đều ghim cảnh
    const pinned = await page.evaluate(() => !!document.querySelector('.pin-spacer'));
    if (!pinned) errors.push('mức standard nhưng không có cảnh nào được ghim (GSAP không chạy?)');
  }

  // Tên khách tự điền vào form, gửi xác nhận và lời chúc (thiệp mẫu không có sheetUrl: lưu trên máy)
  const nameVal = await page.inputValue('#giu-ghe form[data-sh=rsvp] input[name=name]');
  if (nameVal !== GUEST) errors.push(`ô tên xác nhận là "${nameVal}"`);
  await page.click('#giu-ghe form[data-sh=rsvp] [type=submit]');
  await page.waitForTimeout(300);
  const rsvpMsg = await page.textContent('#giu-ghe form[data-sh=rsvp] .sh-msg');
  if (!/Cảm ơn/.test(rsvpMsg)) errors.push(`gửi xác nhận: "${rsvpMsg}"`);
  await page.fill('#giu-ghe form[data-sh=wish] textarea', 'Chúc hai bạn trăm năm hạnh phúc!');
  await page.click('#giu-ghe form[data-sh=wish] [type=submit]');
  await page.waitForTimeout(300);
  const sub = await page.textContent('#giu-ghe .subtitle');
  if (!/trăm năm/.test(sub)) errors.push(`lời chúc không chạy thành phụ đề: "${sub}"`);

  // Xé vé hiện nút chỉ đường; ngăn kéo Thông tin nhanh mở được
  await page.locator('#ve-moi .tk-stub').first().click();
  if (!(await page.locator('#ve-moi .ticket.torn .tk-actions a').first().isVisible())) errors.push('xé vé không hiện nút chỉ đường');
  await page.click('[data-sh=quick-open]');
  if (!(await page.isVisible('#sh-quick'))) errors.push('Thông tin nhanh không mở');
  await shot('9-thong-tin-nhanh');

  // Nhạc bắt đầu từ cú chạm lên bìa (thiệp mẫu có nhạc)
  if (await page.$('#sh-audio')) {
    const playing = await page.$eval('#sh-audio', a => !a.paused);
    if (!playing) errors.push('nhạc nền không phát sau khi chạm bìa');
  }

  console.log(`${errors.length ? '✗' : '✓'} ${id} · ${tier}`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/${tier}: ${e}`));
  await ctx.close();
}
// Nhóm khách ?n=: chỉ còn buổi lễ của nhóm, có lời chào riêng; mã nhóm lạ thì giữ nguyên thiệp
for (const id of THEMES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  await page.goto(`${BASE}/v2/demo/${id}/?n=nha-gai&open=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'));
  const shown = await page.$$eval('#ve-moi [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
  if (shown.join() !== '0') errors.push(`nhóm nhà gái thấy các buổi ${shown.join()}, mong đợi chỉ buổi 0`);
  const note = await page.textContent('[data-sh=group-note] p');
  if (!/họ nhà gái/.test(note) || await page.$eval('[data-sh=group-note]', n => n.hidden)) errors.push('không hiện lời chào của nhóm');
  await page.goto(`${BASE}/v2/demo/${id}/?n=khong-co&open=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'));
  if (await page.$$eval('#ve-moi [data-ev][hidden]', els => els.length)) errors.push('mã nhóm lạ vẫn ẩn buổi lễ');
  console.log(`${errors.length ? '✗' : '✓'} ${id} · nhóm khách`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/nhóm: ${e}`));
  await ctx.close();
}
// Phòng Triển Lãm Đêm: bật công tắc mở thiệp; mức cao dựng cảnh 3D (hoặc rơi về sách phẳng nếu máy không có
// WebGL, nhưng không bao giờ kẹt ở màn "đang bật đèn"); dán chấm đỏ giữ chỗ; nhóm khách lọc tường thông tin.
for (const tier of ['cinematic', 'lite']) {
  const id = 'phong-trien-lam';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(vietqr|fonts)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/v2/demo/${id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}&n=nha-gai`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 }).catch(() => errors.push('runtime không khởi động'));
  if ((await page.textContent('.sh-gate [data-guest]').catch(() => '')) !== GUEST) errors.push('tên khách trên bìa sai');
  await page.click('.ptl-switch');
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-open'), null, { timeout: 6000 }).catch(() => errors.push('bật công tắc không mở thiệp'));
  const works = await page.$$eval('#phong .ptl-s-work', els => els.length);
  if (works < 6) errors.push(`chỉ có ${works} ảnh trong phòng tranh`);
  if (tier !== 'lite') {
    const state = await page.waitForFunction(() => {
      const c = document.documentElement.classList;
      return c.contains('ptl-ready') ? '3d' : !c.contains('ptl-3d') && document.querySelector('.sh-gate')?.hidden ? 'phang' : '';
    }, null, { timeout: 45000 }).then(h => h.jsonValue()).catch(() => '');
    if (!state) errors.push('kẹt ở màn "đang bật đèn": cảnh 3D không lên mà cũng không rơi về bản phẳng');
    else console.log(`   (cảnh ${state === '3d' ? '3D' : 'phẳng, máy không có WebGL'})`);
  } else if (await page.evaluate(() => document.documentElement.classList.contains('ptl-3d'))) errors.push('mức lite vẫn dựng cảnh 3D');
  const evs = await page.$$eval('#phong .ptl-track .ptl-evs [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
  if (evs.join() !== '0') errors.push(`nhóm nhà gái thấy buổi ${evs.join()} trên tường thông tin`);
  await page.locator('#le-tan').scrollIntoViewIfNeeded();
  if ((await page.inputValue('#le-tan form[data-sh=rsvp] input[name=name]')) !== GUEST) errors.push('ô tên giữ chỗ không tự điền');
  // Chọn bức ảnh thích nhất (số 3) rồi dán chấm đỏ: chấm đỏ nằm trên đúng bức đó, ghi chú gửi kèm số ảnh
  await page.click('#le-tan .ptl-thumb[data-fav="3"]');
  await page.click('#le-tan form[data-sh=rsvp] [type=submit]');
  await page.waitForTimeout(400);
  if (!/Cảm ơn/.test(await page.textContent('#le-tan form[data-sh=rsvp] .sh-msg'))) errors.push('gửi giữ chỗ không thành công');
  if (!(await page.$('#le-tan .ptl-thumb[data-fav="3"] .ptl-dot.is-on'))) errors.push('không dán chấm đỏ lên bức ảnh đã chọn');
  if (!/Thích ảnh số 3/.test(await page.inputValue('#le-tan form[data-sh=rsvp] input[name=note]'))) errors.push('ghi chú không kèm bức ảnh khách thích');
  // Trên điện thoại, nội dung tràn làm trình duyệt nới rộng khung nhìn (innerWidth > 390) và thu nhỏ cả trang
  const wide = await page.evaluate(() => innerWidth > 390 || document.documentElement.scrollWidth > innerWidth
    ? [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 391).slice(0, 4).map(e => `${e.tagName.toLowerCase()}.${e.className}`).join(', ') || 'không rõ' : '');
  if (wide) errors.push('trang tràn ngang ở khổ 390px: ' + wide);
  console.log(`${errors.length ? '✗' : '✓'} ${id} · ${tier}`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/${tier}: ${e}`));
  await ctx.close();
}
// Hồ Gương: chạm mặt nước mở thiệp; cảnh 3D lên hoặc rơi về bản phẳng (không kẹt màn sương); xem ảnh toàn màn hình;
// cọc đo nước có số ngày; thả hoa đăng giữ chỗ; nhóm khách lọc bến đón khách; không tràn ngang.
for (const tier of ['cinematic', 'lite']) {
  const id = 'ho-guong';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(vietqr|fonts)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/v2/demo/${id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}&n=nha-gai`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 }).catch(() => errors.push('runtime không khởi động'));
  if ((await page.textContent('.sh-gate [data-guest]').catch(() => '')) !== GUEST) errors.push('tên khách trên bìa sai');
  await page.click('.hg-touch');
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-open'), null, { timeout: 6000 }).catch(() => errors.push('chạm mặt nước không mở thiệp'));
  if ((await page.$$eval('#ho .hg-track img[data-i]', els => els.length)) < 6) errors.push('ít hơn 6 ảnh trên mặt hồ');
  if (tier !== 'lite') {
    const state = await page.waitForFunction(() => {
      const c = document.documentElement.classList;
      return c.contains('hg-ready') ? '3d' : !c.contains('hg-3d') && document.querySelector('.sh-gate')?.hidden ? 'phang' : '';
    }, null, { timeout: 45000 }).then(h => h.jsonValue()).catch(() => '');
    if (!state) errors.push('kẹt ở màn sương: cảnh 3D không lên mà cũng không rơi về bản phẳng');
    else console.log(`   (cảnh ${state === '3d' ? '3D' : 'phẳng, máy không có WebGL'})`);
  } else {
    if (await page.evaluate(() => document.documentElement.classList.contains('hg-3d'))) errors.push('mức lite vẫn dựng cảnh 3D');
    await page.click('#ho .hg-track img[data-i="0"]');
    if (!(await page.isVisible('.hg-view'))) errors.push('chạm ảnh không mở chế độ xem ảnh');
    await page.click('.hg-v-close');
  }
  if (!/ngày|vạch/.test(await page.textContent('#ho .hg-track [data-days]'))) errors.push('cọc đo nước không ghi số ngày');
  const evs = await page.$$eval('#ho .hg-track .hg-evs [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
  if (evs.join() !== '0') errors.push(`nhóm nhà gái thấy buổi ${evs.join()} ở bến đón khách`);
  await page.locator('#ben').scrollIntoViewIfNeeded();
  if ((await page.inputValue('#ben form[data-sh=rsvp] input[name=name]')) !== GUEST) errors.push('ô tên giữ chỗ không tự điền');
  await page.click('#ben form[data-sh=rsvp] [type=submit]');
  await page.waitForTimeout(400);
  if (!/Cảm ơn/.test(await page.textContent('#ben form[data-sh=rsvp] .sh-msg'))) errors.push('thả hoa đăng giữ chỗ không thành công');
  if (!(await page.$('#ben .hg-lantern.is-off'))) errors.push('đèn hoa đăng không trôi đi sau khi giữ chỗ');
  if (await page.evaluate(() => innerWidth > 390 || document.documentElement.scrollWidth > innerWidth)) errors.push('trang tràn ngang ở khổ 390px');
  console.log(`${errors.length ? '✗' : '✓'} ${id} · ${tier}`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/${tier}: ${e}`));
  await ctx.close();
}
// Bầu Trời Ảnh: ngước lên mở thiệp; cảnh 3D lên hoặc rơi về bản phẳng; ảnh là đốm sáng chạm để xem;
// la bàn có vạch cho từng ảnh; thả đom đóm giữ chỗ; nhóm khách lọc nơi đón khách; không tràn ngang.
for (const tier of ['cinematic', 'lite']) {
  const id = 'bau-troi-anh';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(vietqr|fonts)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/v2/demo/${id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}&n=nha-gai`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 }).catch(() => errors.push('runtime không khởi động'));
  if ((await page.textContent('.sh-gate [data-guest]').catch(() => '')) !== GUEST) errors.push('tên khách trên bìa sai');
  await page.click('.bt-up');
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-open'), null, { timeout: 6000 }).catch(() => errors.push('ngước lên không mở thiệp'));
  // Lời chào của nhóm nằm ở mép trên, đè lên ngôi sao đầu tiên: khách đọc xong thì đóng
  if (!(await page.$eval('[data-sh=group-note]', n => n.hidden))) await page.click('[data-sh=group-note] .sh-x');
  const photos = await page.$$eval('#troi .bt-photo', els => els.length);
  if (photos < 6) errors.push(`chỉ có ${photos} ảnh trên trời`);
  if ((await page.$$eval('#troi .bt-tick', els => els.length)) !== photos) errors.push('la bàn thiếu vạch cho ảnh');
  if (tier !== 'lite') {
    const state = await page.waitForFunction(() => {
      const c = document.documentElement.classList;
      return c.contains('bt-ready') ? '3d' : !c.contains('bt-3d') && document.querySelector('.sh-gate')?.hidden ? 'phang' : '';
    }, null, { timeout: 45000 }).then(h => h.jsonValue()).catch(() => '');
    if (!state) errors.push('kẹt ở màn chờ: cảnh 3D không lên mà cũng không rơi về bản phẳng');
    else console.log(`   (cảnh ${state === '3d' ? '3D' : 'phẳng, máy không có WebGL'})`);
  } else {
    if (await page.evaluate(() => document.documentElement.classList.contains('bt-3d'))) errors.push('mức lite vẫn dựng cảnh 3D');
    await page.click('#troi .bt-photo[data-i="0"]');
    if (!(await page.isVisible('.bt-view'))) errors.push('chạm ảnh không mở chế độ xem ảnh');
    await page.click('.bt-v-close');
  }
  const evs = await page.$$eval('#troi .bt-plates .bt-evs [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
  if (evs.join() !== '0') errors.push(`nhóm nhà gái thấy buổi ${evs.join()} ở nơi đón khách`);
  await page.locator('#san').scrollIntoViewIfNeeded();
  if ((await page.inputValue('#san form[data-sh=rsvp] input[name=name]')) !== GUEST) errors.push('ô tên giữ chỗ không tự điền');
  await page.click('#san form[data-sh=rsvp] [type=submit]');
  await page.waitForTimeout(400);
  if (!/Cảm ơn/.test(await page.textContent('#san form[data-sh=rsvp] .sh-msg'))) errors.push('thả đom đóm giữ chỗ không thành công');
  if (!(await page.$('#san .bt-fly.is-up'))) errors.push('đom đóm không bay lên sau khi giữ chỗ');
  if (await page.evaluate(() => innerWidth > 390 || document.documentElement.scrollWidth > innerWidth)) errors.push('trang tràn ngang ở khổ 390px');
  console.log(`${errors.length ? '✗' : '✓'} ${id} · ${tier}`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/${tier}: ${e}`));
  await ctx.close();
}
// Tạp Chí Cưới: không có màn chờ; màn đầu đã có tên, ngày, nơi (tiêu chí H1); dòng tít bìa dẫn tới đúng trang;
// dòng số trang có nút Trả lời; chạm ảnh mở xem lớn; phiếu trả lời gửi được; nhóm khách lọc buổi lễ; không tràn ngang.
for (const tier of ['standard', 'lite']) {
  const id = 'tap-chi-cuoi';
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource.*(vietqr|fonts)/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE)) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/v2/demo/${id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}&n=nha-gai`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 }).catch(() => errors.push('runtime không khởi động'));
  if (!(await page.$eval('[data-sh=group-note]', n => n.hidden))) await page.click('[data-sh=group-note] .sh-x');
  // H1: không thao tác gì, màn đầu đã thấy tên hai người và ngày
  const first = await page.evaluate(() => {
    const vis = el => { const r = el?.getBoundingClientRect(); return !!r && r.top >= 0 && r.bottom <= innerHeight && r.height > 0; };
    return { names: vis(document.querySelector('.tc-names .n2')), date: vis(document.querySelector('.tc-lines li:first-child b')) };
  });
  if (!first.names || !first.date) errors.push(`màn đầu thiếu ${!first.names ? 'tên' : ''} ${!first.date ? 'ngày' : ''}`);
  if (!(await page.textContent('#bia [data-guest]')).includes(GUEST)) errors.push('tên khách trên bìa sai');
  const photos = await page.$$eval('.tc-open', els => els.length);
  if (photos < 6) errors.push(`chỉ có ${photos} ảnh trong ruột`);
  await page.locator('.tc-open').first().click();
  if (!(await page.isVisible('.tc-view'))) errors.push('chạm ảnh không mở xem ảnh lớn');
  await page.click('.tc-view [data-step="1"]');
  if (!/^2 \//.test(await page.textContent('.tc-view-n'))) errors.push('nút ảnh sau không chuyển ảnh');
  await page.click('.tc-view-x');
  const evs = await page.$$eval('#lich [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
  if (evs.join() !== '0') errors.push(`nhóm nhà gái thấy buổi ${evs.join()} ở trang lịch`);
  await page.evaluate(() => scrollTo(0, innerHeight * 2));
  await page.waitForTimeout(500);
  if (!(await page.isVisible('.tc-folio .tc-reply'))) errors.push('dòng số trang không có nút Trả lời');
  await page.click('.tc-folio .tc-reply');
  await page.waitForTimeout(600);
  if ((await page.inputValue('#phieu form[data-sh=rsvp] input[name=name]')) !== GUEST) errors.push('ô tên trong phiếu không tự điền');
  await page.click('#phieu form[data-sh=rsvp] [type=submit]');
  await page.waitForTimeout(400);
  if (!/Cảm ơn/.test(await page.textContent('#phieu form[data-sh=rsvp] .sh-msg'))) errors.push('gửi phiếu trả lời không thành công');
  if (await page.evaluate(() => innerWidth > 390 || document.documentElement.scrollWidth > innerWidth)) errors.push('trang tràn ngang ở khổ 390px');
  console.log(`${errors.length ? '✗' : '✓'} ${id} · ${tier}`);
  errors.forEach(e => console.log('   ' + e));
  failures.push(...errors.map(e => `${id}/${tier}: ${e}`));
  await ctx.close();
}
await browser.close();
if (failures.length) { console.log(`\n${failures.length} lỗi`); process.exit(1); }
console.log('\nThiệp bản 2 đều ổn');
