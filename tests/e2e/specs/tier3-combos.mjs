import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import {
  TARGET_V2_THEMES,
  readLegacyThemes,
  readWebThemesRegistry,
  readV2ThemeEntry,
  isV2ShowcaseUpgraded,
} from '../lib/registries.mjs';
import { createSafeContext, openV1Gate, openV2Gate, saveFailureShot } from '../lib/browser.mjs';
import { assertNoHorizontalOverflow, instantScrollTo, scrollFullPage } from '../lib/assertions.mjs';

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

  // 2. Storefront (/v2) showcase -> launch v2 demo
  await record('tier3', 'combos', 'Storefront /v2 showcase -> launch v2 demo', async () => {
    if (!isV2ShowcaseUpgraded()) {
      const err = new Error('/v2 showcase is still Pha 0 placeholder ("Đang xây bản mới")');
      err.pendingMilestone = 'M6: upgrade /v2 showcase with interactive theme cards';
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
      const demoLink = page.locator('a[href*="/v2/demo/"]').first();
      await demoLink.waitFor({ state: 'visible', timeout: 8000 });
      const href = await demoLink.getAttribute('href');
      const targetAttr = await demoLink.getAttribute('target');
      let targetPage = page;
      if (targetAttr === '_blank') {
        const [popup] = await Promise.all([page.waitForEvent('popup'), demoLink.click()]);
        targetPage = popup;
        session.attachPage(targetPage);
        await targetPage.waitForLoadState('load');
      } else {
        await demoLink.click();
        await page.waitForURL(/\/v2\/demo\//, { timeout: 15000 });
      }
      await targetPage.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
      tracker.assertClean(`/v2 launch -> ${href}`);
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

  // 5. v2 combined params (?tier=lite&k=Chị+Lan&n=nha-gai) + conditional ?p= probe + RSVP/wish + #sh-quick
  const webReg = readWebThemesRegistry();
  for (const id of TARGET_V2_THEMES) {
    await record('tier3', 'combos', `v2 ${id} combined ?tier=lite&k=Chị+Lan&n=nha-gai + #sh-quick + RSVP/wish`, async () => {
      if (!webReg.registeredIds.includes(id)) {
        const err = new Error(`v2 theme "${id}" not yet registered`);
        err.pendingMilestone = `M4/M5/M6: implement v2 theme "${id}"`;
        throw err;
      }
      const entry = readV2ThemeEntry(id);
      const themeMod = entry ? (await import(pathToFileURL(entry.themeJs).href)).default : null;
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${webUrl}/v2/demo/${id}/?tier=lite&k=${encodeURIComponent('Chị Lan')}&n=nha-gai`, {
          waitUntil: 'load',
          timeout: 30000,
        });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        assert.equal(await page.getAttribute('html', 'data-motion'), 'lite');
        const guestText = await page.locator('[data-guest]').first().textContent().catch(() => '');
        assert.equal((guestText || '').trim(), 'Chị Lan');

        if (entry?.demo?.guestGroups?.some(g => g.id === 'nha-gai')) {
          assert.equal(
            await page.$eval('[data-sh="group-note"]', el => el.hidden),
            false,
            `v2 ${id} combo: [data-sh="group-note"] should be visible for ?n=nha-gai`
          );
          if ((entry.demo.events || []).length >= 2) {
            const hiddenEv = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
            assert.ok(hiddenEv >= 1, `v2 ${id} combo: expected [data-ev] filtering for ?n=nha-gai`);
          }
        }

        await openV2Gate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${id} combo`);

        // Open #sh-quick and verify close works cleanly
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(350);
        await page.locator('[data-sh="quick-open"]').first().click();
        await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
        await page.locator('#sh-quick [data-sh="quick-close"]').first().click();
        await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

        // Submit RSVP with wish (in scene or inside #sh-quick for stage themes)
        const sceneRsvp = page.locator('.sh-scene form[data-sh="rsvp"]').first();
        const hasSceneRsvp = (await sceneRsvp.count()) > 0;
        let rsvpForm = sceneRsvp;
        let rsvpMsgSel = '.sh-scene form[data-sh="rsvp"] .sh-msg';
        if (!hasSceneRsvp) {
          await page.locator('[data-sh="quick-open"]').first().click();
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

        // Conditional ?p= palette probe using theme's second palette dynamically
        const altPal = themeMod?.palettes?.[1]?.id;
        if (altPal) {
          await page.goto(`${webUrl}/v2/demo/${id}/?p=${encodeURIComponent(altPal)}&open=1`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        }
        tracker.assertClean(`v2 ${id} combo`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier3-v2-${id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }
}
