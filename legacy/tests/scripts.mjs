// Kiểm tra hai lệnh doctor và sync-studio (sync dùng máy chủ Sheet giả trên localhost, thư mục thử được xóa sau khi chạy).
import { createServer } from 'node:http';
import { cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { execFile, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { writeSlugs } from '../scripts/build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), TMP = join(ROOT, '_thu-sync');
const run = (...a) => execFileSync(process.execPath, a, { cwd: ROOT, encoding: 'utf8' });
// Bất đồng bộ để máy chủ Sheet giả trong cùng tiến trình còn trả lời được
const runAsync = (...a) => new Promise((res, rej) => execFile(process.execPath, a, { cwd: ROOT, encoding: 'utf8' }, (e, so, se) => e ? rej(new Error(se || e.message)) : res(so)));

assert.match(run('scripts/doctor.mjs'), /0 lỗi/);

// npm run new --goi: đặt thời hạn lưu theo gói và bật trang kỷ niệm
const NEW = join(ROOT, 'thu-tao-moi-xyz');
try {
  run('scripts/new-invite.mjs', 'thu-tao-moi-xyz', '--theme', 'thu-tay', '--goi', 'co-ban', '--date', '2030-05-22');
  const d = JSON.parse(readFileSync(join(NEW, 'invite.json'), 'utf8')), exp = new Date(); exp.setMonth(exp.getMonth() + 6);
  assert.equal(d.lifecycle.package, 'co-ban'); assert.equal(d.lifecycle.expiresAt, exp.toISOString().slice(0, 10));
  assert.equal(d.afterWedding.enabled, true); assert.match(d.date, /^2030-05-22/);
  run('scripts/new-invite.mjs', 'thu-tao-moi-abc', '--theme', 'thu-tay', '--goi', 'rieng');
  assert.equal(JSON.parse(readFileSync(join(ROOT, 'thu-tao-moi-abc', 'invite.json'), 'utf8')).lifecycle.expiresAt, undefined, 'gói Riêng không hết hạn');
} finally { rmSync(NEW, { recursive: true, force: true }); rmSync(join(ROOT, 'thu-tao-moi-abc'), { recursive: true, force: true }); }

// Tên miền riêng: publicUrl làm index.html nạp core/ từ web chính (tuyệt đối) và og:url theo tên miền riêng; rewrite theo host
const DOM = join(ROOT, 'thu-ten-mien'), VJ = join(ROOT, '_vercel-thu.json');
try {
  run('scripts/new-invite.mjs', 'thu-ten-mien', '--theme', 'thu-tay');
  writeFileSync(VJ, readFileSync(join(ROOT, 'vercel.json')));
  const env = { ...process.env, VERCEL_JSON: VJ };
  execFileSync(process.execPath, ['scripts/domain.mjs', 'thu-ten-mien', 'https://www.Minhkhang-thuha.vn/'], { cwd: ROOT, env });
  const html = readFileSync(join(DOM, 'index.html'), 'utf8'), site = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8')).baseUrl;
  assert.ok(html.includes(`src="${site}/core/boot.js"`), 'core/boot.js phải là địa chỉ tuyệt đối');
  assert.ok(html.includes('content="https://minhkhang-thuha.vn/"'), 'og:url phải là tên miền riêng');
  assert.ok(html.includes('crossorigin'), 'modulepreload cross-origin cần crossorigin');
  const v = JSON.parse(readFileSync(VJ, 'utf8'));
  assert.deepEqual(v.rewrites.map(r => r.has[0].value), ['minhkhang-thuha.vn', 'www.minhkhang-thuha.vn']);
  assert.equal(v.rewrites[0].destination, '/thu-ten-mien/$1');
  execFileSync(process.execPath, ['scripts/domain.mjs', 'thu-ten-mien', 'minhkhang-thuha.vn'], { cwd: ROOT, env }); // chạy lại không thêm trùng
  assert.equal(JSON.parse(readFileSync(VJ, 'utf8')).rewrites.length, 2);
  assert.ok(readFileSync(join(ROOT, 'vercel.json'), 'utf8').includes('Access-Control-Allow-Origin'), 'vercel.json thiếu header CORS');
} finally { rmSync(DOM, { recursive: true, force: true }); rmSync(VJ, { force: true }); }

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
writeSlugs(); // các thiệp thử đã xóa: trả slugs.json về đúng danh sách thật
