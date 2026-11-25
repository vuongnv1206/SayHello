export type ThemeTopic = {
  id: string;
  name?: string;
  desc?: string;
  swatch?: readonly string[];
  vars?: Readonly<Record<string, string>>;
  fonts?: string;
  themeColor?: string;
};

export type ThemeMoment = {
  id: string;
  verb?: string;
  verbLabel?: string;
  trigger?: string;
  durationMs?: number;
  easing?: string;
  reducedFallback?: string;
};

export type ThemeSpec = {
  id: string;
  name: string;
  version: string;
  layout?: string;
  tier?: string;
  gateMs?: number;
  tagline?: string;
  moment?: ThemeMoment;
  topics?: readonly ThemeTopic[];
  palettes?: readonly ThemeTopic[];
  features?: Readonly<Record<string, string>>;
};

export type ThemeDemoData = Record<string, unknown> & {
  groom?: { short?: string; full?: string };
  bride?: { short?: string; full?: string };
  date?: string;
  city?: string;
  images?: { preview?: string; hero?: string; album?: string[] };
};

export type ThemeRegistryEntry = {
  id: string;
  theme: ThemeSpec;
  demo: ThemeDemoData;
  assetBase: string;
  preview: string;
};
