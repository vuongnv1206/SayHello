// Danh sách mẫu để kiểm thử: đọc thẳng từ packages/themes/* (giống scripts/sync-engine.mjs).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const THEMES_DIR = join(ROOT, 'packages', 'themes');

export async function discoverThemes() {
  const ids = readdirSync(THEMES_DIR)
    .filter(d => existsSync(join(THEMES_DIR, d, 'theme.js')) && existsSync(join(THEMES_DIR, d, 'demo.json')))
    .sort();

  return Promise.all(ids.map(async id => {
    const themeJs = join(THEMES_DIR, id, 'theme.js');
    const mod = (await import(pathToFileURL(themeJs).href)).default;
    return {
      id,
      name: mod.name || id,
      layout: mod.layout || '',
      tier: mod.tier || '',
      gateMs: mod.gateMs,
      palettes: mod.palettes || [],
      topics: (mod.topics || []).map(t => (typeof t === 'string' ? { id: t } : t)).filter(t => t?.id),
      features: mod.features || {},
      demo: JSON.parse(readFileSync(join(THEMES_DIR, id, 'demo.json'), 'utf8')),
      themeJs,
      assetBase: `/_e/themes/${id}/`,
    };
  }));
}
