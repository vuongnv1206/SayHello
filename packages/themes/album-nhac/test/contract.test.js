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
const render = (data, opts = {}) => renderDocument(theme, data, { assetBase: '/_e/themes/album-nhac/', ...opts });

test('album-nhac contract: required features are placed in scenes, cover opens fast', () => {
  assert.equal(theme.id, 'album-nhac');
  assert.deepEqual([...theme.fallback], []);
  assert.ok(theme.gateMs <= 900);
  assert.ok(theme.moment?.verbLabel);
  assert.ok(theme.topics.length >= 3);
});

test('every topic carries its own layout rules, not only colours', () => {
  const [, ...others] = theme.topics;
  for (const { id } of others) assert.ok(css.includes(`html[data-topic="${id}"]`), `no structural rules for ${id}`);
});

test('renderDocument: every topic, stripped optional data, XSS and prototype keys', () => {
  for (const { id } of theme.topics) {
    const page = render(demo, { topic: id });
    assert.ok(page.includes(`data-topic="${id}"`));
    assert.ok(page.includes(demo.groom.short));
  }
  assert.ok(render({ ...demo, story: [], accounts: [], music: '', families: [], images: { album: [] } }).includes(demo.bride.short));
  const evil = render({ ...demo, groom: { short: '<script>alert(1)</script>', full: 'x' }, city: '<img src=x onerror=alert(1)>' });
  assert.ok(!evil.includes('<script>alert(1)</script>'));
  assert.ok(!evil.includes('<img src=x onerror'));
  assert.doesNotThrow(() => render(demo, { topic: '__proto__' }));
});

test('no endless animation', () => {
  assert.ok(!/\binfinite\b/.test(css));
});

test('album-nhac images: 7 unique files, no duplicates', () => {
  const dir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 7);
  const hashes = new Set(files.map(f => crypto.createHash('md5').update(fs.readFileSync(path.join(dir, f))).digest('hex')));
  assert.equal(hashes.size, files.length);
});

test('music points at a track shipped with the app', () => {
  const file = path.resolve(PKG_DIR, '../../../apps/web/public', '.' + demo.music);
  assert.ok(fs.existsSync(file), demo.music);
});
