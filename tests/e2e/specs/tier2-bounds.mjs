import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ROOT,
  readLegacyThemes,
  readLegacyInvite,
  readWebThemesRegistry,
  discoverV2Themes,
} from '../lib/registries.mjs';
import {
  createSafeContext,
  openV1Gate,
  openV2Gate,
  ensureQuickOpenVisible,
  saveShot,
  saveFailureShot,
} from '../lib/browser.mjs';
import {
  scrollFullPage,
  instantScrollTo,
  assertNoHorizontalOverflow,
  findSmallVietnameseText,
  assertReadableVietnameseText,
  assertVisibleClickableCta,
  assertCoverGateTiming,
  assertFiveSecondDiscoverability,
  assertVestibularComfort,
  assertSelfContainedAssets,
  assertWcagContrast,
  measureDesktopLayoutFingerprint,
} from '../lib/assertions.mjs';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];
const MOBILE_320 = { name: 'mobile-320', width: 320, height: 568, isMobile: true, hasTouch: true };

export async function runTier2Bounds({ browser, legacyUrl, webUrl, shotsDir, record }) {
  const legacyThemes = readLegacyThemes();
  const webReg = readWebThemesRegistry();
  const v2Themes = await discoverV2Themes({ webUrl });
  const { renderDocument } = await import(pathToFileURL(join(ROOT, 'packages', 'engine', 'src', 'render.js')).href);
  const v2Fingerprints = {};

  // 1. Frozen legacy v1: Desktop (1440x900) & Mobile (390x844) overflow, CTA clickability, 0 runtime errors
  for (const t of legacyThemes) {
    for (const vp of VIEWPORTS) {
      await record('tier2', 'viewport-bounds', `v1 ${t.id} (${vp.name} ${vp.width}x${vp.height}): overflow, CTA, 0 errors`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${legacyUrl}/${t.demo}/?k=Kh%C3%A1ch+Th%E1%BB%AD`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 20000 });

          await assertVisibleClickableCta(page, '#cover [data-open]', { minWidth: 36, minHeight: 32, label: `v1 ${t.id} ${vp.name} gate CTA` });
          await openV1Gate(page);
          await scrollFullPage(page);

          await assertNoHorizontalOverflow(page, `v1 ${t.id} ${vp.name}`);
          await saveShot(page, shotsDir, `tier2-${vp.name}-v1-${t.id}`);

          const rsvpBtn = page.locator('form[data-w="rsvp"] [type="submit"]').first();
          if (await rsvpBtn.count()) {
            await assertVisibleClickableCta(page, 'form[data-w="rsvp"] [type="submit"]', { label: `v1 ${t.id} ${vp.name} RSVP submit` });
          }

          // Sanity check against microscopic (<6px) rendering glitches; frozen legacy 520px/12px styles are intentionally preserved
          const microscopic = (await findSmallVietnameseText(page, 6));
          assert.equal(microscopic.length, 0, `v1 ${t.id} ${vp.name} microscopic text (<6px): ${JSON.stringify(microscopic)}`);

          tracker.assertClean(`v1 ${t.id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-${vp.name}-v1-${t.id}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  // 2. Dynamically discovered v2 themes: Desktop & Mobile bounds, >= 13px typography, gate <= 900ms, vestibular comfort
  for (const theme of v2Themes) {
    if (!theme.isRegistered) {
      await record('tier2', 'viewport-bounds', `v2 ${theme.id} desktop/mobile bounds`, async () => {
        const err = new Error(`v2 theme "${theme.id}" not yet registered`);
        err.pendingMilestone = theme.pendingReason || `M1/M2: wire v2 theme "${theme.id}"`;
        throw err;
      });
      continue;
    }

    for (const vp of VIEWPORTS) {
      await record('tier2', 'viewport-bounds', `v2 ${theme.id} (${vp.name} ${vp.width}x${vp.height}): overflow, CTA, >=13px, vestibular`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${theme.id}/?k=Kh%C3%A1ch+Th%E1%BB%AD`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });

          const gateSel = (await page.locator('.sh-gate [data-open]').count()) > 0
            ? '.sh-gate [data-open]'
            : '.sh-gate button, .sh-gate [role="button"], .sh-gate [data-open], .sh-gate .lever, .sh-gate .ptl-switch, .sh-gate .th-open-btn';
          await assertVisibleClickableCta(page, gateSel, { label: `v2 ${theme.id} ${vp.name} gate CTA` });

          const gateTiming = await openV2Gate(page);
          assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `v2 ${theme.id} ${vp.name}` });

          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `v2 ${theme.id} ${vp.name}`);
          await saveShot(page, shotsDir, `tier2-${vp.name}-v2-${theme.id}`);

          const sceneRsvpBtn = page.locator('.sh-scene form[data-sh="rsvp"] [type="submit"]').first();
          if (await sceneRsvpBtn.count()) {
            await assertVisibleClickableCta(page, '.sh-scene form[data-sh="rsvp"] [type="submit"]', { label: `v2 ${theme.id} ${vp.name} RSVP submit` });
          }
          await ensureQuickOpenVisible(page);
          await assertVisibleClickableCta(page, '[data-sh="quick-open"]', { label: `v2 ${theme.id} ${vp.name} Quick Info button` });

          if (vp.name === 'desktop') {
            v2Fingerprints[theme.id] = await measureDesktopLayoutFingerprint(page);
          }

          // Anti-cringe legibility (>= 13px)
          const smallText = await findSmallVietnameseText(page, 13);
          const microscopic = smallText.filter(x => x.fontSize < 6);
          assert.equal(microscopic.length, 0, `v2 ${theme.id} ${vp.name} microscopic text (<6px): ${JSON.stringify(microscopic)}`);
          assert.equal(smallText.length, 0, `v2 ${theme.id} ${vp.name} has ${smallText.length} Vietnamese text element(s) < 13px: ${JSON.stringify(smallText.slice(0, 4))}`);

          // Self-contained asset isolation check
          assertSelfContainedAssets(tracker.trackedRequests, { themeId: theme.id, label: `v2 ${theme.id} ${vp.name}` });

          // Vestibular comfort check
          const actualMotion = await page.getAttribute('html', 'data-motion');
          await assertVestibularComfort(page, {
            label: `v2 ${theme.id} ${vp.name}`,
            motionTier: actualMotion || 'standard',
          });

          tracker.assertClean(`v2 ${theme.id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-${vp.name}-v2-${theme.id}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  // 3. Desktop 1440x900 v2 Layout Distinctiveness Cohort Check
  await record('tier2', 'layout-uniqueness', 'v2 Desktop 1440x900 layout distinctiveness (no 520px collapse & >=2 archetypes)', async () => {
    const v2Entries = Object.entries(v2Fingerprints);
    assert.ok(v2Entries.length >= 2, `Expected >= 2 registered v2 themes with desktop fingerprints, got ${v2Entries.length}`);
    const collapsedV2 = v2Entries.filter(([, f]) => f.contentSpan <= 540 && !f.hasFullBleedStage);
    assert.equal(collapsedV2.length, 0, `v2 themes collapsing <=540px: ${collapsedV2.map(([k]) => k).join(', ')}`);
    const v2Buckets = new Set(v2Entries.map(([, f]) => `${f.dataLayout}:${f.bucket}`));
    assert.ok(v2Buckets.size >= 2, `Expected >= 2 distinct v2 layout archetypes, got ${[...v2Buckets].join(', ')}`);
  });

  // 4. v2 Motion Tiers (?tier=cinematic|standard|lite) & prefers-reduced-motion: reduce + webglcontextlost + vestibular comfort
  for (const theme of v2Themes) {
    if (!theme.isRegistered) {
      await record('tier2', 'motion-tiers', `v2 ${theme.id} motion tiers & reducedMotion`, async () => {
        const err = new Error(`v2 theme "${theme.id}" not yet registered`);
        err.pendingMilestone = theme.pendingReason || `M1/M2: wire v2 theme "${theme.id}"`;
        throw err;
      });
      continue;
    }

    const cases = [
      { label: 'tier=cinematic', query: theme.layout === 'stage' ? '?tier=cinematic&snap=1' : '?tier=cinematic', reducedMotion: 'no-preference', expected: 'cinematic', testContextLoss: true, vp: VIEWPORTS[1] },
      { label: 'tier=standard', query: '?tier=standard', reducedMotion: 'no-preference', expected: 'standard', testContextLoss: false, vp: VIEWPORTS[1] },
      { label: 'tier=lite', query: '?tier=lite', reducedMotion: 'no-preference', expected: 'lite', testContextLoss: false, vp: VIEWPORTS[1] },
      { label: 'prefers-reduced-motion: reduce (mobile)', query: '', reducedMotion: 'reduce', expected: 'lite', testContextLoss: false, vp: VIEWPORTS[1] },
      { label: 'prefers-reduced-motion: reduce (desktop)', query: '', reducedMotion: 'reduce', expected: 'lite', testContextLoss: false, vp: VIEWPORTS[0] },
    ];

    for (const c of cases) {
      await record('tier2', 'motion-tiers', `v2 ${theme.id} (${c.label}) -> data-motion="${c.expected}" & static parity`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: c.vp.width, height: c.vp.height },
          isMobile: c.vp.isMobile,
          hasTouch: c.vp.hasTouch,
          reducedMotion: c.reducedMotion,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${theme.id}/${c.query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
          const actual = await page.getAttribute('html', 'data-motion');
          assert.equal(actual, c.expected, `Expected html[data-motion="${c.expected}"], got "${actual}"`);

          // Also check gate-phase vestibular safety before opening (e.g. .cover-hint in lite mode)
          await assertVestibularComfort(page, {
            label: `v2 ${theme.id} ${c.label} (gate)`,
            reducedMotion: c.reducedMotion === 'reduce',
            motionTier: c.expected,
            checkIdleDrift: false,
          });

          await openV2Gate(page);
          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `v2 ${theme.id} ${c.label}`);

          // Verify .sh-music[aria-pressed="true"] i does not spin infinitely in lite/reduced mode
          if (c.expected === 'lite') {
            await page.evaluate(() => {
              const btn = document.querySelector('[data-sh="music"]');
              if (btn) btn.setAttribute('aria-pressed', 'true');
            });
          }

          await assertVestibularComfort(page, {
            label: `v2 ${theme.id} ${c.label}`,
            reducedMotion: c.reducedMotion === 'reduce',
            motionTier: c.expected,
          });

          if (c.testContextLoss) {
            const layout = await page.getAttribute('html', 'data-layout');
            if (layout === 'stage') {
              await page.waitForFunction(
                () => document.documentElement.classList.contains('ptl-3d')
                  || document.documentElement.classList.contains('th-3d')
                  || document.documentElement.dataset.motion === 'lite',
                null,
                { timeout: 10000 }
              ).catch(() => {});

              const stageState = await page.evaluate(() => {
                const cv = document.querySelector('canvas');
                const mounted3d = document.documentElement.classList.contains('ptl-3d') || document.documentElement.classList.contains('th-3d');
                let webglSupported = false;
                try {
                  const testCanvas = document.createElement('canvas');
                  webglSupported = Boolean(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'));
                } catch {}
                return { hasCanvas: Boolean(cv), mounted3d, webglSupported };
              });

              if (stageState.mounted3d && stageState.hasCanvas) {
                const wasCanceled = await page.evaluate(() => {
                  const cv = document.querySelector('canvas');
                  if (!cv) return false;
                  const ev = new Event('webglcontextlost', { cancelable: true });
                  cv.dispatchEvent(ev);
                  return ev.defaultPrevented;
                });
                assert.equal(wasCanceled, true, `v2 ${theme.id}: webglcontextlost event was not preventDefault()'d by bindContextLoss`);
                await page.waitForTimeout(300);
                const motionAfter = await page.getAttribute('html', 'data-motion');
                const motionWhy = await page.getAttribute('html', 'data-motion-why');
                assert.equal(
                  motionAfter,
                  'lite',
                  `v2 ${theme.id}: expected stage theme to downgrade html[data-motion] to "lite" after webglcontextlost, got "${motionAfter}"`
                );
                assert.equal(motionWhy, 'webglcontextlost', `v2 ${theme.id}: expected data-motion-why="webglcontextlost", got "${motionWhy}"`);
              } else if (stageState.webglSupported) {
                // Only skip if Three.js CDN failed to load offline; fail loudly otherwise
                const cdnBlocked = tracker.consoleErrors.length > 0;
                assert.ok(cdnBlocked, `v2 ${theme.id}: stage layout failed to mount WebGL under &snap=1 even though WebGL is supported (${JSON.stringify(stageState)})`);
              }
            }
          }

          const quickBtn = await ensureQuickOpenVisible(page);
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          await page.waitForTimeout(150);
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click({ force: true });
          await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

          tracker.assertClean(`v2 ${theme.id} ${c.label}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-motion-${theme.id}-${c.label}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  await record('tier2', 'motion-tiers', 'v2 phong-trien-lam (?tier=lite&open=1, no-preference): .ptl-imgs img filter === "none" without scroll', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: VIEWPORTS[1].width, height: VIEWPORTS[1].height },
      isMobile: VIEWPORTS[1].isMobile,
      hasTouch: VIEWPORTS[1].hasTouch,
      reducedMotion: 'no-preference',
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/v2/demo/phong-trien-lam/?tier=lite&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
      const actualMotion = await page.getAttribute('html', 'data-motion');
      assert.equal(actualMotion, 'lite', `Expected html[data-motion="lite"], got "${actualMotion}"`);
      const filters = await page.$$eval('.ptl-imgs img', imgs => imgs.map(img => getComputedStyle(img).filter));
      assert.ok(filters.length > 0, 'Expected .ptl-imgs img elements in phong-trien-lam');
      assert.ok(
        filters.every(f => f === 'none'),
        `Expected all .ptl-imgs img filter === "none" in ?tier=lite&open=1 without scroll, got ${JSON.stringify(filters)}`
      );
      tracker.assertClean('v2 phong-trien-lam lite static image parity');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier2-motion-phong-trien-lam-lite-img', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 5. Boundary & Invalid-Input Rejection (empty RSVP/wish, attend="Không", XSS ?k=, 60-char Vietnamese ?k=)
  for (const theme of v2Themes.filter(t => t.isRegistered)) {
    await record('tier2', 'input-bounds', `v2 ${theme.id}: invalid RSVP/wish rejected, attend=Không branch, XSS & 60-char VN ?k=`, async () => {
      const xssPayload = '<img src=x onerror=window.__xss=1>';
      const longViName = 'Nguyễn Trần Hoàng Phương Thảo Linh Chi Khánh Ngọc Bảo An'; // 57 chars Vietnamese diacritics

      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();

        // 5a. XSS safety in ?k=
        await page.goto(`${webUrl}/v2/demo/${theme.id}/?k=${encodeURIComponent(xssPayload)}&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        const xssTriggered = await page.evaluate(() => window.__xss === 1);
        assert.equal(xssTriggered, false, `v2 ${theme.id}: XSS executed via ?k=`);
        const guestLiteral = await page.locator('[data-guest]').first().textContent();
        assert.equal((guestLiteral || '').trim(), xssPayload.slice(0, 60), `v2 ${theme.id}: [data-guest] did not render literal string`);

        // 5b. 60-char Vietnamese ?k= boundary without overflow
        await page.goto(`${webUrl}/v2/demo/${theme.id}/?k=${encodeURIComponent(longViName)}&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        await assertNoHorizontalOverflow(page, `v2 ${theme.id} 60-char ?k=`);

        // 5c. Invalid RSVP submission (empty name) -> checkValidity false, 0 POSTs, no "Cảm ơn"
        const sceneRsvp = page.locator('.sh-scene form[data-sh="rsvp"]').first();
        const hasSceneRsvp = (await sceneRsvp.count()) > 0;
        let rsvpForm = sceneRsvp;
        if (!hasSceneRsvp) {
          const qb = await ensureQuickOpenVisible(page);
          await qb.click();
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          rsvpForm = page.locator('#sh-quick form[data-sh="rsvp"]').first();
        }
        await instantScrollTo(rsvpForm);
        await rsvpForm.locator('input[name="name"]').fill('');
        const postsBeforeInvalidRsvp = session.capturedPosts.length;
        await rsvpForm.locator('[type="submit"]').click();
        await page.waitForTimeout(200);
        const rsvpValid = await rsvpForm.evaluate(f => f.checkValidity());
        assert.equal(rsvpValid, false, `v2 ${theme.id}: empty RSVP name should fail checkValidity()`);
        assert.equal(session.capturedPosts.length, postsBeforeInvalidRsvp, `v2 ${theme.id}: invalid RSVP must not send POST`);
        const invalidRsvpMsg = await rsvpForm.locator('.sh-msg').textContent();
        assert.ok(!/Cảm ơn/.test(invalidRsvpMsg || ''), `v2 ${theme.id}: invalid RSVP must not show thank-you message`);

        // 5d. attend="Không" hides [data-when-attend] and yields thanksNo
        await rsvpForm.locator('input[name="name"]').fill('Khách Từ Chối');
        const noRadio = rsvpForm.locator('input[type="radio"][name="attend"][value="Không"]');
        if (await noRadio.count()) {
          await noRadio.check({ force: true });
          const whenAttendHidden = await rsvpForm.locator('[data-when-attend]').evaluateAll(
            els => els.every(el => el.hidden)
          );
          assert.equal(whenAttendHidden, true, `v2 ${theme.id}: [data-when-attend] should be hidden when attend=Không`);
          await rsvpForm.locator('[type="submit"]').click();
          await page.waitForFunction(
            sel => /dịp khác|hẹn gặp/i.test(document.querySelector(sel)?.textContent || ''),
            hasSceneRsvp ? '.sh-scene form[data-sh="rsvp"] .sh-msg' : '#sh-quick form[data-sh="rsvp"] .sh-msg',
            { timeout: 6000 }
          );
        }
        if (!hasSceneRsvp) {
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
        }

        // 5e. Invalid wish submission (empty message) -> blocked, 0 POSTs
        const wishForm = page.locator('form[data-sh="wish"]').first();
        if (await wishForm.count()) {
          await instantScrollTo(wishForm);
          await wishForm.locator('input[name="name"]').fill('Khách Thử');
          await wishForm.locator('textarea[name="message"]').fill('');
          const postsBeforeInvalidWish = session.capturedPosts.length;
          await wishForm.locator('[type="submit"]').click();
          await page.waitForTimeout(200);
          const wishValid = await wishForm.evaluate(f => f.checkValidity());
          assert.equal(wishValid, false, `v2 ${theme.id}: empty wish message should fail checkValidity()`);
          assert.equal(session.capturedPosts.length, postsBeforeInvalidWish, `v2 ${theme.id}: invalid wish must not send POST`);
          const invalidWishMsg = await wishForm.locator('.sh-msg').textContent();
          assert.ok(!/Cảm ơn/.test(invalidWishMsg || ''), `v2 ${theme.id}: invalid wish must not show thank-you message`);
        }

        tracker.assertClean(`v2 ${theme.id} input-bounds`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-input-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // 6. Guest group filtering (?n=nha-gai, ?n=NHA-GAI & ?n=khong-co) on v1 and v2
  await record('tier2', 'guest-groups', 'v1 demo-song-hy ?n=nha-gai filters events & ?n=khong-co keeps all', async () => {
    const groups = [{ id: 'nha-gai', label: 'Họ nhà gái', greeting: 'Kính mời họ nhà gái', events: [0], place: 1, note: 'Xe đón lúc 7:00' }];
    const inv = readLegacyInvite('demo-song-hy');
    const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
    try {
      await session.ctx.route(`${legacyUrl}/demo-song-hy/invite.json`, async route => {
        const mutated = { ...inv, guestGroups: groups };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mutated) });
      });
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${legacyUrl}/demo-song-hy/?n=nha-gai&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 20000 });
      const noteText = await page.locator('.group-note').textContent();
      assert.match(noteText || '', /họ nhà gái.*Xe đón lúc 7:00/);
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (inv.events?.[0]?.address && inv.events?.[1]?.address && inv.events[0].address !== inv.events[1].address) {
        assert.ok(bodyText.includes(inv.events[0].address), 'Missing group event 0 address');
        assert.ok(!bodyText.includes(inv.events[1].address), 'Non-group event 1 should be hidden');
      }

      await page.goto(`${legacyUrl}/demo-song-hy/?n=khong-co&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 20000 });
      assert.equal(await page.locator('.group-note').count(), 0, 'Unknown ?n=khong-co must not render .group-note');
      tracker.assertClean('v1 guest groups');
    } finally {
      await session.ctx.close();
    }
  });

  for (const theme of v2Themes.filter(t => t.isRegistered)) {
    await record('tier2', 'guest-groups', `v2 ${theme.id} ?n=nha-gai, ?n=NHA-GAI & ?n=khong-co filtering`, async () => {
      assert.ok(theme.demo && theme.themeJs, `Missing packages/themes/${theme.id}`);
      const hasNhaGai = theme.demo?.guestGroups?.some(g => g.id === 'nha-gai');

      const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
      try {
        const { page, tracker } = await session.newTrackedPage();
        let baseRouteUrl = `${webUrl}/v2/demo/${theme.id}/`;
        let demoEventsCount = (theme.demo?.events || []).length;

        if (!hasNhaGai) {
          const themeMod = (await import(pathToFileURL(theme.themeJs).href)).default;
          const baseEvents = Array.isArray(theme.demo?.events) ? [...theme.demo.events] : [];
          if (baseEvents.length < 2) {
            baseEvents.push({
              title: 'Tiệc Cưới Nhà Trai',
              date: theme.demo?.date || '2027-11-20T18:00:00+07:00',
              venue: 'Trung tâm tiệc cưới',
              address: 'Hà Nội',
            });
          }
          demoEventsCount = baseEvents.length;
          const injectedDemo = {
            ...theme.demo,
            events: baseEvents,
            guestGroups: [
              ...(theme.demo?.guestGroups || []),
              {
                id: 'nha-gai',
                label: 'Họ nhà gái',
                greeting: 'Trân trọng kính mời họ nhà gái',
                events: [0],
                note: 'Xe đón họ nhà gái xuất phát lúc 7:00',
              },
            ],
          };
          const assetBase = webReg.entries?.[theme.id]?.assetBase || theme.assetBase || `/_e/themes/${theme.id}/`;
          const htmlStr = renderDocument(themeMod, injectedDemo, {
            engineUrl: '/_e/engine/',
            themeUrl: `/_e/themes/${theme.id}/`,
            assetBase,
          });
          baseRouteUrl = `${webUrl}/__e2e_group_${theme.id}/`;
          await session.ctx.route(`${baseRouteUrl}*`, route =>
            route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlStr })
          );
        }

        await page.goto(`${baseRouteUrl}?n=nha-gai&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.$eval('[data-sh="group-note"]', el => el.hidden), false, `v2 ${theme.id}: [data-sh="group-note"] should be visible for ?n=nha-gai`);
        if (demoEventsCount >= 2) {
          const hiddenQuickEvents = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
          assert.ok(hiddenQuickEvents >= 1, `v2 ${theme.id}: expected non-group [data-ev] to be hidden`);
        }

        // Case normalization check (?n=NHA-GAI)
        await page.goto(`${baseRouteUrl}?n=NHA-GAI&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.$eval('[data-sh="group-note"]', el => el.hidden), false, `v2 ${theme.id}: ?n=NHA-GAI should normalize to nha-gai`);

        // Unknown group keeps all events
        await page.goto(`${baseRouteUrl}?n=khong-co&open=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.$eval('[data-sh="group-note"]', el => el.hidden), true, `v2 ${theme.id}: group-note should stay hidden for ?n=khong-co`);
        assert.equal(await page.$$eval('#sh-quick [data-ev][hidden]', els => els.length), 0, `v2 ${theme.id}: ?n=khong-co must not hide any events`);
        tracker.assertClean(`v2 ${theme.id} guest groups`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-groups-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // 7. Missing optional fields (story: [], accounts: [], music: '', families: []) on v1 and v2
  await record('tier2', 'optional-fields', 'v1 demo-cuon-phim renders cleanly with empty story & accounts', async () => {
    const inv = readLegacyInvite('demo-cuon-phim');
    const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
    try {
      await session.ctx.route(`${legacyUrl}/demo-cuon-phim/invite.json`, async route => {
        const stripped = { ...inv, story: [], accounts: [] };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stripped) });
      });
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${legacyUrl}/demo-cuon-phim/?open=1`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 10000 });
      await scrollFullPage(page);
      assert.equal(await page.locator('[data-w="gift"]').count(), 0, 'Gift section should not render without accounts');
      await page.locator('form[data-w="rsvp"] input[name="name"]').fill('Khách Kiểm Tra');
      await page.locator('form[data-w="rsvp"] button[type="submit"]').click();
      await page.waitForFunction(
        () => /Cảm ơn/.test(document.querySelector('form[data-w="rsvp"] .msg')?.textContent || ''),
        null,
        { timeout: 6000 }
      );
      tracker.assertClean('v1 stripped story/accounts');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier2-optional-v1', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  for (const theme of v2Themes.filter(t => t.isRegistered)) {
    await record('tier2', 'optional-fields', `v2 ${theme.id} renders cleanly with empty story, accounts, music & families`, async () => {
      assert.ok(theme.demo && theme.themeJs, `Missing packages/themes/${theme.id}`);
      const themeMod = (await import(pathToFileURL(theme.themeJs).href)).default;
      const strippedDemo = { ...theme.demo, story: [], accounts: [], music: '', families: [] };
      const assetBase = webReg.entries?.[theme.id]?.assetBase || theme.assetBase || `/_e/themes/${theme.id}/`;
      const htmlStr = renderDocument(themeMod, strippedDemo, {
        engineUrl: '/_e/engine/',
        themeUrl: `/_e/themes/${theme.id}/`,
        assetBase,
      });

      const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
      try {
        const testUrl = `${webUrl}/__e2e_stripped_${theme.id}/`;
        await session.ctx.route(testUrl, route =>
          route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlStr })
        );
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        await openV2Gate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${theme.id} stripped`);

        assert.equal(await page.locator('#sh-audio').count(), 0, `v2 ${theme.id}: audio element should omit when music=""`);

        const storyOnlyScenes = (themeMod.scenes || []).filter(
          s => Array.isArray(s.provides) && s.provides.length > 0 && s.provides.every(p => p === 'story')
        );
        for (const s of storyOnlyScenes) {
          assert.equal(await page.locator(`#${s.id}`).count(), 0, `Optional story scene #${s.id} should omit when story=[]`);
        }
        const giftOnlyScenes = (themeMod.scenes || []).filter(
          s => Array.isArray(s.provides) && s.provides.length > 0 && s.provides.every(p => p === 'gift')
        );
        for (const s of giftOnlyScenes) {
          assert.equal(await page.locator(`#${s.id}`).count(), 0, `Optional gift scene #${s.id} should omit when accounts=[]`);
        }
        assert.equal(
          await page.locator('[data-w="gift"], .accounts, .gift-accounts, .ptl-accs, .th-accs').count(),
          0,
          'Optional gift section should omit when accounts=[]'
        );

        const bodyText = await page.evaluate(() => document.body?.innerText || '');
        const sampleStoryTitle = theme.demo?.story?.[0]?.title;
        if (sampleStoryTitle) {
          assert.ok(!bodyText.includes(sampleStoryTitle), `v2 ${theme.id}: story item "${sampleStoryTitle}" still rendered when story=[]`);
        }
        const sampleAccountNum = theme.demo?.accounts?.[0]?.number;
        if (sampleAccountNum) {
          assert.ok(!bodyText.includes(sampleAccountNum), `v2 ${theme.id}: account number "${sampleAccountNum}" still rendered when accounts=[]`);
        }

        const qb = await ensureQuickOpenVisible(page);
        await qb.click();
        await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
        tracker.assertClean(`v2 ${theme.id} stripped optional fields`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-optional-v2-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // 8. Narrow Mobile (320x568) bounds, CTA & 5s discoverability across /v2/ & all v2 themes
  await record('tier2', 'viewport-bounds', 'v2 /v2/ showcase (mobile-320 320x568): overflow, CTA, >=13px', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: MOBILE_320.width, height: MOBILE_320.height },
      isMobile: MOBILE_320.isMobile,
      hasTouch: MOBILE_320.hasTouch,
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/v2/`, { waitUntil: 'load', timeout: 30000 });
      await scrollFullPage(page);
      await assertNoHorizontalOverflow(page, '/v2/ mobile-320');
      await assertReadableVietnameseText(page, { minPx: 13, label: '/v2/ mobile-320' });
      await assertVisibleClickableCta(page, 'a[href*="/v2/demo/"]', { label: '/v2/ mobile-320 demo CTA' });
      tracker.assertClean('/v2/ mobile-320');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier2-mobile320-v2-showcase', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  for (const theme of v2Themes.filter(t => t.isRegistered)) {
    await record('tier2', 'viewport-bounds', `v2 ${theme.id} (mobile-320 320x568): overflow, CTA, 5s discoverability, >=13px`, async () => {
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: MOBILE_320.width, height: MOBILE_320.height },
        isMobile: MOBILE_320.isMobile,
        hasTouch: MOBILE_320.hasTouch,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${webUrl}/v2/demo/${theme.id}/?k=${encodeURIComponent('Khách Thử')}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });

        const gateSel = (await page.locator('.sh-gate [data-open]').count()) > 0
          ? '.sh-gate [data-open]'
          : '.sh-gate button, .sh-gate [role="button"], .sh-gate [data-open], .sh-gate .lever, .sh-gate .ptl-switch, .sh-gate .th-open-btn';
        await assertVisibleClickableCta(page, gateSel, { label: `v2 ${theme.id} mobile-320 gate CTA` });

        const gateTiming = await openV2Gate(page);
        assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `v2 ${theme.id} mobile-320` });

        await assertFiveSecondDiscoverability(page, {
          groomShort: theme.demo?.groom?.short || '',
          brideShort: theme.demo?.bride?.short || '',
          date: theme.demo?.date || '',
          city: theme.demo?.city || '',
          venue: theme.demo?.events?.[0]?.venue || '',
          timeoutMs: 5000,
          label: `v2 ${theme.id} mobile-320`,
        });

        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${theme.id} mobile-320`);
        await assertReadableVietnameseText(page, { minPx: 13, label: `v2 ${theme.id} mobile-320` });

        const sceneRsvpBtn = page.locator('.sh-scene form[data-sh="rsvp"] [type="submit"]').first();
        if (await sceneRsvpBtn.count()) {
          await assertVisibleClickableCta(page, '.sh-scene form[data-sh="rsvp"] [type="submit"]', { label: `v2 ${theme.id} mobile-320 RSVP submit` });
        }
        await ensureQuickOpenVisible(page);
        await assertVisibleClickableCta(page, '[data-sh="quick-open"]', { label: `v2 ${theme.id} mobile-320 Quick Info button` });

        const actualMotion = await page.getAttribute('html', 'data-motion');
        await assertVestibularComfort(page, {
          label: `v2 ${theme.id} mobile-320`,
          motionTier: actualMotion || 'standard',
        });

        tracker.assertClean(`v2 ${theme.id} mobile-320`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-mobile320-v2-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // 9. WCAG AA contrast across all v2 theme x topic/palette variants (17 variants)
  for (const theme of v2Themes.filter(t => t.isRegistered)) {
    const variants = theme.topics?.length ? theme.topics : (theme.palettes || []);
    const variantIds = variants.length ? variants.map(v => v.id) : [''];
    for (const vId of variantIds) {
      const label = vId ? `${theme.id}/${vId}` : theme.id;
      await record('tier2', 'wcag-contrast', `v2 ${label}: WCAG AA contrast >= 4.5:1 (3:1 large text)`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          const url = vId ? `${webUrl}/v2/demo/${theme.id}/${vId}/?tier=lite` : `${webUrl}/v2/demo/${theme.id}/?tier=lite`;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
          await assertWcagContrast(page, { label: `${label} (gate)` });
          await openV2Gate(page);
          await scrollFullPage(page);

          for (const sel of ['.tk-stub', '.bucket', '[data-flip]']) {
            const locs = page.locator(sel);
            const cnt = await locs.count();
            for (let i = 0; i < cnt; i++) {
              const loc = locs.nth(i);
              if (await loc.isVisible().catch(() => false)) {
                await instantScrollTo(loc);
                await loc.click({ force: true });
              }
            }
          }
          await page.waitForTimeout(150);
          await assertWcagContrast(page, { label: `${label} (open)` });

          const quickBtn = await ensureQuickOpenVisible(page);
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          await page.waitForTimeout(150);
          await assertWcagContrast(page, { label: `${label} (#sh-quick)` });
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click({ force: true });
          await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

          tracker.assertClean(`v2 ${label} contrast`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-contrast-${theme.id}-${vId || 'default'}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  // 10. Prototype-key route guard regression (toString, __proto__, constructor, valueOf -> HTTP 404, never 500)
  await record('tier2', 'input-bounds', 'v2 prototype-key route lookups return HTTP 404 (not 500)', async () => {
    const badPaths = [
      '/v2/demo/toString/',
      '/v2/demo/__proto__/',
      '/v2/demo/constructor/',
      '/v2/demo/valueOf/',
      '/v2/demo/toString/foo/',
      '/v2/demo/chieu-sau/toString/',
    ];
    for (const p of badPaths) {
      const res = await fetch(`${webUrl}${p}`, { redirect: 'follow' });
      assert.equal(res.status, 404, `Expected HTTP 404 at ${p}, got ${res.status}`);
    }
  });
}
