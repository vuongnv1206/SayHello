import assert from 'node:assert/strict';
import {
  discoverThemes,
} from '../lib/registries.mjs';
import {
  createSafeContext,
  openGate,
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

export async function runTier3Combos({ browser, webUrl, shotsDir, record }) {
  // 2. Storefront / showcase -> launch demos (Desktop & Mobile)
  await record('tier3', 'combos', 'Storefront / showcase -> launch demo(s)', async () => {
    const session = await createSafeContext(browser, {
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/`, { waitUntil: 'load', timeout: 30000 });
      await assertNoHorizontalOverflow(page, '/ desktop');
      const demoLinks = page.locator('a[href*="/demo/"]');
      await demoLinks.first().waitFor({ state: 'visible', timeout: 8000 });
      const count = await demoLinks.count();
      assert.ok(count >= 1, '/ showcase must link to at least 1 /demo/ route');

      const hrefs = [...new Set(await demoLinks.evaluateAll(els => els.map(a => a.getAttribute('href')).filter(Boolean)))];
      for (const href of hrefs.slice(0, 6)) {
        const targetUrl = new URL(href, `${webUrl}/`).href;
        await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      }
      tracker.assertClean('/ showcase launch');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier3-showcase', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 5. Pairwise combinations: theme x palette/topic x motionTier x guestGroup x viewport
  const themes = await discoverThemes({ webUrl });
  for (const theme of themes) {

    const altPal = theme.palettes?.[1]?.id || '';
    const altTopic = theme.topics?.[0]?.id || '';

    // Pair A (Mobile 390x844): lite + ?k= + ?n=nha-gai + #sh-quick + RSVP with wish
    await record('tier3', 'combos', `${theme.id} pairwise Mobile (lite x ?k= x ?n=nha-gai x RSVP+wish)`, async () => {
      const session = await createSafeContext(browser, {
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${webUrl}/demo/${theme.id}/?tier=lite&k=${encodeURIComponent('Chị Lan')}&n=nha-gai`, {
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
            `${theme.id} combo: [data-sh="group-note"] should be visible for ?n=nha-gai`
          );
          if ((theme.demo.events || []).length >= 2) {
            const hiddenEv = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
            assert.ok(hiddenEv >= 1, `${theme.id} combo: expected [data-ev] filtering for ?n=nha-gai`);
          }
        }

        await openGate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `${theme.id} mobile combo`);

        await assertVestibularComfort(page, { label: `${theme.id} mobile lite combo`, motionTier: 'lite' });

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

        tracker.assertClean(`${theme.id} mobile combo`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier3-mobile-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });

    // Pair B (Desktop 1440x900): standard x altPalette/topic x ?k= x 5s discoverability x >=13px x vestibular
    await record('tier3', 'combos', `${theme.id} pairwise Desktop (standard x ${altTopic ? `topic=${altTopic}` : altPal ? `p=${altPal}` : 'default'} x ?k=)`, async () => {
      const session = await createSafeContext(browser, {
        webUrl,
        viewport: { width: 1440, height: 900 },
        isMobile: false,
        hasTouch: false,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        const extra = altTopic ? `&topic=${encodeURIComponent(altTopic)}` : altPal ? `&p=${encodeURIComponent(altPal)}` : '';
        await page.goto(`${webUrl}/demo/${theme.id}/?tier=standard&k=${encodeURIComponent('Anh Minh')}${extra}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });
        assert.equal(await page.getAttribute('html', 'data-motion'), 'standard');

        const gateTiming = await openGate(page);
        assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `${theme.id} desktop combo` });

        await assertFiveSecondDiscoverability(page, {
          groomShort: theme.demo?.groom?.short || '',
          brideShort: theme.demo?.bride?.short || '',
          date: theme.demo?.date || '',
          city: theme.demo?.city || '',
          venue: theme.demo?.events?.[0]?.venue || '',
          timeoutMs: 5000,
          label: `${theme.id} desktop combo`,
        });

        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `${theme.id} desktop combo`);

        await assertReadableVietnameseText(page, { minPx: 13, label: `${theme.id} desktop combo` });
        await assertVestibularComfort(page, { label: `${theme.id} desktop standard combo`, motionTier: 'standard' });

        tracker.assertClean(`${theme.id} desktop combo`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier3-desktop-${theme.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }
}
