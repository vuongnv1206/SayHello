import { THEME_LIST, getThemeVariants } from "@/lib/themes";

const LAYOUT_LABELS: Record<string, string> = {
  folio: "Folio 2 Cánh",
  lookbook: "Lookbook 2.5D",
  deck: "Hộp Thẻ Ký Ức",
  split: "Song Gia 50/50",
  scroll: "Cuộn Biên Tập",
  stage: "Sân Khấu 3D",
  pager: "Lật Trang",
  hub: "Trung Tâm",
  chat: "Hội Thoại",
  custom: "Tuỳ Biến",
};

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#FAF8F4] text-[#1C1917]">
      <header className="mx-auto w-full max-w-6xl border-b border-[#E5DFD5] px-4 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8E1B2C]">
            SayHello · Bộ Sưu Tập Thiệp Cưới
          </p>
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-5xl sm:leading-[1.12]">
          Tấm thiệp là trung tâm. Mỗi cấu trúc là một chất liệu riêng.
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[#4A433C]">
          Chọn theo kiến trúc trình bày (Layout), chủ đề thẩm mỹ (Topic) và khoảnh khắc mở thiệp
          (Signature Moment) — hiển thị tức thì tên cô dâu chú rể, ngày dương/âm lịch, địa điểm và
          phiếu hồi âm trong 5 giây đầu.
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {THEME_LIST.map((entry) => {
            const { theme, demo, preview } = entry;
            const variants = getThemeVariants(entry);
            const layoutLabel = LAYOUT_LABELS[theme.layout || "scroll"] || theme.layout || "Scroll";
            const momentLabel = theme.moment?.verbLabel || theme.tier || "Tương tác";
            const couple =
              demo.groom?.short && demo.bride?.short
                ? `${demo.groom.short} & ${demo.bride.short}`
                : theme.name;

            return (
              <article
                key={entry.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#E2DBD0] bg-[#FFFFFF] shadow-[0_8px_28px_rgba(28,25,23,0.05)]"
              >
                <a
                  href={`/demo/${entry.id}/`}
                  className="group relative block aspect-[16/10] w-full overflow-hidden bg-[#EFECE5]"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt={`Xem trước mẫu ${theme.name}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[15px] text-[#5C5349]">
                      {theme.name}
                    </div>
                  )}
                </a>

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-[#DCD4C8] bg-[#FAF8F4] px-3 py-1 text-[13px] font-semibold text-[#1C1917]">
                      {layoutLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#EFECE5] px-3 py-1 text-[13px] font-medium text-[#5A4636]">
                      {momentLabel}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-2xl font-semibold text-[#1C1917]">{theme.name}</h2>
                      <span className="text-[14px] text-[#6B6258]">{couple}</span>
                    </div>
                    <p className="mt-1.5 text-[16px] leading-relaxed text-[#4A433C]">
                      {theme.tagline || `Mẫu thiệp ${theme.name}.`}
                    </p>
                  </div>

                  {variants.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-[#EEE8DE] pt-4">
                      <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B6258]">
                        Chủ đề ({variants.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => {
                          const c0 = variant.swatch?.[0] || "#1C1917";
                          const c1 = variant.swatch?.[1] || "#8E1B2C";
                          return (
                            <a
                              key={variant.id}
                              href={`/demo/${entry.id}/?topic=${encodeURIComponent(variant.id)}`}
                              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-[#DCD4C8] bg-[#FAF8F4] px-3.5 py-1.5 text-[14px] font-medium text-[#1C1917] transition-colors hover:border-[#8E1B2C] hover:bg-[#F3EDE3]"
                            >
                              <span
                                aria-hidden="true"
                                className="inline-block h-3.5 w-3.5 rounded-full border border-black/15"
                                style={{ background: `linear-gradient(135deg, ${c0} 50%, ${c1} 50%)` }}
                              />
                              <span>{variant.name || variant.id}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={`/demo/${entry.id}/`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#1C1917] px-5 py-2.5 text-[15px] font-semibold text-[#FAF8F4] transition-colors hover:bg-[#8E1B2C]"
                    >
                      Mở thiệp mẫu
                    </a>
                    <a
                      href={`/demo/${entry.id}/?tier=lite`}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#D8D0C4] px-4 py-2.5 text-[14px] font-medium text-[#3D3630] transition-colors hover:bg-[#EFECE5]"
                    >
                      Bản tĩnh (Lite)
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
