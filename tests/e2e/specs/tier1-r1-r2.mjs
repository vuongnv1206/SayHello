import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  ROOT,
  R1_FORBIDDEN_TERMS,
  R1_REJECTED_PROTOS,
  RETAINED_V1_THEMES,
  readLegacyThemes,
  readLegacySlugs,
  readWebThemesRegistry,
  listLegacyProtos,
  readAdvisoryDoc,
  collectFiles,
  scanFilesForR1,
} from '../lib/registries.mjs';
import { createSafeContext, saveFailureShot } from '../lib/browser.mjs';

export async function runTier1R1R2({ browser, legacyUrl, webUrl, shotsDir, record }) {
  // 1. Static R1 scan across active runtime, config, registries, and non-historical docs
  await record('tier1', 'r1-r2', 'R1 static scan across active code, registries & docs checklists', async () => {
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
      join(ROOT, 'docs', 'TAO-MAU-MOI.md'),
      join(ROOT, 'docs', 'TASKS.md'),
    ];
    for (const slug of readLegacySlugs()) {
      activeTargets.push(join(ROOT, 'legacy', slug));
    }
    const files = collectFiles(activeTargets);
    const hits = scanFilesForR1(files);
    assert.equal(hits.length, 0, `R1 forbidden term(s) found in active files: ${JSON.stringify(hits.slice(0, 10))}`);
  });

  // 2. Registry consistency: exact 10 retained v1 themes & slugs, 0 forbidden
  await record('tier1', 'r1-r2', 'R1 active registries (legacy/themes/index.json, slugs.json, web themes.ts)', async () => {
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

  // 3. Rejected prototype files in legacy/proto/
  await record('tier1', 'r1-r2', 'R1 rejected prototypes absent from legacy/proto/', async () => {
    const present = listLegacyProtos();
    const leftover = R1_REJECTED_PROTOS.filter(p => present.includes(p));
    if (leftover.length) {
      const err = new Error(`Rejected prototypes still present in legacy/proto/: ${leftover.join(', ')}`);
      err.pendingMilestone = 'M1: remove rejected prototypes from legacy/proto/';
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

  // 6. R2 Advisory Document (docs/THAM-MUU-THIET-KE.md) 4-pillar completeness
  await record('tier1', 'r1-r2', 'R2 docs/THAM-MUU-THIET-KE.md covers all 4 advisory pillars', async () => {
    const doc = readAdvisoryDoc();
    if (!doc) {
      const err = new Error('docs/THAM-MUU-THIET-KE.md does not exist yet');
      err.pendingMilestone = 'M1: R2 advisory doc docs/THAM-MUU-THIET-KE.md';
      throw err;
    }
    assert.ok(doc.text.length >= 3000, `Advisory doc too short (${doc.text.length} chars)`);

    // Pillar 1: motionsites.ai, Anthropic skills, BRIEF-3D, template repetition diagnosis
    assert.match(doc.text, /motionsites\.ai/i, 'Missing reference to motionsites.ai');
    assert.match(doc.text, /frontend-design|codebase-design|Anthropic/i, 'Missing Anthropic design skill synthesis');
    assert.match(doc.text, /BRIEF-3D/i, 'Missing BRIEF-3D synthesis');
    assert.match(doc.text, /520px/i, 'Missing diagnosis of 520px collapse');
    assert.match(doc.text, /khuôn mẫu|data-rv/i, 'Missing template repetition diagnosis');

    // Pillar 2: all 10 retained v1 topics
    for (const id of RETAINED_V1_THEMES) {
      assert.ok(doc.text.includes(id), `Advisory doc missing upgrade plan for v1 topic "${id}"`);
    }

    // Pillar 3: new photo-first v2 topics
    for (const id of ['to-hong', 'phong-trien-lam', 'bau-troi-anh', 'ho-guong']) {
      assert.ok(doc.text.includes(id), `Advisory doc missing new topic "${id}"`);
    }

    // Pillar 4: layout, motion, typography >=13px, color palettes, rubric
    assert.match(doc.text, /13px/i, 'Missing >=13px Vietnamese typography requirement');
    assert.match(doc.text, /vietnamese/i, 'Missing vietnamese font subset requirement');
    assert.match(doc.text, /Rubric|Agent-as-Judge/i, 'Missing Agent-as-Judge rubric');
    assert.match(doc.text, /#sh-quick|Thông tin nhanh/i, 'Missing #sh-quick accessibility guidance');
  });
}
