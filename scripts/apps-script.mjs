// Chuẩn bị code Apps Script để dán vào Google Sheets, có sẵn mã bí mật Studio.
//   npm run apps-script
// - Lần đầu: tự tạo STUDIO_SECRET ngẫu nhiên và ghi vào file .env (không đưa lên GitHub).
// - Ghi backend/apps-script.local.gs (đã điền mã, không đưa lên GitHub) và chép sẵn vào clipboard.
// Sau đó chỉ cần mở Apps Script, xóa code mẫu, dán (Ctrl+V), Lưu, Triển khai.
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = join(ROOT, '.env');
const envText = existsSync(ENV) ? readFileSync(ENV, 'utf8') : '';
let secret = envText.match(/^\s*STUDIO_SECRET\s*=\s*["']?([^"'\r\n]+)/m)?.[1]?.trim();
if (!secret) {
  secret = randomBytes(24).toString('base64url');
  appendFileSync(ENV, (envText && !envText.endsWith('\n') ? '\n' : '') + `STUDIO_SECRET=${secret}\n`);
  console.log('✓ Đã tạo mã bí mật mới và lưu vào .env');
} else {
  console.log('✓ Dùng mã bí mật đang có trong .env');
}

const src = readFileSync(join(ROOT, 'backend/apps-script.gs'), 'utf8');
const out = src.replace(/const STUDIO_SECRET = '[^']*';/, `const STUDIO_SECRET = '${secret}';`);
if (out === src) { console.error('✗ Không tìm thấy dòng STUDIO_SECRET trong backend/apps-script.gs'); process.exit(1); }
const file = join(ROOT, 'backend/apps-script.local.gs');
writeFileSync(file, out);
console.log('✓ Đã ghi backend/apps-script.local.gs (code đã điền mã, không đưa lên GitHub)');

const clip = process.platform === 'win32' ? ['clip'] : process.platform === 'darwin' ? ['pbcopy'] : ['xclip', '-selection', 'clipboard'];
const r = spawnSync(clip[0], clip.slice(1), { input: process.platform === 'win32' ? '﻿' + out : out, shell: process.platform === 'win32' });
console.log(r.status === 0 ? '✓ Đã chép code vào clipboard: mở Apps Script, xóa code mẫu, bấm Ctrl+V'
  : '• Không chép được vào clipboard: mở file backend/apps-script.local.gs, chọn hết và sao chép');
