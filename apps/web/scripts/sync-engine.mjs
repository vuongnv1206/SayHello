// Chép mã chạy trên trình duyệt của bộ máy thiệp và các mẫu vào public/_e/ để phục vụ tĩnh (CDN của Vercel).
// Trang thiệp nạp chúng qua import map, không qua bundler của Next, nên máy chủ và trình duyệt dùng cùng một file.
// Chạy tự động trước `next dev` và `next build` (predev/prebuild). Thư mục public/_e/ không đưa lên git.
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const PKG = join(WEB, '..', '..', 'packages');
const OUT = join(WEB, 'public', '_e');
const ALLOWED = new Set(['.js', '.css', '.svg', '.png', '.jpg', '.webp', '.woff2']);
const copy = (src, dest) => cpSync(src, dest, { recursive: true, filter: p => statSync(p).isDirectory() || ALLOWED.has(extname(p)) });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
copy(join(PKG, 'engine', 'src'), join(OUT, 'engine'));
const themes = existsSync(join(PKG, 'themes')) ? readdirSync(join(PKG, 'themes')).filter(d => existsSync(join(PKG, 'themes', d, 'theme.js'))) : [];
for (const id of themes) {
  const dest = join(OUT, 'themes', id);
  copy(join(PKG, 'themes', id), dest);
  rmSync(join(dest, 'node_modules'), { recursive: true, force: true });
}
console.log(`✓ Đã chép bộ máy thiệp và ${themes.length} mẫu vào public/_e/ (${themes.join(', ')})`);
