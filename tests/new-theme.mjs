// Tạo khung cho một mẫu mới: package.json, demo.json (dữ liệu giả), ảnh minh hoạ mặc định và test hợp đồng.
//   node tests/new-theme.mjs <id> <bộ ảnh trong assets/anh-minh-hoa> <tên nhạc> [thư mục gốc]
//   Ví dụ: node tests/new-theme.mjs so-tay-nien-lich khung-theu dao-buoc packages/themes-wip
// theme.js và theme.css do người viết mẫu tự tạo.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT } from './e2e/lib/registries.mjs';

const [id, art, track, base = 'packages/themes-wip'] = process.argv.slice(2);
if (!id || !art || !track) {
  console.log('Dùng: node tests/new-theme.mjs <id> <bộ ảnh> <tên nhạc> [thư mục gốc]');
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new Error('id phải là chữ thường không dấu, nối bằng gạch ngang');
const artDir = join(ROOT, 'assets', 'anh-minh-hoa', art);
if (!existsSync(artDir)) throw new Error(`Không có bộ ảnh ${art}`);
if (!existsSync(join(ROOT, 'apps', 'web', 'public', 'assets', 'music', `${track}.mp3`))) throw new Error(`Không có nhạc ${track}`);

const dir = resolve(ROOT, base, id);
mkdirSync(join(dir, 'images'), { recursive: true });
mkdirSync(join(dir, 'test'), { recursive: true });
const write = (file, text) => { if (!existsSync(file)) writeFileSync(file, text); };

for (let i = 1; i <= 6; i++) copyFileSync(join(artDir, `anh${i}.jpg`), join(dir, 'images', `anh${i}.jpg`));
// ảnh xem trước tạm, thay bằng ảnh chụp mẫu khi hoàn thành
copyFileSync(join(artDir, 'xem-truoc.jpg'), join(dir, 'images', 'xem-truoc.jpg'));

write(join(dir, 'package.json'), JSON.stringify({
  name: `@sayhello/theme-${id}`, version: '1.0.0', private: true, description: `Mẫu ${id}`, type: 'module',
  exports: { '.': './theme.js', './demo.json': './demo.json' }, dependencies: { '@sayhello/engine': '*' },
}, null, 2) + '\n');

const demo = JSON.parse(readFileSync(join(ROOT, 'packages', 'themes', 'photobooth', 'demo.json'), 'utf8'));
Object.assign(demo, {
  slug: `demo-${id}`,
  music: `/assets/music/${track}.mp3`,
  images: { hero: 'images/anh1.jpg', thanks: 'images/anh6.jpg', album: [1, 2, 3, 4, 5].map(i => `images/anh${i}.jpg`), preview: 'images/xem-truoc.jpg' },
});
write(join(dir, 'demo.json'), JSON.stringify(demo, null, 2) + '\n');

write(join(dir, 'test', 'contract.test.js'), `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderDocument } from '@sayhello/engine';
import theme from '../theme.js';
import demo from '../demo.json' with { type: 'json' };

const PKG_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
const render = (data, opts = {}) => renderDocument(theme, data, { assetBase: '/_e/themes/${id}/', ...opts });

test('${id} contract: required features are placed in scenes, cover opens fast', () => {
  assert.equal(theme.id, '${id}');
  assert.deepEqual([...theme.fallback], []);
  assert.ok(theme.gateMs <= 900);
  assert.ok(theme.moment?.verbLabel);
  assert.ok(theme.tagline);
  assert.ok(theme.topics.length >= 3);
});

test('every topic carries its own layout rules, not only colours', () => {
  const [, ...others] = theme.topics;
  for (const { id } of others) assert.ok(css.includes(\`html[data-topic="\${id}"]\`), \`no structural rules for \${id}\`);
});

test('renderDocument: every topic, stripped optional data, XSS and prototype keys', () => {
  for (const { id } of theme.topics) {
    const page = render(demo, { topic: id });
    assert.ok(page.includes(\`data-topic="\${id}"\`));
    assert.ok(page.includes(demo.groom.short));
  }
  assert.ok(render({ ...demo, story: [], accounts: [], music: '', families: [], images: { album: [] } }).includes(demo.bride.short));
  const evil = render({ ...demo, groom: { short: '<script>alert(1)</script>', full: 'x' }, city: '<img src=x onerror=alert(1)>' });
  assert.ok(!evil.includes('<script>alert(1)</script>'));
  assert.ok(!evil.includes('<img src=x onerror'));
  assert.doesNotThrow(() => render(demo, { topic: '__proto__' }));
});

test('no endless animation', () => {
  assert.ok(!/\\binfinite\\b/.test(css));
});

test('${id} images: 7 unique files, no duplicates', () => {
  const dir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(dir).filter(f => /\\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const hashes = new Set(files.map(f => crypto.createHash('md5').update(fs.readFileSync(path.join(dir, f))).digest('hex')));
  assert.equal(hashes.size, files.length);
});

test('music points at a track shipped with the app', () => {
  const file = path.resolve(PKG_DIR, '../../../apps/web/public', '.' + demo.music);
  assert.ok(fs.existsSync(file), demo.music);
});
`);
console.log(`Đã tạo khung ${dir}. Viết tiếp theme.js và theme.css, rồi chạy:\n  node tests/preview-theme.mjs ${base}/${id} --shots <thư mục>`);
