// Kiểm tra tự động toàn bộ thiệp bản 2 trên cả máy tính (1440x900) và điện thoại (390x844),
// ở cả 3 mức chuyển động (cinematic, standard, lite) và phân nhóm khách (?n=).
//   node apps/web/tests/thiep-v2.mjs [gốc=http://localhost:3000] [thư mục ảnh chụp] [--allow-pending]
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWebThemesRegistry } from '../../../tests/e2e/lib/registries.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node apps/web/tests/thiep-v2.mjs [baseUrl=http://localhost:3000] [shotsDir] [--allow-pending]');
  process.exit(0);
}

const ALLOW_PENDING = args.includes('--allow-pending') || process.env.E2E_ALLOW_PENDING === '1';
const posArgs = args.filter(a => !a.startsWith('--'));
const BASE = (posArgs[0] || 'http://localhost:3000').replace(/\/$/, '');
const SHOTS = posArgs[1] || '';
const GUEST = 'Chị Lan';
const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));

if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const ALLOWED_EXTERNAL_ERRORS = /(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|vietqr|fonts\.googleapis|fonts\.gstatic|maps\.google)/i;
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'mobile-320', width: 320, height: 568, isMobile: true, hasTouch: true },
];

async function discoverThemes() {
  const pkgDir = join(ROOT, 'packages', 'themes');
  const onDisk = existsSync(pkgDir)
    ? readdirSync(pkgDir).filter(d => existsSync(join(pkgDir, d, 'theme.js')) && existsSync(join(pkgDir, d, 'demo.json')))
    : [];

  const webReg = readWebThemesRegistry();
  const regIds = new Set(webReg.registeredIds);

  // Also scrape live /v2/ showcase links
  try {
    const res = await fetch(`${BASE}/v2/`);
    if (res.status === 200) {
      const html = await res.text();
      for (const m of html.matchAll(/\/v2\/demo\/([a-z0-9-]+)/gi)) regIds.add(m[1]);
    }
  } catch {}

  const allIds = [...new Set([...onDisk, ...regIds])];
  const out = [];
  for (const id of allIds) {
    const demoFile = join(pkgDir, id, 'demo.json');
    const demo = existsSync(demoFile) ? JSON.parse(readFileSync(demoFile, 'utf8')) : null;
    let status = 0;
    try {
      const r = await fetch(`${BASE}/v2/demo/${id}/`);
      status = r.status;
    } catch {}
    out.push({ id, demo, onDisk: onDisk.includes(id), registered: status === 200 });
  }
  return out;
}

async function createTrackedContext(browser, vp, tier) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.isMobile ? 2 : 1,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    reducedMotion: tier === 'lite' ? 'reduce' : 'no-preference',
  });
  await ctx.route('**/script.google.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  );
  await ctx.route('https://www.google.com/maps/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map</title>' })
  );
  await ctx.route('https://fonts.googleapis.com/**', route =>
    route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' })
  );
  await ctx.route('https://fonts.gstatic.com/**', route => route.abort());

  const page = await ctx.newPage();
  const errors = [];
  const baseOrigin = new URL(BASE).origin;

  page.on('pageerror', e => errors.push('Lỗi JS: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const loc = m.location()?.url || '';
    const txt = `${m.text()} ${loc}`;
    if (!ALLOWED_EXTERNAL_ERRORS.test(txt)) {
      errors.push('console: ' + (loc && !m.text().includes(loc) ? `${m.text()} (${loc})` : m.text()));
    }
  });
  page.on('requestfailed', req => {
    try {
      if (new URL(req.url()).origin !== baseOrigin) return;
      const reason = req.failure()?.errorText || 'failed';
      if (reason === 'net::ERR_ABORTED') return;
      errors.push(`requestfailed (${reason}): ${req.url()}`);
    } catch {}
  });
  page.on('response', r => {
    try {
      if (r.status() >= 400 && new URL(r.url()).origin === baseOrigin) errors.push(`${r.status()} ${r.url()}`);
    } catch {}
  });

  return { ctx, page, errors };
}

async function checkFiveSecondDiscoverability(page, demo) {
  const groom = (demo?.groom?.short || '').toLowerCase();
  const bride = (demo?.bride?.short || '').toLowerCase();
  const venueHint = (demo?.events?.[0]?.venue || '').toLowerCase();
  const cityHint = (demo?.city || '').toLowerCase();
  const d = demo?.date ? new Date(demo.date) : null;
  const dateTokens = d && !Number.isNaN(d.getTime())
    ? [
        `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
        `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        `${d.getDate()}.${d.getMonth() + 1}`,
        `tháng ${d.getMonth() + 1}`,
        String(d.getFullYear()),
      ]
    : [];

  return page.evaluate(({ g, b, dToks, vHint, cHint }) => {
    const isVisible = (el, root = null) => {
      if (!el || el.nodeType !== 1) return false;
      const elPos = getComputedStyle(el).position;
      const isCss3dRoot = Boolean(
        root &&
        root.nodeType === 1 &&
        (root.classList.contains('ptl-css') || root.classList.contains('th-css'))
      );
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden')) return false;
        const isCss3dStageAncestor = Boolean(
          isCss3dRoot &&
          !root.contains(cur) &&
          (cur.classList.contains('ptl-stage') || cur.classList.contains('th-stage'))
        );
        if (cur.getAttribute('aria-hidden') === 'true' && !isCss3dStageAncestor) return false;
        if (cur.classList.contains('sh-gate') && cur.hidden) return false;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
        if (cur === el || (elPos !== 'fixed' && (cs.overflow === 'hidden' || cs.overflow === 'clip') && cs.display !== 'contents')) {
          const cr = cur.getBoundingClientRect();
          if (cr.width <= 0 || cr.height <= 0) return false;
        }
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const collectVisibleText = root => {
      const parts = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const val = node.nodeValue;
        if (!val || !val.trim()) continue;
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'OPTION'].includes(parent.tagName)) continue;
        if (isVisible(parent, root)) parts.push(val);
      }
      return parts.join(' ');
    };
    const text = [...document.querySelectorAll('.sh-scene, .ptl-css, .th-css, main')]
      .filter(root => isVisible(root, root))
      .map(collectVisibleText)
      .join(' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    const hasNames = (!g || text.includes(g)) && (!b || text.includes(b));
    const hasDate = dToks.length
      ? dToks.some(t => text.includes(t.toLowerCase()))
      : /\b20\d{2}\b|\b\d{1,2}[./-]\d{1,2}\b/.test(text);
    const quickVenueText = (document.querySelector('#sh-quick .sh-quick-events')?.textContent || '').trim();
    const hasVenue = Boolean(
      (vHint && text.includes(vHint)) ||
      (cHint && text.includes(cHint)) ||
      /địa điểm|tư gia|trung tâm|tiệc cưới|nhà hàng|số \d|phường|quận|lễ vu quy|lễ thành hôn|khách sạn|vườn/i.test(text) ||
      (quickVenueText.length > 10 && document.querySelectorAll('.sh-scene [data-ev], .sh-scene [href*="maps.google"]').length > 0)
    );
    const hasRsvp = Boolean(
      [...document.querySelectorAll('.sh-scene form[data-sh="rsvp"]')].some(el => isVisible(el)) ||
      [...document.querySelectorAll('.sh-scene a[href*="rsvp"], .sh-scene a[href="#le-tan"], .sh-scene a[href="#ket-duyen"], .sh-scene a[href="#giu-ghe"]')].some(el => isVisible(el)) ||
      [...document.querySelectorAll('[data-sh="quick-open"]')].some(el => isVisible(el))
    );
    return { hasNames, hasDate, hasVenue, hasRsvp };
  }, { g: groom, b: bride, dToks: dateTokens, vHint: venueHint, cHint: cityHint });
}

async function checkSmallText(page, minPx = 13) {
  return page.evaluate(min => {
    const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'TEMPLATE', 'OPTION']);
    const isHidden = el => {
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') return true;
        if (cur.classList.contains('sh-sr') || (cur.classList.contains('sh-gate') && cur.hidden)) return true;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return true;
      }
      return false;
    };
    const bad = [];
    for (const el of document.body?.querySelectorAll('*') || []) {
      if (skip.has(el.tagName) || el.closest('svg')) continue;
      let txt = '';
      for (const n of el.childNodes) if (n.nodeType === 3) txt += n.textContent;
      txt = txt.replace(/\s+/g, ' ').trim();
      if (!/\p{L}{2,}/u.test(txt)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || isHidden(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (Number.isFinite(fs) && fs < min) bad.push(`${el.tagName.toLowerCase()}(${fs}px): "${txt.slice(0, 24)}"`);
    }
    return bad;
  }, minPx);
}

async function checkVestibular(page, tier) {
  return page.evaluate(isLite => {
    const isVis = el => {
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden')) return false;
        if (cur.classList.contains('sh-gate') && cur.hidden) return false;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const issues = [];
    for (const anim of document.getAnimations()) {
      if (anim.playState !== 'running') continue;
      const timing = anim.effect?.getComputedTiming?.();
      if (!timing || timing.iterations !== Infinity) continue;
      const target = anim.effect?.target;
      if (!target || !isVis(target)) continue;
      if (!isLite && (target.matches?.('.sh-music[aria-pressed="true"] i') || target.closest?.('.sh-music[aria-pressed="true"]'))) continue;
      const r = target.getBoundingClientRect();
      if (!isLite && r.width <= 28 && r.height <= 28 && /pulse/i.test(anim.animationName || '')) continue;
      issues.push(`infinite animation "${anim.animationName}" on ${target.tagName.toLowerCase()}.${target.className}`);
    }
    for (const el of document.querySelectorAll('.sh-scene, .sh-scene > *, .sh-scene div, .sh-scene img, article, figure, .ptl-plate, .th-plate, .ptl-css > *, .th-css > *, .card, .ticket:not(.torn), h1, h2, p, form')) {
      if (!isVis(el) || el.closest('.clap, .lever, .pop, .sh-music')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) continue;
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') continue;
      try {
        const m = new DOMMatrix(t);
        const deg = Math.max(
          Math.abs(Math.atan2(m.b, m.a) * 180 / Math.PI),
          Math.abs(Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180 / Math.PI),
          Math.abs(Math.asin(Math.max(-1, Math.min(1, m.m23))) * 180 / Math.PI)
        );
        if (deg > 6.2) issues.push(`tilt ${deg.toFixed(1)}deg on ${el.tagName.toLowerCase()}.${el.className}`);
      } catch {}
    }
    if (isLite) {
      const webgl = [...document.querySelectorAll('canvas')].filter(c => !c.classList.contains('fx-canvas') && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 100);
      if (webgl.length) issues.push(`${webgl.length} WebGL canvas active in lite mode`);
      if (document.querySelectorAll('.pin-spacer').length) issues.push('.pin-spacer active in lite mode');
    }
    return issues;
  }, tier === 'lite');
}

const themes = await discoverThemes();
if (!themes.length) {
  console.error('Không tìm thấy mẫu v2 nào trong packages/themes/ hoặc apps/web');
  process.exit(1);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const failures = [];
const pendingItems = [];

try {
  for (const theme of themes) {
    if (!theme.registered) {
      const msg = `${theme.id}: chưa đăng ký trên ${BASE}/v2/demo/${theme.id}/`;
      if (ALLOW_PENDING) {
        console.log(`~ ${msg} (pending)`);
        pendingItems.push(msg);
        continue;
      }
      console.error(`✗ ${msg}`);
      failures.push(msg);
      continue;
    }

    for (const vp of VIEWPORTS) {
      for (const tier of ['cinematic', 'standard', 'lite']) {
        const { ctx, page, errors } = await createTrackedContext(browser, vp, tier);
        const shot = async name => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${theme.id}-${vp.name}-${tier}-${name}.png`) }); };

        try {
          await page.goto(`${BASE}/v2/demo/${theme.id}/?k=${encodeURIComponent(GUEST)}&tier=${tier}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 })
            .catch(() => errors.push('runtime không khởi động (thiếu sh-ready)'));

          const actualMotion = await page.getAttribute('html', 'data-motion');
          if (actualMotion !== tier) errors.push(`data-motion="${actualMotion}", mong đợi "${tier}"`);

          const guestText = (await page.locator('[data-guest]').first().textContent().catch(() => '') || '').trim();
          if (guestText !== GUEST) errors.push(`tên khách trên bìa là "${guestText}" != "${GUEST}"`);
          await shot('0-bia');

          // Mở bìa bằng selector theo hợp đồng engine
          const gateCount = await page.locator('.sh-gate').count();
          if (gateCount > 0) {
            const explicit = page.locator('.sh-gate [data-open]').first();
            const cta = (await explicit.count()) > 0
              ? explicit
              : page.locator('.sh-gate button, .sh-gate [role="button"], .sh-gate .lever, .sh-gate .ptl-switch, .sh-gate .th-open-btn').first();
            await cta.waitFor({ state: 'visible', timeout: 5000 });
            const t0 = Date.now();
            await cta.click({ force: true });
            await page.waitForFunction(() => document.documentElement.classList.contains('sh-open'), null, { timeout: 8000 })
              .catch(() => errors.push('bìa không mở sau khi kích hoạt CTA'));
            const unlockMs = Date.now() - t0;
            if (unlockMs > 900) {
              errors.push(`mở bìa mất ${unlockMs}ms (> 900ms)`);
            }
            await page.waitForFunction(() => {
              const g = document.querySelector('.sh-gate');
              return !g || g.hidden || getComputedStyle(g).display === 'none';
            }, null, { timeout: 8000 }).catch(() => errors.push('bìa không ẩn sau khi mở'));
          }

          // 5s discoverability check
          let disc = await checkFiveSecondDiscoverability(page, theme.demo);
          const discDeadline = Date.now() + 5000;
          while ((!disc.hasNames || !disc.hasDate || !disc.hasVenue || !disc.hasRsvp) && Date.now() < discDeadline) {
            await page.waitForTimeout(150);
            disc = await checkFiveSecondDiscoverability(page, theme.demo);
          }
          if (!disc.hasNames || !disc.hasDate || !disc.hasVenue || !disc.hasRsvp) {
            errors.push(`5s discoverability thiếu: ${JSON.stringify(disc)}`);
          }

          // Cuộn toàn trang
          const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0));
          for (let y = 0; y <= total; y += 360) {
            await page.evaluate(pos => window.scrollTo({ top: pos, behavior: 'instant' }), y);
            await page.waitForTimeout(45);
          }
          await shot('1-full');

          // Kiểm tra tràn ngang
          const overflow = await page.evaluate(
            vpWidth => Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0, window.innerWidth) > vpWidth + 2,
            vp.width
          );
          if (overflow) errors.push(`tràn ngang ở ${vp.width}x${vp.height}`);

          // Kiểm tra cỡ chữ >= 13px
          const smallFonts = await checkSmallText(page, 13);
          if (smallFonts.length) {
            errors.push(`chữ < 13px: ${smallFonts.slice(0, 3).join(', ')}`);
          }

          // Kiểm tra chống chóng mặt (vestibular comfort)
          const vestIssues = await checkVestibular(page, tier);
          if (vestIssues.length) {
            errors.push(`vestibular: ${vestIssues.slice(0, 2).join('; ')}`);
          }

          // Quick Info (#sh-quick)
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.waitForTimeout(150);
          const stillAway = await page.evaluate(() => document.querySelector('.sh-quick-btn')?.classList.contains('is-away'));
          if (stillAway) {
            await page.evaluate(() => window.scrollTo({ top: 30, behavior: 'instant' }));
            await page.waitForTimeout(80);
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          }
          await page.waitForFunction(
            () => {
              const qb = document.querySelector('.sh-quick-btn');
              return !qb || !qb.classList.contains('is-away');
            },
            null,
            { timeout: 3000 }
          ).catch(() => errors.push('.sh-quick-btn vẫn giữ .is-away'));
          await page.waitForTimeout(360);
          const quickBtn = page.locator('[data-sh="quick-open"]').first();
          await quickBtn.waitFor({ state: 'visible', timeout: 4000 });
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          const quickEvents = await page.locator('#sh-quick [data-ev]').count();
          if (quickEvents < 1) errors.push('#sh-quick thiếu danh sách buổi lễ [data-ev]');

          const sceneRsvpCount = await page.locator('.sh-scene form[data-sh="rsvp"]').count();
          if (sceneRsvpCount > 0) {
            await page.locator('#sh-quick [data-sh="quick-close"]').first().click({ timeout: 4000 });
            await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
          }

          // RSVP theo hợp đồng engine
          const rsvpForm = sceneRsvpCount > 0
            ? page.locator('.sh-scene form[data-sh="rsvp"]').first()
            : page.locator('#sh-quick form[data-sh="rsvp"]').first();
          await rsvpForm.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          const rsvpName = await rsvpForm.locator('input[name="name"]').inputValue();
          if (rsvpName !== GUEST) errors.push(`ô tên RSVP là "${rsvpName}" != "${GUEST}"`);
          await rsvpForm.locator('[type="submit"]').click({ timeout: 5000 });
          await page.waitForFunction(
            sel => /Cảm ơn/.test(document.querySelector(sel)?.textContent || ''),
            sceneRsvpCount > 0 ? '.sh-scene form[data-sh="rsvp"] .sh-msg' : '#sh-quick form[data-sh="rsvp"] .sh-msg',
            { timeout: 6000 }
          ).catch(() => errors.push('gửi RSVP không hiện "Cảm ơn"'));

          if (sceneRsvpCount === 0) {
            await page.locator('#sh-quick [data-sh="quick-close"]').first().click({ timeout: 4000 }).catch(() => {});
          }

          // Lời chúc (nếu mẫu có)
          const wishForm = page.locator('form[data-sh="wish"]').first();
          if (await wishForm.count()) {
            await wishForm.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
            await wishForm.locator('textarea[name="message"]').fill('Chúc hai bạn trăm năm hạnh phúc!');
            await wishForm.locator('[type="submit"]').click({ timeout: 5000 });
            await page.waitForFunction(
              () => /Cảm ơn/.test(document.querySelector('form[data-sh="wish"] .sh-msg')?.textContent || ''),
              null,
              { timeout: 6000 }
            ).catch(() => errors.push('gửi lời chúc không thành công'));
          }
        } catch (err) {
          errors.push((err?.message || String(err)).split('\n')[0]);
        } finally {
          await ctx.close();
        }

        const label = `${theme.id} · ${vp.name} · ${tier}`;
        if (errors.length) {
          console.log(`✗ ${label}`);
          errors.forEach(e => console.log('   ' + e));
          failures.push(...errors.map(e => `${label}: ${e}`));
        } else {
          console.log(`✓ ${label}`);
        }
      }
    }

    // Nhóm khách ?n= trên cả desktop & mobile với đầy đủ listener lỗi
    for (const vp of VIEWPORTS) {
      const { ctx, page, errors } = await createTrackedContext(browser, vp, 'standard');
      try {
        await page.goto(`${BASE}/v2/demo/${theme.id}/?n=nha-gai&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        const nhaGai = theme.demo?.guestGroups?.find(g => g.id === 'nha-gai');
        if (nhaGai) {
          const noteHidden = await page.$eval('[data-sh="group-note"]', el => el.hidden);
          if (noteHidden) errors.push('không hiện [data-sh="group-note"] cho ?n=nha-gai');
          if ((theme.demo.events || []).length >= 2 && Array.isArray(nhaGai.events) && nhaGai.events.length > 0) {
            const expected = nhaGai.events.map(String);
            const shown = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => !e.hidden).map(e => e.dataset.ev));
            if ([...shown].sort().join(',') !== [...expected].sort().join(',')) {
              errors.push(`nhóm nha-gai thấy buổi [${shown.join(',')}] (mong đợi [${expected.join(',')}]) trong #sh-quick`);
            }
          }
        }

        await page.goto(`${BASE}/v2/demo/${theme.id}/?n=khong-co&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        const unknownHidden = await page.$$eval('#sh-quick [data-ev][hidden]', els => els.length);
        if (unknownHidden > 0) errors.push('mã nhóm lạ ?n=khong-co vẫn ẩn buổi lễ');
      } catch (err) {
        errors.push((err?.message || String(err)).split('\n')[0]);
      } finally {
        await ctx.close();
      }
      const label = `${theme.id} · ${vp.name} · nhóm khách`;
      if (errors.length) {
        console.log(`✗ ${label}`);
        errors.forEach(e => console.log('   ' + e));
        failures.push(...errors.map(e => `${label}: ${e}`));
      } else {
        console.log(`✓ ${label}`);
      }
    }
  }
  for (const badPath of ['/v2/demo/toString/', '/v2/demo/__proto__/', '/v2/demo/constructor/', '/v2/demo/valueOf/', '/v2/demo/toString/foo/']) {
    try {
      const r = await fetch(`${BASE}${badPath}`, { redirect: 'follow' });
      if (r.status !== 404) {
        const msg = `${badPath}: trả về ${r.status} (mong đợi 404)`;
        console.log(`✗ ${msg}`);
        failures.push(msg);
      }
    } catch (err) {
      failures.push(`${badPath}: ${err?.message || err}`);
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.log(`\n${failures.length} lỗi (${pendingItems.length} pending)`);
  process.exit(1);
}
console.log(`\nThiệp bản 2 ổn (${themes.length} mẫu, ${pendingItems.length} pending)`);
