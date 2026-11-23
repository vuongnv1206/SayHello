// Tạo ảnh xem trước (hiện khi gửi link qua Zalo/Facebook) từ ảnh cưới + tên cặp đôi + ngày cưới.
//   npm run xem-truoc -- ten-cap-doi                    (ảnh chính: images.hero)
//   npm run xem-truoc -- ten-cap-doi --anh images/anh3.jpg
// Ghi ra ten-cap-doi/images/xem-truoc.jpg (1200x630) và đặt images.preview trong invite.json.
// `npm run new` tự gọi lệnh này sau khi tạo thiệp.
import sharp from 'sharp';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = 1200, H = 630, OUT = 'images/xem-truoc.jpg';
const xml = s => String(s ?? '').normalize('NFC').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
// Cỡ chữ vừa khung: ước lượng bề rộng ký tự ≈ 0.55 cỡ chữ với font có chân
const fit = (text, maxW, max) => Math.min(max, Math.floor(maxW / Math.max(1, [...text].length * 0.55)));
// Font phải đủ dấu tiếng Việt (Georgia thiếu chữ "ố" nên không dùng): Linux có Noto/DejaVu, Windows có Times New Roman
const FONT = `'Noto Serif', 'DejaVu Serif', 'Times New Roman', serif`;

export async function makePreview(slug, { photo } = {}) {
  const dir = join(ROOT, slug), p = join(dir, 'invite.json');
  const d = JSON.parse(readFileSync(p, 'utf8'));
  const src = photo || d.images?.hero || d.images?.album?.[0];
  if (!src || !existsSync(join(dir, src))) throw new Error(`Không tìm thấy ảnh cưới (${src || 'chưa có images.hero'}) trong ${slug}/`);
  const [a, b] = d.order === 'bride-first' ? [d.bride, d.groom] : [d.groom, d.bride];
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.date || '');
  const date = [m ? `${m[3]} · ${m[2]} · ${m[1]}` : '', d.city || ''].filter(Boolean).join(' · ');

  // Ảnh phủ kín khung, ưu tiên vùng có người (sharp "attention"); lớp tối bên trái để chữ dễ đọc
  const bg = await sharp(join(dir, src)).rotate().resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();
  const size = Math.max(48, Math.min(fit(a.short, 860, 92), fit(b.short, 860, 92)));
  const top = (H - size * 2.55) / 2 - 10; // khối tên nằm giữa chiều cao
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".78"/>
      <stop offset=".5" stop-color="#000" stop-opacity=".5"/>
      <stop offset=".85" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <filter id="s" x="-5%" y="-30%" width="110%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity=".6"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
  <g font-family="${FONT}" fill="#fff8ec" filter="url(#s)">
    <text x="80" y="104" font-size="24" letter-spacing="6" fill-opacity=".85">THIỆP CƯỚI</text>
    <text x="80" y="${top + size}" font-size="${size}" font-weight="700">${xml(a.short)}</text>
    <text x="84" y="${top + size * 1.75}" font-size="${Math.round(size * .55)}" font-style="italic" fill="#f4d58d">&amp;</text>
    <text x="80" y="${top + size * 2.55}" font-size="${size}" font-weight="700">${xml(b.short)}</text>
    <text x="80" y="${H - 72}" font-size="30" letter-spacing="4">${xml(date)}</text>
  </g>
</svg>`;
  const out = await sharp(bg).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  writeFileSync(join(dir, OUT), out);
  if (d.images && d.images.preview !== OUT) { d.images.preview = OUT; writeFileSync(p, JSON.stringify(d, null, 2) + '\n'); }
  return `${slug}/${OUT}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2), i = args.indexOf('--anh');
  const slug = args.find((x, k) => !x.startsWith('--') && !(i >= 0 && k === i + 1));
  if (!slug) { console.error('✗ Cần tên thư mục thiệp: npm run xem-truoc -- ten-cap-doi'); process.exit(1); }
  try {
    const f = await makePreview(slug, { photo: i >= 0 ? args[i + 1] : undefined });
    const { buildInvite } = await import('./build.mjs');
    buildInvite(slug);
    console.log(`✓ Đã tạo ${f}`);
  } catch (e) { console.error('✗ ' + e.message); process.exit(1); }
}
