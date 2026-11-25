import assert from 'node:assert/strict';
import {
  TARGET_V2_THEMES,
  readShopConfig,
  readWebThemesRegistry,
  isV2ShowcaseUpgraded,
} from '../lib/registries.mjs';
import { createSafeContext, openV1Gate, openV2Gate, saveFailureShot } from '../lib/browser.mjs';
import { assertNoHorizontalOverflow, instantScrollTo, scrollFullPage } from '../lib/assertions.mjs';

export async function runTier4Journeys({ browser, legacyUrl, webUrl, shotsDir, record }) {
  // Journey 1 (Mobile 390x844): v1 Craft & Courtyard (/demo-thiep-gap/, /demo-song-hy/)
  await record('tier4', 'journeys', 'Journey 1 (Mobile): v1 craft/courtyard (thiep-gap + song-hy)', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const { page, tracker } = await session.newTrackedPage();

      // demo-thiep-gap
      await page.goto(`${legacyUrl}/demo-thiep-gap/?k=${encodeURIComponent('Bạn Minh')}`, { waitUntil: 'load', timeout: 30000 });
      await openV1Gate(page);
      await scrollFullPage(page);
      await assertNoHorizontalOverflow(page, 'Journey 1 demo-thiep-gap');

      const giftBtn = page.locator('[data-w="gift"] .giftbox').first();
      if (await giftBtn.count()) {
        await instantScrollTo(giftBtn);
        await giftBtn.click();
        await page.locator('[data-w="gift"] .accounts').first().waitFor({ state: 'visible', timeout: 4000 });
      }

      const mapTabs = page.locator('[data-w="map"] .tabs button');
      if ((await mapTabs.count()) >= 2) {
        await instantScrollTo(mapTabs.nth(1));
        const addrBefore = await page.locator('[data-w="map"] .addr').first().textContent();
        await mapTabs.nth(1).click();
        const addrAfter = await page.locator('[data-w="map"] .addr').first().textContent();
        assert.notEqual(addrAfter, addrBefore, 'Map tab switch did not update address');
      }

      const rsvp = page.locator('form[data-w="rsvp"]').first();
      await instantScrollTo(rsvp);
      await rsvp.locator('input[name="withwish"]').check();
      await rsvp.locator('textarea[name="wish"]').fill('Chúc mừng hai bạn!');
      await rsvp.locator('button[type="submit"]').click();
      await page.waitForFunction(() => /Cảm ơn/.test(document.querySelector('form[data-w="rsvp"] .msg')?.textContent || ''), null, { timeout: 6000 });

      const gb = page.locator('form[data-w="guestbook"]').first();
      await instantScrollTo(gb);
      await gb.locator('textarea[name="message"]').fill('Hẹn gặp tại lễ cưới!');
      await gb.locator('button[type="submit"]').click();
      await page.waitForFunction(() => /Cảm ơn/.test(document.querySelector('form[data-w="guestbook"] .msg')?.textContent || ''), null, { timeout: 6000 });
      await page.locator('.cheers button').first().click({ timeout: 2000 }).catch(() => {});

      // demo-song-hy
      await page.goto(`${legacyUrl}/demo-song-hy/?k=${encodeURIComponent('Cô Hoa')}`, { waitUntil: 'load', timeout: 30000 });
      await openV1Gate(page);
      await scrollFullPage(page);
      await assertNoHorizontalOverflow(page, 'Journey 1 demo-song-hy');
      tracker.assertClean('Journey 1');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier4-journey1', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // Journey 2 (Desktop 1440x900): v1 Narrative & Panorama (ve-may-bay, khoa-tinh, den-long)
  await record('tier4', 'journeys', 'Journey 2 (Desktop): v1 narrative/panorama (ve-may-bay, khoa-tinh, den-long)', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      for (const [slug, guest] of [
        ['demo-ve-may-bay', 'Anh Tuấn'],
        ['demo-khoa-tinh', 'Chú Hùng'],
        ['demo-den-long', 'Bác Mai'],
      ]) {
        await page.goto(`${legacyUrl}/${slug}/?k=${encodeURIComponent(guest)}`, { waitUntil: 'load', timeout: 30000 });
        if (slug === 'demo-khoa-tinh') {
          await page.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 12000 });
          const dials = page.locator('#cover [data-dial]');
          if ((await dials.count()) === 4) {
            await dials.nth(0).focus();
            await page.keyboard.press('ArrowUp');
            assert.equal(await dials.nth(0).getAttribute('aria-valuenow'), '1', 'khoa-tinh dial spinbutton did not increment');
          }
        }
        await openV1Gate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `Journey 2 ${slug}`);

        const rsvp = page.locator('form[data-w="rsvp"]').first();
        await instantScrollTo(rsvp);
        await rsvp.locator('button[type="submit"]').click();
        await page.waitForFunction(() => /Cảm ơn/.test(document.querySelector('form[data-w="rsvp"] .msg')?.textContent || ''), null, { timeout: 6000 });

        const gb = page.locator('form[data-w="guestbook"]').first();
        if (await gb.count()) {
          await instantScrollTo(gb);
          await gb.locator('textarea[name="message"]').fill('Chúc hai bạn trăm năm hạnh phúc!');
          await gb.locator('button[type="submit"]').click();
          await page.waitForFunction(() => /Cảm ơn/.test(document.querySelector('form[data-w="guestbook"] .msg')?.textContent || ''), null, { timeout: 6000 });
          await page.locator('.cheers button').first().click({ timeout: 2000 }).catch(() => {});
        }

        if (slug === 'demo-khoa-tinh') {
          const throwBtn = page.locator('.thanks .throw').first();
          if (await throwBtn.count()) {
            await instantScrollTo(throwBtn);
            await throwBtn.click();
          }
        } else if (slug === 'demo-den-long') {
          const releaseBtn = page.locator('.thanks .release').first();
          if (await releaseBtn.count()) {
            await instantScrollTo(releaseBtn);
            await releaseBtn.click();
          }
        }
      }
      tracker.assertClean('Journey 2');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier4-journey2', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // Journey 3 (Mobile & Desktop): v2 3D Photo-First Themes
  const webReg = readWebThemesRegistry();
  for (const id of TARGET_V2_THEMES) {
    await record('tier4', 'journeys', `Journey 3 (Desktop + Mobile): v2 ${id} full interactive flow`, async () => {
      if (!webReg.registeredIds.includes(id)) {
        const err = new Error(`v2 theme "${id}" not yet registered`);
        err.pendingMilestone = `M4/M5/M6: implement v2 theme "${id}"`;
        throw err;
      }

      for (const vp of [
        { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
        { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
      ]) {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${id}/?k=${encodeURIComponent('Khách Quý')}`, { waitUntil: 'load', timeout: 30000 });
          await openV2Gate(page);
          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `Journey 3 ${id} ${vp.name}`);

          const layout = await page.getAttribute('html', 'data-layout');
          if (layout === 'stage') {
            await page.waitForTimeout(350);
            const hasVisibleCanvas = await page.evaluate(() =>
              [...document.querySelectorAll('canvas')].some(c => {
                const cs = getComputedStyle(c);
                if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.05) return false;
                const r = c.getBoundingClientRect();
                return r.width > 100 && r.height > 100;
              })
            );
            const hasStageFallback = await page.evaluate(
              () => document.querySelectorAll('.ptl-track, .constellation-fallback, .hg-horizon-fallback').length > 0
            );
            assert.ok(hasVisibleCanvas || hasStageFallback, `Journey 3 ${id} ${vp.name}: stage theme missing visible canvas or DOM fallback`);
          }

          if (id === 'cuon-phim') {
            const stub = page.locator('#ve-moi .tk-stub').first();
            if (await stub.count()) {
              await instantScrollTo(stub);
              await stub.click();
              const actLink = page.locator('#ve-moi .ticket.torn .tk-actions a').first();
              if (await actLink.count()) {
                assert.equal(await actLink.isVisible(), true);
              }
            }
          }

          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
          await page.waitForTimeout(350);
          await page.locator('[data-sh="quick-open"]').first().click();
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click();

          const rsvp = page.locator('form[data-sh="rsvp"]').first();
          if (await rsvp.count()) {
            const inDialog = await rsvp.evaluate(el => !!el.closest('#sh-quick'));
            if (inDialog) await page.locator('[data-sh="quick-open"]').first().click();
            await instantScrollTo(rsvp);
            await rsvp.locator('[type="submit"]').click();
            await page.waitForFunction(
              () => /Cảm ơn/.test(document.querySelector('form[data-sh="rsvp"] .sh-msg')?.textContent || ''),
              null,
              { timeout: 6000 }
            );
            if (inDialog) await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
          }

          const wish = page.locator('form[data-sh="wish"]').first();
          if (await wish.count()) {
            await instantScrollTo(wish);
            await wish.locator('textarea[name="message"]').fill('Chúc mừng ngày vui!');
            await wish.locator('[type="submit"]').click();
            await page.waitForFunction(
              () => /Cảm ơn/.test(document.querySelector('form[data-sh="wish"] .sh-msg')?.textContent || ''),
              null,
              { timeout: 6000 }
            );
          }

          tracker.assertClean(`Journey 3 ${id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier4-journey3-${id}-${vp.name}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      }
    });
  }

  // Journey 4 (Desktop 1440x900): /v2 showcase & / storefront browsing
  await record('tier4', 'journeys', 'Journey 4 (Desktop): / storefront & /v2 showcase browsing', async () => {
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/`, { waitUntil: 'load', timeout: 30000 });
      await page.locator('#themes .card').first().waitFor({ state: 'visible', timeout: 10000 });
      assert.equal(await page.locator('#themes .card').count(), 10, 'Expected 10 theme cards on /');
      assert.ok((await page.locator('#packs .pack').count()) >= 1, 'Expected pricing packs on /');
      await assertNoHorizontalOverflow(page, 'Storefront /');

      // Ensure poster images load
      await scrollFullPage(page);
      const brokenImgs = await page.evaluate(() =>
        [...document.querySelectorAll('#themes img.poster')].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
      );
      assert.equal(brokenImgs.length, 0, `Broken poster images on /: ${brokenImgs.join(', ')}`);

      await page.goto(`${webUrl}/v2/`, { waitUntil: 'load', timeout: 30000 });
      await assertNoHorizontalOverflow(page, '/v2 showcase');
      tracker.assertClean('Journey 4');

      if (!isV2ShowcaseUpgraded()) {
        const err = new Error('/v2 showcase still shows Pha 0 placeholder');
        err.pendingMilestone = 'M6: upgrade /v2 showcase';
        throw err;
      }
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier4-journey4', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // Journey 5 (Mobile & Desktop): /dat-thiep/ ordering & /studio/ + /studio/khach.html
  await record('tier4', 'journeys', 'Journey 5 (Mobile + Desktop): /dat-thiep/ order flow & /studio/ tools', async () => {
    const shop = readShopConfig();
    const pack = shop.packages.find(p => p.id === 'co-ban') || shop.packages[0];
    const session = await createSafeContext(browser, {
      legacyUrl,
      webUrl,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/dat-thiep/?goi=${encodeURIComponent(pack.id)}&moi=1`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('#themes input', { timeout: 10000 });
      await assertNoHorizontalOverflow(page, '/dat-thiep/ mobile');

      // Empty submit triggers validation
      await page.click('#submit');
      assert.ok((await page.textContent('#err') || '').trim().length > 0, 'Empty order submit should set #err');

      await page.fill('input[name="groom"]', 'Quốc Bảo');
      await page.fill('input[name="bride"]', 'Mai Anh');
      await page.fill('input[name="date"]', '2027-12-05');
      await page.fill('input[name="phone"]', '0912345678');
      assert.equal(await page.inputValue('input[name="slug"]'), 'quoc-bao-mai-anh');

      // Duplicate slug check + blocked submit verification
      await page.fill('input[name="slug"]', 'demo-thu-tay');
      await page.waitForFunction(() => /đã có người dùng/.test(document.querySelector('#slug-msg')?.textContent || ''), null, { timeout: 4000 });
      await page.click('#submit');
      await page.waitForFunction(() => /đã có người dùng/.test(document.querySelector('#err')?.textContent || ''), null, { timeout: 4000 });
      assert.equal(await page.locator('#pay').isVisible(), false, 'Duplicate slug submit must be blocked');

      await page.fill('input[name="slug"]', 'quoc-bao-mai-anh');
      await page.click('#submit');
      await page.locator('#pay').waitFor({ state: 'visible', timeout: 6000 });
      const code = (await page.textContent('#pay-code') || '').trim();
      assert.match(code, /^SH[A-Z0-9]{6}$/, `Unexpected order code: "${code}"`);
      const qr = await page.getAttribute('#qr', 'src');
      assert.ok(qr?.includes(`amount=${pack.price}`) && qr.includes(code), `QR missing amount/code: ${qr}`);

      // Desktop Studio + Guest Manager check
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${legacyUrl}/studio/?thiep=demo-song-hy&ma=thu`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('#form details.group', { timeout: 10000 });
      await page.click('#device button[data-v="tablet"]');
      assert.equal(await page.getAttribute('#frameWrap', 'class'), 'device tablet');

      await page.goto(`${legacyUrl}/studio/khach.html?thiep=demo-song-hy&ma=thu`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('#stats .stat', { timeout: 10000 });
      await page.click('[data-t="links"]');
      await page.waitForSelector('#names', { timeout: 5000 });
      await page.click('[data-t="seating"]');
      await page.waitForSelector('#seat-out', { timeout: 5000 });

      tracker.assertClean('Journey 5');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier4-journey5', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });
}
