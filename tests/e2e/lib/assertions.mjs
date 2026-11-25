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
  const m = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    bodyW: document.body ? document.body.scrollWidth : 0,
    innerW: window.innerWidth,
  }));
  const maxW = Math.max(m.docW, m.bodyW);
  assert.ok(
    maxW <= m.innerW + 2,
    `${label ? label + ': ' : ''}Horizontal overflow detected: scrollWidth=${maxW} > innerWidth=${m.innerW}`
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
  await loc.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
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
