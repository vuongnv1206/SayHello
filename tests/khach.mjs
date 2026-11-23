// Kiểm tra nhóm khách (?n=) trên thiệp và trang quản lý khách (link theo nhóm, ảnh thẻ mời có QR).
// Google Sheet được giả bằng route của trình duyệt, không gọi mạng thật.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), HOST = 'http://sayhello.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.otf': 'font/otf', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const SLUG = 'demo-song-hy', OUT = process.env.KHACH_TEST_OUT || '';
const GROUPS = [{ id: 'nha-gai', label: 'Họ nhà gái', greeting: 'Kính mời họ nhà gái', events: [0], place: 1, note: 'Xe đón lúc 7:00 tại nhà gái' }];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const posts = [];
async function open(withGroups = false) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.route(HOST + '/**', route => {
    const u = new URL(route.request().url());
    if (u.pathname === '/exec' && route.request().method() === 'POST') { posts.push(JSON.parse(route.request().postData())); return route.fulfill({ contentType: 'application/json', body: '{"ok":true}' }); }
    if (u.pathname === '/exec') { // Google Sheet giả
      const t = u.searchParams.get('type');
      const body = t === 'guests' ? { rsvps: [{ at: '2027-01-01T00:00:00Z', name: 'Chị Lan', attend: 'Có', guests: 2, side: 'Nhà gái', gid: 'a1' }], wishes: [{ at: '2027-01-02T00:00:00.000Z', name: 'Bác Hải', message: 'Trăm năm hạnh phúc', hidden: false }] }
        : t === 'content' ? { content: { guestGroups: GROUPS } } : t === 'invite_list' ? { list: [] } : {};
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }
    let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
    const f = join(ROOT, p);
    if (!existsSync(f)) return route.fulfill({ status: 404, body: '' });
    let body = readFileSync(f);
    if (p === `/${SLUG}/invite.json`) { const d = JSON.parse(body); d.sheetUrl = HOST + '/exec'; if (withGroups) d.guestGroups = GROUPS; body = JSON.stringify(d); }
    route.fulfill({ status: 200, contentType: TYPES[extname(f).toLowerCase()] || 'application/octet-stream', body });
  });
  await ctx.route(url => !url.href.startsWith(HOST), r => r.abort());
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return { ctx, page, errors };
}

// 1) Thiệp: nhóm nha-gai chỉ thấy lễ thứ nhất, bản đồ mở địa điểm thứ hai trước, có ghi chú riêng và link xem đủ lịch
{
  const { ctx, page, errors } = await open(true);
  const inv = JSON.parse(readFileSync(join(ROOT, SLUG, 'invite.json'), 'utf8'));
  await page.goto(`${HOST}/${SLUG}/?k=Chị+Lan&n=nha-gai`); await page.waitForTimeout(800);
  await page.click('[data-open]', { force: true }); await page.waitForTimeout(3500);
  const text = await page.evaluate(() => document.body.innerText);
  assert.ok(text.includes(inv.events[0].address), 'thiếu lễ của nhóm');
  assert.ok(!text.includes(inv.events[1].address), 'còn hiện lễ không thuộc nhóm');
  assert.match(await page.textContent('.group-note'), /họ nhà gái.*Xe đón lúc 7:00/);
  assert.match(await page.getAttribute('.group-note a', 'href'), /^((?!n=).)*$/, 'link xem toàn bộ vẫn còn n=');
  await page.goto(`${HOST}/${SLUG}/?k=Khách&n=khong-co`); await page.waitForTimeout(800);
  await page.click('[data-open]', { force: true }); await page.waitForTimeout(3500);
  assert.ok(!(await page.$('.group-note')), 'nhóm không có thì không được hiện ghi chú');
  assert.deepEqual(errors, []); await ctx.close();
}

// 2) Trang khách: nhóm trong Studio hiện ở tab link mời, tạo link kèm &n=, tải được ảnh thẻ mời (PNG, có QR)
{
  const { ctx, page, errors } = await open();
  await page.goto(`${HOST}/studio/khach.html?thiep=${SLUG}&ma=thu`); await page.waitForSelector('#stats .stat');
  await page.click('[data-t=links]');
  await page.waitForSelector('#names');
  await page.fill('#names', 'Chị Lan\nAnh Tuấn | nha-gai');
  await page.selectOption('#def-group', 'nha-gai');
  posts.length = 0;
  await page.click('#make');
  const rows = await page.$$eval('#out tbody tr', l => l.map(x => x.textContent));
  assert.equal(rows.length, 2); assert.ok(rows.every(r => r.includes('(nha-gai)')), 'thiếu nhóm: ' + rows);
  assert.match(rows[0], /Sẽ đến/, 'Chị Lan đã xác nhận phải hiện Sẽ đến');
  assert.match(rows[1], /Chưa gửi/);
  await page.check('[data-sent="1"]');
  await page.waitForFunction(() => document.querySelector('#out').textContent.includes('Đã gửi · chờ phản hồi'));
  await page.waitForTimeout(1000); // chờ lưu lên Sheet (debounce)
  const saved = posts.filter(p => p.type === 'invite_list').pop();
  assert.ok(saved && saved.key === 'thu' && saved.list.length === 2 && saved.list[1].sent === true && saved.list[1].group === 'nha-gai', 'danh sách không được lưu: ' + JSON.stringify(saved));
  await page.selectOption('#flt', 'unsent');
  assert.equal((await page.$$('#out tbody tr')).length, 0, 'lọc Chưa gửi sai (Chị Lan đã xác nhận, Anh Tuấn đã gửi)');
  await page.selectOption('#flt', '');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-card="1"]')]);
  const path = await dl.path(); assert.ok(statSync(path).size > 20000, 'ảnh thẻ mời quá nhỏ');
  assert.match(dl.suggestedFilename(), /anh-tuan\.png$/);
  if (OUT) { mkdirSync(OUT, { recursive: true }); await dl.saveAs(join(OUT, 'the-moi.png')); }
  assert.deepEqual(errors, []); await ctx.close();
}
// 3) Cặp đôi ghim lời chúc ngay trên trang quản lý khách
{
  const { ctx, page, errors } = await open();
  await page.goto(`${HOST}/studio/khach.html?thiep=${SLUG}&ma=thu`); await page.waitForSelector('#stats .stat');
  await page.click('[data-t=wishes]');
  await page.click('[data-mod=pin]');
  await page.waitForFunction(() => document.querySelector('#list').textContent.includes('📌'));
  const m = posts.find(p => p.type === 'moderate');
  assert.ok(m && m.pin === true && m.name === 'Bác Hải' && m.at === '2027-01-02T00:00:00.000Z' && m.key === 'thu', 'yêu cầu ghim sai: ' + JSON.stringify(m));
  await page.click('[data-mod=hide]');
  await page.waitForFunction(() => document.querySelector('#list').textContent.includes('(đã ẩn)'));
  assert.equal(posts.filter(p => p.type === 'moderate').pop().hide, true);
  assert.deepEqual(errors, []); await ctx.close();
}
// 4) Xác nhận tham dự: chọn buổi lễ, ghi chú, gửi kèm lời chúc trong một lần bấm
{
  const { ctx, page, errors } = await open(true);
  await page.goto(`${HOST}/${SLUG}/?k=Anh+Tuấn`); await page.waitForTimeout(800);
  await page.click('[data-open]', { force: true }); await page.waitForTimeout(3500);
  const form = await page.$('form[data-w=rsvp]'); await form.scrollIntoViewIfNeeded();
  assert.equal((await form.$$('[name=ev]')).length, 2, 'phải có ô chọn từng buổi lễ');
  await (await form.$('[name=ev][value="0"]')).uncheck();
  await page.fill('form[data-w=rsvp] [name=note]', 'Ăn chay');
  await (await form.$('[name=withwish]')).check();
  await page.fill('form[data-w=rsvp] [name=wish]', 'Chúc hai bạn hạnh phúc');
  posts.length = 0;
  await form.$eval('button[type=submit]', b => b.click()); await page.waitForTimeout(600);
  const p = posts.find(x => x.type === 'rsvp');
  assert.ok(p, 'không gửi xác nhận');
  assert.equal(p.events, JSON.parse(readFileSync(join(ROOT, SLUG, 'invite.json'), 'utf8')).events[1].title);
  assert.equal(p.note, 'Ăn chay'); assert.equal(p.wish, 'Chúc hai bạn hạnh phúc'); assert.match(p.gid, /^[a-z0-9]{6,12}$/);
  assert.deepEqual(errors, []); await ctx.close();
}
await browser.close();
console.log('✓ Nhóm khách, ảnh thẻ mời, ghim và ẩn lời chúc');
