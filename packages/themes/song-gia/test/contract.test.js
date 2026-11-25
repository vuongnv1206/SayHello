import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderDocument } from '@sayhello/engine';
import theme, { polarKnotPath } from '../theme.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(DIR, '..');
const REPO_ROOT = path.resolve(PKG_DIR, '..', '..', '..');
const DEMO = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'demo.json'), 'utf8'));

test('song-gia contract: split layout, seam-converge moment, 2 topics, zero fallback', () => {
  assert.equal(theme.id, 'song-gia');
  assert.equal(theme.layout, 'split');
  assert.equal(theme.moment?.id, 'seam-converge');
  assert.equal(theme.fallback.length, 0);
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.deepEqual(theme.topics.map(t => t.id), ['gom-su', 'hai-thanh-pho']);
  assert.ok(polarKnotPath(84).length > 400);
});

test('song-gia renderDocument: 50/50 split, switcher, 2D SVG knot, stripped optional fields', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/song-gia/',
    assetBase: '/_e/themes/song-gia/',
  });
  assert.match(fullHtml, /data-layout="split"/);
  assert.match(fullHtml, /data-moment="seam-converge"/);
  assert.match(fullHtml, /data-side-pick="nha-gai"/);
  assert.match(fullHtml, /sg-knot-svg/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /data-ev="1"/);
  assert.match(fullHtml, /class="accounts"/);

  const twoCities = renderDocument(theme, { ...DEMO, topic: 'hai-thanh-pho' });
  assert.match(twoCities, /data-topic="hai-thanh-pho"/);
  assert.match(twoCities, /#3D5A4C/);

  const stripped = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '', families: [] });
  assert.doesNotMatch(stripped, /id="hanh-trinh"/);
  assert.doesNotMatch(stripped, /class="accounts"/);
  assert.doesNotMatch(stripped, /id="sh-audio"/);
});

test('song-gia CSS enforces >= 13px labels and zero infinite animations', () => {
  const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.match(css, /max\(13px/);
});

test('song-gia images: 7 unique files with 0 MD5 collisions across repo', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  if (!fs.existsSync(imgDir)) return;
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const otherHashes = new Map();
  for (const base of ['packages/themes', 'legacy']) {
    const baseDir = path.join(REPO_ROOT, base);
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir)) {
      if (base === 'packages/themes' && entry === 'song-gia') continue;
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
  const own = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    assert.ok(buf.length > 15_000, `${f} too small`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(own.has(md5), false);
    own.add(md5);
    assert.equal(otherHashes.has(md5), false, `Collision on ${f} with ${otherHashes.get(md5)}`);
  }
});
