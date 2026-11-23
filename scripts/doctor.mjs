// Soát lỗi trước khi giao thiệp hoặc đẩy code.
//   npm run doctor            (kiểm tra cả shop.json và mọi thiệp)
//   npm run doctor -- <thiệp> (chỉ một thiệp)
// Thiệp demo-* chỉ bị kiểm tra phần kỹ thuật; thiệp bán cho khách bị kiểm tra cả dữ liệu giả (số 0000000000, thiếu sheetUrl, ngày đã qua).
// Thoát mã 1 nếu có ✗ (lỗi). ! (cảnh báo) không làm hỏng.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allInvites } from './build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
let errors = 0, warns = 0;
const bad = m => { errors++; console.log('  ✗ ' + m); };
const warn = m => { warns++; console.log('  ! ' + m); };
const FAKE = /0{6,}/;
const only = process.argv[2];

const themes = read('themes/index.json');
if (!only) {
  console.log('shop.json');
  const shop = read('shop.json');
  if (shop.giaTam) warn('giaTam còn true: giá vẫn là giá tạm');
  if (FAKE.test(shop.bank?.number || '')) warn('Số tài khoản nhận tiền còn là số giả');
  if (FAKE.test(shop.zalo || '')) warn('Số Zalo còn là số giả');
  if (!shop.orderSheetUrl) warn('Chưa có orderSheetUrl: đơn hàng sẽ không ghi vào Sheet');
  console.log('themes/');
  for (const t of themes) {
    if (!existsSync(join(ROOT, 'themes', t.id, 'theme.js'))) bad(`Mẫu ${t.id} có trong themes/index.json nhưng thiếu theme.js`);
    if (!existsSync(join(ROOT, t.demo, 'invite.json'))) bad(`Mẫu ${t.id}: thiếu thiệp demo ${t.demo}/`);
  }
  for (const d of readdirSync(join(ROOT, 'themes'), { withFileTypes: true }))
    if (d.isDirectory() && !themes.some(t => t.id === d.name)) bad(`Thư mục themes/${d.name} chưa được khai báo trong themes/index.json`);
}

for (const slug of only ? [only] : allInvites()) {
  console.log(slug);
  if (!existsSync(join(ROOT, slug, 'invite.json'))) { bad('Không có invite.json'); continue; }
  const d = read(`${slug}/invite.json`), demo = slug.startsWith('demo-');
  if (!themes.some(t => t.id === d.theme)) bad(`Mẫu "${d.theme}" không có trong themes/index.json`);
  if (!existsSync(join(ROOT, slug, 'index.html'))) bad('Thiếu index.html (chạy npm run build)');
  const hero = d.images?.hero;
  if (!hero) warn('Chưa có images.hero');
  if (!existsSync(join(ROOT, slug, 'images/xem-truoc.jpg'))) (demo ? warn : bad)('Thiếu images/xem-truoc.jpg (chạy npm run xem-truoc -- ' + slug + ')');
  const dir = join(ROOT, slug, 'images');
  if (existsSync(dir)) for (const f of readdirSync(dir)) {
    const kb = statSync(join(dir, f)).size / 1024;
    if (kb > 350 && f !== 'xem-truoc.jpg') warn(`Ảnh ${f} nặng ${Math.round(kb)}KB (nên dưới 350KB, chạy npm run images)`);
  }
  if (!demo) {
    if (FAKE.test(JSON.stringify(d.accounts || []))) bad('Tài khoản mừng cưới còn số giả 0000000000');
    if (!d.sheetUrl) bad('Thiếu sheetUrl: xác nhận và lời chúc sẽ không lưu vào Sheet');
    if (d.date && Date.parse(d.date) < Date.now()) warn('Ngày cưới đã qua');
    if (!d.date) bad('Thiếu ngày cưới');
  }
}
console.log(`\n${errors} lỗi, ${warns} cảnh báo`);
process.exit(errors ? 1 : 0);
