import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_EXTERNAL_CONSOLE_ERRORS = [
  /(Failed to load resource|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_TIMED_OUT|ERR_CONNECTION_REFUSED).*(cdn\.jsdelivr\.net|vietqr|fonts\.googleapis|fonts\.gstatic|maps\.google)/i,
  /WebSocket connection to 'ws:\/\/(127\.0\.0\.1|localhost):\d+\/_next\/hmr/i,
];

export async function launchBrowser() {
  return chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
}

function mockAppsScriptResponse(urlStr, method, postData, capturedPosts) {
  const u = new URL(urlStr);
  if (method === 'POST') {
    let parsed = postData;
    try {
      parsed = JSON.parse(postData || '{}');
    } catch {}
    capturedPosts.push({ url: urlStr, body: parsed, at: Date.now() });
    return { ok: true, wishes: [], rsvps: [], list: [], hearts: 42 };
  }
  const type = u.searchParams.get('type') || '';
  if (type === 'guests') return { rsvps: [], wishes: [] };
  if (type === 'content') return {};
  if (type === 'invite_list') return { list: [] };
  if (type === 'wishes') return [];
  if (type === 'hearts') return { hearts: 42 };
  if (type === 'seating') return { seats: {} };
  if (type === 'check_slug') return { taken: false };
  if (type === 'order_status') return { found: false };
  return { ok: true };
}

export async function createSafeContext(browser, {
  legacyUrl,
  webUrl,
  viewport = { width: 390, height: 844 },
  isMobile = false,
  hasTouch = false,
  reducedMotion = 'no-preference',
  acceptDownloads = false,
} = {}) {
  const ctx = await browser.newContext({
    viewport,
    isMobile,
    hasTouch,
    reducedMotion,
    acceptDownloads,
  });

  const capturedPosts = [];
  const originSet = new Set(
    [legacyUrl, webUrl]
      .filter(Boolean)
      .map(u => {
        try { return new URL(u).origin; } catch { return ''; }
      })
      .filter(Boolean)
  );

  // Intercept Google Apps Script to guarantee 0 real Google Sheet mutations
  await ctx.route('**/script.google.com/**', async route => {
    const req = route.request();
    const payload = mockAppsScriptResponse(req.url(), req.method(), req.postData(), capturedPosts);
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(payload),
    });
  });

  // Return clean 204/empty PNG for vietqr/google maps iframes if offline or to avoid console noise without hiding local errors
  await ctx.route('https://www.google.com/maps/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map</title>' })
  );

  function attachPage(page) {
    const pageErrors = [];
    const httpErrors = [];
    const consoleErrors = [];

    page.on('pageerror', err => {
      pageErrors.push(err?.message || String(err));
    });
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      const locUrl = msg.location()?.url || '';
      const combined = locUrl ? `${text} ${locUrl}` : text;
      if (ALLOWED_EXTERNAL_CONSOLE_ERRORS.some(re => re.test(combined))) return;
      consoleErrors.push(locUrl && !text.includes(locUrl) ? `${text} (${locUrl})` : text);
    });
    page.on('response', res => {
      if (res.status() < 400) return;
      const url = res.url();
      let resOrigin = '';
      try { resOrigin = new URL(url).origin; } catch {}
      if (resOrigin && originSet.has(resOrigin)) {
        httpErrors.push(`${res.status()} ${url}`);
      }
    });

    return {
      pageErrors,
      httpErrors,
      consoleErrors,
      allErrors() {
        return [
          ...pageErrors.map(e => `pageerror: ${e}`),
          ...httpErrors.map(e => `http: ${e}`),
          ...consoleErrors.map(e => `console.error: ${e}`),
        ];
      },
      assertClean(contextLabel = '') {
        const all = this.allErrors();
        if (all.length) {
          throw new Error(`${contextLabel ? contextLabel + ': ' : ''}${all.join(' | ')}`);
        }
      },
    };
  }

  async function newTrackedPage() {
    const page = await ctx.newPage();
    const tracker = attachPage(page);
    return { page, tracker };
  }

  return { ctx, capturedPosts, newTrackedPage, attachPage };
}

export async function saveShot(page, shotsDir, name) {
  if (!shotsDir || !page || page.isClosed()) return null;
  try {
    mkdirSync(shotsDir, { recursive: true });
    const safe = String(name || 'shot').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 96);
    const outPath = join(shotsDir, `${safe}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    return outPath;
  } catch {
    return null;
  }
}

export async function saveFailureShot(ctx, shotsDir, label, err) {
  if (!shotsDir || !ctx || err?.pendingMilestone) return null;
  const page = ctx.pages().find(p => !p.isClosed());
  if (!page) return null;
  return saveShot(page, shotsDir, `FAIL-${label}`);
}

export async function openV1Gate(page, { timeout = 8000 } = {}) {
  await page.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 12000 });
  const isAlreadyGone = await page.$('#cover.gone');
  if (isAlreadyGone) return;
  const opener = page.locator('#cover [data-open]').first();
  await opener.waitFor({ state: 'visible', timeout: 5000 });
  await opener.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  // Some themes apply idle bobbing CSS animations on [data-open], which trips Playwright's stability wait.
  // Verify the button is actually unoccluded at its center, then click cleanly.
  const hitOk = await opener.evaluate(el => {
    const r = el.getBoundingClientRect();
    const cx = Math.min(window.innerWidth - 1, Math.max(1, r.left + r.width / 2));
    const cy = Math.min(window.innerHeight - 1, Math.max(1, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  });
  if (!hitOk) throw new Error('v1 gate [data-open] is occluded at center');
  await opener.click({ force: true, timeout: 5000 });
  await page.waitForFunction(() => !!document.querySelector('#cover.gone'), null, { timeout });
}

export async function openV2Gate(page, { timeout = 8000 } = {}) {
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
  const alreadyOpen = await page.evaluate(() => document.documentElement.classList.contains('sh-open'));
  if (alreadyOpen) return;
  const gate = page.locator('.sh-gate');
  if ((await gate.count()) === 0) return;
  const explicitOpen = page.locator('.sh-gate [data-open]').first();
  const cta = (await explicitOpen.count()) > 0
    ? explicitOpen
    : page.locator('.sh-gate button, .sh-gate [role="button"], .sh-gate [data-open], .sh-gate .lever').first();
  await cta.waitFor({ state: 'visible', timeout: 5000 });
  await cta.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const hitOk = await cta.evaluate(el => {
    const r = el.getBoundingClientRect();
    const cx = Math.min(window.innerWidth - 1, Math.max(1, r.left + r.width / 2));
    const cy = Math.min(window.innerHeight - 1, Math.max(1, r.top + r.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  });
  if (!hitOk) throw new Error('v2 gate CTA is occluded at center');
  await cta.click({ force: true, timeout: 5000 });
  await page.waitForFunction(
    () => document.documentElement.classList.contains('sh-open') && Boolean(document.querySelector('.sh-gate')?.hidden),
    null,
    { timeout }
  );
}
