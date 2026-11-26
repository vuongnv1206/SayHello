import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderDocument } from '@sayhello/engine';
import theme from '../theme.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(DIR, '..');
const DEMO = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'demo.json'), 'utf8'));
const PKG_JSON = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));

test('phong-trien-lam contract: metadata, version parity, stage layout, fallback === 0, motion.lite pairs', () => {
  assert.equal(theme.id, 'phong-trien-lam');
  assert.equal(theme.name, 'Phòng Triển Lãm Đêm');
  assert.equal(theme.version, '1.1.0');
  assert.equal(PKG_JSON.version, theme.version, 'package.json version must match theme.js version');
  assert.equal(theme.tier, 'cinematic');
  assert.equal(theme.layout, 'stage');
  assert.equal(theme.fallback.length, 0, 'All required features (when, where, rsvp) must be provided');
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.ok(theme.gateMs <= 900);
  assert.deepEqual(theme.palettes.map(p => p.id), ['xam-luc', 'nhung-man', 'thach-cao', 'men-lam']);
  assert.match(theme.fonts, /Be\+Vietnam\+Pro/i);

  for (const s of theme.scenes) {
    if (s.motion?.cinematic) {
      assert.ok(s.motion.lite, `Scene "${s.id}" with motion.cinematic must define motion.lite`);
    }
  }
});

test('phong-trien-lam strict lazy loading & synchronous webglcontextlost downgrade', () => {
  const themeSrc = fs.readFileSync(path.join(PKG_DIR, 'theme.js'), 'utf8');
  assert.doesNotMatch(themeSrc, /from\s+['"](three|gsap|lenis|\.\/gallery3d\.js)/, 'Must not statically import heavy libs or gallery3d.js');
  assert.match(themeSrc, /\/\* webpackIgnore: true \*\/ \/\* turbopackIgnore: true \*\//);

  const gallerySrc = fs.readFileSync(path.join(PKG_DIR, 'gallery3d.js'), 'utf8');
  assert.match(gallerySrc, /bindContextLoss/);
  assert.match(gallerySrc, /ctx\.downgrade\(['"]webglcontextlost['"]\)/);
  assert.doesNotMatch(gallerySrc, /recoverContext\s*\(/, 'webglcontextlost should downgrade immediately without delayed retry');
});

test('phong-trien-lam renderDocument: scenes, stripped optional fields, palette, and XSS escaping', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/phong-trien-lam/',
    assetBase: '/_e/themes/phong-trien-lam/',
  });
  assert.match(fullHtml, /<html lang="vi" class="sh-locked"/);
  assert.match(fullHtml, /id="sanh"/);
  assert.match(fullHtml, /id="phong"/);
  assert.match(fullHtml, /id="le-tan"/);
  assert.match(fullHtml, /tabindex="-1"/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /class="ptl-accs"/);
  assert.match(fullHtml, /img\.vietqr\.io/);

  const strippedHtml = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '' }, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/phong-trien-lam/',
    assetBase: '/_e/themes/phong-trien-lam/',
  });
  assert.doesNotMatch(strippedHtml, /ptl-s-text/);
  assert.doesNotMatch(strippedHtml, /ptl-accs/);
  assert.doesNotMatch(strippedHtml, /id="sh-audio"/);

  const palHtml = renderDocument(theme, { ...DEMO, palette: 'thach-cao' });
  assert.match(palHtml, /data-palette="thach-cao"/);
  assert.match(palHtml, /--wall:#e7e3dc/);

  const xssHtml = renderDocument(theme, {
    ...DEMO,
    slug: '</script><script>alert(1)</script>',
    groom: { ...DEMO.groom, short: 'Gia <b>Huy</b>' },
  });
  assert.doesNotMatch(xssHtml, /Gia <b>Huy<\/b>/);
  assert.match(xssHtml, /Gia &lt;b&gt;Huy&lt;\/b&gt;/);
  assert.equal((xssHtml.match(/<\/script>/g) || []).length, (xssHtml.match(/<script/g) || []).length);
});

test('phong-trien-lam images: 6 unique files, no duplicates', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 6, 'Expected anh-01.jpg..anh-06.jpg (6 files)');
  for (let i = 1; i <= 6; i++) assert.ok(files.includes(`anh-0${i}.jpg`), `Missing anh-0${i}.jpg`);

  const seenOwn = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    assert.ok(buf.length > 20_000, `${f} unexpectedly small (${buf.length} bytes)`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(seenOwn.has(md5), false, `Duplicate MD5 within phong-trien-lam/images: ${f}`);
    seenOwn.add(md5);
  }
});
