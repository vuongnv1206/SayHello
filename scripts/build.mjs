// Sinh lại index.html cho mọi thiệp (thư mục có invite.json) từ dữ liệu trong invite.json.
// Thẻ <title>, mô tả và ảnh xem trước (og:*) phải nằm sẵn trong HTML vì Zalo/Facebook không chạy JavaScript.
// Chạy: node scripts/build.mjs            (tất cả thiệp)
//       node scripts/build.mjs ten-cap-doi (một thiệp)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ddmmyyyy = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };

export function buildInvite(slug) {
  const dir = join(ROOT, slug), d = JSON.parse(readFileSync(join(dir, 'invite.json'), 'utf8'));
  const [a, b] = d.order === 'bride-first' ? [d.bride, d.groom] : [d.groom, d.bride];
  const pair = `${a.short} & ${b.short}`, date = ddmmyyyy(d.date);
  const title = d.title || `${a.short} ❤ ${b.short} | ${date.replace(/\//g, '.')}`;
  const desc = d.description || `Trân trọng kính mời quý khách tới dự Lễ Thành Hôn của ${a.short} và ${b.short} - ${date}.`;
  const base = (site.baseUrl || '').replace(/\/$/, '');
  const img = d.images?.preview || d.images?.hero || '';
  const imgUrl = img && base ? `${base}/${slug}/${img}` : img;
  const page = `<!DOCTYPE html>
<!-- File này được sinh tự động bởi scripts/build.mjs từ invite.json. Đừng sửa tay, hãy sửa invite.json rồi chạy lại. -->
<html lang="${esc(d.lang || 'vi')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(`Thiệp cưới ${pair}`)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
${imgUrl ? `<meta property="og:image" content="${esc(imgUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(pair)}">
` : ''}${base ? `<meta property="og:url" content="${esc(`${base}/${slug}/`)}">
` : ''}<meta property="og:locale" content="vi_VN">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${esc(d.themeColor || '#7a0c12')}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23a4161a'/%3E%3Ctext x='32' y='47' font-size='42' text-anchor='middle' fill='%23e6c27a' font-family='serif' font-weight='700'%3E囍%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="modulepreload" href="../core/boot.js">
<link rel="modulepreload" href="../themes/${esc(d.theme)}/theme.js">
<style>body{margin:0;background:${esc(d.themeColor || '#111')}}</style>
</head>
<body>
<noscript><p style="color:#fff;font:16px system-ui;padding:40px 20px;text-align:center">Vui lòng bật JavaScript để xem thiệp cưới của ${esc(pair)}.</p></noscript>
<script type="module" src="../core/boot.js"></script>
</body>
</html>
`;
  writeFileSync(join(dir, 'index.html'), page);
  return slug;
}

export function allInvites() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && existsSync(join(ROOT, e.name, 'invite.json')))
    .map(e => e.name);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = process.argv[2] ? [process.argv[2]] : allInvites();
  list.forEach(s => console.log('✓', buildInvite(s)));
}
