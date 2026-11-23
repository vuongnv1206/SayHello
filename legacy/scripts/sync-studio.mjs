// Kéo phần cặp đôi đã sửa trong Studio (lưu ở Google Sheets) về invite.json của thiệp,
// rồi làm lại ảnh xem trước và index.html để link gửi Zalo/Facebook khớp nội dung mới.
//   npm run sync-studio -- ten-cap-doi            (ghi vào invite.json)
//   npm run sync-studio -- ten-cap-doi --dry-run  (chỉ in ra phần sẽ đổi, không ghi)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickEditable } from '../core/content.js';
import { merge } from '../core/util.js';
import { buildInvite } from './build.mjs';
import { makePreview } from './xem-truoc.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const slug = process.argv[2], dry = process.argv.includes('--dry-run');
if (!slug || slug.startsWith('--') || !existsSync(join(ROOT, slug, 'invite.json'))) { console.error('✗ Cần đường dẫn một thiệp có sẵn, vd: npm run sync-studio -- demo-thu-tay [--dry-run]'); process.exit(1); }

const file = join(ROOT, slug, 'invite.json');
const base = JSON.parse(readFileSync(file, 'utf8'));
if (!base.sheetUrl) { console.error('✗ invite.json chưa có sheetUrl nên không có gì để kéo về'); process.exit(1); }
const u = base.sheetUrl + (base.sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams({ invite: slug, type: 'content' });
const res = await fetch(u);
if (!res.ok) { console.error('✗ Google Sheet trả lỗi HTTP ' + res.status); process.exit(1); }
const body = await res.json();
if (!body || typeof body.content !== 'object' || !Object.keys(body.content).length) { console.log('Cặp đôi chưa sửa gì trong Studio, không có gì để cập nhật.'); process.exit(0); }

const merged = merge(base, pickEditable(body.content));
const changed = Object.keys(merged).filter(k => JSON.stringify(merged[k]) !== JSON.stringify(base[k]));
if (!changed.length) { console.log('invite.json đã khớp với bản trong Studio.'); process.exit(0); }
for (const k of changed) console.log(`• ${k}:\n    cũ: ${JSON.stringify(base[k] ?? null).slice(0, 140)}\n    mới: ${JSON.stringify(merged[k]).slice(0, 140)}`);
if (dry) { console.log('\n(--dry-run) Chưa ghi gì. Bỏ --dry-run để cập nhật.'); process.exit(0); }

writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
console.log(`\n✓ Đã cập nhật ${slug}/invite.json (${changed.length} mục)`);
try { console.log('✓ Ảnh xem trước:', await makePreview(slug)); }
catch (e) { console.log('! Chưa làm lại ảnh xem trước: ' + e.message); }
console.log('✓', buildInvite(slug));
