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

test('hop-ky-uc contract: deck layout, deal-flip moment, 2 topics, zero fallback', () => {
  assert.equal(theme.id, 'hop-ky-uc');
  assert.equal(theme.layout, 'deck');
  assert.equal(theme.moment?.id, 'deal-flip');
  assert.equal(theme.fallback.length, 0);
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.deepEqual(theme.topics.map(t => t.id), ['hop-nhung', 'buu-thiep']);
});

test('hop-ky-uc renderDocument: deck tabs, flip card, visible RSVP form, stripped optional fields', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/hop-ky-uc/',
    assetBase: '/_e/themes/hop-ky-uc/',
  });
  assert.match(fullHtml, /data-layout="deck"/);
  assert.match(fullHtml, /data-moment="deal-flip"/);
  assert.match(fullHtml, /data-cards="/);
  assert.match(fullHtml, /data-flip/);
  assert.doesNotMatch(fs.readFileSync(path.join(PKG_DIR, 'theme.js'), 'utf8'), /ctx\.album/);
  assert.match(fullHtml, /<form class="sh-form[^"]*" data-sh="rsvp"/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /class="accounts"/);

  const buuThiep = renderDocument(theme, { ...DEMO, topic: 'buu-thiep' });
  assert.match(buuThiep, /data-topic="buu-thiep"/);
  assert.match(buuThiep, /#1A2B42/);

  const stripped = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '', families: [] });
  assert.doesNotMatch(stripped, /id="ky-niem"/);
  assert.doesNotMatch(stripped, /class="accounts"/);
  assert.doesNotMatch(stripped, /id="sh-audio"/);
});

test('hop-ky-uc CSS enforces >= 13px labels and zero infinite animations', () => {
  const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.match(css, /max\(13px/);
});

test('hop-ky-uc images: 7 unique files with 0 MD5 collisions across repo', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  if (!fs.existsSync(imgDir)) return;
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const otherHashes = new Map();
  for (const base of ['packages/themes', 'legacy']) {
    const baseDir = path.join(REPO_ROOT, base);
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir)) {
      if (base === 'packages/themes' && entry === 'hop-ky-uc') continue;
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
