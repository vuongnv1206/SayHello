// Máy chủ tĩnh cho site bản 1 khi chạy trên máy: giống Vercel (trailingSlash: true), không cần cài gì thêm.
//   npm run dev:legacy            (cổng 3001)
//   node scripts/serve.mjs 4000
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = +(process.argv[2] || process.env.PORT || 3001);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon' };
// Không phục vụ file bí mật hay công cụ (Vercel cũng bỏ qua theo .vercelignore)
const HIDDEN = /^\/(\.env|\.git|node_modules|scripts|backend|tests)(\/|$)/;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (HIDDEN.test(p) || p.includes('\0')) return end(res, 404);
  let file = normalize(join(ROOT, p));
  if (!file.startsWith(normalize(ROOT))) return end(res, 404);
  try {
    let s = await stat(file);
    if (s.isDirectory()) {
      // /ten-cap-doi -> /ten-cap-doi/ để đường dẫn tương đối ../core/ đúng
      if (!p.endsWith('/')) { res.writeHead(308, { Location: p + '/' + url.search }); return res.end(); }
      file = join(file, 'index.html'); s = await stat(file);
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch { end(res, 404); }
}).listen(PORT, () => console.log(`Site bản 1: http://localhost:${PORT}/`));

function end(res, code) { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(code === 404 ? 'Không tìm thấy' : ''); }
