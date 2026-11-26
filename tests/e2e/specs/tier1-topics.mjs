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
  instantScrollTo,
  scrollFullPage,
  assertCoverGateTiming,
  assertFiveSecondDiscoverability,
  assertVisibleImagesLoaded,
} from '../lib/assertions.mjs';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

export async function runTier1Topics({ browser, webUrl, shotsDir, record }) {
  const guest = 'Khách Thử';

  // 2. Dynamically discovered themes across Desktop (1440x900) and Mobile (390x844)
  const themes = await discoverThemes({ webUrl });
  assert.ok(themes.length >= 1, 'Expected at least 1 theme discovered in packages/themes/');

  for (const theme of themes) {

    for (const vp of VIEWPORTS) {
      await record('tier1', 'themes', `${theme.id} (${vp.name} ${vp.width}x${vp.height}): gate <=900ms, 5s card, Quick Info, RSVP & wish`, async () => {
        const session = await createSafeContext(browser, {
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/demo/${theme.id}/?k=${encodeURIComponent(guest)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });

          // Feature: Guest personalization on cover gate
          const gateGuest = await page.locator('[data-guest]').first().textContent().catch(() => '');
          assert.equal((gateGuest || '').trim(), guest, `${theme.id}: [data-guest] text="${gateGuest}" != "${guest}"`);

          // Feature: Cover gate unlock & latency <= 900ms
          const gateTiming = await openGate(page);
          assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `${theme.id} ${vp.name}` });

          // Feature: Card-as-Centerpiece 5-second discoverability (before scrolling entire page)
          await assertFiveSecondDiscoverability(page, {
            groomShort: theme.demo?.groom?.short || '',
            brideShort: theme.demo?.bride?.short || '',
            date: theme.demo?.date || '',
            city: theme.demo?.city || '',
            venue: theme.demo?.events?.[0]?.venue || '',
            timeoutMs: 5000,
            label: `${theme.id} ${vp.name}`,
          });

          await scrollFullPage(page);
          await assertVisibleImagesLoaded(page, `${theme.id} ${vp.name}`);

          // Feature: #sh-quick safety net + Google Calendar & Maps links
          const quickBtn = await ensureQuickOpenVisible(page);
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          const quickEventsCount = await page.locator('#sh-quick .sh-quick-events li').count();
          assert.ok(quickEventsCount >= 1, `${theme.id}: #sh-quick missing event items`);

          const gcalHref = await page.locator('#sh-quick a[href*="calendar.google.com/calendar/render"]').first().getAttribute('href').catch(() => '');
          assert.ok(gcalHref && gcalHref.startsWith('https://calendar.google.com/calendar/render'), `${theme.id}: invalid Google Calendar link in #sh-quick`);
          const mapHref = await page.locator('#sh-quick a[href*="google.com/maps"]').first().getAttribute('href').catch(() => '');
          if (theme.demo?.places?.length) {
            assert.ok(mapHref && mapHref.startsWith('https://www.google.com/maps/'), `${theme.id}: invalid Google Maps link in #sh-quick`);
          }

          const sceneRsvpCount = await page.locator('.sh-scene form[data-sh="rsvp"]').count();
          if (sceneRsvpCount > 0) {
            await page.locator('#sh-quick [data-sh="quick-close"]').first().click();
            await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });
          }

          // Feature: RSVP submission
          const rsvpForm = sceneRsvpCount > 0
            ? page.locator('.sh-scene form[data-sh="rsvp"]').first()
            : page.locator('#sh-quick form[data-sh="rsvp"]').first();
          await instantScrollTo(rsvpForm);
          const rsvpName = await rsvpForm.locator('input[name="name"]').inputValue();
          assert.equal(rsvpName, guest, `${theme.id}: RSVP name="${rsvpName}" != "${guest}"`);
          const postsBeforeRsvp = session.capturedPosts.length;
          await rsvpForm.locator('[type="submit"]').click();
          await rsvpForm.locator('.sh-msg').waitFor({ state: 'visible', timeout: 5000 });
          await page.waitForFunction(
            sel => /Cảm ơn/.test(document.querySelector(sel)?.textContent || ''),
            sceneRsvpCount > 0 ? '.sh-scene form[data-sh="rsvp"] .sh-msg' : '#sh-quick form[data-sh="rsvp"] .sh-msg',
            { timeout: 6000 }
          );
          const isSent = await rsvpForm.evaluate(el => el.classList.contains('is-sent'));
          assert.equal(isSent, true, `${theme.id}: RSVP form missing .is-sent after submit`);
          if (theme.demo?.sheetUrl) {
            assert.ok(
              session.capturedPosts.slice(postsBeforeRsvp).some(p => p.body?.type === 'rsvp'),
              `${theme.id}: expected intercepted POST { type: 'rsvp' }`
            );
          }

          if (sceneRsvpCount === 0) {
            await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
          }

          // Feature: Wish form if theme provides guestbook
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
            if (theme.demo?.sheetUrl) {
              assert.ok(
                session.capturedPosts.slice(postsBeforeWish).some(p => p.body?.type === 'wish'),
                `${theme.id}: expected intercepted POST { type: 'wish' }`
              );
            }
            const wishesEl = page.locator('[data-sh="wishes"]').first();
            if (await wishesEl.count()) {
              const wText = await wishesEl.textContent();
              assert.ok((wText || '').includes(wishText), `${theme.id}: wish not rendered in [data-sh="wishes"]`);
            }
          }

          tracker.assertClean(`${theme.id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier1-${theme.id}-${vp.name}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }
}
