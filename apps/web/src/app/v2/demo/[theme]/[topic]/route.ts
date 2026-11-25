// Thiệp mẫu bản 2 theo từng chủ đề (?topic= hoặc /v2/demo/<theme>/<topic>/).
import { renderDocument } from "@sayhello/engine";
import { THEMES, getThemeVariants } from "@/lib/themes";

export function generateStaticParams() {
  const params: Array<{ theme: string; topic: string }> = [];
  for (const [themeId, entry] of Object.entries(THEMES)) {
    for (const variant of getThemeVariants(entry)) {
      if (variant?.id) params.push({ theme: themeId, topic: variant.id });
    }
  }
  return params;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ theme: string; topic: string }> }
) {
  const { theme: id, topic } = await params;
  const entry = THEMES[id];
  if (!entry) {
    return new Response("Không có mẫu này", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const variants = getThemeVariants(entry);
  if (!variants.some((v) => v.id === topic)) {
    return new Response("Không có chủ đề này", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const body = renderDocument(entry.theme, entry.demo, {
    assetBase: entry.assetBase,
    topic,
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
