// In ra link Studio (để cặp đôi tự sửa thiệp) và link trang khách mời của một thiệp.
//   npm run studio-link -- minh-khang-thu-ha
// Cần STUDIO_SECRET giống hệt chuỗi trong backend/apps-script.gs, đặt trong file .env:
//   STUDIO_SECRET=chuoi-bi-mat-cua-ban
import { createHmac } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = existsSync(join(ROOT, '.env')) ? Object.fromEntries(readFileSync(join(ROOT, '.env'), 'utf8').split('\n')
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map(m => [m[1], m[2].replace(/^["']|["']$/g, '')])) : {};
const secret = process.env.STUDIO_SECRET || env.STUDIO_SECRET;
const slug = process.argv[2];
const admin = slug === '--ban-hang';
if (!admin && (!slug || !existsSync(join(ROOT, slug, 'invite.json')))) { console.error('✗ Cần đường dẫn của một thiệp có sẵn, vd: npm run studio-link -- demo-thu-tay\n  (hoặc --ban-hang để lấy link trang tổng hợp của người bán)'); process.exit(1); }
if (!secret) { console.error('✗ Chưa có STUDIO_SECRET trong file .env (xem backend/HUONG-DAN.md)'); process.exit(1); }

export const editKey = (s, sec) => createHmac('sha256', sec).update(s).digest('hex').slice(0, 16);
const base = (JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8')).baseUrl || 'http://localhost:3000').replace(/\/$/, '');
if (admin) {
  console.log(`Trang tổng hợp của người bán (chỉ mình bạn dùng): ${base}/ban-hang/?ma=${editKey('_admin', secret)}`);
  process.exit(0);
}
const key = editKey(slug, secret);
console.log(`Studio (gửi cặp đôi, giữ bí mật): ${base}/studio/?thiep=${slug}&ma=${key}`);
console.log(`Quản lý khách:                    ${base}/studio/khach.html?thiep=${slug}&ma=${key}`);
console.log(`Thiệp gửi khách mời:              ${base}/${slug}/`);
