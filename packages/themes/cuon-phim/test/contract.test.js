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
const REPO_ROOT = path.resolve(PKG_DIR, '..', '..', '..');
const DEMO = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'demo.json'), 'utf8'));

test('cuon-phim contract: metadata, scroll layout, palettes, gateMs <= 900, motion.lite pairs', () => {
  assert.equal(theme.id, 'cuon-phim');
  assert.equal(theme.name, 'Cuộn Phim');
  assert.equal(theme.version, '2.0.0');
  assert.equal(theme.tier, 'cinematic');
  assert.equal(theme.layout, 'scroll');
  assert.equal(theme.fallback.length, 0, 'All required features (when, where, rsvp) must be provided');
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.ok(theme.gateMs <= 900);
  assert.deepEqual(theme.palettes.map(p => p.id), ['nhung-do', 'luc-bao', 'hai-quan']);
  assert.match(theme.fonts, /Be\+Vietnam\+Pro/i);

  for (const s of theme.scenes) {
    if (s.motion?.cinematic || s.motion?.standard) {
      assert.ok(s.motion.lite, `Scene "${s.id}" with motion must define motion.lite`);
    }
  }
});

test('cuon-phim renderDocument: scenes, stripped optional fields, palette, VietQR %20, and XSS escaping', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/cuon-phim/',
    assetBase: '/_e/themes/cuon-phim/',
  });
  assert.match(fullHtml, /<html lang="vi" class="sh-locked"/);
  assert.match(fullHtml, /id="phong-chieu"/);
  assert.match(fullHtml, /id="mo-man"/);
  assert.match(fullHtml, /id="ve-moi"/);
  assert.match(fullHtml, /id="giu-ghe"/);
  assert.match(fullHtml, /id="quay-bap"/);
  assert.match(fullHtml, /id="danh-de"/);
  assert.match(fullHtml, /tabindex="-1"/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /img\.vietqr\.io/);
  assert.doesNotMatch(fullHtml, /Rạp Hạnh Phúc/);

  const strippedHtml = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '', families: [] }, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/cuon-phim/',
    assetBase: '/_e/themes/cuon-phim/',
  });
  assert.doesNotMatch(strippedHtml, /id="canh-phim"/);
  assert.doesNotMatch(strippedHtml, /id="quay-bap"/);
  assert.doesNotMatch(strippedHtml, /id="sh-audio"/);

  const palHtml = renderDocument(theme, { ...DEMO, palette: 'luc-bao' });
  assert.match(palHtml, /data-palette="luc-bao"/);
  assert.match(palHtml, /--velvet:#14574a/);

  const xssHtml = renderDocument(theme, {
    ...DEMO,
    slug: '</script><script>alert(1)</script>',
    groom: { ...DEMO.groom, short: 'Gia <b>Huy</b>' },
  });
  assert.doesNotMatch(xssHtml, /Gia <b>Huy<\/b>/);
  assert.match(xssHtml, /Gia &lt;b&gt;Huy&lt;\/b&gt;/);
  assert.equal((xssHtml.match(/<\/script>/g) || []).length, (xssHtml.match(/<script/g) || []).length);
});

test('cuon-phim CSS: stops infinite animations under html[data-motion="lite"] and avoids sub-13px fonts', () => {
  const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
  assert.match(css, /html\[data-motion="?lite"?\]/);
  assert.match(css, /\.cover-hint/);
  assert.match(css, /\.seat\.mine/);
  const pxMatches = [...css.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)];
  for (const m of pxMatches) {
    assert.ok(parseFloat(m[1]) >= 13, `Found font-size < 13px in cuon-phim/theme.css: ${m[0]}`);
  }
});

test('cuon-phim images: 7 unique files with 0 MD5 collisions across all themes and legacy demos', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7, 'Expected anh1..6.jpg + xem-truoc.jpg (7 files)');
  assert.ok(files.includes('xem-truoc.jpg'));
  for (let i = 1; i <= 6; i++) assert.ok(files.includes(`anh${i}.jpg`), `Missing anh${i}.jpg`);

  const otherHashes = new Map();
  for (const base of ['packages/themes', 'legacy']) {
    const baseDir = path.join(REPO_ROOT, base);
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir)) {
      if (base === 'packages/themes' && entry === 'cuon-phim') continue;
      const d = path.join(baseDir, entry, 'images');
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) {
        const fp = path.join(d, f);
        if (fs.statSync(fp).isFile()) {
          otherHashes.set(crypto.createHash('md5').update(fs.readFileSync(fp)).digest('hex'), fp);
        }
      }
    }
  }

  const seenOwn = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    assert.ok(buf.length > 20_000, `${f} unexpectedly small (${buf.length} bytes)`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(seenOwn.has(md5), false, `Duplicate MD5 within cuon-phim/images: ${f}`);
    seenOwn.add(md5);
    assert.equal(otherHashes.has(md5), false, `MD5 collision for ${f} with ${otherHashes.get(md5)}`);
  }
});
