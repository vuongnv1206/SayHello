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

test('chieu-sau contract: lookbook layout, optical-push moment, 3 topics, zero fallback', () => {
  assert.equal(theme.id, 'chieu-sau');
  assert.equal(theme.layout, 'lookbook');
  assert.equal(theme.moment?.id, 'optical-push');
  assert.equal(theme.fallback.length, 0);
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.deepEqual(theme.topics.map(t => t.id), ['suong-da-lat', 'dem-sai-gon', 'chang-vang-bien']);
});

test('chieu-sau renderDocument: 2.5D imgPair cutouts, graceful no-fg fallback, topics & stripped optional fields', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/chieu-sau/',
    assetBase: '/_e/themes/chieu-sau/',
  });
  assert.match(fullHtml, /data-layout="lookbook"/);
  assert.match(fullHtml, /data-moment="optical-push"/);
  assert.match(fullHtml, /class="cs-fg"/);
  assert.match(fullHtml, /class="cs-frame no-fg/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /class="accounts"/);
  assert.doesNotMatch(fullHtml, /2\.5D/);
  assert.equal(typeof theme.scenes.find(s => s.id === 'trang-bia')?.mount, 'function');

  const night = renderDocument(theme, { ...DEMO, topic: 'dem-sai-gon' });
  assert.match(night, /data-topic="dem-sai-gon"/);
  assert.match(night, /#121316/);

  const stripped = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '', families: [] });
  assert.doesNotMatch(stripped, /id="chuyen-tinh"/);
  assert.doesNotMatch(stripped, /class="accounts"/);
  assert.doesNotMatch(stripped, /id="sh-audio"/);
});

test('chieu-sau CSS enforces >= 13px labels and zero infinite animations', () => {
  const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.match(css, /max\(13px/);
});

test('chieu-sau images: 11 unique files (6 jpg + 4 cutout webp + preview), no duplicates', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  if (!fs.existsSync(imgDir)) return;
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 11);
  const own = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    assert.ok(buf.length > 15_000, `${f} too small`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(own.has(md5), false);
    own.add(md5);
  }
});
