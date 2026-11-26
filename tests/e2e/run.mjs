import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from './lib/registries.mjs';
import { resolveOrStartServers } from './lib/servers.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { runTier1Topics } from './specs/tier1-topics.mjs';
import { runTier2Bounds } from './specs/tier2-bounds.mjs';
import { runTier3Combos } from './specs/tier3-combos.mjs';
import { runTier4Journeys } from './specs/tier4-journeys.mjs';

function parseTiers(raw) {
  if (raw === 'all') return new Set(['1', '2', '3', '4']);
  const parts = String(raw || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (!parts.length || parts.some(p => !['1', '2', '3', '4'].includes(p))) {
    throw new Error(`Invalid --tier="${raw}". Expected "all" or comma-separated values from 1,2,3,4.`);
  }
  return new Set(parts);
}

function parseArgs(argv) {
  const opts = {
    mode: 'auto',
    tier: 'all',
    webUrl: process.env.WEB_URL || '',
    shots: '',
    json: '',
  };
  for (const a of argv) {
    if (a.startsWith('--mode=')) opts.mode = a.slice(7);
    else if (a.startsWith('--tier=')) opts.tier = a.slice(7);
    else if (a.startsWith('--web-url=')) opts.webUrl = a.slice(10);
    else if (a === '--shots') opts.shots = join(ROOT, 'test-results', 'e2e', 'shots');
    else if (a.startsWith('--shots=')) opts.shots = a.slice(8);
    else if (a.startsWith('--json=')) opts.json = a.slice(7);
  }
  if (!['auto', 'dev', 'start'].includes(opts.mode)) {
    throw new Error(`Invalid --mode="${opts.mode}". Expected auto, dev, or start.`);
  }
  opts.tiers = parseTiers(opts.tier);
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.shots) mkdirSync(opts.shots, { recursive: true });
const results = [];

async function record(tier, suite, name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - t0;
    results.push({ tier, suite, name, status: 'PASS', detail: '', durationMs });
    console.log(`  PASS  [${tier}/${suite}] ${name} (${durationMs}ms)`);
  } catch (err) {
    const durationMs = Date.now() - t0;
    results.push({ tier, suite, name, status: 'FAIL', detail: err?.stack || err?.message || String(err), durationMs });
    console.error(`  FAIL  [${tier}/${suite}] ${name}\n        ${err?.message || err}`);
  }
}

let servers;
let browser;
try {
  console.log(`Starting SayHello E2E (mode=${opts.mode}, tier=${opts.tier})...`);
  servers = await resolveOrStartServers({
    mode: opts.mode,
    webUrl: opts.webUrl,
  });
  console.log(`Target ready (${servers.mode}): ${servers.webUrl}`);

  browser = await launchBrowser();
  servers.onBeforeStop?.(async () => {
    if (browser) await browser.close().catch(() => {});
  });
  const ctx = {
    browser,
    webUrl: servers.webUrl,
    shotsDir: opts.shots,
    record,
  };

  if (opts.tiers.has('1')) {
    await runTier1Topics(ctx);
  }
  if (opts.tiers.has('2')) {
    await runTier2Bounds(ctx);
  }
  if (opts.tiers.has('3')) {
    await runTier3Combos(ctx);
  }
  if (opts.tiers.has('4')) {
    await runTier4Journeys(ctx);
  }
} finally {
  if (browser) await browser.close().catch(() => {});
  if (servers) await servers.stop().catch(() => {});
}

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;

console.log(`\nSummary: PASS=${passed} FAIL=${failed} TOTAL=${results.length}`);

if (opts.json) {
  mkdirSync(dirname(opts.json), { recursive: true });
  writeFileSync(opts.json, JSON.stringify({ opts: { ...opts, tiers: [...opts.tiers] }, summary: { passed, failed, total: results.length }, results }, null, 2));
}

if (results.length === 0 || failed > 0) {
  process.exit(1);
}
