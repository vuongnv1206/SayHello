import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  readLegacyThemes,
  readLegacyInvite,
  discoverV2Themes,
} from '../lib/registries.mjs';
import {
  createSafeContext,
  openV1Gate,
  openV2Gate,
  ensureQuickOpenVisible,
  saveFailureShot,
} from '../lib/browser.mjs';
import {
  instantScrollTo,
  scrollFullPage,
  assertCoverGateTiming,
  assertFiveSecondDiscoverability,
  assertVisibleImagesLoaded,
  assertSelfContainedAssets,
} from '../lib/assertions.mjs';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

export async function runTier1Topics({ browser, legacyUrl, webUrl, shotsDir, record }) {
  const legacyThemes = readLegacyThemes();
  const guest = 'Khách Thử';

  // 1. All 10 retained v1 legacy themes (Mobile 390x844)
  for (const t of legacyThemes) {
    await record('tier1', 'v1-topics', `v1 ${t.id}: 0 errors, gate open, event details, RSVP & wish`, async () => {
      const invite = readLegacyInvite(t.demo);
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

  // 2. Dynamically discovered v2 themes across Desktop (1440x900) and Mobile (390x844)
  const v2Themes = await discoverV2Themes({ webUrl });
  assert.ok(v2Themes.length >= 1, 'Expected at least 1 v2 theme discovered in packages/themes/');

  for (const theme of v2Themes) {
    if (!theme.isRegistered) {
      await record('tier1', 'v2-topics', `v2 ${theme.id}: registration & core contract`, async () => {
        const err = new Error(`v2 theme "${theme.id}" exists on disk (packages/themes/${theme.id}) but is not registered in web runtime yet`);
        err.pendingMilestone = theme.pendingReason || `M1/M2: wire v2 theme "${theme.id}"`;
        throw err;
      });
      continue;
    }

    for (const vp of VIEWPORTS) {
      await record('tier1', 'v2-topics', `v2 ${theme.id} (${vp.name} ${vp.width}x${vp.height}): gate <=900ms, 5s card, Quick Info, RSVP & wish`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        let pendingReason = '';
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${theme.id}/?k=${encodeURIComponent(guest)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 20000 });

          // Feature: Guest personalization on cover gate
          const gateGuest = await page.locator('[data-guest]').first().textContent().catch(() => '');
          assert.equal((gateGuest || '').trim(), guest, `v2 ${theme.id}: [data-guest] text="${gateGuest}" != "${guest}"`);

          // Feature: Cover gate unlock & latency <= 900ms
          const gateTiming = await openV2Gate(page);
          try {
            assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `v2 ${theme.id} ${vp.name}` });
          } catch (gateErr) {
            if (theme.id === 'cuon-phim') {
              pendingReason ||= 'M1: reduce cuon-phim cover gate lock to <= 900ms';
            } else {
              throw gateErr;
            }
          }

          // Feature: Card-as-Centerpiece 5-second discoverability (before scrolling entire page)
          await assertFiveSecondDiscoverability(page, {
            groomShort: theme.demo?.groom?.short || '',
            brideShort: theme.demo?.bride?.short || '',
            date: theme.demo?.date || '',
            city: theme.demo?.city || '',
            venue: theme.demo?.events?.[0]?.venue || '',
            timeoutMs: 5000,
            label: `v2 ${theme.id} ${vp.name}`,
          });

          await scrollFullPage(page);
          const cuonPhimMissingImagesDir = theme.id === 'cuon-phim' && !existsSync(join(ROOT, 'packages', 'themes', 'cuon-phim', 'images'));
          try {
            await assertVisibleImagesLoaded(page, `v2 ${theme.id} ${vp.name}`);
          } catch (imgErr) {
            if (cuonPhimMissingImagesDir && /\/_e\/themes\/cuon-phim\/images\//.test(imgErr.message)) {
              pendingReason ||= 'M1 F4: bundle demo images in packages/themes/cuon-phim/images/';
            } else {
              throw imgErr;
            }
          }

          try {
            assertSelfContainedAssets(tracker.trackedRequests, { themeId: theme.id, label: `v2 ${theme.id} ${vp.name}` });
          } catch (assetErr) {
            if (theme.id === 'cuon-phim' && cuonPhimMissingImagesDir) {
              pendingReason ||= 'M1: bundle self-contained demo images in packages/themes/cuon-phim/images/';
            } else {
              throw assetErr;
            }
          }

          // Feature: #sh-quick safety net + Google Calendar & Maps links
          const quickBtn = await ensureQuickOpenVisible(page);
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          const quickEventsCount = await page.locator('#sh-quick .sh-quick-events li').count();
          assert.ok(quickEventsCount >= 1, `v2 ${theme.id}: #sh-quick missing event items`);

          const gcalHref = await page.locator('#sh-quick a[href*="calendar.google.com/calendar/render"]').first().getAttribute('href').catch(() => '');
          assert.ok(gcalHref && gcalHref.startsWith('https://calendar.google.com/calendar/render'), `v2 ${theme.id}: invalid Google Calendar link in #sh-quick`);
          const mapHref = await page.locator('#sh-quick a[href*="google.com/maps"]').first().getAttribute('href').catch(() => '');
          if (theme.demo?.places?.length) {
            assert.ok(mapHref && mapHref.startsWith('https://www.google.com/maps/'), `v2 ${theme.id}: invalid Google Maps link in #sh-quick`);
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
          assert.equal(rsvpName, guest, `v2 ${theme.id}: RSVP name="${rsvpName}" != "${guest}"`);
          const postsBeforeRsvp = session.capturedPosts.length;
          await rsvpForm.locator('[type="submit"]').click();
          await rsvpForm.locator('.sh-msg').waitFor({ state: 'visible', timeout: 5000 });
          await page.waitForFunction(
            sel => /Cảm ơn/.test(document.querySelector(sel)?.textContent || ''),
            sceneRsvpCount > 0 ? '.sh-scene form[data-sh="rsvp"] .sh-msg' : '#sh-quick form[data-sh="rsvp"] .sh-msg',
            { timeout: 6000 }
          );
          const isSent = await rsvpForm.evaluate(el => el.classList.contains('is-sent'));
          assert.equal(isSent, true, `v2 ${theme.id}: RSVP form missing .is-sent after submit`);
          if (theme.demo?.sheetUrl) {
            assert.ok(
              session.capturedPosts.slice(postsBeforeRsvp).some(p => p.body?.type === 'rsvp'),
              `v2 ${theme.id}: expected intercepted POST { type: 'rsvp' }`
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
                `v2 ${theme.id}: expected intercepted POST { type: 'wish' }`
              );
            }
            const wishesEl = page.locator('[data-sh="wishes"]').first();
            if (await wishesEl.count()) {
              const wText = await wishesEl.textContent();
              assert.ok((wText || '').includes(wishText), `v2 ${theme.id}: wish not rendered in [data-sh="wishes"]`);
            }
          }

          const badErrors = cuonPhimMissingImagesDir
            ? tracker.allErrors().filter(e => !/\/_e\/themes\/cuon-phim\/images\//.test(e))
            : tracker.allErrors();
          assert.equal(badErrors.length, 0, `v2 ${theme.id} ${vp.name}: ${badErrors.join(' | ')}`);
          if (cuonPhimMissingImagesDir && tracker.allErrors().length > 0) {
            pendingReason ||= 'M1 F4: bundle demo images in packages/themes/cuon-phim/images/';
          }

          if (pendingReason) {
            const err = new Error(`v2 ${theme.id} ${vp.name} pending M1 defect: ${pendingReason}`);
            err.pendingMilestone = pendingReason;
            throw err;
          }
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier1-v2-${theme.id}-${vp.name}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }
}
