// Thiệp mẫu bản 2: HTML dựng sẵn bởi bộ máy thiệp (không React), tạo lúc build cho từng mẫu.
// Tên khách (?k=) do trình duyệt điền nên trang vẫn cache chung được.
import { renderDocument } from "@sayhello/engine";
import { THEMES } from "@/lib/themes";

export function generateStaticParams() {
  return Object.keys(THEMES).map((theme) => ({ theme }));
}

export async function GET(_req: Request, { params }: RouteContext<"/v2/demo/[theme]">) {
  const { theme: id } = await params;
  const entry = Object.hasOwn(THEMES, id) ? THEMES[id] : undefined;
  if (!entry) return new Response("Không có mẫu này", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const body = renderDocument(entry.theme, entry.demo, { assetBase: entry.assetBase });
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
