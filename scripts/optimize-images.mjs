// Nén ảnh của các thiệp để mở nhanh trên 4G. Ghi đè lên file gốc, nên hãy giữ ảnh gốc ở nơi khác.
//   node scripts/optimize-images.mjs             (mọi thiệp)
//   node scripts/optimize-images.mjs ten-cap-doi (một thiệp)
// - Ảnh thường: cạnh dài tối đa 1600px, JPEG chất lượng 80. Chỉ xử lý ảnh trên 350KB hoặc quá lớn.
// - images.preview (ảnh xem trước khi gửi link): cắt đúng 1200x630.
// - Xoay ảnh theo EXIF và bỏ thông tin vị trí GPS trong ảnh.
import sharp from 'sharp';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { allInvites } from './build.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const MAX_SIDE = 1600, MAX_BYTES = 350 * 1024;
const kb = n => Math.round(n / 1024) + 'KB';

async function optimize(slug) {
  const dir = join(ROOT, slug), d = JSON.parse(readFileSync(join(dir, 'invite.json'), 'utf8'));
  const preview = d.images?.preview;
  const imgDir = join(dir, 'images');
  let files = [];
  try { files = readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)); } catch { return; }
  for (const f of files) {
    const p = join(imgDir, f), rel = 'images/' + f, before = statSync(p).size;
    const img = sharp(readFileSync(p)).rotate(), meta = await img.metadata();
    let out;
    if (rel === preview) {
      if (meta.width === 1200 && meta.height === 630 && before <= MAX_BYTES) continue;
      out = await img.resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    } else {
      if (before <= MAX_BYTES && Math.max(meta.width, meta.height) <= MAX_SIDE) continue;
      out = await img.resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })[extname(f).toLowerCase() === '.png' ? 'png' : 'jpeg']({ quality: 80, mozjpeg: true }).toBuffer();
    }
    if (out.length < before || rel === preview) {
      writeFileSync(p, out);
      console.log(`  ${slug}/${rel}: ${kb(before)} → ${kb(out.length)}`);
    }
  }
}

const list = process.argv[2] ? [process.argv[2]] : allInvites();
for (const s of list) await optimize(s);
console.log('✓ Đã nén ảnh cho', list.length, 'thiệp');
