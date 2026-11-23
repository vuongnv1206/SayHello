// Kiểm tra hai lệnh doctor và sync-studio (sync dùng máy chủ Sheet giả trên localhost, thư mục thử được xóa sau khi chạy).
import { createServer } from 'node:http';
import { cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), TMP = join(ROOT, '_thu-sync');
const run = (...a) => execFileSync(process.execPath, a, { cwd: ROOT, encoding: 'utf8' });
// Bất đồng bộ để máy chủ Sheet giả trong cùng tiến trình còn trả lời được
const runAsync = (...a) => new Promise((res, rej) => execFile(process.execPath, a, { cwd: ROOT, encoding: 'utf8' }, (e, so, se) => e ? rej(new Error(se || e.message)) : res(so)));

assert.match(run('scripts/doctor.mjs'), /0 lỗi/);

const srv = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ content: { groom: { short: 'Quốc Bảo' }, city: 'Huế', sheetUrl: 'https://evil.example' } }));
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
try {
  cpSync(join(ROOT, 'demo-thu-tay'), TMP, { recursive: true });
  const f = join(TMP, 'invite.json'), d = JSON.parse(readFileSync(f, 'utf8'));
  d.sheetUrl = `http://127.0.0.1:${srv.address().port}/exec`; writeFileSync(f, JSON.stringify(d));
  const before = readFileSync(f, 'utf8');
  assert.match(await runAsync('scripts/sync-studio.mjs', '_thu-sync', '--dry-run'), /Chưa ghi gì/);
  assert.equal(readFileSync(f, 'utf8'), before, '--dry-run không được ghi file');
  const out = await runAsync('scripts/sync-studio.mjs', '_thu-sync');
  assert.match(out, /Đã cập nhật/);
  const after = JSON.parse(readFileSync(f, 'utf8'));
  assert.equal(after.groom.short, 'Quốc Bảo'); assert.equal(after.city, 'Huế');
  assert.equal(after.sheetUrl, d.sheetUrl, 'sheetUrl không được bị Studio ghi đè');
  console.log('✓ doctor và sync-studio');
} finally { srv.close(); rmSync(TMP, { recursive: true, force: true }); }
