# Kiến trúc hệ thống · SayHello Monorepo

Tài liệu này mô tả kiến trúc kỹ thuật hiện hành của kho mã nguồn `D:\MyCode\SayHello` (nhánh `redesign`, trạng thái sau Milestone M1 và M2).

---

## 1. Tổng quan công nghệ & ranh giới các thế hệ

| Thành phần | Công nghệ / Ngôn ngữ | Vai trò & Ranh giới |
|---|---|---|
| **Ứng dụng Web v2 (`apps/web/`)** | Next.js `16.4.6` (React `19.3.0`, Tailwind `4.3.3`, Turbopack, TypeScript) | Phục vụ trang trưng bày `/v2/`, route thiệp SSG/SSR `/v2/demo/[theme]/` và `/v2/demo/[theme]/[topic]/`, cùng fallback proxy về `legacy/` qua `LEGACY_ORIGIN`. |
| **Bộ máy Thiệp v2 (`packages/engine/`)** | JavaScript **ES module thuần** (**không React**) | Hợp đồng `defineTheme` / `composeInvitation`, SSR `renderDocument()`, token nền `base.css`, runtime trình duyệt (`runtime.js`, `services.js`, `lib.js`, `stage3d.js`). |
| **Các mẫu thiệp v2 (`packages/themes/`)** | ESM + CSS thuần + tài nguyên ảnh `sharp` | 7 mẫu đang hoạt động (`thiep-gap-doi`, `chieu-sau`, `hop-ky-uc`, `song-gia`, `cuon-phim`, `phong-trien-lam`, `to-hong`). |
| **Thế hệ 1 đóng băng (`legacy/`)** | HTML + CSS + ESM thuần + Google Apps Script | 10 mẫu v1, công cụ Studio (`legacy/studio/`), trang bán/đặt thiệp (`legacy/dat-thiep/`, `legacy/ban-hang/`), bộ sinh HTML (`legacy/scripts/build.mjs`). |
| **Cơ sở dữ liệu tương lai (`supabase/`)** | Supabase CLI (`supabase/config.toml`, PostgreSQL `17`) | Đã cấu hình cổng cục bộ và xác thực ẩn danh (`enable_anonymous_sign_ins = true`); thư mục `supabase/migrations/` hiện để trống chờ pha SaaS backend. |
| **Kiểm thử E2E (`tests/e2e/`)** | Playwright + Node `node:test` | Bộ kiểm tra đa tầng Tiers 1–4 (`tests/e2e/run.mjs`) và smoke test v2 (`apps/web/tests/thiep-v2.mjs`). |

---

## 2. Cấu trúc thư mục thực tế

```text
D:\MyCode\SayHello\
├── package.json                       # npm workspaces: apps/*, packages/*, packages/themes/*, legacy
├── README.md                          # Tổng quan dự án & lệnh chạy nhanh
├── CLAUDE.md                          # Chỉ dẫn gốc cho trợ lý AI
├── .github/workflows/check.yml        # CI: job legacy + job v2 trên [main, redesign]
├── apps/web/
│   ├── package.json                   # @sayhello/web (predev/prebuild chạy sync-engine.mjs)
│   ├── next.config.ts                 # cacheComponents, trailingSlash, transpilePackages, rewrites.fallback -> LEGACY_ORIGIN
│   ├── tsconfig.json                  # Cấu hình TypeScript (incremental: true)
│   ├── AGENTS.md                      # Lưu ý API Next.js 16 (đọc node_modules/next/dist/docs/)
│   ├── scripts/sync-engine.mjs        # Tự động quét packages/themes/* -> public/_e/ & themes.generated.ts
│   ├── src/
│   │   ├── app/layout.tsx             # Font Be Vietnam Pro & khung gốc Next.js
│   │   ├── app/v2/page.tsx            # Trang Showcase Bộ Sưu Tập Layout × Topic × Moment
│   │   ├── app/v2/demo/[theme]/route.ts          # Route SSG /v2/demo/<theme>/ (hỗ trợ ?topic=)
│   │   ├── app/v2/demo/[theme]/[topic]/route.ts  # Route SSG /v2/demo/<theme>/<topic>/
│   │   └── lib/
│   │       ├── theme-types.ts         # Kiểu TypeScript cho ThemeSpec, ThemeTopic, ThemeMoment
│   │       ├── themes.ts              # Export THEMES, THEME_LIST, getThemeVariants()
│   │       └── themes.generated.ts    # Tệp tự sinh bởi sync-engine.mjs (không sửa tay)
│   ├── public/
│   │   ├── _e/                        # Bản sao tĩnh engine + 7 mẫu + manifest.json (gitignored)
│   │   └── assets/music/              # 3 file nhạc nền (binh-minh.mp3, dao-buoc.mp3, hop-nhac.mp3)
│   └── tests/thiep-v2.mjs             # Kiểm thử Playwright cho các mẫu v2
├── packages/
│   ├── engine/
│   │   ├── package.json               # @sayhello/engine
│   │   ├── README.md                  # Tài liệu nội bộ gói engine
│   │   ├── src/
│   │   │   ├── index.js               # Cổng export server/shared API
│   │   │   ├── define-theme.js        # defineTheme, composeInvitation, composeTheme, LAYOUTS, TIERS, FEATURES
│   │   │   ├── render.js              # renderDocument(): SSR HTML, import map, bảo vệ __proto__ trong buildEarlyScript
│   │   │   ├── model.js               # buildContext, merge, mapUrl, qrUrl (VietQR %20), imgPair()
│   │   │   ├── blocks.js              # rsvpForm, wishForm, wishList, countdown, quickInfo (#sh-quick)
│   │   │   ├── voice.js, date.js, html.js, tier.js
│   │   │   ├── base.css               # Token --sh-*, sàn chữ 16px/13px, :where() độ ưu tiên 0
│   │   │   └── client/                # runtime.js, services.js, backend.js, lib.js, stage3d.js
│   │   └── test/                      # Unit tests (define-theme, m2-contract, render, stage3d)
│   └── themes/
│       ├── thiep-gap-doi/             # M2: layout 'folio', moment 'unseal-gleam' (3 topics)
│       ├── chieu-sau/                 # M2: layout 'lookbook', moment 'optical-push' (3 topics, 2.5D imgPair)
│       ├── hop-ky-uc/                 # M2: layout 'deck', moment 'deal-flip' (2 topics)
│       ├── song-gia/                  # M2: layout 'split', moment 'seam-converge' (2 topics)
│       ├── cuon-phim/                 # M1 ổn định: layout 'scroll' (7 ảnh tự chứa)
│       ├── phong-trien-lam/           # M1 ổn định: layout 'stage' (gallery3d.js camera phẳng)
│       └── to-hong/                   # M1 ổn định: layout 'stage' (thread3d.js camera phẳng + motion2d.js)
├── legacy/                            # Thế hệ 1 (@sayhello/legacy), cổng dev :3001
│   ├── index.html, shop.json, site.json, slugs.json, themes/index.json
│   ├── core/, studio/, dat-thiep/, ban-hang/, backend/, proto/, scripts/, tests/
├── supabase/
│   ├── config.toml                    # Cấu hình Supabase cục bộ (PG17)
│   └── migrations/                    # Thư mục migration SQL
├── tests/e2e/
│   ├── run.mjs                        # Trình chạy E2E (Tiers 1–4)
│   ├── lib/registries.mjs             # Danh mục kiểm chuẩn R1, M1–M3, checkM3Docs()
│   └── specs/                         # tier1-r1-r2, tier1-topics, tier2-bounds, tier3-combos, tier4-journeys
└── docs/
    ├── ASSESSMENT-AND-RESTRUCTURING-PLAN.md
    ├── TEMPLATES-AND-TOPICS.md
    ├── DESIGN.md
    ├── ARCHITECTURE.md                # Tài liệu này
    ├── TAO-MAU-MOI.md
    ├── RULES.md
    ├── CLAUDE-HANDOFF.md
    └── archive/                       # 12 tài liệu lịch sử + docs/archive/README.md
```

---

## 3. Luồng dữ liệu & Vòng đời dựng trang (`Layout × Topic × Moment`)

### 3.1 Đồng bộ tự động (`apps/web/scripts/sync-engine.mjs`)
Trước mỗi lần chạy `npm run dev` hoặc `npm run build` (`predev` / `prebuild` trong `apps/web/package.json`):
1. Sao chép toàn bộ `packages/engine/src/` vào `apps/web/public/_e/engine/`.
2. Quét `packages/themes/*`, đọc `theme.js` và `demo.json` của 7 mẫu hợp lệ.
3. Sao chép tệp tĩnh (`.js`, `.css`, `.svg`, `.png`, `.jpg`, `.webp`, `.woff2`) vào `apps/web/public/_e/themes/<id>/`.
4. Sinh đồng bộ `apps/web/public/_e/manifest.json` và `apps/web/src/lib/themes.generated.ts` — loại bỏ hoàn toàn nhu cầu đăng ký thủ công ở 5 tệp khác nhau như trước M2.

### 3.2 Dựng HTML trên máy chủ (`packages/engine/src/render.js`)
1. Route `apps/web/src/app/v2/demo/[theme]/route.ts` hoặc `apps/web/src/app/v2/demo/[theme]/[topic]/route.ts` gọi `renderDocument(entry.theme, entry.demo, { assetBase: entry.assetBase, topic })`.
2. `defineTheme()` / `composeInvitation()` (`packages/engine/src/define-theme.js`) đã chuẩn hóa và `Object.freeze()` cấu trúc `layoutSpec`, `moment`, `topics` (đồng bộ sang `palettes`), kiểm tra cảnh `gate` đứng đầu và bắt buộc có `motion.lite` khi khai báo `motion.cinematic`.
3. `renderDocument()` chọn topic theo thứ tự ưu tiên (`opts.topic` -> `invite.topic` -> `invite.palette` -> `theme.defaultTopic` -> `topics[0]`), kiểm tra hợp lệ tên biến CSS (`--sh-*`) và URL Google Fonts, gắn thuộc tính `data-layout`, `data-moment`, `data-topic` lên `<html>`, nhúng import map (`@sayhello/engine`, `three@0.170.0`) và `<script type="application/json" id="sh-data">`.
4. Đoạn `buildEarlyScript` trong `render.js` đọc `?topic=` / `?p=` trên client trước khi vẽ khung hình đầu tiên, sử dụng `Object.prototype.hasOwnProperty.call` để chặn prototype pollution (`?topic=__proto__`).

### 3.3 Khởi động trên trình duyệt (`packages/engine/src/client/runtime.js`)
1. `boot(theme)` điền tên khách từ `?k=` (`[data-guest]`, `[data-guest-value]`), lọc nghi lễ theo nhóm khách `?n=` (`applyGroup`), gắn điều khiển nhạc nền (`/assets/music/*.mp3`) và biểu mẫu (`services.js`: RSVP, Lưu bút, Đếm ngược, hộp `#sh-quick`).
2. Đo FPS (`measureFps` trong `tier.js`) và tôn trọng `?tier=lite|standard|cinematic` hoặc `prefers-reduced-motion`.
3. Hiển thị bìa ngay từ HTML tĩnh; chỉ gọi `ctx.lib('scroll' | 'three' | 'lenis')` (`lib.js`) sau khi cần thiết hoặc tải trước nhẹ nhàng không chặn vẽ đầu tiên.
4. Khi khách mở bìa (hoặc qua `gateMs: 450`), lớp `.sh-gate` nhận thuộc tính `hidden` (`.sh-gate[hidden] { display: none !important; }` trong `packages/engine/src/base.css`) và phát sự kiện `open`.

---

## 4. Định tuyến, Proxy Fallback & Quy trình CI

### 4.1 Định tuyến trên `apps/web` (`apps/web/next.config.ts`)
- `/v2/` — Trang Showcase Bộ Sưu Tập `apps/web/src/app/v2/page.tsx`.
- `/v2/demo/<theme>/` — Bản dựng SSG tĩnh cho từng mẫu (hỗ trợ chuyển `?topic=<id>`, `?tier=lite`, `?n=<group>`, `?k=<guest>`).
- `/v2/demo/<theme>/<topic>/` — Bản dựng SSG tĩnh riêng cho từng cặp `(theme, topic)`.
- **Mọi đường dẫn khác** (`/`, `/dat-thiep/`, `/studio/`, `/ban-hang/`, `/<slug-thiep-v1>/`): Tự động chuyển tiếp về `LEGACY_ORIGIN` (mặc định `http://localhost:3001`) qua `rewrites.fallback` của `apps/web/next.config.ts`. Nhờ đó link thiệp v1 đã gửi khách không bao giờ đứt gãy.

### 4.2 Quy trình CI (`.github/workflows/check.yml`)
Chạy tự động trên `pull_request` và `push` tới `[main, redesign]` với Node `22`:
1. **Job `legacy`:** Vào `legacy/`, chạy `node scripts/build.mjs`, kiểm tra `git diff --exit-code -- '*/index.html'`, cài Playwright Chromium và chạy `npm test -w @sayhello/legacy`.
2. **Job `v2`:** Chạy `npm test -w @sayhello/engine`, `npm run build -w @sayhello/web`, khởi chạy song song `node legacy/scripts/serve.mjs 3001` và `next start -p 3000`, rồi chạy `node apps/web/tests/thiep-v2.mjs http://localhost:3000`.
3. **Kiểm tra mở rộng tại máy phát triển:** Có thể chạy thêm hợp đồng từng mẫu (`node --test packages/themes/<id>/test/contract.test.js`), lint (`npm run lint -w @sayhello/web`), typecheck (`npx --prefix apps/web tsc --noEmit --incremental false -p apps/web/tsconfig.json`) và toàn bộ 4 tầng E2E (`node tests/e2e/run.mjs --tier=all`).

*(Xem hướng dẫn tạo mẫu/topic mới tại `docs/TAO-MAU-MOI.md` và danh sách lệnh đầy đủ tại `docs/CLAUDE-HANDOFF.md`.)*
