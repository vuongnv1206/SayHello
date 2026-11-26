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

test('thiep-gap-doi contract: folio layout, unseal-gleam moment, 3 topics, zero fallback', () => {
  assert.equal(theme.id, 'thiep-gap-doi');
  assert.equal(theme.layout, 'folio');
  assert.equal(theme.moment?.id, 'unseal-gleam');
  assert.equal(theme.fallback.length, 0);
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.deepEqual(theme.topics.map(t => t.id), ['son-mai', 'giay-do', 'lua-nga']);
});

test('thiep-gap-doi renderDocument: topics, stripped optional fields, XSS escaping', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/thiep-gap-doi/',
    assetBase: '/_e/themes/thiep-gap-doi/',
  });
  assert.match(fullHtml, /data-layout="folio"/);
  assert.match(fullHtml, /data-moment="unseal-gleam"/);
  assert.match(fullHtml, /data-topic="son-mai"/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /data-ev="1"/);
  assert.match(fullHtml, /class="accounts"/);
  assert.match(fullHtml, /img\.vietqr\.io/);

  const giayDo = renderDocument(theme, { ...DEMO, topic: 'giay-do' });
  assert.match(giayDo, /data-topic="giay-do"/);
  assert.match(giayDo, /#F5F0E6/);

  const stripped = renderDocument(theme, { ...DEMO, story: [], accounts: [], music: '', families: [] });
  assert.doesNotMatch(stripped, /id="chuyen-tinh"/);
  assert.doesNotMatch(stripped, /class="accounts"/);
  assert.doesNotMatch(stripped, /id="sh-audio"/);

  const xss = renderDocument(theme, { ...DEMO, groom: { short: 'Anh <b>X</b>' } });
  assert.doesNotMatch(xss, /Anh <b>X<\/b>/);
  assert.equal((xss.match(/<\/script>/g) || []).length, (xss.match(/<script/g) || []).length);
});

test('thiep-gap-doi CSS enforces >= 13px labels and zero infinite animations', () => {
  const css = fs.readFileSync(path.join(PKG_DIR, 'theme.css'), 'utf8');
  assert.doesNotMatch(css, /\binfinite\b/);
  assert.match(css, /max\(13px/);
});

test('thiep-gap-doi images: 7 unique files, no duplicates', () => {
  const imgDir = path.join(PKG_DIR, 'images');
  if (!fs.existsSync(imgDir)) return;
  const files = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const own = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    assert.ok(buf.length > 15_000, `${f} too small`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(own.has(md5), false);
    own.add(md5);
  }
});
