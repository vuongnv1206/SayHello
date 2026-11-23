// Gắn tên miền riêng cho một thiệp (gói Riêng): thiệp hiện ở gốc tên miền, vd. https://minhkhangthuha.vn/
//   npm run domain -- minh-khang-thu-ha minhkhangthuha.vn
// Việc script làm: ghi publicUrl vào invite.json, dựng lại index.html (nạp core/themes từ web chính), thêm luật rewrite vào vercel.json.
// Việc Ngài làm tay: thêm tên miền vào dự án trên Vercel (Settings → Domains) và trỏ DNS theo hướng dẫn của Vercel.
// Sau khi gắn xong, mở https://<tên miền>/ kiểm tra: nếu hiện trang chủ SayHello thay vì thiệp, báo lại để chuyển sang cách khác.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInvite } from './build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const [slug, domainRaw] = process.argv.slice(2);
const domain = String(domainRaw || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
const fail = m => { console.error('✗ ' + m); process.exit(1); };
if (!slug || !existsSync(join(ROOT, slug, 'invite.json'))) fail('Cần đường dẫn một thiệp có sẵn, vd: npm run domain -- minh-khang-thu-ha minhkhangthuha.vn');
if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) fail('Tên miền không hợp lệ: ' + domainRaw);

const vercelPath = process.env.VERCEL_JSON || join(ROOT, 'vercel.json');
const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
vercel.rewrites ||= [];
const taken = vercel.rewrites.find(r => r.has?.some(h => h.type === 'host' && (h.value === domain || h.value === 'www.' + domain)) && r.destination !== `/${slug}/$1`);
if (taken) fail(`Tên miền ${domain} đã gắn với thiệp khác (${taken.destination})`);
for (const host of [domain, 'www.' + domain]) {
  if (vercel.rewrites.some(r => r.has?.some(h => h.value === host))) continue;
  vercel.rewrites.push({ source: '/(.*)', has: [{ type: 'host', value: host }], destination: `/${slug}/$1` });
}
writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');

const file = join(ROOT, slug, 'invite.json'), d = JSON.parse(readFileSync(file, 'utf8'));
d.publicUrl = 'https://' + domain;
writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
console.log('✓ Đã dựng lại', buildInvite(slug), '(publicUrl =', d.publicUrl + ')');
console.log(`✓ Đã thêm luật rewrite cho ${domain} và www.${domain} vào ${vercelPath === join(ROOT, 'vercel.json') ? 'vercel.json' : vercelPath}`);
console.log('\nBước tiếp theo (làm tay): thêm tên miền vào dự án Vercel, trỏ DNS, rồi commit và đẩy code.');
