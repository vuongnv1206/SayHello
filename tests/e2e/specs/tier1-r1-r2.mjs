import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  R1_FORBIDDEN_TERMS,
  R1_REJECTED_PROTOS,
  LEGACY_JUNK_FILES,
  RETAINED_V1_THEMES,
  readLegacyThemes,
  readLegacySlugs,
  readWebThemesRegistry,
  listLegacyProtos,
  listActiveDocs,
  checkM3Docs,
  collectFiles,
  scanFilesForR1,
} from '../lib/registries.mjs';
import { createSafeContext, saveFailureShot } from '../lib/browser.mjs';

export async function runTier1R1R2({ browser, legacyUrl, webUrl, shotsDir, record }) {
  // 1. Static R1 scan across active runtime, config, registries, and active docs/*.md (excluding docs/archive/)
  await record('tier1', 'r1-r2', 'R1 static scan across active code, registries & docs/*.md', async () => {
    const activeTargets = [
      join(ROOT, 'legacy', 'index.html'),
      join(ROOT, 'legacy', 'slugs.json'),
      join(ROOT, 'legacy', 'shop.json'),
      join(ROOT, 'legacy', 'core'),
      join(ROOT, 'legacy', 'themes'),
      join(ROOT, 'legacy', 'dat-thiep'),
      join(ROOT, 'legacy', 'studio'),
      join(ROOT, 'legacy', 'ban-hang'),
      join(ROOT, 'legacy', 'proto'),
      join(ROOT, 'packages'),
      join(ROOT, 'apps', 'web', 'src'),
      ...listActiveDocs(),
    ];
    for (const rootDoc of ['README.md', 'CLAUDE.md']) {
      const full = join(ROOT, rootDoc);
      if (existsSync(full)) activeTargets.push(full);
    }
    for (const slug of readLegacySlugs()) {
      activeTargets.push(join(ROOT, 'legacy', slug));
    }
    const files = collectFiles(activeTargets);
    const hits = scanFilesForR1(files);
    const m3Ready = checkM3Docs().ready;
    const codeHits = hits.filter(h => !h.file.startsWith('docs/'));
    const docHits = hits.filter(h => h.file.startsWith('docs/'));
    assert.equal(codeHits.length, 0, `R1 forbidden term(s) found in active code/config: ${JSON.stringify(codeHits.slice(0, 10))}`);
    if (docHits.length > 0) {
      if (!m3Ready) {
        const err = new Error(`Unarchived legacy docs still mention removed R1 themes: ${JSON.stringify(docHits.slice(0, 5))}`);
        err.pendingMilestone = 'M3: archive historical docs (PROGRESS.md, PROPOSAL.md, REDESIGN.md) to docs/archive/';
        throw err;
      }
      assert.equal(docHits.length, 0, `R1 forbidden term(s) found in active docs/*.md: ${JSON.stringify(docHits.slice(0, 10))}`);
    }
  });

  // 2. Registry consistency: exact 10 retained v1 themes & slugs, 0 forbidden
  await record('tier1', 'r1-r2', 'R1 active registries (legacy/themes/index.json, slugs.json, web themes)', async () => {
    const legacyThemes = readLegacyThemes();
    const themeIds = legacyThemes.map(t => t.id);
    assert.deepEqual([...themeIds].sort(), [...RETAINED_V1_THEMES].sort(), `Expected 10 retained v1 themes, got ${themeIds.join(', ')}`);

    const slugs = readLegacySlugs();
    const expectedSlugs = RETAINED_V1_THEMES.map(id => `demo-${id}`);
    assert.deepEqual([...slugs].sort(), [...expectedSlugs].sort(), `Unexpected slugs: ${slugs.join(', ')}`);

    const webReg = readWebThemesRegistry();
    for (const id of webReg.registeredIds) {
      assert.ok(!/kintsugi|kinh-van|gom-ghep/i.test(id), `Forbidden v2 theme registered: ${id}`);
    }
  });

  // 3. Rejected prototype files & stale junk cleanup (M1 F1)
  await record('tier1', 'r1-r2', 'M1 cleanup: rejected prototypes & stale junk files removed', async () => {
    const present = listLegacyProtos();
    const leftoverProtos = R1_REJECTED_PROTOS.filter(p => present.includes(p));
    const leftoverJunk = LEGACY_JUNK_FILES.filter(rel => existsSync(join(ROOT, rel)));
    const allLeftover = [...leftoverProtos.map(p => `legacy/proto/${p}`), ...leftoverJunk];
    if (allLeftover.length) {
      const err = new Error(`Stale prototypes/junk still present: ${allLeftover.join(', ')}`);
      err.pendingMilestone = 'M1: remove rejected prototypes and stale junk files';
      throw err;
    }
  });

  // 4. HTTP 404 on deleted theme routes (both v1 & v2)
  await record('tier1', 'r1-r2', 'R1 deleted theme routes return HTTP 404', async () => {
    const routes = [
      `${legacyUrl}/demo-kintsugi/`,
      `${legacyUrl}/demo-kinh-van-hoa/`,
      `${legacyUrl}/demo-gom-ghep/`,
      `${webUrl}/v2/demo/kintsugi/`,
      `${webUrl}/v2/demo/kinh-van-hoa/`,
      `${webUrl}/v2/demo/gom-ghep/`,
    ];
    for (const url of routes) {
      const res = await fetch(url, { redirect: 'follow' });
      assert.equal(res.status, 404, `Expected 404 at ${url}, got ${res.status}`);
    }
  });

  // 5. Rendered UI scan on /, /dat-thiep/, /studio/, /v2/
  await record('tier1', 'r1-r2', 'R1 rendered UI pages contain 0 forbidden theme names or links', async () => {
    const session = await createSafeContext(browser, { legacyUrl, webUrl, viewport: { width: 1280, height: 800 } });
    try {
      const targets = [
        { url: `${webUrl}/`, waitFor: '#themes .card' },
        { url: `${webUrl}/dat-thiep/`, waitFor: '#themes input' },
        { url: `${legacyUrl}/studio/?thiep=demo-song-hy&ma=thu`, waitFor: '#form .theme-card' },
        { url: `${webUrl}/v2/`, waitFor: 'main, body' },
      ];
      for (const { url, waitFor } of targets) {
        const { page, tracker } = await session.newTrackedPage();
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await page.locator(waitFor).first().waitFor({ state: 'attached', timeout: 10000 });
        const dump = await page.evaluate(() => ({
          text: document.body?.innerText || '',
          hrefs: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href') || '').join(' '),
        }));
        for (const { label, regex } of R1_FORBIDDEN_TERMS) {
          assert.ok(!regex.test(dump.text), `${url} rendered text contains R1 forbidden term "${label}"`);
          assert.ok(!regex.test(dump.hrefs), `${url} links contain R1 forbidden term "${label}"`);
        }
        tracker.assertClean(url);
        await page.close();
      }
    } catch (err) {
      await saveFailureShot(session.ctx, shotsDir, 'tier1-r1-ui', err);
      throw err;
    } finally {
      await session.ctx.close();
    }
  });

  // 6. M3 Multi-angle assessment, templates/topics blueprint, architecture & Claude handoff docs
  await record('tier1', 'r1-r2', 'M3 docs/*.md synchronized (ASSESSMENT-AND-RESTRUCTURING-PLAN, TEMPLATES-AND-TOPICS, ARCHITECTURE, CLAUDE-HANDOFF)', async () => {
    const check = checkM3Docs();
    if (check.pendingMilestone) {
      const err = new Error(check.message);
      err.pendingMilestone = check.pendingMilestone;
      throw err;
    }
    assert.ok(check.ready, `M3 documentation check failed: ${check.message}`);
  });
}
