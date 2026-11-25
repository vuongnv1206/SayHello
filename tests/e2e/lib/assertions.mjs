import assert from 'node:assert/strict';

export async function scrollFullPage(page, { step = 380, delay = 45 } = {}) {
  const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0));
  for (let y = 0; y <= total; y += step) {
    await page.evaluate(pos => window.scrollTo({ top: pos, behavior: 'instant' }), y);
    await page.waitForTimeout(delay);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(150);
}

export async function instantScrollTo(locator) {
  await locator.waitFor({ state: 'attached', timeout: 5000 });
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

export async function assertNoHorizontalOverflow(page, label = '') {
  const vp = page.viewportSize();
  const m = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    bodyW: document.body ? document.body.scrollWidth : 0,
    innerW: window.innerWidth,
  }));
  const maxW = Math.max(m.docW, m.bodyW, m.innerW);
  const targetW = vp?.width || m.innerW;
  assert.ok(
    maxW <= targetW + 2,
    `${label ? label + ': ' : ''}Horizontal overflow detected: maxWidth=${maxW} (doc=${m.docW}, inner=${m.innerW}) > viewport=${targetW}`
  );
}

export async function findSmallVietnameseText(page, minPx = 13) {
  return page.evaluate(min => {
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'TEMPLATE', 'OPTION']);
    const isHiddenBranch = el => {
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') return true;
        if (cur.classList.contains('sr') || cur.classList.contains('sh-sr')) return true;
        if (cur.id === 'cover' && cur.classList.contains('gone')) return true;
        if (cur.classList.contains('sh-gate') && cur.hidden) return true;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return true;
      }
      return false;
    };
    const violations = [];
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (SKIP_TAGS.has(el.tagName) || el.closest('svg')) continue;
      let directText = '';
      for (const n of el.childNodes) {
        if (n.nodeType === 3) directText += n.textContent;
      }
      directText = directText.replace(/\s+/g, ' ').trim();
      if (!/\p{L}{2,}/u.test(directText)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (isHiddenBranch(el)) continue;
      const cs = getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      if (Number.isFinite(fontSize) && fontSize < min) {
        violations.push({
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className : '',
          fontSize: Math.round(fontSize * 100) / 100,
          text: directText.slice(0, 50),
        });
      }
    }
    return violations;
  }, minPx);
}

export async function assertReadableVietnameseText(page, { minPx = 13, label = '' } = {}) {
  const violations = await findSmallVietnameseText(page, minPx);
  assert.equal(
    violations.length,
    0,
    `${label ? label + ': ' : ''}Text < ${minPx}px found: ${JSON.stringify(violations.slice(0, 5))}`
  );
}

export async function assertVisibleClickableCta(page, selector, { minWidth = 36, minHeight = 36, label = selector } = {}) {
  const all = page.locator(selector);
  await all.first().waitFor({ state: 'attached', timeout: 5000 });
  const count = await all.count();
  let loc = null;
  for (let i = 0; i < count; i++) {
    const candidate = all.nth(i);
    const vis = await candidate.isVisible().catch(() => false);
    if (!vis) continue;
    const opaque = await candidate.evaluate(el => {
      const cs = getComputedStyle(el);
      return parseFloat(cs.opacity) > 0.05;
    }).catch(() => false);
    if (opaque) {
      loc = candidate;
      break;
    }
  }
  if (!loc) loc = all.first();
  await loc.evaluate(el => {
    if (getComputedStyle(el).position !== 'fixed') {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });
  await page.waitForTimeout(80);
  const visible = await loc.isVisible();
  assert.ok(visible, `${label}: CTA not visible`);
  const box = await loc.boundingBox();
  assert.ok(box, `${label}: CTA has no bounding box`);
  assert.ok(
    box.width >= minWidth && box.height >= minHeight,
    `${label}: CTA too small (${Math.round(box.width)}x${Math.round(box.height)} < ${minWidth}x${minHeight})`
  );
  const vp = page.viewportSize();
  assert.ok(
    box.x >= -2 && box.y >= -2 && box.x + box.width <= vp.width + 2 && box.y + box.height <= vp.height + 2,
    `${label}: CTA outside viewport (${JSON.stringify(box)} vs ${JSON.stringify(vp)})`
  );
  const hitOk = await loc.evaluate((el, b) => {
    const cx = Math.min(window.innerWidth - 1, Math.max(1, b.x + b.width / 2));
    const cy = Math.min(window.innerHeight - 1, Math.max(1, b.y + b.height / 2));
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  }, box);
  assert.ok(hitOk, `${label}: CTA occluded at center (${Math.round(box.x + box.width / 2)}, ${Math.round(box.y + box.height / 2)})`);
}

export function assertCoverGateTiming({ unlockMs, maxMs = 900, label = '' } = {}) {
  assert.ok(
    Number.isFinite(unlockMs) && unlockMs <= maxMs,
    `${label ? label + ': ' : ''}Cover gate unlock took ${unlockMs}ms (max ${maxMs}ms)`
  );
}

/**
 * Verifies Card-as-Centerpiece 5-second discoverability:
 * within <= 5000ms of gate opening, couple names, wedding date, venue/location,
 * and RSVP reachability are present and visible in the rendered DOM.
 */
export async function assertFiveSecondDiscoverability(page, {
  groomShort = '',
  brideShort = '',
  date = '',
  city = '',
  venue = '',
  timeoutMs = 5000,
  label = '',
} = {}) {
  const start = Date.now();
  const parsedDate = date ? new Date(date) : null;
  const dateTokens = [];
  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = String(parsedDate.getFullYear());
    dateTokens.push(`${dd}.${mm}`, `${dd}/${mm}`, `${parsedDate.getDate()}.${parsedDate.getMonth() + 1}`, `tháng ${parsedDate.getMonth() + 1}`, yyyy);
  }

  let lastReport = null;
  while (Date.now() - start <= timeoutMs) {
    lastReport = await page.evaluate(({ groom, bride, dTokens, cityHint, venueHint }) => {
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

      const visibleTexts = [];
      const roots = [...document.querySelectorAll('.sh-scene, .ptl-css, .th-css, main')];
      for (const root of roots) {
        if (!isVisible(root, root)) continue;
        visibleTexts.push(collectVisibleText(root));
      }
      // Also include quick info event/venue summary if scene text is in CSS3D plates
      const joined = visibleTexts.join(' ').replace(/\s+/g, ' ').trim();
      const lower = joined.toLowerCase();

      const hasGroom = !groom || lower.includes(groom.toLowerCase());
      const hasBride = !bride || lower.includes(bride.toLowerCase());
      const hasDate = dTokens.length
        ? dTokens.some(tok => lower.includes(tok.toLowerCase()))
        : /\b20\d{2}\b|\b\d{1,2}[./-]\d{1,2}\b/.test(joined);
      const quickVenueText = (document.querySelector('#sh-quick .sh-quick-events')?.textContent || '').trim();
      const hasVenue = Boolean(
        (venueHint && lower.includes(venueHint.toLowerCase())) ||
        (cityHint && lower.includes(cityHint.toLowerCase())) ||
        /địa điểm|tư gia|trung tâm|tiệc cưới|nhà hàng|số \d|phường|quận|lễ vu quy|lễ thành hôn|khách sạn|vườn/i.test(joined) ||
        (quickVenueText.length > 10 && document.querySelectorAll('.sh-scene [data-ev], .sh-scene [href*="maps.google"]').length > 0)
      );

      const quickBtns = [...document.querySelectorAll('[data-sh="quick-open"]')];
      const sceneRsvps = [...document.querySelectorAll('.sh-scene form[data-sh="rsvp"]')];
      const rsvpAnchors = [...document.querySelectorAll('.sh-scene a[href*="rsvp"], .sh-scene a[href="#le-tan"], .sh-scene a[href="#ket-duyen"], .sh-scene a[href="#giu-ghe"]')];
      const rsvpReachable = Boolean(
        sceneRsvps.some(el => isVisible(el)) ||
        rsvpAnchors.some(el => isVisible(el)) ||
        quickBtns.some(el => isVisible(el))
      );

      return {
        hasGroom,
        hasBride,
        hasDate,
        hasVenue,
        rsvpReachable,
        sampleLen: joined.length,
      };
    }, { groom: groomShort, bride: brideShort, dTokens: dateTokens, cityHint: city, venueHint: venue });

    if (lastReport.hasGroom && lastReport.hasBride && lastReport.hasDate && lastReport.hasVenue && lastReport.rsvpReachable) {
      return lastReport;
    }
    await page.waitForTimeout(150);
  }

  assert.fail(
    `${label ? label + ': ' : ''}5-second discoverability failed (${timeoutMs}ms): ${JSON.stringify(lastReport)}`
  );
}

/**
 * Verifies vestibular comfort & anti-dizziness via observable browser APIs:
 * 1. Zero infinite CSS spin/shake/flicker on cards/photos/UI (allows only .sh-music[aria-pressed="true"] i when not lite/reduced).
 * 2. Bounded transform tilt <= 6° on readable cards/plates/text via DOMMatrix.
 * 3. Idle stability (<= 1.5px drift over 350ms with no input).
 * 4. Static parity on tier=lite or prefers-reduced-motion: reduce (0 WebGL canvases, 0 .pin-spacer, 0 infinite anims, visible text opacity > 0.5).
 */
export async function assertVestibularComfort(page, {
  label = '',
  reducedMotion = false,
  motionTier = 'standard',
  checkIdleDrift = true,
} = {}) {
  const isLite = reducedMotion || motionTier === 'lite';

  const report = await page.evaluate(({ lite }) => {
    const isVisibleEl = el => {
      if (!el || el.nodeType !== 1) return false;
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') return false;
        if (cur.classList.contains('sh-gate') && cur.hidden) return false;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // 1. Check infinite animations
    const badAnimations = [];
    for (const anim of document.getAnimations()) {
      if (anim.playState !== 'running') continue;
      const timing = anim.effect?.getComputedTiming?.();
      if (!timing || timing.iterations !== Infinity) continue;
      const target = anim.effect?.target;
      if (!target || !isVisibleEl(target)) continue;

      const isMusicIcon = Boolean(target.matches?.('.sh-music[aria-pressed="true"] i') || target.closest?.('.sh-music[aria-pressed="true"]'));
      if (!lite && isMusicIcon) continue;

      const animName = anim.animationName || '';
      const r = target.getBoundingClientRect();
      // In non-lite mode, allow tiny subtle pulse dots <= 28px; flag any spin/shake/flicker/wobble/orbit or larger elements
      const isTinyDot = !lite && r.width <= 28 && r.height <= 28 && /pulse/i.test(animName);
      if (isTinyDot) continue;

      badAnimations.push({
        animationName: animName,
        tag: target.tagName?.toLowerCase() || '',
        className: typeof target.className === 'string' ? target.className : '',
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    }

    // 2. Check transform tilt > 6 degrees on readable plates/cards/text
    const tiltedElements = [];
    const tiltTargets = document.querySelectorAll(
      '.sh-scene, .sh-scene > *, .sh-scene div, .sh-scene img, article, figure, .ptl-plate, .th-plate, .ptl-css > *, .th-css > *, .card, .ticket:not(.torn), h1, h2, h3, p, form'
    );
    for (const el of tiltTargets) {
      if (!isVisibleEl(el)) continue;
      if (el.closest('.clap, .lever, .pop, .sh-music')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) continue;
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') continue;
      try {
        const m = new DOMMatrix(t);
        const deg2d = Math.abs(Math.atan2(m.b, m.a) * 180 / Math.PI);
        const yaw = Math.abs(Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180 / Math.PI);
        const pitch = Math.abs(Math.asin(Math.max(-1, Math.min(1, m.m23))) * 180 / Math.PI);
        const maxDeg = Math.max(deg2d, yaw, pitch);
        if (maxDeg > 6.2) {
          tiltedElements.push({
            tag: el.tagName.toLowerCase(),
            className: typeof el.className === 'string' ? el.className : '',
            deg: Math.round(maxDeg * 10) / 10,
          });
        }
      } catch {}
    }

    // 3. Static parity checks when lite / reduced-motion
    const liteIssues = [];
    if (lite) {
      const actualMotion = document.documentElement.dataset.motion;
      if (actualMotion !== 'lite') {
        liteIssues.push(`data-motion="${actualMotion}" (expected "lite")`);
      }
      const visibleWebgl = [...document.querySelectorAll('canvas')].filter(c => {
        if (c.classList.contains('fx-canvas')) return false;
        const cs = getComputedStyle(c);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
        const r = c.getBoundingClientRect();
        return r.width > 100 && r.height > 100;
      });
      if (visibleWebgl.length > 0) {
        liteIssues.push(`${visibleWebgl.length} visible WebGL canvas(es) active in lite mode`);
      }
      const pinSpacers = document.querySelectorAll('.pin-spacer').length;
      if (pinSpacers > 0) {
        liteIssues.push(`${pinSpacers} .pin-spacer element(s) active in lite mode`);
      }
      for (const el of document.querySelectorAll('.sh-scene h1, .sh-scene h2, .sh-scene h3, .sh-scene p, .sh-scene .sh-btn')) {
        if (!isVisibleEl(el)) continue;
        const op = parseFloat(getComputedStyle(el).opacity);
        if (Number.isFinite(op) && op <= 0.5) {
          liteIssues.push(`low opacity (${op}) on ${el.tagName.toLowerCase()}`);
          break;
        }
      }
    }

    return { badAnimations, tiltedElements, liteIssues };
  }, { lite: isLite });

  assert.equal(
    report.badAnimations.length,
    0,
    `${label ? label + ': ' : ''}Infinite vestibular-hazard animations detected: ${JSON.stringify(report.badAnimations.slice(0, 5))}`
  );
  assert.equal(
    report.tiltedElements.length,
    0,
    `${label ? label + ': ' : ''}Extreme tilt (>6 deg) detected on readable elements: ${JSON.stringify(report.tiltedElements.slice(0, 5))}`
  );
  assert.equal(
    report.liteIssues.length,
    0,
    `${label ? label + ': ' : ''}Reduced-motion / lite static parity failed: ${report.liteIssues.join('; ')}`
  );

  if (checkIdleDrift) {
    const sample = () => page.evaluate(() => {
      const els = [...document.querySelectorAll('.sh-scene h1, .sh-scene h2, .ptl-plate, .th-plate, form[data-sh="rsvp"], .sh-scene article')].slice(0, 8);
      return els.map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left,
          y: r.top,
          t: getComputedStyle(el).transform,
        };
      });
    });
    await page.waitForTimeout(150);
    const s1 = await sample();
    await page.waitForTimeout(350);
    const s2 = await sample();
    let maxDrift = 0;
    let transformChanged = false;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      maxDrift = Math.max(maxDrift, Math.abs(s1[i].x - s2[i].x), Math.abs(s1[i].y - s2[i].y));
      if (s1[i].t !== s2[i].t) transformChanged = true;
    }
    assert.ok(
      maxDrift <= 1.5 && !transformChanged,
      `${label ? label + ': ' : ''}Idle instability detected (drift=${maxDrift.toFixed(2)}px, transformChanged=${transformChanged})`
    );
  }
}

export async function assertVisibleImagesLoaded(page, label = '') {
  // Trigger any lazy images that are now in viewport after scrolling
  await page.waitForTimeout(250);

  const inspectImages = () => page.evaluate(() => {
    const isVisibleEl = el => {
      for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') return false;
        if (cur.classList.contains('sh-gate') && cur.hidden) return false;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const broken = [];
    const incompleteIndices = [];
    const imgs = document.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (!isVisibleEl(img)) continue;
      if (!img.getAttribute('src')) continue;
      // Ignore external VietQR if offline/blocked by environment
      if (/img\.vietqr\.io/i.test(img.src)) continue;
      if (img.complete && img.naturalWidth === 0) {
        broken.push({ src: img.getAttribute('src'), complete: img.complete, naturalWidth: img.naturalWidth });
      } else if (!img.complete) {
        incompleteIndices.push(i);
      }
    }
    return { broken, incompleteIndices, scrollY: window.scrollY };
  });

  const initial = await inspectImages();
  if (initial.broken.length > 0) {
    assert.equal(
      initial.broken.length,
      0,
      `${label ? label + ': ' : ''}Broken visible images: ${JSON.stringify(initial.broken.slice(0, 5))}`
    );
  }

  let broken = initial.broken;
  if (initial.incompleteIndices.length > 0) {
    const prevScrollY = initial.scrollY;
    try {
      for (const idx of initial.incompleteIndices) {
        await page.evaluate(i => {
          const img = document.querySelectorAll('img')[i];
          if (img) img.scrollIntoView({ block: 'center', behavior: 'instant' });
        }, idx);

        const deadline = Date.now() + 2500;
        while (Date.now() < deadline) {
          const state = await page.evaluate(i => {
            const img = document.querySelectorAll('img')[i];
            if (!img) return { complete: true, naturalWidth: 1 };
            return { complete: img.complete, naturalWidth: img.naturalWidth };
          }, idx);
          if (state.complete) break;
          await page.waitForTimeout(50);
        }
      }
    } finally {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), prevScrollY);
    }

    const after = await page.evaluate(() => {
      const isVisibleEl = el => {
        for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
          if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') return false;
          if (cur.classList.contains('sh-gate') && cur.hidden) return false;
          const cs = getComputedStyle(cur);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
        }
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const out = [];
      for (const img of document.querySelectorAll('img')) {
        if (!isVisibleEl(img)) continue;
        if (!img.getAttribute('src')) continue;
        if (/img\.vietqr\.io/i.test(img.src)) continue;
        if (!img.complete || img.naturalWidth === 0) {
          out.push({ src: img.getAttribute('src'), complete: img.complete, naturalWidth: img.naturalWidth });
        }
      }
      return out;
    });
    broken = after;
  }

  assert.equal(
    broken.length,
    0,
    `${label ? label + ': ' : ''}Broken visible images: ${JSON.stringify(broken.slice(0, 5))}`
  );
}

export function assertSelfContainedAssets(trackedRequests, { themeId = '', label = '' } = {}) {
  const legacyProxyHits = (trackedRequests || [])
    .map(r => r.url)
    .filter(u => /\/demo-[a-z0-9-]+\//i.test(u) && !u.includes('/v2/demo/'));
  assert.equal(
    legacyProxyHits.length,
    0,
    `${label ? label + ': ' : ''}v2 theme "${themeId}" still depends on legacy proxy assets: ${legacyProxyHits.slice(0, 4).join(', ')}`
  );
}

export async function measureDesktopLayoutFingerprint(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const dataLayout = document.documentElement.dataset.layout || document.body?.dataset.layout || '';
    const main = document.querySelector('main');
    let mainWidth = main ? Math.round(main.getBoundingClientRect().width) : 0;

    if (!mainWidth) {
      const sceneKids = [...document.querySelectorAll('.sh-scene > *')].filter(el => {
        const cs = getComputedStyle(el);
        return cs.position !== 'fixed' && cs.display !== 'none';
      });
      mainWidth = sceneKids.reduce((mx, el) => Math.max(mx, Math.round(el.getBoundingClientRect().width)), 0);
    }

    const blocks = [...document.querySelectorAll('main img, main article, main form, main figure, main section > div, .sh-scene > div, .sh-scene article, .sh-scene form, .sh-scene figure, canvas')].filter(el => {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 24 && r.height > 24 && r.width <= vw + 2;
    });

    let minLeft = Infinity;
    let maxRight = -Infinity;
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      if (r.left >= -2 && r.right <= vw + 2) {
        minLeft = Math.min(minLeft, r.left);
        maxRight = Math.max(maxRight, r.right);
      }
    }
    const contentSpan = Number.isFinite(minLeft) && maxRight > minLeft ? Math.round(maxRight - minLeft) : mainWidth;

    const containers = [...document.querySelectorAll('main > section, main > div, .sh-scene')];
    let multiColSections = 0;
    let hasFullBleedStage = false;

    for (const c of document.querySelectorAll('canvas')) {
      if (c.classList.contains('fx-canvas')) continue;
      const cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) continue;
      const cr = c.getBoundingClientRect();
      if (cr.width >= 900 && cr.height >= 450) {
        hasFullBleedStage = true;
        break;
      }
    }

    for (const sec of containers) {
      const sr = sec.getBoundingClientRect();
      if (!hasFullBleedStage && sr.width >= 1024 && (sec.querySelector('canvas:not(.fx-canvas)') || sr.width >= vw - 40)) {
        const c = sec.querySelector('canvas:not(.fx-canvas)');
        if (c) {
          const cr = c.getBoundingClientRect();
          if (cr.width >= 900 && cr.height >= 450) hasFullBleedStage = true;
        }
      }
      const candidateGroups = [
        [...sec.querySelectorAll(':scope > *')],
        ...[...sec.querySelectorAll(':scope > div, :scope > .grid, :scope > .cast')].map(w => [...w.children]),
      ];
      let hasRow = false;
      for (const rawGroup of candidateGroups) {
        if (hasRow) break;
        const cand = rawGroup.filter(el => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return cs.position !== 'fixed' && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 40 && r.height > 24;
        });
        for (let i = 0; i < cand.length && !hasRow; i++) {
          const a = cand[i].getBoundingClientRect();
          for (let j = i + 1; j < cand.length; j++) {
            const b = cand[j].getBoundingClientRect();
            const vOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            const minH = Math.min(a.height, b.height);
            const separatedX = a.right <= b.left + 16 || b.right <= a.left + 16;
            if (minH > 0 && vOverlap > minH * 0.2 && separatedX) {
              hasRow = true;
              break;
            }
          }
        }
      }
      if (hasRow) multiColSections++;
    }

    let bucket = 'collapsed-520';
    if (hasFullBleedStage) bucket = 'full-bleed-stage';
    else if (dataLayout === 'split' || dataLayout === 'chat') bucket = 'split-pane';
    else if (contentSpan > 620 && multiColSections >= 1) bucket = 'wide-multi-col';
    else if (contentSpan > 620) bucket = 'wide-single';

    return { dataLayout, mainWidth, contentSpan, multiColSections, hasFullBleedStage, bucket };
  });
}
