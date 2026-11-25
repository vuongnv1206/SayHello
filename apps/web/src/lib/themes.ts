// Tự động nạp toàn bộ mẫu từ packages/themes/* qua scripts/sync-engine.mjs -> themes.generated.ts.
export type { ThemeDemoData, ThemeMoment, ThemeRegistryEntry, ThemeSpec, ThemeTopic } from "./theme-types";
export { THEMES, THEME_LIST } from "./themes.generated";
import { THEME_LIST } from "./themes.generated";

export function getThemeVariants(entry: (typeof THEME_LIST)[number]) {
  const topics = entry.theme.topics?.length ? entry.theme.topics : entry.theme.palettes || [];
  return topics;
}
