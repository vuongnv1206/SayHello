import test from 'node:test';
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
const render = (data, opts = {}) => renderDocument(theme, data, { assetBase: '/_e/themes/photobooth/', ...opts });

test('photobooth contract: required features are placed in scenes', () => {
  assert.equal(theme.id, 'photobooth');
  assert.deepEqual([...theme.fallback], []);
  assert.ok(theme.gateMs <= 900);
  assert.ok(theme.moment?.verbLabel);
});

test('the long opening ritual always ships with a skip button', () => {
  const html = render(demo);
  assert.match(html, /<button[^>]*\bdata-ritual\b/);
  assert.match(html, /<button[^>]*\bdata-skip\b/);
});

test('renderDocument: every palette, stripped optional data, XSS and prototype keys', () => {
  for (const { id } of theme.palettes) assert.ok(render({ ...demo, palette: id }).includes('Nhật Minh'));
  assert.ok(render({ ...demo, story: [], accounts: [], music: '', families: [] }).includes('Thanh Trúc'));
  const evil = render({ ...demo, groom: { short: '<script>alert(1)</script>', full: 'x' } });
  assert.ok(!evil.includes('<script>alert(1)</script>'));
  assert.doesNotThrow(() => render(demo, { topic: '__proto__' }));
});

test('no endless animation on full-screen layers', () => {
  assert.ok(!/\binfinite\b/.test(css));
});

test('photobooth images: 7 unique files, no duplicates', () => {
  const dir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const hashes = new Set(files.map(f => crypto.createHash('md5').update(fs.readFileSync(path.join(dir, f))).digest('hex')));
  assert.equal(hashes.size, files.length);
});
