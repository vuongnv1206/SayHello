// Đo tốc độ mở thiệp trên điện thoại 4G chậm (giả lập), làm mốc so sánh bản 1 và bản 2.
//   node scripts/do-toc-do.mjs http://localhost:3001 /demo-cuon-phim/ /demo-tin-nhan/ /
// Mỗi trang đo 3 lần, lấy trung vị. Chỉ số:
//   FCP   lúc hiện nội dung đầu tiên
//   LCP   lúc hiện phần tử lớn nhất
//   Bìa   lúc nút mở thiệp [data-open] hiện ra và bấm được (với trang thiệp)
//   KB    tổng dữ liệu tải trước khi bìa sẵn sàng
import { chromium } from 'playwright';

const [base = 'http://localhost:3001', ...paths] = process.argv.slice(2);
const PAGES = paths.length ? paths : ['/', '/demo-song-hy/', '/demo-cuon-phim/', '/demo-tin-nhan/'];
const RUNS = 3;
// "Slow 4G" của Lighthouse: RTT 150ms, 1,6 Mbps tải xuống, 750 Kbps tải lên; CPU chậm 4 lần
const NET = { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const rows = [];

for (const p of PAGES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', NET);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0;
    cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(base + p + (/^\/(v2\/)?demo/.test(p) ? '?k=Khách+mời' : ''), { waitUntil: 'commit' });
    let cover = null;
    if (/^\/(v2\/)?demo/.test(p)) {
      await page.waitForSelector('[data-open], .lever', { state: 'visible', timeout: 60000 }).catch(() => {});
      cover = Date.now() - t0;
    }
    const coverBytes = bytes;
    await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => ({ fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, lcp: window.__lcp }));
    runs.push({ ...m, cover, kb: Math.round((cover ? coverBytes : bytes) / 1024) });
    await ctx.close();
  }
  rows.push({ trang: p, FCP: med(runs.map(r => r.fcp)), LCP: med(runs.map(r => r.lcp)), 'Bìa': runs[0].cover == null ? null : med(runs.map(r => r.cover)), KB: med(runs.map(r => r.kb)) });
}
await browser.close();

const s = ms => ms == null ? '-' : (ms / 1000).toFixed(2) + 's';
console.log(`\nĐo trên ${base} · 4G chậm + CPU chậm 4 lần · trung vị ${RUNS} lần\n`);
console.log('| Trang | FCP | LCP | Bìa bấm được | KB trước khi bìa sẵn sàng |\n|---|---|---|---|---|');
for (const r of rows) console.log(`| \`${r.trang}\` | ${s(r.FCP)} | ${s(r.LCP)} | ${s(r['Bìa'])} | ${r.KB} |`);
