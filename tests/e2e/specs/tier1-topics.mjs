import assert from 'node:assert/strict';
import {
  TARGET_V2_THEMES,
  readLegacyThemes,
  readLegacyInvite,
  readWebThemesRegistry,
  readV2ThemeEntry,
} from '../lib/registries.mjs';
import { createSafeContext, openV1Gate, openV2Gate, saveFailureShot } from '../lib/browser.mjs';
import { instantScrollTo, scrollFullPage } from '../lib/assertions.mjs';

export async function runTier1Topics({ browser, legacyUrl, webUrl, shotsDir, record }) {
  const legacyThemes = readLegacyThemes();
  const guest = 'Khách Thử';

  // All 10 retained v1 legacy themes
  for (const t of legacyThemes) {
    await record('tier1', 'v1-topics', `v1 ${t.id}: 0 errors, gate open, event details, RSVP & wish`, async () => {
      const invite = readLegacyInvite(t.demo);
      const entry = readV2ThemeEntry(id);
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${legacyUrl}/${t.demo}/?k=${encodeURIComponent(guest)}`, { waitUntil: 'load', timeout: 30000 });
        await openV1Gate(page);
        await scrollFullPage(page);

        const bodyText = await page.evaluate(() => document.querySelector('main#card')?.innerText || '');
        assert.ok(bodyText.trim().length > 50, `v1 ${t.id}: main#card text is unexpectedly empty`);
        if (invite.events?.[0]?.title) {
          assert.ok(
            bodyText.includes(invite.events[0].title) || bodyText.includes(invite.groom.short),
            `v1 ${t.id}: missing expected event/couple content`
          );
        }

        // RSVP submission
        const rsvpForm = page.locator('form[data-w="rsvp"]').first();
        await instantScrollTo(rsvpForm);
        const rsvpName = await rsvpForm.locator('input[name="name"]').inputValue();
        assert.equal(rsvpName, guest, `v1 ${t.id}: RSVP name not pre-filled with "${guest}" (got "${rsvpName}")`);

        const postsBeforeRsvp = session.capturedPosts.length;
        await rsvpForm.locator('button[type="submit"]').click();
        await page.waitForFunction(
          () => /Cảm ơn/.test(document.querySelector('form[data-w="rsvp"] .msg')?.textContent || ''),
          null,
          { timeout: 6000 }
        );
        if (invite.sheetUrl) {
          assert.ok(
            session.capturedPosts.slice(postsBeforeRsvp).some(p => p.body?.type === 'rsvp'),
            `v1 ${t.id}: expected intercepted POST { type: 'rsvp' }`
          );
        }

        // Guestbook wish submission
        const wishForm = page.locator('form[data-w="guestbook"]').first();
        if (await wishForm.count()) {
          await instantScrollTo(wishForm);
          const wishText = 'Chúc hai bạn trăm năm hạnh phúc!';
          await wishForm.locator('textarea[name="message"]').fill(wishText);
          const postsBeforeWish = session.capturedPosts.length;
          await wishForm.locator('button[type="submit"]').click();
          await page.waitForFunction(
            () => /Cảm ơn/.test(document.querySelector('form[data-w="guestbook"] .msg')?.textContent || ''),
            null,
            { timeout: 6000 }
          );
          const wishesText = await page.locator('.wishes').first().innerText().catch(() => '');
          assert.ok(wishesText.includes(wishText), `v1 ${t.id}: submitted wish not rendered in .wishes`);
          if (invite.sheetUrl) {
            assert.ok(
              session.capturedPosts.slice(postsBeforeWish).some(p => p.body?.type === 'wish'),
              `v1 ${t.id}: expected intercepted POST { type: 'wish' }`
            );
          }
          // Dismiss cheers dialog if shown
          await page.locator('.cheers button').first().click({ timeout: 1000 }).catch(() => {});
        }

        tracker.assertClean(`v1 ${t.id}`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier1-v1-${t.id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // All 5 target v2 themes
  const webReg = readWebThemesRegistry();
  for (const id of TARGET_V2_THEMES) {
    await record('tier1', 'v2-topics', `v2 ${id}: 0 errors, gate open, Quick Info, RSVP & wish`, async () => {
      if (!webReg.registeredIds.includes(id)) {
        const err = new Error(`v2 theme "${id}" is not registered in apps/web/src/lib/themes.ts yet`);
        err.pendingMilestone = `M4/M5/M6: implement and register v2 theme "${id}"`;
        throw err;
      }

      const entry = readV2ThemeEntry(id);
      const session = await createSafeContext(browser, {
        legacyUrl,
        webUrl,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      try {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(`${webUrl}/v2/demo/${id}/?k=${encodeURIComponent(guest)}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });

        const gateGuest = await page.locator('[data-guest]').first().textContent().catch(() => '');
        assert.equal((gateGuest || '').trim(), guest, `v2 ${id}: [data-guest] text="${gateGuest}" != "${guest}"`);

        await openV2Gate(page);
        await scrollFullPage(page);

        // Ensure .sh-quick-btn is not hidden by .is-away (at bottom or top of scroll)
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(350);
        const quickBtn = page.locator('[data-sh="quick-open"]').first();
        await quickBtn.click();
        await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
        const quickEventsCount = await page.locator('#sh-quick .sh-quick-events li').count();
        assert.ok(quickEventsCount >= 1, `v2 ${id}: #sh-quick missing event items`);

        const sceneRsvpCount = await page.locator('.sh-scene form[data-sh="rsvp"]').count();
        if (sceneRsvpCount > 0) {
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click();
          await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });
        }

        // RSVP form (either in scene or embedded in #sh-quick)
        const rsvpForm = sceneRsvpCount > 0
          ? page.locator('.sh-scene form[data-sh="rsvp"]').first()
          : page.locator('#sh-quick form[data-sh="rsvp"]').first();
        await instantScrollTo(rsvpForm);
        const rsvpName = await rsvpForm.locator('input[name="name"]').inputValue();
        assert.equal(rsvpName, guest, `v2 ${id}: RSVP name="${rsvpName}" != "${guest}"`);
        const postsBeforeRsvp = session.capturedPosts.length;
        await rsvpForm.locator('[type="submit"]').click();
        await rsvpForm.locator('.sh-msg').waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForFunction(
          sel => /Cảm ơn/.test(document.querySelector(sel)?.textContent || ''),
          sceneRsvpCount > 0 ? '.sh-scene form[data-sh="rsvp"] .sh-msg' : '#sh-quick form[data-sh="rsvp"] .sh-msg',
          { timeout: 6000 }
        );
        if (entry?.demo?.sheetUrl) {
          assert.ok(
            session.capturedPosts.slice(postsBeforeRsvp).some(p => p.body?.type === 'rsvp'),
            `v2 ${id}: expected intercepted POST { type: 'rsvp' }`
          );
        }

        if (sceneRsvpCount === 0) {
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
        }

        // Wish form if theme provides guestbook
        const wishForm = page.locator('form[data-sh="wish"]').first();
        if (await wishForm.count()) {
          await instantScrollTo(wishForm);
          const wishText = 'Chúc hai bạn mãi hạnh phúc!';
          await wishForm.locator('textarea[name="message"]').fill(wishText);
          const postsBeforeWish = session.capturedPosts.length;
          await wishForm.locator('[type="submit"]').click();
          await page.waitForFunction(
            () => /Cảm ơn/.test(document.querySelector('form[data-sh="wish"] .sh-msg')?.textContent || ''),
            null,
            { timeout: 6000 }
          );
          if (entry?.demo?.sheetUrl) {
            assert.ok(
              session.capturedPosts.slice(postsBeforeWish).some(p => p.body?.type === 'wish'),
              `v2 ${id}: expected intercepted POST { type: 'wish' }`
            );
          }
          const wishesEl = page.locator('[data-sh="wishes"]').first();
          if (await wishesEl.count()) {
            const wText = await wishesEl.textContent();
            assert.ok((wText || '').includes(wishText), `v2 ${id}: wish not rendered in [data-sh="wishes"]`);
          }
        }

        tracker.assertClean(`v2 ${id}`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier1-v2-${id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }
}
