// Soát một mẫu đang viết mà không cần build ứng dụng: tự mở máy chủ tĩnh, chạy các kiểm tra của E2E
// trên mọi chủ đề, và chụp ảnh để xem bằng mắt.
//   node tests/preview-theme.mjs packages/themes-wip/<id> [--shots <thư mục>]
import http from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './e2e/lib/registries.mjs';
import { createSafeContext, ensureQuickOpenVisible, launchBrowser, openGate, runGateRitual } from './e2e/lib/browser.mjs';
import {
  assertCoverGateTiming, assertFiveSecondDiscoverability, assertNoHorizontalOverflow, assertReadableVietnameseText,
  assertVestibularComfort, assertVisibleImagesLoaded, assertWcagContrast, scrollFullPage,
} from './e2e/lib/assertions.mjs';

const [dirArg, ...rest] = process.argv.slice(2);
if (!dirArg) {
  console.log('Dùng: node tests/preview-theme.mjs <thư mục mẫu> [--shots <thư mục>]');
  process.exit(1);
}
const dir = resolve(dirArg);
const shotsDir = rest[0] === '--shots' ? resolve(rest[1]) : '';
const { renderDocument } = await import(pathToFileURL(join(ROOT, 'packages', 'engine', 'src', 'index.js')).href);
const theme = (await import(pathToFileURL(join(dir, 'theme.js')).href)).default;
const demo = JSON.parse(readFileSync(join(dir, 'demo.json'), 'utf8'));
const id = theme.id;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const MOUNTS = [
  ['/_e/engine/', join(ROOT, 'packages', 'engine', 'src')],
  [`/_e/themes/${id}/`, dir],
  ['/assets/', join(ROOT, 'apps', 'web', 'public', 'assets')],
];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (code, type, body) => { res.writeHead(code, { 'Content-Type': type }); res.end(body); };
  if (url.pathname === '/') {
    const topic = url.searchParams.get('topic') || undefined;
    return send(200, TYPES['.html'], renderDocument(theme, demo, { assetBase: `/_e/themes/${id}/`, themeUrl: `/_e/themes/${id}/`, topic }));
  }
  if (url.pathname === '/favicon.ico') return send(204, 'image/x-icon', '');
  for (const [prefix, base] of MOUNTS) {
    if (!url.pathname.startsWith(prefix)) continue;
    const file = resolve(base, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (file.startsWith(base + sep) && existsSync(file) && statSync(file).isFile()) {
      return send(200, TYPES[extname(file).toLowerCase()] || 'application/octet-stream', readFileSync(file));
    }
  }
  send(404, 'text/plain; charset=utf-8', 'Không tìm thấy');
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const webUrl = `http://127.0.0.1:${server.address().port}`;

const VIEWPORTS = [
  { name: '320', viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true },
  { name: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: '1440', viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
];
const topics = (theme.topics?.length ? theme.topics : theme.palettes || [{ id: '' }]).map(t => t.id);
const browser = await launchBrowser();
let failed = 0;
let passed = 0;

async function check(name, opts, fn) {
  const session = await createSafeContext(browser, { webUrl, ...opts });
  try {
    const { page, tracker } = await session.newTrackedPage();
    await fn(page, session);
    tracker.assertClean(name);
    passed++;
    console.log(`  ĐẠT   ${name}`);
  } catch (err) {
    failed++;
    console.log(`  LỖI   ${name}\n        ${String(err.message || err).slice(0, 900)}`);
  } finally {
    await session.ctx.close();
  }
}
const go = async (page, query) => {
  await page.goto(`${webUrl}/?${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
};

for (const topic of topics) {
  for (const vp of VIEWPORTS) {
    const label = `${topic || id} ${vp.name}px`;
    await check(label, vp, async (page, session) => {
      await go(page, `topic=${topic}&tier=standard&k=${encodeURIComponent('Khách Thử')}`);
      await assertWcagContrast(page, { label: `${label} (bìa)` });
      await assertNoHorizontalOverflow(page, `${label} (bìa)`);
      await assertVestibularComfort(page, { label: `${label} (bìa)` });
      const timing = await openGate(page);
      assertCoverGateTiming({ unlockMs: timing.unlockMs, maxMs: 900, label });
      await assertFiveSecondDiscoverability(page, {
        groomShort: demo.groom?.short, brideShort: demo.bride?.short, date: demo.date, city: demo.city,
        venue: demo.events?.[0]?.venue, label,
      });
      await scrollFullPage(page);
      await assertVisibleImagesLoaded(page, label);
      await assertNoHorizontalOverflow(page, label);
      await assertReadableVietnameseText(page, { minPx: 13, label });
      await assertWcagContrast(page, { label: `${label} (mở)` });
      await assertVestibularComfort(page, { label });

      const quick = await ensureQuickOpenVisible(page);
      await quick.click({ timeout: 5000 });
      await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
      await page.waitForTimeout(150);
      await assertWcagContrast(page, { label: `${label} (thông tin nhanh)` });
      await page.locator('#sh-quick [data-sh="quick-close"]').first().click();

      for (const [kind, field] of [['rsvp', null], ['wish', 'message']]) {
        const form = page.locator(`.sh-scene form[data-sh="${kind}"]`).first();
        if (!(await form.count())) {
          if (kind === 'rsvp') throw new Error('thiếu form hồi âm trong cảnh');
          continue;
        }
        await form.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        const name = form.locator('input[name="name"]');
        if (!(await name.inputValue())) await name.fill('Khách Thử');
        if (field) await form.locator(`textarea[name="${field}"]`).fill('Chúc hai bạn trăm năm hạnh phúc!');
        await form.locator('[type="submit"]').click({ timeout: 5000 });
        await page.waitForFunction(k => /Cảm ơn/.test(document.querySelector(`.sh-scene form[data-sh="${k}"] .sh-msg`)?.textContent || ''), kind, { timeout: 6000 });
      }
      await page.waitForTimeout(500);
      await assertNoHorizontalOverflow(page, `${label} (sau hồi âm)`);
      await assertWcagContrast(page, { label: `${label} (sau hồi âm)` });
    });
  }
  await check(`${topic || id} bản nhẹ`, { ...VIEWPORTS[1], reducedMotion: 'reduce' }, async page => {
    await go(page, `topic=${topic}&tier=lite`);
    await openGate(page);
    await scrollFullPage(page);
    await assertVestibularComfort(page, { label: 'bản nhẹ', motionTier: 'lite', reducedMotion: true });
    await assertNoHorizontalOverflow(page, 'bản nhẹ');
  });
}
await check('nhóm khách ?n=nha-gai', VIEWPORTS[1], async page => {
  await go(page, 'n=nha-gai&open=1');
  if (await page.$eval('[data-sh="group-note"]', el => el.hidden).catch(() => true)) throw new Error('không hiện lời nhắn nhóm khách');
});
if (await (async () => readFileSync(join(dir, 'theme.js'), 'utf8').includes('data-ritual'))()) {
  await check('đi hết nghi thức mở', VIEWPORTS[1], async page => { await go(page, 'tier=standard'); await runGateRitual(page); });
}

if (shotsDir) {
  mkdirSync(shotsDir, { recursive: true });
  const shoot = async (opts, query, { open = true, full = true } = {}) => {
    const page = await browser.newPage({ ...opts, reducedMotion: 'reduce' });
    await page.goto(`${webUrl}/?${query}${open ? '&open=1&tier=lite' : ''}&k=${encodeURIComponent('Chị Lan')}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    if (full) {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
    }
    const buf = await page.screenshot({ fullPage: full });
    await page.close();
    return `data:image/png;base64,${buf.toString('base64')}`;
  };
  const sheet = async (file, items, imgWidth, height) => {
    const page = await browser.newPage({ viewport: { width: Math.min(items.length, 4) * (imgWidth + 10), height: height || 100 } });
    await page.setContent(`<body style="margin:0;background:#777;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start">${items
      .map(i => `<figure style="margin:0;width:${imgWidth}px"><figcaption style="background:#000;color:#fff;font:15px sans-serif;padding:3px">${i.label}</figcaption><img src="${i.src}" style="width:${imgWidth}px;display:block"></figure>`)
      .join('')}</body>`);
    await page.screenshot({ path: join(shotsDir, file), fullPage: !height });
    await page.close();
  };
  const covers = [];
  for (const topic of topics) covers.push({ label: `bìa ${topic}`, src: await shoot({ viewport: { width: 360, height: 640 } }, `topic=${topic}`, { open: false, full: false }) });
  await sheet('bia.png', covers, 360);
  const bodies = [];
  for (const topic of topics) bodies.push({ label: topic, src: await shoot({ viewport: { width: 360, height: 800 } }, `topic=${topic}`) });
  await sheet('than-dien-thoai.png', bodies, 360, 2800);
  const wide = [];
  for (const topic of topics) wide.push({ label: `${topic} 1440`, src: await shoot({ viewport: { width: 1440, height: 900 } }, `topic=${topic}`, { full: false }) });
  await sheet('may-tinh.png', wide, 700);
  console.log(`Ảnh: ${shotsDir}`);
}

await browser.close();
server.close();
console.log(`\n${id}: đạt ${passed}, lỗi ${failed}`);
process.exit(failed ? 1 : 0);
