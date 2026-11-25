import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { renderDocument } from '@sayhello/engine';
import theme from '../theme.js';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const { chromium } = require('playwright');

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(DIR, '..');
const REPO_ROOT = path.resolve(PKG_DIR, '..', '..', '..');
const DEMO = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'demo.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

const ALLOWED_EXTERNAL_ERRORS = [
  /(Failed to load resource|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_TIMED_OUT|ERR_CONNECTION_REFUSED).*(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|vietqr|fonts\.googleapis|fonts\.gstatic|maps\.google)/i,
];

function startServer() {
  const routes = [
    { prefix: '/_e/engine/', dir: path.join(REPO_ROOT, 'packages', 'engine', 'src') },
    { prefix: '/_e/themes/to-hong/', dir: PKG_DIR },
    { prefix: '/assets/', dir: path.join(REPO_ROOT, 'legacy', 'assets') },
  ];

  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const p = u.pathname;

    if (p === '/' || p === '/index.html') {
      const palette = u.searchParams.get('p') || undefined;
      const doc = renderDocument(theme, palette ? { ...DEMO, palette } : DEMO, {
        engineUrl: '/_e/engine/',
        themeUrl: '/_e/themes/to-hong/',
        assetBase: '/_e/themes/to-hong/',
      });
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(doc);
      return;
    }

    if (p === '/stripped') {
      const doc = renderDocument(theme, { ...DEMO, story: [], accounts: [] }, {
        engineUrl: '/_e/engine/',
        themeUrl: '/_e/themes/to-hong/',
        assetBase: '/_e/themes/to-hong/',
      });
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(doc);
      return;
    }

    for (const r of routes) {
      if (p.startsWith(r.prefix)) {
        const rel = decodeURIComponent(p.slice(r.prefix.length));
        const fp = path.resolve(r.dir, rel);
        if (!fp.startsWith(r.dir) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        const ext = path.extname(fp).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(fp).pipe(res);
        return;
      }
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

const cdnCache = new Map();

async function createTrackedPage(browser, baseUrl, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.route('https://www.google.com/maps/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map</title>' })
  );
  await ctx.route(/^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\//, async route => {
    const url = route.request().url();
    if (cdnCache.has(url)) {
      const c = cdnCache.get(url);
      return route.fulfill({ status: c.status, headers: c.headers, body: c.body });
    }
    const resp = await route.fetch();
    const body = await resp.body();
    const headers = { ...resp.headers(), 'access-control-allow-origin': '*' };
    if (resp.status() === 200) cdnCache.set(url, { status: 200, headers, body });
    return route.fulfill({ status: resp.status(), headers, body });
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const httpErrors = [];
  const origin = new URL(baseUrl).origin;

  page.on('pageerror', err => pageErrors.push(err?.message || String(err)));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const txt = msg.text();
    const loc = msg.location()?.url || '';
    if (ALLOWED_EXTERNAL_ERRORS.some(re => re.test(`${txt} ${loc}`))) return;
    consoleErrors.push(loc ? `${txt} (${loc})` : txt);
  });
  page.on('response', res => {
    if (res.status() < 400) return;
    let resOrigin = '';
    try { resOrigin = new URL(res.url()).origin; } catch {}
    if (resOrigin === origin) httpErrors.push(`${res.status()} ${res.url()}`);
  });

  return {
    ctx,
    page,
    assertClean(label) {
      const all = [...pageErrors, ...consoleErrors, ...httpErrors];
      assert.equal(all.length, 0, `${label} errors: ${all.join(' | ')}`);
    },
  };
}

async function openGate(page) {
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
  if (await page.evaluate(() => document.documentElement.classList.contains('sh-open'))) return;
  const cta = page.locator('.sh-gate [data-open]').first();
  await cta.waitFor({ state: 'visible', timeout: 5000 });
  const hitOk = await cta.evaluate(el => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  });
  assert.ok(hitOk, 'Gate [data-open] CTA must be unoccluded at center');
  await cta.click();
  await page.waitForFunction(
    () => document.documentElement.classList.contains('sh-open') && Boolean(document.querySelector('.sh-gate')?.hidden),
    null,
    { timeout: 8000 }
  );
}

async function scrollPage(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 450) {
    await page.evaluate(pos => window.scrollTo({ top: pos, behavior: 'instant' }), y);
    await page.waitForTimeout(35);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(150);
}

async function checkNoOverflowAndMinFont(page, label) {
  const ov = await page.evaluate(() => ({
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    iw: window.innerWidth,
  }));
  assert.ok(ov.sw <= ov.iw + 2, `${label}: horizontal overflow ${ov.sw} > ${ov.iw}`);

  const small = await page.evaluate(() => {
    const bad = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'OPTION'].includes(el.tagName) || el.closest('svg')) continue;
      let t = '';
      for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
      t = t.replace(/\s+/g, ' ').trim();
      if (!/\p{L}{2,}/u.test(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      let hidden = false;
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        const cs = getComputedStyle(cur);
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true' || cur.classList.contains('sh-sr')
          || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) {
          hidden = true; break;
        }
      }
      if (hidden) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 13) bad.push({ tag: el.tagName, cls: el.className, fs, t: t.slice(0, 40) });
    }
    return bad;
  });
  assert.equal(small.length, 0, `${label}: small Vietnamese text < 13px: ${JSON.stringify(small)}`);
}

const { server, baseUrl } = await startServer();
const browser = await chromium.launch({ headless: true });

try {
  const VIEWPORTS = [
    { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  ];

  // 1. Cinematic (?tier=cinematic&snap=1 and ?tier=cinematic without snap) + standard + lite across 1440x900 & 390x844
  for (const vp of VIEWPORTS) {
    for (const mode of [
      { label: 'cinematic-snap', query: '?tier=cinematic&snap=1&k=Ch%E1%BB%8B+Lan', expected: 'cinematic', checkCanvas: true },
      { label: 'cinematic-nosnap', query: '?tier=cinematic&k=Ch%E1%BB%8B+Lan', expected: 'cinematic', checkCanvas: false },
      { label: 'standard', query: '?tier=standard&k=Ch%E1%BB%8B+Lan', expected: 'standard', checkCanvas: false },
      { label: 'lite', query: '?tier=lite&k=Ch%E1%BB%8B+Lan', expected: 'lite', checkCanvas: false },
    ]) {
      const s = await createTrackedPage(browser, baseUrl, vp);
      try {
        await s.page.goto(`${baseUrl}/${mode.query}`, { waitUntil: 'load', timeout: 30000 });
        await s.page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        assert.equal(await s.page.getAttribute('html', 'data-motion'), mode.expected);
        const guestTxt = await s.page.locator('.sh-gate [data-guest]').first().textContent();
        assert.equal(guestTxt, 'Chị Lan');

        await openGate(s.page);
        await s.page.waitForTimeout(450);

        if (mode.checkCanvas) {
          const canvasBox = await s.page.locator('.th-canvas').boundingBox();
          assert.ok(canvasBox && canvasBox.width >= vp.viewport.width - 4 && canvasBox.height >= 400, `${vp.name} cinematic canvas missing`);
        }

        await scrollPage(s.page);
        await checkNoOverflowAndMinFont(s.page, `${vp.name} ${mode.label}`);

        // Desktop wide check when not in 3D canvas mode
        if (vp.name === 'desktop' && (mode.expected === 'lite' || mode.expected === 'standard')) {
          const span = await s.page.evaluate(() => {
            const imgs = [...document.querySelectorAll('.th-track .th-frame')];
            const ls = imgs.map(e => e.getBoundingClientRect().left);
            const rs = imgs.map(e => e.getBoundingClientRect().right);
            return Math.max(...rs) - Math.min(...ls);
          });
          assert.ok(span > 620, `Desktop ${mode.label} must not collapse <=540px (span=${span})`);
        }

        s.assertClean(`${vp.name} ${mode.label}`);
        console.log(`PASS: ${vp.name} ${mode.label}`);
      } finally {
        await s.ctx.close();
      }
    }
  }

  // 2. Reduced motion + heading opacity + webglcontextlost (< 300ms -> lite)
  {
    const s = await createTrackedPage(browser, baseUrl, { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    try {
      await s.page.goto(`${baseUrl}/`, { waitUntil: 'load', timeout: 30000 });
      await openGate(s.page);
      assert.equal(await s.page.getAttribute('html', 'data-motion'), 'lite');
      await scrollPage(s.page);
      const lowHeadings = await s.page.evaluate(() =>
        [...document.querySelectorAll('.sh-scene h1, .sh-scene h2, .sh-scene h3')].filter(el => {
          const cs = getComputedStyle(el);
          return cs.display !== 'none' && parseFloat(cs.opacity) <= 0.5;
        }).length
      );
      assert.equal(lowHeadings, 0, 'Reduced motion headings must remain opacity > 0.5');
      s.assertClean('reducedMotion');
      console.log('PASS: reducedMotion');
    } finally {
      await s.ctx.close();
    }
  }

  {
    const s = await createTrackedPage(browser, baseUrl, { viewport: { width: 390, height: 844 } });
    try {
      await s.page.goto(`${baseUrl}/?tier=cinematic&snap=1`, { waitUntil: 'load', timeout: 30000 });
      await openGate(s.page);
      await s.page.waitForFunction(() => document.documentElement.classList.contains('th-ready'), null, { timeout: 20000 });
      const canceled = await s.page.evaluate(() => {
        const cv = document.querySelector('.th-canvas');
        const ev = new Event('webglcontextlost', { cancelable: true });
        cv.dispatchEvent(ev);
        return ev.defaultPrevented;
      });
      assert.equal(canceled, true, 'webglcontextlost must call preventDefault()');
      await s.page.waitForTimeout(250);
      assert.equal(await s.page.getAttribute('html', 'data-motion'), 'lite', 'Must downgrade to lite within < 300ms');
      assert.equal(await s.page.evaluate(() => document.documentElement.classList.contains('th-3d')), false);
      s.assertClean('webglcontextlost');
      console.log('PASS: webglcontextlost (< 300ms -> lite)');
    } finally {
      await s.ctx.close();
    }
  }

  // 3. Guest groups (?n=nha-gai&open=1 vs ?n=khong-co&open=1) + ?p=dem-to-do + stripped story/accounts
  {
    const s = await createTrackedPage(browser, baseUrl, { viewport: { width: 390, height: 844 } });
    try {
      await s.page.goto(`${baseUrl}/?n=nha-gai&open=1&p=dem-to-do`, { waitUntil: 'load', timeout: 30000 });
      await s.page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      assert.equal(await s.page.getAttribute('html', 'data-palette'), 'dem-to-do');
      assert.equal(await s.page.$eval('[data-sh="group-note"]', el => el.hidden), false);
      const hiddenEv = await s.page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
      assert.ok(hiddenEv >= 1, 'Expected non-group event hidden for ?n=nha-gai');

      await s.page.goto(`${baseUrl}/?n=khong-co&open=1`, { waitUntil: 'load', timeout: 30000 });
      await s.page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      assert.equal(await s.page.$eval('[data-sh="group-note"]', el => el.hidden), true);
      assert.equal(await s.page.$$eval('#sh-quick [data-ev][hidden]', els => els.length), 0);

      await s.page.goto(`${baseUrl}/stripped?open=1&tier=lite`, { waitUntil: 'load', timeout: 30000 });
      await s.page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      assert.equal(await s.page.locator('.th-s-text, .th-accs, .accounts, .gift-accounts').count(), 0);
      const bodyTxt = await s.page.evaluate(() => document.body.innerText);
      assert.equal(bodyTxt.includes(DEMO.story[0].title), false);
      assert.equal(bodyTxt.includes('0000000000'), false);

      s.assertClean('groups-palette-stripped');
      console.log('PASS: ?n=nha-gai / ?n=khong-co / ?p=dem-to-do / stripped');
    } finally {
      await s.ctx.close();
    }
  }

  // 4. Interactive #knotBtn hold-to-tie + RSVP + Wish + #sh-quick + .th-view lightbox
  {
    const s = await createTrackedPage(browser, baseUrl, { viewport: { width: 390, height: 844 } });
    try {
      await s.page.goto(`${baseUrl}/?tier=lite&k=Anh+Tu%E1%BA%A5n`, { waitUntil: 'load', timeout: 30000 });
      await openGate(s.page);

      // Lightbox check
      await s.page.locator('.th-photo-btn').first().click();
      await s.page.locator('.th-view[open]').waitFor({ state: 'visible', timeout: 3000 });
      await s.page.locator('.th-v-next').click();
      assert.match(await s.page.locator('.th-view-count').textContent() || '', /^2 \//);
      await s.page.locator('.th-v-close').click();

      // Quick Info drawer check (at top and bottom)
      await s.page.locator('[data-sh="quick-open"]').click();
      await s.page.locator('#sh-quick[open]').waitFor({ state: 'visible', timeout: 3000 });
      assert.ok((await s.page.locator('#sh-quick .sh-quick-events li').count()) >= 2);
      await s.page.locator('#sh-quick [data-sh="quick-close"]').first().click();
      await s.page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

      // Hold #knotBtn to tie & auto-submit RSVP
      const kb = s.page.locator('#knotBtn');
      await kb.scrollIntoViewIfNeeded();
      await kb.dispatchEvent('pointerdown', { pointerId: 1 });
      await s.page.waitForFunction(
        () => /Cảm ơn/.test(document.querySelector('form[data-sh="rsvp"] .sh-msg')?.textContent || ''),
        null,
        { timeout: 5000 }
      );
      await kb.dispatchEvent('pointerup', { pointerId: 1 });
      assert.ok(await s.page.locator('.th-desk-rsvp.is-tied').count() === 1);

      // Standard form[data-sh="rsvp"] [type="submit"] still works cleanly
      const rsvpSubmit = s.page.locator('form[data-sh="rsvp"] [type="submit"]');
      await rsvpSubmit.scrollIntoViewIfNeeded();
      await rsvpSubmit.click();
      await s.page.waitForFunction(
        () => /Cảm ơn/.test(document.querySelector('form[data-sh="rsvp"] .sh-msg')?.textContent || ''),
        null,
        { timeout: 5000 }
      );

      // Quick Info still clickable at page bottom
      await s.page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await s.page.waitForTimeout(200);
      await s.page.locator('[data-sh="quick-open"]').click();
      await s.page.locator('#sh-quick[open]').waitFor({ state: 'visible', timeout: 3000 });
      await s.page.locator('#sh-quick [data-sh="quick-close"]').first().click();

      // Submit wish
      const wf = s.page.locator('form[data-sh="wish"]');
      await wf.locator('textarea[name="message"]').fill('Chúc Nhật Minh & Thanh Trúc trăm năm hạnh phúc!');
      await wf.locator('[type="submit"]').click();
      await s.page.waitForFunction(
        () => /Cảm ơn/.test(document.querySelector('form[data-sh="wish"] .sh-msg')?.textContent || ''),
        null,
        { timeout: 5000 }
      );
      assert.match(await s.page.locator('[data-sh="wishes"]').textContent() || '', /trăm năm hạnh phúc/);

      s.assertClean('interactive-flows');
      console.log('PASS: interactive #knotBtn + RSVP + Wish + #sh-quick + .th-view lightbox');
    } finally {
      await s.ctx.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
