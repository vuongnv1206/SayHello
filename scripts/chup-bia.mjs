// Chụp màn bìa thật của từng thiệp mẫu ở khổ điện thoại (400x822) làm poster cho trang chủ.
// Ghi ra demo-<mẫu>/images/bia.jpg. Ảnh xem trước khi gửi link (xem-truoc.jpg, 1200x630) giữ nguyên.
//   npm run chup-bia               (mọi mẫu trong themes/index.json)
//   npm run chup-bia -- cuon-phim  (một mẫu)
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOST = 'http://sayhello.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

const only = process.argv[2];
const themes = JSON.parse(readFileSync(join(ROOT, 'themes/index.json'), 'utf8')).filter(t => !only || t.id === only);
if (!themes.length) { console.error('Không thấy mẫu ' + only); process.exit(1); }

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const t of themes) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 822 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  // File trong dự án phục vụ tại chỗ; font Google vẫn tải từ mạng để chữ đúng như thật; mạng khác chặn
  await ctx.route(HOST + '/**', route => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(ROOT, p);
    if (!existsSync(f)) return route.fulfill({ status: 404, body: '' });
    let body = readFileSync(f);
    if (/\/invite\.json$/.test(p)) { const d = JSON.parse(body); delete d.sheetUrl; body = JSON.stringify(d); }
    route.fulfill({ status: 200, contentType: TYPES[extname(f).toLowerCase()] || 'application/octet-stream', body });
  });
  await ctx.route(url => !url.href.startsWith(HOST) && !/fonts\.(googleapis|gstatic)\.com/.test(url.hostname), r => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${HOST}/${t.demo}/?k=Khách+mời`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500); // chờ hiệu ứng vào của bìa chạy xong
  const png = await page.screenshot({ type: 'png' });
  const out = join(ROOT, t.demo, 'images/bia.jpg');
  writeFileSync(out, await sharp(png).resize(400, 822).jpeg({ quality: 78, mozjpeg: true }).toBuffer());
  console.log('✓ ' + t.demo + '/images/bia.jpg');
  await ctx.close();
}
await browser.close();
