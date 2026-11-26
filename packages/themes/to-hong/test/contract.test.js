import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildContext, renderDocument } from '@sayhello/engine';
import theme, { plan, polarKnotPath } from '../theme.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(DIR, '..');
const DEMO = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'demo.json'), 'utf8'));

test('defineTheme contract: metadata, provides, fallback === 0, motion.lite pairs', () => {
  assert.equal(theme.id, 'to-hong');
  assert.equal(theme.name, 'Tơ Hồng');
  assert.equal(theme.version, '2.0.0');
  assert.equal(theme.tier, 'cinematic');
  assert.equal(theme.layout, 'stage');
  assert.equal(theme.fallback.length, 0, 'All required features (when, where, rsvp) must be provided');
  assert.equal(theme.scenes[0].kind, 'gate');
  assert.equal(theme.palettes.length, 2);
  assert.equal(theme.palettes[0].id, 'suong-som');
  assert.equal(theme.palettes[1].id, 'dem-to-do');
  assert.match(theme.fonts, /vietnamese|Bricolage\+Grotesque.*Newsreader.*Be\+Vietnam\+Pro/i);

  for (const s of theme.scenes) {
    if (s.motion?.cinematic) {
      assert.ok(s.motion.lite, `Scene "${s.id}" with motion.cinematic must define motion.lite`);
    }
  }
});

test('strict lazy loading & GLSL pow() safety', () => {
  const themeSrc = fs.readFileSync(path.join(PKG_DIR, 'theme.js'), 'utf8');
  assert.doesNotMatch(themeSrc, /from\s+['"](three|gsap|lenis|\.\/thread3d\.js|\.\/motion2d\.js)/, 'Must not statically import heavy libs or motion modules');
  assert.match(themeSrc, /\/\* webpackIgnore: true \*\/ \/\* turbopackIgnore: true \*\//);

  const threadSrc = fs.readFileSync(path.join(PKG_DIR, 'thread3d.js'), 'utf8');
  assert.match(threadSrc, /RoomEnvironment/);
  assert.match(threadSrc, /PMREMGenerator/);
  assert.match(threadSrc, /createPost/);
  assert.match(threadSrc, /bindContextLoss/);
  assert.match(threadSrc, /ctx\.downgrade\(['"]webglcontextlost['"]\)/);

  // Check GLSL pow() calls use safe max(..., 0.0001)
  const powMatches = threadSrc.match(/\bpow\s*\([^)]+\)/g) || [];
  for (const m of powMatches) {
    assert.match(m, /max\s*\(/, `Unsafe GLSL pow() without max(): ${m}`);
  }
});

test('plan(ctx) scales cleanly across 6, 12, 20, and 30 photos with optional story', () => {
  for (const count of [6, 12, 20, 30]) {
    const album = Array.from({ length: count }, (_, i) => `images/anh${(i % 12) + 1}.jpg`);
    const inviteNoStory = { ...DEMO, story: [], images: { ...DEMO.images, album } };
    const ctxNoStory = buildContext(theme, inviteNoStory, { assetBase: '/_e/themes/to-hong/' });
    const stopsNoStory = plan(ctxNoStory);

    const renderedImgs = stopsNoStory
      .filter(s => s.kind === 'work')
      .reduce((sum, s) => sum + s.works.length, 0);
    assert.equal(renderedImgs, count, `Expected all ${count} photos planned`);
    assert.equal(stopsNoStory.filter(s => s.kind === 'text').length, 0, 'Must omit story stops when story=[]');
    assert.equal(stopsNoStory[0].kind, 'title');
    assert.equal(stopsNoStory[stopsNoStory.length - 1].kind, 'finale');

    const inviteWithStory = { ...DEMO, images: { ...DEMO.images, album } };
    const ctxWithStory = buildContext(theme, inviteWithStory, { assetBase: '/_e/themes/to-hong/' });
    const stopsWithStory = plan(ctxWithStory);
    assert.equal(stopsWithStory.filter(s => s.kind === 'text').length, DEMO.story.length);
  }
});

test('polarKnotPath generates valid SVG path', () => {
  const d = polarKnotPath(95);
  assert.match(d, /^M[\d.-]+ [\d.-]+/);
  assert.ok(d.length > 500);
});

test('renderDocument: full demo, stripped story/accounts, palette dem-to-do, and XSS escaping', () => {
  const fullHtml = renderDocument(theme, DEMO, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/to-hong/',
    assetBase: '/_e/themes/to-hong/',
  });
  assert.match(fullHtml, /<html lang="vi" class="sh-locked"/);
  assert.match(fullHtml, /id="bia-to-hong"/);
  assert.match(fullHtml, /id="duong-to"/);
  assert.match(fullHtml, /id="ket-duyen"/);
  assert.match(fullHtml, /id="sh-quick"/);
  assert.match(fullHtml, /id="sh-audio"/);
  assert.match(fullHtml, /data-ev="0"/);
  assert.match(fullHtml, /data-ev="1"/);
  assert.match(fullHtml, /class="th-accs"/);
  assert.doesNotMatch(fullHtml, /class="accounts"/);
  assert.match(fullHtml, /img\.vietqr\.io/);

  const strippedHtml = renderDocument(theme, { ...DEMO, story: [], accounts: [] }, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/to-hong/',
    assetBase: '/_e/themes/to-hong/',
  });
  assert.doesNotMatch(strippedHtml, /th-s-text/);
  assert.doesNotMatch(strippedHtml, /th-accs/);
  assert.doesNotMatch(strippedHtml, new RegExp(DEMO.story[0].title));
  assert.doesNotMatch(strippedHtml, /0000000000/);

  const darkHtml = renderDocument(theme, { ...DEMO, palette: 'dem-to-do' }, {
    engineUrl: '/_e/engine/',
    themeUrl: '/_e/themes/to-hong/',
    assetBase: '/_e/themes/to-hong/',
  });
  assert.match(darkHtml, /data-palette="dem-to-do"/);
  assert.match(darkHtml, /--mist:#160D10/);

  const xssHtml = renderDocument(theme, {
    ...DEMO,
    slug: '</script><script>alert(1)</script>',
    groom: { ...DEMO.groom, short: 'Nhật <b>Minh</b>' },
  });
  assert.doesNotMatch(xssHtml, /Nhật <b>Minh<\/b>/);
  assert.match(xssHtml, /Nhật &lt;b&gt;Minh&lt;\/b&gt;/);
  assert.equal((xssHtml.match(/<\/script>/g) || []).length, (xssHtml.match(/<script/g) || []).length);
});

test('image assets: 13 files exist, no duplicates', () => {
  const thImagesDir = path.join(PKG_DIR, 'images');
  const files = fs.readdirSync(thImagesDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  assert.equal(files.length, 13, 'Expected anh1..12.jpg + xem-truoc.jpg (13 files)');
  assert.ok(files.includes('xem-truoc.jpg'));
  for (let i = 1; i <= 12; i++) assert.ok(files.includes(`anh${i}.jpg`), `Missing anh${i}.jpg`);

  const seenOwn = new Set();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(thImagesDir, f));
    assert.ok(buf.length > 20_000, `${f} unexpectedly small (${buf.length} bytes)`);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    assert.equal(seenOwn.has(md5), false, `Duplicate MD5 within to-hong/images: ${f}`);
    seenOwn.add(md5);
  }
});
