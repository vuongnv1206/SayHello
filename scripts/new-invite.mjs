// Tạo thiệp mới từ thiệp mẫu của một theme.
//   node scripts/new-invite.mjs minh-khang-thu-ha --theme song-hy
// Sẽ tạo thư mục minh-khang-thu-ha/ (invite.json + ảnh mẫu + index.html). Sau đó:
//   1. Sửa minh-khang-thu-ha/invite.json (tên, ngày, địa điểm, tài khoản, sheetUrl)
//   2. Thay ảnh trong minh-khang-thu-ha/images/
//   3. Chạy lại: node scripts/build.mjs minh-khang-thu-ha
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInvite } from './build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const themes = JSON.parse(readFileSync(join(ROOT, 'themes/index.json'), 'utf8'));
const theme = opt('theme') || themes[0].id;
const from = opt('from') || themes.find(t => t.id === theme)?.demo;

const fail = m => { console.error('✗ ' + m); process.exit(1); };
if (!slug || !/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)) fail('Cần đường dẫn thiệp chỉ gồm chữ thường không dấu, số và dấu gạch: vd. minh-khang-thu-ha');
if (existsSync(join(ROOT, slug))) fail(`Thư mục ${slug}/ đã tồn tại`);
if (!existsSync(join(ROOT, 'themes', theme, 'theme.js'))) fail(`Không có theme "${theme}". Có: ${themes.map(t => t.id).join(', ')}`);
if (!from || !existsSync(join(ROOT, from, 'invite.json'))) fail(`Không tìm thấy thiệp mẫu để sao chép (${from})`);

cpSync(join(ROOT, from), join(ROOT, slug), { recursive: true });
const p = join(ROOT, slug, 'invite.json'), d = JSON.parse(readFileSync(p, 'utf8'));
Object.assign(d, { slug, theme });
writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
buildInvite(slug);
console.log(`✓ Đã tạo ${slug}/ theo mẫu "${theme}" (sao chép từ ${from}/)
  Sửa ${slug}/invite.json và thay ảnh trong ${slug}/images/, rồi chạy: node scripts/build.mjs ${slug}`);
