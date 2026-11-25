import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ROOT,
  TARGET_V2_THEMES,
  readLegacyThemes,
  readLegacyInvite,
  readWebThemesRegistry,
  readV2ThemeEntry,
} from '../lib/registries.mjs';
import { createSafeContext, openV1Gate, openV2Gate, saveShot, saveFailureShot } from '../lib/browser.mjs';
import {
  scrollFullPage,
  assertNoHorizontalOverflow,
  findSmallVietnameseText,
  assertVisibleClickableCta,
  measureDesktopLayoutFingerprint,
} from '../lib/assertions.mjs';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

export async function runTier2Bounds({ browser, legacyUrl, webUrl, shotsDir, record }) {
  const legacyThemes = readLegacyThemes();
  const webReg = readWebThemesRegistry();
  const { renderDocument } = await import(pathToFileURL(join(ROOT, 'packages', 'engine', 'src', 'render.js')).href);
  const v1Fingerprints = {};
  const v2Fingerprints = {};

  // 1. Desktop (1440x900) & Mobile (390x844) overflow, CTA, Vietnamese >= 13px, and Desktop layout fingerprint
  for (const t of legacyThemes) {
    for (const vp of VIEWPORTS) {
      await record('tier2', 'viewport-bounds', `v1 ${t.id} (${vp.name} ${vp.width}x${vp.height}): overflow, CTA, typography`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${legacyUrl}/${t.demo}/?k=Kh%C3%A1ch+Th%E1%BB%AD`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 12000 });

          await assertVisibleClickableCta(page, '#cover [data-open]', { minWidth: 36, minHeight: 32, label: `v1 ${t.id} ${vp.name} gate CTA` });
          await openV1Gate(page);
          await scrollFullPage(page);

          // Hard fail on horizontal overflow at any time
          await assertNoHorizontalOverflow(page, `v1 ${t.id} ${vp.name}`);
          await saveShot(page, shotsDir, `tier2-${vp.name}-v1-${t.id}`);

          const rsvpBtn = page.locator('form[data-w="rsvp"] [type="submit"]').first();
          if (await rsvpBtn.count()) {
            await assertVisibleClickableCta(page, 'form[data-w="rsvp"] [type="submit"]', { label: `v1 ${t.id} ${vp.name} RSVP submit` });
          }

          if (vp.name === 'desktop') {
            v1Fingerprints[t.id] = await measureDesktopLayoutFingerprint(page);
          }

          const smallText = await findSmallVietnameseText(page, 13);
          const microscopic = smallText.filter(x => x.fontSize < 6);
          assert.equal(microscopic.length, 0, `v1 ${t.id} ${vp.name} microscopic text (<6px): ${JSON.stringify(microscopic)}`);
          if (smallText.length > 0) {
            const err = new Error(`v1 ${t.id} ${vp.name} has ${smallText.length} Vietnamese text element(s) < 13px (e.g. ${JSON.stringify(smallText.slice(0, 3))})`);
            err.pendingMilestone = 'M1/M2/M3: raise legacy base.css & theme labels to >= 13px';
            throw err;
          }

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

  for (const id of TARGET_V2_THEMES) {
    if (!webReg.registeredIds.includes(id)) {
      await record('tier2', 'viewport-bounds', `v2 ${id} desktop/mobile bounds`, async () => {
        const err = new Error(`v2 theme "${id}" not yet registered`);
        err.pendingMilestone = `M4/M5/M6: implement v2 theme "${id}"`;
        throw err;
      });
      continue;
    }

    for (const vp of VIEWPORTS) {
      await record('tier2', 'viewport-bounds', `v2 ${id} (${vp.name} ${vp.width}x${vp.height}): overflow, CTA, typography`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.hasTouch,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${id}/?k=Kh%C3%A1ch+Th%E1%BB%AD`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });

          const gateSel = (await page.locator('.sh-gate [data-open]').count()) > 0
            ? '.sh-gate [data-open]'
            : '.sh-gate button, .sh-gate [role="button"], .sh-gate [data-open], .sh-gate .lever';
          await assertVisibleClickableCta(page, gateSel, { label: `v2 ${id} ${vp.name} gate CTA` });
          await openV2Gate(page);
          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `v2 ${id} ${vp.name}`);
          await saveShot(page, shotsDir, `tier2-${vp.name}-v2-${id}`);

          const sceneRsvpBtn = page.locator('.sh-scene form[data-sh="rsvp"] [type="submit"]').first();
          if (await sceneRsvpBtn.count()) {
            await assertVisibleClickableCta(page, '.sh-scene form[data-sh="rsvp"] [type="submit"]', { label: `v2 ${id} ${vp.name} RSVP submit` });
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(100);
          await assertVisibleClickableCta(page, '[data-sh="quick-open"]', { label: `v2 ${id} ${vp.name} Quick Info button` });

          if (vp.name === 'desktop') {
            v2Fingerprints[id] = await measureDesktopLayoutFingerprint(page);
          }

          const smallText = await findSmallVietnameseText(page, 13);
          const microscopic = smallText.filter(x => x.fontSize < 6);
          assert.equal(microscopic.length, 0, `v2 ${id} ${vp.name} microscopic text (<6px): ${JSON.stringify(microscopic)}`);
          if (smallText.length > 0) {
            const err = new Error(`v2 ${id} ${vp.name} has ${smallText.length} Vietnamese text element(s) < 13px (e.g. ${JSON.stringify(smallText.slice(0, 3))})`);
            err.pendingMilestone = `M3/M4/M5: raise v2 ${id} labels to >= 13px`;
            throw err;
          }

          tracker.assertClean(`v2 ${id} ${vp.name}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-${vp.name}-v2-${id}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  // 2. Desktop 1440x900 Layout Distinctiveness Cohort Check
  await record('tier2', 'layout-uniqueness', 'Desktop 1440x900 layout distinctiveness (break 520px collapse)', async () => {
    const v1Entries = Object.entries(v1Fingerprints);
    assert.ok(v1Entries.length === legacyThemes.length, 'Missing v1 desktop fingerprints');
    const collapsedV1 = v1Entries.filter(([, f]) => f.contentSpan <= 540 && !f.hasFullBleedStage);
    const v1Buckets = new Set(v1Entries.map(([, f]) => f.bucket));

    if (collapsedV1.length > 0) {
      const err = new Error(
        `${collapsedV1.length}/${v1Entries.length} v1 themes still collapse to <=540px on 1440x900: ${collapsedV1.map(([k]) => k).join(', ')}`
      );
      err.pendingMilestone = 'M2/M3: upgrade v1 themes beyond 520px desktop column collapse';
      throw err;
    }
    assert.ok(v1Buckets.size >= 3, `Expected >= 3 distinct desktop layout buckets across v1 themes, got ${[...v1Buckets].join(', ')}`);

    const v2Entries = Object.entries(v2Fingerprints);
    if (v2Entries.length < TARGET_V2_THEMES.length) {
      const err = new Error(`Only ${v2Entries.length}/${TARGET_V2_THEMES.length} v2 themes implemented for cohort uniqueness`);
      err.pendingMilestone = 'M4/M5/M6: implement all 5 v2 themes';
      throw err;
    }
    const collapsedV2 = v2Entries.filter(([, f]) => f.contentSpan <= 540 && !f.hasFullBleedStage);
    assert.equal(collapsedV2.length, 0, `v2 themes collapsing <=540px: ${collapsedV2.map(([k]) => k).join(', ')}`);
    const v2Buckets = new Set(v2Entries.map(([, f]) => `${f.dataLayout}:${f.bucket}`));
    assert.ok(v2Buckets.size >= 2, `Expected >= 2 distinct v2 layout archetypes, got ${[...v2Buckets].join(', ')}`);
  });

  // 3. v2 Motion Tiers (?tier=cinematic|standard|lite) & prefers-reduced-motion: reduce + webglcontextlost
  for (const id of TARGET_V2_THEMES) {
    if (!webReg.registeredIds.includes(id)) {
      await record('tier2', 'motion-tiers', `v2 ${id} motion tiers & reducedMotion`, async () => {
        const err = new Error(`v2 theme "${id}" not yet registered`);
        err.pendingMilestone = `M4/M5/M6: implement v2 theme "${id}"`;
        throw err;
      });
      continue;
    }

    const cases = [
      { label: 'tier=cinematic', query: '?tier=cinematic', reducedMotion: 'no-preference', expected: 'cinematic', testContextLoss: true },
      { label: 'tier=standard', query: '?tier=standard', reducedMotion: 'no-preference', expected: 'standard', testContextLoss: false },
      { label: 'tier=lite', query: '?tier=lite', reducedMotion: 'no-preference', expected: 'lite', testContextLoss: false },
      { label: 'prefers-reduced-motion: reduce', query: '', reducedMotion: 'reduce', expected: 'lite', testContextLoss: false },
    ];

    for (const c of cases) {
      await record('tier2', 'motion-tiers', `v2 ${id} (${c.label}) -> data-motion="${c.expected}"`, async () => {
        const session = await createSafeContext(browser, {
          legacyUrl,
          webUrl,
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          reducedMotion: c.reducedMotion,
        });
        try {
          const { page, tracker } = await session.newTrackedPage();
          await page.goto(`${webUrl}/v2/demo/${id}/${c.query}`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
          const actual = await page.getAttribute('html', 'data-motion');
          assert.equal(actual, c.expected, `Expected html[data-motion="${c.expected}"], got "${actual}"`);

          await openV2Gate(page);
          await scrollFullPage(page);
          await assertNoHorizontalOverflow(page, `v2 ${id} ${c.label}`);

          if (c.reducedMotion === 'reduce') {
            const lowOpacityHeadings = await page.evaluate(() => {
              const bad = [];
              for (const el of document.querySelectorAll('.sh-scene h1, .sh-scene h2, .sh-scene h3')) {
                let hidden = false;
                for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
                  if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true') {
                    hidden = true;
                    break;
                  }
                  const csCur = getComputedStyle(cur);
                  if (csCur.display === 'none' || csCur.visibility === 'hidden') {
                    hidden = true;
                    break;
                  }
                }
                if (hidden) continue;
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) continue;
                const op = parseFloat(getComputedStyle(el).opacity);
                if (Number.isFinite(op) && op <= 0.5) {
                  bad.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 40), opacity: op });
                }
              }
              return bad;
            });
            assert.equal(
              lowOpacityHeadings.length,
              0,
              `v2 ${id} reducedMotion: headings stuck at low opacity: ${JSON.stringify(lowOpacityHeadings)}`
            );
          }

          if (c.testContextLoss) {
            const hasCanvas = await page.locator('canvas').count();
            if (hasCanvas > 0) {
              const wasCanceled = await page.evaluate(() => {
                const cv = document.querySelector('canvas');
                if (!cv) return false;
                const ev = new Event('webglcontextlost', { cancelable: true });
                cv.dispatchEvent(ev);
                return ev.defaultPrevented;
              });
              await page.waitForTimeout(300);
              const layout = await page.getAttribute('html', 'data-layout');
              const motionAfter = await page.getAttribute('html', 'data-motion');
              const motionWhy = await page.getAttribute('html', 'data-motion-why');
              if (layout === 'stage' && (wasCanceled || motionWhy)) {
                assert.equal(
                  motionAfter,
                  'lite',
                  `v2 ${id}: expected stage theme to downgrade html[data-motion] to "lite" after webglcontextlost, got "${motionAfter}"`
                );
              }
            }
          }

          // Verify scenes are readable and Quick Info is accessible (runs AFTER webglcontextlost when testing context loss)
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
          await page.waitForTimeout(350);
          await page.locator('[data-sh="quick-open"]').first().click();
          await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
          await page.locator('#sh-quick').evaluate(el => { el.scrollTop = 0; });
          await page.locator('#sh-quick [data-sh="quick-close"]').first().click();
          await page.locator('#sh-quick').waitFor({ state: 'hidden', timeout: 3000 });

          tracker.assertClean(`v2 ${id} ${c.label}`);
        } catch (err) {
          await saveFailureShot(session.ctx, shotsDir, `tier2-motion-${id}-${c.label}`, err);
          throw err;
        } finally {
          await session.ctx.close();
        }
      });
    }
  }

  // 4. Guest group filtering (?n=nha-gai & ?n=khong-co) on v1 and v2
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
      await page.goto(`${legacyUrl}/demo-song-hy/?n=nha-gai&open=1`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 10000 });
      const noteText = await page.locator('.group-note').textContent();
      assert.match(noteText || '', /họ nhà gái.*Xe đón lúc 7:00/);
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (inv.events?.[0]?.address && inv.events?.[1]?.address && inv.events[0].address !== inv.events[1].address) {
        assert.ok(bodyText.includes(inv.events[0].address), 'Missing group event 0 address');
        assert.ok(!bodyText.includes(inv.events[1].address), 'Non-group event 1 should be hidden');
      }

      await page.goto(`${legacyUrl}/demo-song-hy/?n=khong-co&open=1`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => document.body.classList.contains('opened'), null, { timeout: 10000 });
      assert.equal(await page.locator('.group-note').count(), 0, 'Unknown ?n=khong-co must not render .group-note');
      tracker.assertClean('v1 guest groups');
    } finally {
      await session.ctx.close();
    }
  });

  for (const id of webReg.registeredIds) {
    await record('tier2', 'guest-groups', `v2 ${id} ?n=nha-gai filters events & ?n=khong-co keeps all`, async () => {
      const entry = readV2ThemeEntry(id);
      assert.ok(entry, `Missing packages/themes/${id}`);
      const hasNhaGai = entry.demo?.guestGroups?.some(g => g.id === 'nha-gai');

      const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
      try {
        const { page, tracker } = await session.newTrackedPage();
        let baseRouteUrl = `${webUrl}/v2/demo/${id}/`;
        let demoEventsCount = (entry.demo?.events || []).length;

        if (!hasNhaGai) {
          const themeMod = (await import(pathToFileURL(entry.themeJs).href)).default;
          const baseEvents = Array.isArray(entry.demo?.events) ? [...entry.demo.events] : [];
          if (baseEvents.length < 2) {
            baseEvents.push({
              title: 'Tiệc Cưới Nhà Trai',
              date: entry.demo?.date || '2027-11-20T18:00:00+07:00',
              venue: 'Trung tâm tiệc cưới',
              address: 'Hà Nội',
            });
          }
          demoEventsCount = baseEvents.length;
          const injectedDemo = {
            ...entry.demo,
            events: baseEvents,
            guestGroups: [
              ...(entry.demo?.guestGroups || []),
              {
                id: 'nha-gai',
                label: 'Họ nhà gái',
                greeting: 'Trân trọng kính mời họ nhà gái',
                events: [0],
                note: 'Xe đón họ nhà gái xuất phát lúc 7:00',
              },
            ],
          };
          const assetBase = webReg.entries?.[id]?.assetBase || `/demo-${id}/`;
          const htmlStr = renderDocument(themeMod, injectedDemo, {
            engineUrl: '/_e/engine/',
            themeUrl: `/_e/themes/${id}/`,
            assetBase,
          });
          baseRouteUrl = `${webUrl}/__e2e_group_${id}/`;
          await session.ctx.route(`${baseRouteUrl}*`, route =>
            route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlStr })
          );
        }

        await page.goto(`${baseRouteUrl}?n=nha-gai&open=1`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        const noteHidden = await page.$eval('[data-sh="group-note"]', el => el.hidden);
        assert.equal(noteHidden, false, `v2 ${id}: [data-sh="group-note"] should be visible for ?n=nha-gai`);
        if (demoEventsCount >= 2) {
          const hiddenQuickEvents = await page.$$eval('#sh-quick [data-ev]', els => els.filter(e => e.hidden).length);
          assert.ok(hiddenQuickEvents >= 1, `v2 ${id}: expected non-group [data-ev] to be hidden`);
        }

        await page.goto(`${baseRouteUrl}?n=khong-co&open=1`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        assert.equal(await page.$eval('[data-sh="group-note"]', el => el.hidden), true, `v2 ${id}: group-note should stay hidden for ?n=khong-co`);
        assert.equal(await page.$$eval('#sh-quick [data-ev][hidden]', els => els.length), 0, `v2 ${id}: ?n=khong-co must not hide any events`);
        tracker.assertClean(`v2 ${id} guest groups`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-groups-${id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }

  // 5. Missing optional fields (story: [], accounts: []) on v1 and v2
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

  // v2 missing optional fields via renderDocument + Playwright route on webUrl origin
  for (const id of webReg.registeredIds) {
    await record('tier2', 'optional-fields', `v2 ${id} renders cleanly with empty story & accounts`, async () => {
      const entry = readV2ThemeEntry(id);
      assert.ok(entry, `Missing packages/themes/${id}`);
      const themeMod = (await import(pathToFileURL(entry.themeJs).href)).default;
      const strippedDemo = { ...entry.demo, story: [], accounts: [] };
      const assetBase = webReg.entries?.[id]?.assetBase || `/demo-${id}/`;
      const htmlStr = renderDocument(themeMod, strippedDemo, {
        engineUrl: '/_e/engine/',
        themeUrl: `/_e/themes/${id}/`,
        assetBase,
      });

      const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 390, height: 844 } });
      try {
        const testUrl = `${webUrl}/__e2e_stripped_${id}/`;
        await session.ctx.route(testUrl, route =>
          route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlStr })
        );
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(testUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => document.documentElement.classList.contains('sh-ready'), null, { timeout: 15000 });
        await openV2Gate(page);
        await scrollFullPage(page);
        await assertNoHorizontalOverflow(page, `v2 ${id} stripped`);

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
          await page.locator('[data-w="gift"], .accounts, .gift-accounts, .ptl-accs').count(),
          0,
          'Optional gift section should omit when accounts=[]'
        );

        const bodyText = await page.evaluate(() => document.body?.innerText || '');
        const sampleStoryTitle = entry.demo?.story?.[0]?.title;
        if (sampleStoryTitle) {
          assert.ok(!bodyText.includes(sampleStoryTitle), `v2 ${id}: story item "${sampleStoryTitle}" still rendered when story=[]`);
        }
        const sampleAccountNum = entry.demo?.accounts?.[0]?.number;
        if (sampleAccountNum) {
          assert.ok(!bodyText.includes(sampleAccountNum), `v2 ${id}: account number "${sampleAccountNum}" still rendered when accounts=[]`);
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(100);
        await page.locator('[data-sh="quick-open"]').first().click();
        await page.locator('#sh-quick').waitFor({ state: 'visible', timeout: 3000 });
        tracker.assertClean(`v2 ${id} stripped story/accounts`);
      } catch (err) {
        await saveFailureShot(session.ctx, shotsDir, `tier2-optional-v2-${id}`, err);
        throw err;
      } finally {
        await session.ctx.close();
      }
    });
  }
}
