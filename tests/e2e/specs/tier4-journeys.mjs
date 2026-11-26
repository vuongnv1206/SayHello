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
  assertCoverGateTiming,
  assertFiveSecondDiscoverability,
  assertVisibleImagesLoaded,
  instantScrollTo,
  scrollFullPage,
} from '../lib/assertions.mjs';

export async function runTier4Journeys({ browser, webUrl, shotsDir, record }) {
  // Journey 3+ (Desktop & Mobile): Complete Guest Journey per dynamically discovered theme
  const themes = await discoverThemes({ webUrl });
  for (const theme of themes) {
    await record('tier4', 'journeys', `Journey (Desktop + Mobile): ${theme.id} complete guest workflow`, async () => {

      for (const vp of [
        { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
        { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
      ]) {
        const session = await createSafeContext(browser, {
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/demo/${theme.id}/?k=${encodeURIComponent('Khách Quý')}&n=nha-gai`, { waitUntil: 'domcontentloaded', timeout: 30000 });

          const gateTiming = await openGate(page);
          assertCoverGateTiming({ unlockMs: gateTiming.unlockMs, maxMs: 900, label: `Journey ${theme.id} ${vp.name}` });

          await assertFiveSecondDiscoverability(page, {
            groomShort: theme.demo?.groom?.short || '',
            brideShort: theme.demo?.bride?.short || '',
            date: theme.demo?.date || '',
            city: theme.demo?.city || '',
            venue: theme.demo?.events?.[0]?.venue || '',
            timeoutMs: 5000,
            label: `Journey ${theme.id} ${vp.name}`,
          });

          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `Journey ${theme.id} ${vp.name}`);
          await assertVisibleImagesLoaded(page, `Journey ${theme.id} ${vp.name}`);

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
              () => document.querySelectorAll('.ptl-track, .th-track, .constellation-fallback, .hg-horizon-fallback').length > 0
            );
            assert.ok(hasVisibleCanvas || hasStageFallback, `Journey ${theme.id} ${vp.name}: stage theme missing visible canvas or DOM fallback`);
          }

          if (theme.id === 'cuon-phim') {
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

          // Map & Google Calendar links in #sh-quick
          const quickBtn = await ensureQuickOpenVisible(page);
          await quickBtn.click({ timeout: 5000 });
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          const gcalHref = await page.locator('#sh-quick a[href*="calendar.google.com/calendar/render"]').first().getAttribute('href').catch(() => '');
          assert.ok(gcalHref && gcalHref.startsWith('https://calendar.google.com/calendar/render'), `Journey ${theme.id}: missing Google Calendar link`);
          if (theme.demo?.places?.length) {
            const mapHref = await page.locator('#sh-quick a[href*="google.com/maps"]').first().getAttribute('href').catch(() => '');
            assert.ok(mapHref && mapHref.startsWith('https://www.google.com/maps/'), `Journey ${theme.id}: missing Google Maps link`);
          }
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click();

          // Gift QR & copy flow when accounts exist
          if ((theme.demo?.accounts || []).length > 0) {
            const bucketBtn = page.locator('.bucket, [data-gift-open]').first();
            if (await bucketBtn.count()) {
              await instantScrollTo(bucketBtn);
              await bucketBtn.click();
              await page.waitForTimeout(250);
            }
            const qrImg = page.locator('img.qr, .accounts img, .ptl-accs img, .th-accs img').first();
            if (await qrImg.count()) {
              const qrSrc = await qrImg.getAttribute('src');
              assert.ok(qrSrc && (/vietqr\.io/.test(qrSrc) || /^(\/|https?:)/.test(qrSrc)), `Journey ${theme.id}: invalid gift QR src "${qrSrc}"`);
              if (/vietqr\.io/.test(qrSrc)) {
                const qrUrl = new URL(qrSrc, 'https://img.vietqr.io');
                const addInfo = qrUrl.searchParams.get('addInfo') || '';
                const firstAcc = theme.demo.accounts[0];
                if (firstAcc?.bankCode && firstAcc?.number) {
                  assert.ok(decodeURIComponent(qrUrl.pathname).includes(`${firstAcc.bankCode}-${firstAcc.number}`), `Journey ${theme.id}: VietQR missing bankCode-number`);
                }
                assert.ok(/mung cuoi|khach quy/i.test(addInfo), `Journey ${theme.id}: VietQR addInfo missing wedding note/guest`);
              }
            }
            const copyBtn = page.locator('[data-copy], button.copy, .ptl-copy, .th-copy').first();
            if (await copyBtn.count()) {
              await instantScrollTo(copyBtn);
              const expectedAccNum = await copyBtn.getAttribute('data-copy');
              await copyBtn.click();
              await page.waitForTimeout(200);
              const copyText = (await copyBtn.textContent() || '').trim();
              assert.ok(
                /chép|copy|copied|ok/i.test(copyText) || (expectedAccNum && copyText === expectedAccNum),
                `Journey ${theme.id}: unexpected copy button state "${copyText}"`
              );
            }
          }

          // Invalid RSVP rejected -> valid RSVP submitted
          const rsvp = page.locator('form[data-sh="rsvp"]').first();
          if (await rsvp.count()) {
            const inDialog = await rsvp.evaluate(el => !!el.closest('#sh-quick'));
            if (inDialog) await (await ensureQuickOpenVisible(page)).click();
            await instantScrollTo(rsvp);

            await rsvp.locator('input[name="name"]').fill('');
            await rsvp.locator('[type="submit"]').click();
            await page.waitForTimeout(150);
            assert.equal(await rsvp.evaluate(f => f.checkValidity()), false, `Journey ${theme.id}: empty RSVP must fail validity`);

            await rsvp.locator('input[name="name"]').fill('Khách Quý');
            await rsvp.locator('[type="submit"]').click();
            await page.waitForFunction(
              () => /Cảm ơn/.test(document.querySelector('form[data-sh="rsvp"] .sh-msg')?.textContent || ''),
              null,
              { timeout: 6000 }
            );
            if (inDialog) await page.locator('#sh-quick [data-sh="quick-close"]').first().click().catch(() => {});
          }

          // Wish submit
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
            const wishesEl = page.locator('[data-sh="wishes"]').first();
            if (await wishesEl.count()) {
              const txt = await wishesEl.textContent();
              assert.ok((txt || '').includes('Chúc mừng ngày vui!'), `Journey ${theme.id}: wish missing from [data-sh="wishes"]`);
            }
          }

          tracker.assertClean(`Journey ${theme.id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier4-journey-${theme.id}-${vp.name}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      }
    });
  }

  // Journey: trang bộ sưu tập (máy tính và điện thoại)
  await record('tier4', 'journeys', 'Journey (Desktop + Mobile): / showcase browsing', async () => {
    const session = await createSafeContext(browser, {
      webUrl,
      viewport: { width: 1440, height: 900 },
    });
    try {
      const { page, tracker } = await session.newTrackedPage();
      await page.goto(`${webUrl}/`, { waitUntil: 'load', timeout: 30000 });
      await assertNoHorizontalOverflow(page, '/ desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      await assertNoHorizontalOverflow(page, '/ mobile');
      tracker.assertClean('Journey showcase');
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier4-journey-showcase', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });
}
