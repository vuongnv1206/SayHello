import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const TARGET_V2_THEMES = [
  'cuon-phim',
  'to-hong',
  'phong-trien-lam',
  'bau-troi-anh',
  'ho-guong',
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

function skipCommentOrString(src, i) {
  const ch = src[i];
  if (ch === '/' && src[i + 1] === '/') {
    const nl = src.indexOf('\n', i + 2);
    return nl === -1 ? src.length : nl + 1;
  }
  if (ch === '/' && src[i + 1] === '*') {
    const end = src.indexOf('*/', i + 2);
    return end === -1 ? src.length : end + 2;
  }
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

function parseThemesObject(src) {
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
    const next = skipCommentOrString(src, i);
    if (next !== i) { i = next; continue; }
    if (!/\s/.test(src[i])) break;
    i++;
  }
  if (src[i] !== '{') return { registeredIds, entries };
  const closeIdx = findMatchingBrace(src, i);
  if (closeIdx === -1) return { registeredIds, entries };

  i++;
  while (i < closeIdx) {
    const next = skipCommentOrString(src, i);
    if (next !== i) { i = next; continue; }
    const ch = src[i];
    if (/\s|,/.test(ch)) { i++; continue; }

    let key = '';
    if (ch === '"' || ch === "'") {
      const endQ = skipCommentOrString(src, i);
      key = src.slice(i + 1, endQ - 1);
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
      const n2 = skipCommentOrString(src, i);
      if (n2 !== i) { i = n2; continue; }
      if (!/\s/.test(src[i])) break;
      i++;
    }
    if (src[i] !== ':') continue;
    i++;
    while (i < closeIdx) {
      const n2 = skipCommentOrString(src, i);
      if (n2 !== i) { i = n2; continue; }
      if (!/\s/.test(src[i])) break;
      i++;
    }

    if (src[i] === '{') {
      const valEnd = findMatchingBrace(src, i);
      if (valEnd === -1) break;
      const entryText = src.slice(i, valEnd + 1);
      if (key) {
        registeredIds.push(key);
        const ab = entryText.match(/\bassetBase\s*:\s*(["'])([^"']+)\1/);
        entries[key] = { assetBase: ab ? ab[2] : '' };
      }
      i = valEnd + 1;
    } else {
      while (i < closeIdx && src[i] !== ',') {
        const n2 = skipCommentOrString(src, i);
        if (n2 !== i) { i = n2; continue; }
        if (src[i] === '{') {
          const endB = findMatchingBrace(src, i);
          if (endB === -1) break;
          i = endB + 1;
          continue;
        }
        i++;
      }
    }
  }

  return { registeredIds, entries };
}

export function readWebThemesRegistry() {
  const file = join(ROOT, 'apps', 'web', 'src', 'lib', 'themes.ts');
  const src = readFileSync(file, 'utf8');
  const { registeredIds, entries } = parseThemesObject(src);
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

export function readAdvisoryDoc() {
  const file = join(ROOT, 'docs', 'THAM-MUU-THIET-KE.md');
  if (!existsSync(file)) return null;
  return { file, text: readFileSync(file, 'utf8') };
}

export function isV2ShowcaseUpgraded() {
  const file = join(ROOT, 'apps', 'web', 'src', 'app', 'v2', 'page.tsx');
  if (!existsSync(file)) return false;
  const text = readFileSync(file, 'utf8');
  if (/Đang xây bản mới/.test(text) && !/\/v2\/demo\//.test(text)) return false;
  return true;
}

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'test-results', 'public']);
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
