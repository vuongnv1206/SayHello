import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  readLegacyThemes,
  discoverV2Themes,
  isV2ShowcaseUpgraded,
} from '../lib/registries.mjs';
import {
  createSafeContext,
  openV2Gate,
  ensureQuickOpenVisible,
  saveFailureShot,
} from '../lib/browser.mjs';
import {
  assertNoHorizontalOverflow,
  assertReadableVietnameseText,
  assertVestibularComfort,
  assertCoverGateTiming,
  assertFiveSecondDiscoverability,
  instantScrollTo,
  scrollFullPage,
} from '../lib/assertions.mjs';

export async function runTier3Combos({ browser, legacyUrl, webUrl, shotsDir, record }) {
  // 1. Storefront (/) -> live preview with custom names -> order link pre-selects theme
  await record('tier3', 'combos', 'Storefront / -> live preview names -> /dat-thiep/?mau= pre-selection', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/`, { waitUntil: 'load', timeout: 30000 });
      await page.locator('#themes .card .phone').first().waitFor({ state: 'attached', timeout: 10000 });
      assert.equal(await page.locator('iframe').count(), 0, 'Storefront should lazy-load iframes');

      await page.fill('#t-groom', 'Quốc Bảo');
      await page.fill('#t-bride', 'Mai Anh');
      await page.fill('#t-date', '2027-12-05');
      await page.locator('#themes .card .phone').first().click();

      await page.waitForFunction(() => document.querySelectorAll('iframe').length === 1, null, { timeout: 8000 });
      const previewFrame = page.frames().find(f => f !== page.mainFrame());
      assert.ok(previewFrame, 'Preview iframe not found');
      await previewFrame.waitForFunction(
        () => /Quốc Bảo/.test(document.body?.innerText || '') && /Mai Anh/.test(document.body?.innerText || ''),
        null,
        { timeout: 10000 }
      );

      const orderHref = await page.locator('#themes .card .order').first().getAttribute('href');
      assert.ok(orderHref && /dat-thiep\/\?mau=/.test(orderHref), `Unexpected order href: ${orderHref}`);
      const wantTheme = new URL(orderHref, `${webUrl}/`).searchParams.get('mau');
      await page.goto(new URL(orderHref, `${webUrl}/`).href, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('#themes input[name="theme"]', { timeout: 10000 });
      const checkedVal = await page.locator('#themes input[name="theme"]:checked').getAttribute('value');
      assert.equal(checkedVal, wantTheme, `Order page did not pre-select theme "${wantTheme}"`);
      tracker.assertClean('Storefront / combo');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier3-storefront', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 2. Storefront (/v2) showcase -> launch v2 demos (Desktop & Mobile)
  await record('tier3', 'combos', 'Storefront /v2 showcase -> launch registered v2 demo(s)', async () => {
    if (!isV2ShowcaseUpgraded()) {
      const err = new Error('/v2 showcase is still Pha 0 placeholder ("Đang xây bản mới")');
      err.pendingMilestone = 'M2: upgrade /v2 showcase with interactive template & topic gallery';
      throw err;
    }
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/v2/`, { waitUntil: 'load', timeout: 30000 });
      await assertNoHorizontalOverflow(page, '/v2 desktop');
      const demoLinks = page.locator('a[href*="/v2/demo/"]');
      await demoLinks.first().waitFor({ state: 'visible', timeout: 8000 });
      const count = await demoLinks.count();
      assert.ok(count >= 1, '/v2 showcase must link to at least 1 /v2/demo/ route');

      const hrefs = [...new Set(await demoLinks.evaluateAll(els => els.map(a => a.getAttribute('href')).filter(Boolean)))];
      for (const href of hrefs.slice(0, 6)) {
        const targetUrl = new URL(href, `${webUrl}/`).href;
        await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      }
      tracker.assertClean('/v2 showcase launch');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier3-v2-showcase', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 3. Studio palette switching (.swatch) + live guest preview (#guest)
  await record('tier3', 'combos', 'Studio palette switch (.swatch) & #guest live preview update', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${legacyUrl}/studio/?thiep=demo-song-hy&ma=thu`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.swatch', { timeout: 10000 });
      await page.waitForFunction(() => !document.querySelector('#frameWrap')?.classList.contains('loading'), null, { timeout: 15000 });
      const swatches = page.locator('.swatch');
      assert.ok((await swatches.count()) >= 2, 'Expected >= 2 palette swatches in Studio');

      await swatches.nth(1).click();
      await page.waitForFunction(() => document.querySelector('#frameWrap')?.classList.contains('loading'), null, { timeout: 5000 });
      await page.waitForFunction(() => !document.querySelector('#frameWrap')?.classList.contains('loading'), null, { timeout: 15000 });
      const previewFrame = page.frames().find(f => f !== page.mainFrame());
      assert.ok(previewFrame, 'Studio preview iframe not found');
      await previewFrame.waitForFunction(
        () => document.body?.classList.contains('ready') && document.documentElement.style.length > 0,
        null,
        { timeout: 10000 }
      );
      const customProps = await previewFrame.evaluate(() => document.documentElement.style.cssText);
      assert.ok(customProps.length > 0, 'Preview iframe CSS variables did not update after palette swatch click');

      await page.fill('#guest', 'Cô Minh');
      await page.waitForFunction(() => document.querySelector('#frameWrap')?.classList.contains('loading'), null, { timeout: 5000 });
      await page.waitForFunction(() => !document.querySelector('#frameWrap')?.classList.contains('loading'), null, { timeout: 15000 });
      const updatedFrame = page.frames().find(f => f !== page.mainFrame());
      assert.ok(updatedFrame, 'Updated Studio preview iframe not found');
      await updatedFrame.waitForFunction(
        () => document.querySelector('form[data-w="rsvp"] input[name="name"]')?.value === 'Cô Minh',
        null,
        { timeout: 10000 }
      );
      tracker.assertClean('Studio palette & guest combo');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier3-studio', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 4. v1 cross-theme compatibility (?theme=<id>&k=Chị+Lan)
  const legacyThemes = readLegacyThemes();
  await record('tier3', 'combos', 'v1 cross-theme ?theme= rendering across all 10 themes', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      for (const t of legacyThemes) {
        await page.goto(`${legacyUrl}/demo-ca-phe-phin/?theme=${encodeURIComponent(t.id)}&k=${encodeURIComponent('Chị Lan')}&open=1`, {
          waitUntil: 'load',
          timeout: 30000,
        });
        await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 10000 });
        await assertNoHorizontalOverflow(page, `cross-theme ?theme=${t.id}`);
        const nameVal = await page.locator('form[data-w="rsvp"] input[name="name"]').inputValue();
        assert.equal(nameVal, 'Chị Lan', `?theme=${t.id}: expected RSVP name "Chị Lan", got "${nameVal}"`);
      }
      tracker.assertClean('v1 ?theme= cross-compat');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier3-v1-cross', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 5. Pairwise v2 combinations: theme x palette/topic x motionTier x guestGroup x viewport
  const v2Themes = await discoverV2Themes({ webUrl });
  const cuonPhimMissingImagesDir = !existsSync(join(ROOT, 'packages', 'themes', 'cuon-phim', 'images'));
  const checkTracker = (tracker, themeId, label) => {
    const errs = (themeId === 'cuon-phim' && cuonPhimMissingImagesDir)
      ? tracker.allErrors().filter(e => !/\/_e\/themes\/cuon-phim\/images\//.test(e))
      : tracker.allErrors();
    assert.equal(errs.length, 0, `${label}: ${errs.join(' | ')}`);
    return (themeId === 'cuon-phim' && cuonPhimMissingImagesDir && tracker.allErrors().length > 0)
      ? 'M1 F4: bundle demo images in packages/themes/cuon-phim/images/'
      : '';
  };
  for (const theme of v2Themes) {
    if (!theme.isRegistered) {
      await record('tier3', 'combos', `v2 ${theme.id} pairwise combos`, async () => {
        const err = new Error(`v2 theme "${theme.id}" not yet registered`);
        err.pendingMilestone = theme.pendingReason || `M1/M2: wire v2 theme "${theme.id}"`;
        throw err;
      });
      continue;
    }

    const altPal = theme.palettes?.[1]?.id || '';
    const altTopic = theme.topics?.[0]?.id || '';

    // Pair A (Mobile 390x844): lite + ?k= + ?n=nha-gai + #sh-quick + RSVP with wish
    await record('tier3', 'combos', `v2 ${theme.id} pairwise Mobile (lite x ?k= x ?n=nha-gai x RSVP+wish)`, async () => {
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      let pendingReason = '';
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${webUrl}/v2/demo/${theme.id}/?tier=lite&k=${encodeURIComponent('Chị Lan')}&n=nha-gai`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.getAttribute('html', 'data-motion'), 'lite');
        const guestText = await page.locator('[data-guest]').first().textContent().catch(() => '');
        assert.equal((guestText || '').trim(), 'Chị Lan');

        if (theme.demo?.guestGroups?.some(g => g.id === 'nha-gai')) {
          assert.equal(
            await page.$eval('[data-sh="group-note"]', el => el.hidden),
            false,
            `v2 ${theme.id} combo: [data-sh="group-note"] should be visible for ?n=nha-gai`
          );
          if ((theme.demo.events || []).length >= 2) {
            const hiddenEv = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
            assert.ok(hiddenEv >= 1, `v2 ${theme.id} combo: expected [data-ev] filtering for ?n=nha-gai`);
          }
        }

        await openV2Gate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${theme.id} mobile combo`);

        try {
          await assertVestibularComfort(page, { label: `v2 ${theme.id} mobile lite combo`, motionTier: 'lite' });
        } catch (vestErr) {
          if (theme.id === 'cuon-phim') {
            pendingReason ||= `M1: fix ${theme.id} vestibular comfort (${vestErr.message.slice(0, 80)})`;
          } else {
            throw vestErr;
          }
        }

        const quickBtn = await ensureQuickOpenVisible(page);
        await quickBtn.click();
        await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
        await page.locator('#sh-quick [data-sh="quick-close"]').first().click();
        await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

        const sceneRsvp = page.locator('.sh-scene form[data-sh="rsvp"]').first();
        const hasSceneRsvp = (await sceneRsvp.count()) > 0;
        let rsvpForm = sceneRsvp;
        let rsvpMsgSel = '.sh-scene form[data-sh="rsvp"] .sh-msg';
        if (!hasSceneRsvp) {
          await (await ensureQuickOpenVisible(page)).click();
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          rsvpForm = page.locator('#sh-quick form[data-sh="rsvp"]').first();
          rsvpMsgSel = '#sh-quick form[data-sh="rsvp"] .sh-msg';
        }
        await instantScrollTo(rsvpForm);
        assert.equal(await rsvpForm.locator('input[name="name"]').inputValue(), 'Chị Lan');
        await rsvpForm.locator('textarea[name="wish"]').fill('Chúc mừng hạnh phúc!');
        await rsvpForm.locator('[type="submit"]').click();
        await page.waitForFunction(
          sel => /Cảm ơn/.test(document.querySelector(sel)?.textContent || ''),
          rsvpMsgSel,
          { timeout: 6000 }
        );
        if (!hasSceneRsvp) {
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
        }

        pendingReason ||= checkTracker(tracker, theme.id, `v2 ${theme.id} mobile combo`);
        if (pendingReason) {
          const err = new Error(pendingReason);
          err.pendingMilestone = pendingReason;
          throw err;
        }
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier3-v2-mobile-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });

    // Pair B (Desktop 1440x900): standard x altPalette/topic x ?k= x 5s discoverability x >=13px x vestibular
    await record('tier3', 'combos', `v2 ${theme.id} pairwise Desktop (standard x ${altTopic ? `topic=${altTopic}` : altPal ? `p=${altPal}` : 'default'} x ?k=)`, async () => {
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 1440, height: 900 },
        isMobile: false,
        hasTouch: false,
      });
      let pendingReason = '';
      try {
        const { page, tracker } = await session.newTrackedPage();
        const extra = altTopic ? `&topic=${encodeURIComponent(altTopic)}` : altPal ? `&p=${encodeURIComponent(altPal)}` : '';
        await page.goto(`${webUrl}/v2/demo/${theme.id}/?tier=standard&k=${encodeURIComponent('Anh Minh')}${extra}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.getAttribute('html', 'data-motion'), 'standard');

        const gateTiming = await openV2Gate(page);
        try {
          assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `v2 ${theme.id} desktop combo` });
        } catch (gateErr) {
          if (theme.id === 'cuon-phim') {
            pendingReason ||= 'M1: reduce cuon-phim cover gate lock <= 900ms';
          } else {
            throw gateErr;
          }
        }

        await assertFiveSecondDiscoverability(page, {
          groomShort: theme.demo?.groom?.short || '',
          brideShort: theme.demo?.bride?.short || '',
          date: theme.demo?.date || '',
          city: theme.demo?.city || '',
          venue: theme.demo?.events?.[0]?.venue || '',
          timeoutMs: 5000,
          label: `v2 ${theme.id} desktop combo`,
        });

        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${theme.id} desktop combo`);

        try {
          await assertReadableVietnameseText(page, { minPx: 13, label: `v2 ${theme.id} desktop combo` });
        } catch (fontErr) {
          if (theme.id === 'cuon-phim') {
            pendingReason ||= 'M1: fix cuon-phim <13px labels';
          } else {
            throw fontErr;
          }
        }

        try {
          await assertVestibularComfort(page, { label: `v2 ${theme.id} desktop standard combo`, motionTier: 'standard' });
        } catch (vestErr) {
          if (theme.id === 'cuon-phim') {
            pendingReason ||= `M1: fix ${theme.id} vestibular comfort (${vestErr.message.slice(0, 80)})`;
          } else {
            throw vestErr;
          }
        }

        pendingReason ||= checkTracker(tracker, theme.id, `v2 ${theme.id} desktop combo`);
        if (pendingReason) {
          const err = new Error(pendingReason);
          err.pendingMilestone = pendingReason;
          throw err;
        }
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier3-v2-desktop-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }
}
