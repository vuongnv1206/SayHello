import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));

export const R1_FORBIDDEN_TERMS = [
  { label: 'Gốm Ghép Vàng', regex: /Gốm\s+Ghép\s+Vàng/i },
  { label: 'kintsugi', regex: /\bkintsugi\b/i },
  { label: 'gom-ghep', regex: /\bgom-ghep\b/i },
  { label: 'Kính Vạn Hoa', regex: /Kính\s+Vạn\s+Hoa/i },
  { label: 'kinh-van-hoa', regex: /\bkinh-van-hoa\b/i },
];

export const R1_REJECTED_PROTOS = [
  'chu-la-hinh.html',
  'hai-bo.html',
  'hai-vong-lich.html',
];

export const LEGACY_JUNK_FILES = [
  'legacy/proto/to-hong.html',
  'apps/web/README.md',
];

export const RETAINED_V1_THEMES = [
  'song-hy',
  'thu-tay',
  've-may-bay',
  'khoa-tinh',
  'den-long',
  'cuon-phim',
  'tin-nhan',
  'thiep-gap',
  'khung-theu',
  'ca-phe-phin',
];

export function readLegacyThemes() {
  const file = join(ROOT, 'legacy', 'themes', 'index.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function readLegacySlugs() {
  const file = join(ROOT, 'legacy', 'slugs.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function readShopConfig() {
  const file = join(ROOT, 'legacy', 'shop.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function readLegacyInvite(slug) {
  const file = join(ROOT, 'legacy', slug, 'invite.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function listLegacyProtos() {
  const dir = join(ROOT, 'legacy', 'proto');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.html'));
}

function skipComment(src, i) {
  const ch = src[i];
  if (ch === '/' && src[i + 1] === '/') {
    const nl = src.indexOf('\n', i + 2);
    return nl === -1 ? src.length : nl + 1;
  }
  if (ch === '/' && src[i + 1] === '*') {
    const end = src.indexOf('*/', i + 2);
    return end === -1 ? src.length : end + 2;
  }
  return i;
}

function skipCommentOrString(src, i) {
  const afterComment = skipComment(src, i);
  if (afterComment !== i) return afterComment;
  const ch = src[i];
  if (ch === '"' || ch === "'" || ch === '`') {
    let j = i + 1;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === ch) return j + 1;
      j++;
    }
    return src.length;
  }
  return i;
}

function findMatchingBrace(src, openIdx) {
  let depth = 0;
  let i = openIdx;
  while (i < src.length) {
    const next = skipCommentOrString(src, i);
    if (next !== i) { i = next; continue; }
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

export function parseThemesObject(src) {
  const registeredIds = [];
  const entries = {};
  const declMatch = /export\s+const\s+THEMES\b/.exec(src);
  if (!declMatch) return { registeredIds, entries };

  let i = declMatch.index + declMatch[0].length;
  let b = 0, p = 0, k = 0;
  let assignIdx = -1;
  while (i < src.length) {
    const next = skipCommentOrString(src, i);
    if (next !== i) { i = next; continue; }
    const ch = src[i];
    if (ch === '{') b++;
    else if (ch === '}') b = Math.max(0, b - 1);
    else if (ch === '(') p++;
    else if (ch === ')') p = Math.max(0, p - 1);
    else if (ch === '[') k++;
    else if (ch === ']') k = Math.max(0, k - 1);
    else if (ch === '=' && b === 0 && p === 0 && k === 0 && src[i + 1] !== '>' && src[i + 1] !== '=' && src[i - 1] !== '=') {
      assignIdx = i;
      break;
    }
    i++;
  }
  if (assignIdx === -1) return { registeredIds, entries };

  i = assignIdx + 1;
  while (i < src.length) {
    const next = skipComment(src, i);
    if (next !== i) { i = next; continue; }
    if (!/\s/.test(src[i])) break;
    i++;
  }
  if (src[i] !== '{') return { registeredIds, entries };
  const closeIdx = findMatchingBrace(src, i);
  if (closeIdx === -1) return { registeredIds, entries };

  i++;
  while (i < closeIdx) {
    const next = skipComment(src, i);
    if (next !== i) { i = next; continue; }
    const ch = src[i];
    if (/\s|,/.test(ch)) { i++; continue; }

    let key = '';
    if (ch === '"' || ch === "'") {
      const endQ = skipCommentOrString(src, i);
      key = endQ > i + 1 && src[endQ - 1] === ch ? src.slice(i + 1, endQ - 1) : '';
      i = endQ;
    } else if (/[a-zA-Z0-9_-]/.test(ch)) {
      let j = i;
      while (j < closeIdx && /[a-zA-Z0-9_-]/.test(src[j])) j++;
      key = src.slice(i, j);
      i = j;
    } else {
      i++;
      continue;
    }

    while (i < closeIdx) {
      const n2 = skipComment(src, i);
      if (n2 !== i) { i = n2; continue; }
      if (!/\s/.test(src[i])) break;
      i++;
    }
    if (src[i] !== ':') continue;
    i++;
    while (i < closeIdx) {
      const n2 = skipComment(src, i);
      if (n2 !== i) { i = n2; continue; }
      if (!/\s/.test(src[i])) break;
      i++;
    }

    if (src[i] === '{') {
      const valEnd = findMatchingBrace(src, i);
      if (valEnd === -1) break;
      const entryText = src.slice(i, valEnd + 1);
      if (key) {
        if (!registeredIds.includes(key)) registeredIds.push(key);
        const ab = entryText.match(/\bassetBase\s*:\s*(["'])([^"']*)\1/);
        entries[key] = { assetBase: ab ? ab[2] : '' };
      }
      i = valEnd + 1;
    } else {
      let depthP = 0, depthB = 0;
      while (i < closeIdx) {
        const n2 = skipCommentOrString(src, i);
        if (n2 !== i) { i = n2; continue; }
        const vc = src[i];
        if (vc === '{') {
          const endB = findMatchingBrace(src, i);
          if (endB === -1) break;
          i = endB + 1;
          continue;
        }
        if (vc === '(') depthP++;
        else if (vc === ')') depthP = Math.max(0, depthP - 1);
        else if (vc === '[') depthB++;
        else if (vc === ']') depthB = Math.max(0, depthB - 1);
        else if (vc === ',' && depthP === 0 && depthB === 0) break;
        i++;
      }
    }
  }

  return { registeredIds, entries };
}

export function extractManifestThemes(data) {
  const ids = [];
  const entries = {};
  if (!data || typeof data !== 'object') return { ids, entries };

  const addEntry = (id, val) => {
    if (!id || typeof id !== 'string') return;
    if (!ids.includes(id)) ids.push(id);
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      entries[id] = { ...(entries[id] || {}), ...val, id };
    } else if (!entries[id]) {
      entries[id] = { id };
    }
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') addEntry(item, null);
      else if (item && typeof item === 'object' && typeof item.id === 'string') addEntry(item.id, item);
    }
    return { ids, entries };
  }

  if (Array.isArray(data.themes)) {
    for (const item of data.themes) {
      if (typeof item === 'string') addEntry(item, null);
      else if (item && typeof item === 'object' && typeof item.id === 'string') addEntry(item.id, item);
    }
    return { ids, entries };
  }

  if (data.themes && typeof data.themes === 'object' && !Array.isArray(data.themes)) {
    for (const [key, val] of Object.entries(data.themes)) {
      const id = (val && typeof val === 'object' && typeof val.id === 'string' && val.id) ? val.id : key;
      addEntry(id, val);
    }
    return { ids, entries };
  }

  const META_KEYS = new Set(['version', 'themes', 'generatedAt', 'schema', 'schemaVersion', 'updatedAt']);
  for (const [key, val] of Object.entries(data)) {
    if (META_KEYS.has(key) && (!val || typeof val !== 'object' || Array.isArray(val))) continue;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const id = (typeof val.id === 'string' && val.id) ? val.id : key;
      addEntry(id, val);
    }
  }
  return { ids, entries };
}

export function readGeneratedManifestIds(manifestPaths) {
  const candidates = manifestPaths || [
    join(ROOT, 'apps', 'web', 'public', '_e', 'manifest.json'),
    join(ROOT, 'apps', 'web', 'src', 'lib', 'themes-manifest.json'),
    join(ROOT, 'apps', 'web', 'src', 'lib', 'manifest.json'),
    join(ROOT, 'packages', 'themes', 'manifest.json'),
  ];
  const ids = [];
  const entries = {};
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      const parsed = extractManifestThemes(data);
      for (const id of parsed.ids) {
        if (!ids.includes(id)) ids.push(id);
        entries[id] = { ...(entries[id] || {}), ...(parsed.entries[id] || {}) };
      }
    } catch {}
  }
  return { ids, entries };
}

export function readWebThemesRegistry() {
  const file = join(ROOT, 'apps', 'web', 'src', 'lib', 'themes.ts');
  const src = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const parsed = parseThemesObject(src);
  const manifest = readGeneratedManifestIds();
  const importIds = [...src.matchAll(/@sayhello\/theme-([a-z0-9-]+)/g)].map(m => m[1]);

  const registeredIds = [...new Set([...parsed.registeredIds, ...manifest.ids, ...importIds])];
  const entries = { ...manifest.entries, ...parsed.entries };

  const pkgThemesDir = join(ROOT, 'packages', 'themes');
  const packageIds = existsSync(pkgThemesDir)
    ? readdirSync(pkgThemesDir).filter(d => existsSync(join(pkgThemesDir, d, 'theme.js')))
    : [];

  return { file, src, registeredIds, entries, packageIds };
}

export function readV2ThemeEntry(themeId) {
  const dir = join(ROOT, 'packages', 'themes', themeId);
  const themeJs = join(dir, 'theme.js');
  const demoJson = join(dir, 'demo.json');
  if (!existsSync(themeJs) || !existsSync(demoJson)) return null;
  return {
    id: themeId,
    themeJs,
    demo: JSON.parse(readFileSync(demoJson, 'utf8')),
  };
}

async function importThemeMeta(themeJsPath) {
  try {
    const mod = (await import(pathToFileURL(themeJsPath).href)).default;
    if (!mod || typeof mod !== 'object') return null;
    const topics = Array.isArray(mod.topics)
      ? mod.topics.map(t => (typeof t === 'string' ? { id: t } : t)).filter(t => t?.id)
      : [];
    return {
      id: mod.id || '',
      name: mod.name || '',
      layout: mod.layout || '',
      tier: mod.tier || '',
      gateMs: mod.gateMs,
      palettes: Array.isArray(mod.palettes) ? mod.palettes : [],
      topics,
      features: mod.features || {},
    };
  } catch {
    return null;
  }
}

async function probeUrlStatus(url, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    return res.status;
  } catch {
    return 0;
  } finally {
    clearTimeout(t);
  }
}

async function scrapeV2ShowcaseTargets(webUrl) {
  const links = [];
  if (!webUrl) return links;
  try {
    const res = await fetch(`${webUrl.replace(/\/$/, '')}/v2/`);
    if (res.status !== 200) return links;
    const html = await res.text();
    const re = /href=["']([^"']*\/v2\/demo\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?(?:\?([^"']*))?)["']/gi;
    let m;
    while ((m = re.exec(html))) {
      const fullHref = m[1];
      const themeId = m[2];
      const pathTopic = m[3] || '';
      const query = m[4] || '';
      const qp = new URLSearchParams(query);
      const topic = pathTopic || qp.get('topic') || qp.get('p') || '';
      links.push({ href: fullHref, id: themeId, topic });
    }
  } catch {}
  return links;
}

/**
 * Dynamically discovers all v2 themes/templates/topics across disk (`packages/themes/*`),
 * `apps/web/src/lib/themes.ts` / generated manifests, and live `/v2/` showcase + `/v2/demo/<id>/` HTTP probes.
 */
export async function discoverV2Themes({ webUrl = '' } = {}) {
  const webReg = readWebThemesRegistry();
  const showcaseLinks = await scrapeV2ShowcaseTargets(webUrl);
  const showcaseIds = [...new Set(showcaseLinks.map(l => l.id))];

  const candidateIds = [...new Set([
    ...webReg.packageIds,
    ...webReg.registeredIds,
    ...showcaseIds,
  ])];

  const results = [];
  for (const id of candidateIds) {
    const entry = readV2ThemeEntry(id);
    const meta = entry ? await importThemeMeta(entry.themeJs) : null;
    const inPackages = Boolean(entry);
    const inWebRegistry = webReg.registeredIds.includes(id);

    let registeredOnline = false;
    if (webUrl) {
      const status = await probeUrlStatus(`${webUrl.replace(/\/$/, '')}/v2/demo/${id}/`);
      registeredOnline = status === 200;
    }

    const isRegistered = webUrl ? (registeredOnline || inWebRegistry) : inWebRegistry;
    const showcaseTopics = showcaseLinks
      .filter(l => l.id === id && l.topic)
      .map(l => ({ id: l.topic, href: l.href }));
    const metaTopics = meta?.topics || [];
    const topics = [...new Map([...metaTopics, ...showcaseTopics].map(t => [t.id, t])).values()];

    const isPending = inPackages && !isRegistered;
    results.push({
      id,
      name: meta?.name || id,
      layout: meta?.layout || '',
      tier: meta?.tier || '',
      gateMs: meta?.gateMs,
      palettes: meta?.palettes || [],
      topics,
      features: meta?.features || {},
      demo: entry?.demo || null,
      themeJs: entry?.themeJs || '',
      assetBase: webReg.entries?.[id]?.assetBase || `/_e/themes/${id}/`,
      inPackages,
      inWebRegistry,
      registeredOnline,
      isRegistered,
      isPending,
      pendingReason: isPending ? `M1/M2: wire "${id}" into apps/web/src/lib/themes.ts` : '',
    });
  }

  return results;
}

export function listActiveDocs() {
  const docsDir = join(ROOT, 'docs');
  if (!existsSync(docsDir)) return [];
  return readdirSync(docsDir)
    .filter(name => name.endsWith('.md'))
    .map(name => join(docsDir, name))
    .filter(full => statSync(full).isFile());
}

export function checkM3Docs() {
  const required = [
    'docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md',
    'docs/TEMPLATES-AND-TOPICS.md',
    'docs/ARCHITECTURE.md',
    'docs/CLAUDE-HANDOFF.md',
  ];
  const missing = required.filter(rel => !existsSync(join(ROOT, rel)));
  if (missing.length > 0) {
    return {
      ready: false,
      missing,
      pendingMilestone: 'M3: multi-angle assessment, templates/topics blueprint & synchronized docs',
      message: `M3 docs not yet created: ${missing.join(', ')}`,
    };
  }

  const assessment = readFileSync(join(ROOT, 'docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md'), 'utf8');
  const templatesDoc = readFileSync(join(ROOT, 'docs/TEMPLATES-AND-TOPICS.md'), 'utf8');
  const archDoc = readFileSync(join(ROOT, 'docs/ARCHITECTURE.md'), 'utf8');
  const handoffDoc = readFileSync(join(ROOT, 'docs/CLAUDE-HANDOFF.md'), 'utf8');

  const errors = [];
  if (assessment.length < 1500) errors.push('docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md too short');
  if (!/chóng mặt|xoay|dizziness|camera/i.test(assessment)) errors.push('Assessment doc missing 3D dizziness root-cause analysis');
  if (!/wow/i.test(assessment)) errors.push('Assessment doc missing generic vs "wow" comparison');
  if (!/kiến trúc|architecture/i.test(assessment) || !/trải nghiệm|UX|thẩm mỹ/i.test(assessment)) {
    errors.push('Assessment doc missing >= 3 evaluation angles');
  }

  if (templatesDoc.length < 1500) errors.push('docs/TEMPLATES-AND-TOPICS.md too short');
  if (!/cringe/i.test(templatesDoc)) errors.push('Templates doc missing anti-cringe criteria');
  if (!/mcpservers\.org\/agent-skills/i.test(templatesDoc)) errors.push('Templates doc missing mcpservers.org/agent-skills citation');
  if (!/motionsites\.ai/i.test(templatesDoc)) errors.push('Templates doc missing motionsites.ai citation');
  if (!/highfield|higgsfield/i.test(templatesDoc)) errors.push('Templates doc missing Highfield/Higgsfield citation');

  for (const [docName, text] of [
    ['docs/ARCHITECTURE.md', archDoc],
    ['docs/CLAUDE-HANDOFF.md', handoffDoc],
  ]) {
    if (text.trim().length < 400) errors.push(`${docName} too short`);
    // Verify mentioned repo paths exist when explicitly written as backticked relative paths
    const pathMatches = [...text.matchAll(/`((?:apps|packages|legacy|tests|docs)\/[a-zA-Z0-9_.\-/]+)`/g)].map(m => m[1]);
    for (const rel of pathMatches) {
      const cleanRel = rel.replace(/\/$/, '');
      if (cleanRel.includes('*') || cleanRel.includes('[') || cleanRel.includes('<')) continue;
      if (!existsSync(join(ROOT, cleanRel))) {
        errors.push(`${docName} references missing path \`${rel}\``);
      }
    }
  }

  return {
    ready: errors.length === 0,
    missing: [],
    errors,
    message: errors.join('; '),
  };
}

export function isV2ShowcaseUpgraded() {
  const file = join(ROOT, 'apps', 'web', 'src', 'app', 'v2', 'page.tsx');
  if (!existsSync(file)) return false;
  const text = readFileSync(file, 'utf8');
  if (/Đang xây bản mới/.test(text) && !/\/v2\/demo\//.test(text)) return false;
  return true;
}

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'test-results', 'public', 'archive']);
const SCAN_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.css', '.html', '.json', '.md']);

export function collectFiles(targets) {
  const out = [];
  function walk(p) {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p)) {
        if (SKIP_DIRS.has(name)) continue;
        walk(join(p, name));
      }
    } else if (SCAN_EXTS.has(extname(p).toLowerCase())) {
      out.push(p);
    }
  }
  for (const t of targets) walk(t);
  return out;
}

export function scanFilesForR1(files) {
  const hits = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { label, regex } of R1_FORBIDDEN_TERMS) {
        if (regex.test(line)) {
          hits.push({
            file: file.slice(ROOT.length + 1).replace(/\\/g, '/'),
            line: i + 1,
            term: label,
            snippet: line.trim().slice(0, 140),
          });
        }
      }
    }
  }
  return hits;
}
