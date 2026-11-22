// Kiểm tra nhanh: mở từng thiệp và trang giới thiệu trong Chromium khổ điện thoại,
// bấm mở bìa, cuộn hết trang, gửi thử xác nhận và lời chúc. Báo lỗi nếu có lỗi JavaScript
// hoặc thiếu file. Chạy: npm test  (lần đầu: npx playwright install chromium)
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { allInvites } from '../scripts/build.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.mp3': 'audio/mpeg' };
const HOST = 'http://sayhello.test';

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const failures = [];

async function check(path, invite) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  const errors = [];
  // Phục vụ file thẳng từ thư mục dự án, chặn mạng ngoài để kiểm tra chạy ổn định
  await ctx.route(HOST + '/**', route => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(ROOT, p);
    if (!existsSync(f)) { errors.push('Thiếu file: ' + p); return route.fulfill({ status: 404, body: '' }); }
    route.fulfill({ status: 200, contentType: TYPES[extname(f).toLowerCase()] || 'application/octet-stream', body: readFileSync(f) });
  });
  await ctx.route(url => !url.href.startsWith(HOST), r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  await page.goto(HOST + path + (invite ? (path.includes('?') ? '&' : '?') + 'k=Khách+Thử' : ''), { waitUntil: 'load' });
  await page.waitForTimeout(800);

  if (invite) {
    const opener = await page.$('[data-open]');
    if (!opener) errors.push('Bìa không có nút [data-open]');
    else await opener.click({ force: true });
    await page.waitForTimeout(3500);
    if (!(await page.$('#cover.gone'))) errors.push('Bìa không ẩn sau khi mở');
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 400) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(60); }
    const name = await page.$eval('form[data-w=rsvp] input[name=name]', i => i.value).catch(() => null);
    if (name !== null && name !== 'Khách Thử') errors.push('Tên khách không được điền sẵn vào ô xác nhận');
    for (const sel of ['form[data-w=rsvp]', 'form[data-w=guestbook]']) {
      const form = await page.$(sel);
      if (!form) continue;
      await form.$eval('textarea', t => (t.value = 'Chúc mừng hạnh phúc!')).catch(() => {});
      await form.$eval('button[type=submit]', b => b.click());
      await page.waitForTimeout(400);
      const msg = await form.$eval('.msg', m => m.textContent);
      if (!/Cảm ơn/.test(msg)) errors.push(`${sel}: gửi không thành công ("${msg}")`);
      await page.$eval('.cheers', e => e.remove()).catch(() => {});
    }
  }
  await ctx.close();
  console.log(`${errors.length ? '✗' : '✓'} ${path}`);
  errors.forEach(e => console.log('    ' + e));
  if (errors.length) failures.push(path);
}

await check('/', false);
await check(`/studio/?thiep=${allInvites()[0]}`, false);
await check(`/studio/khach.html?thiep=${allInvites()[0]}`, false);
for (const slug of allInvites()) {
  const d = JSON.parse(readFileSync(join(ROOT, slug, 'invite.json'), 'utf8'));
  await check(`/${slug}/`, true);
  // Mọi mẫu phải chạy được với dữ liệu của thiệp mẫu đầu tiên
  if (slug === allInvites()[0]) {
    for (const t of JSON.parse(readFileSync(join(ROOT, 'themes/index.json'), 'utf8')))
      if (t.id !== d.theme) await check(`/${slug}/?theme=${t.id}`, true);
  }
}
await browser.close();
if (failures.length) { console.log(`\n${failures.length} trang lỗi`); process.exit(1); }
console.log('\nTất cả đều ổn');
