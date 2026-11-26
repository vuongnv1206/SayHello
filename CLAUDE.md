# SayHello — Chỉ dẫn phát triển dự án (Root Index)

Monorepo nền tảng thiệp cưới online (nhánh phát triển **`redesign`**), vận hành song song thế hệ 2 (`apps/web/`, `packages/engine/`, `packages/themes/`) và thế hệ 1 đóng băng (`legacy/`) qua `apps/web/next.config.ts` (`rewrites.fallback` -> `LEGACY_ORIGIN`, mặc định `http://localhost:3001`).

## Tài liệu chuẩn bắt buộc đọc trước khi sửa code
- `docs/RULES.md` — Quy trình Git (`redesign` -> PR vào `main`), phân biệt lệnh workspace, bảo mật & các bất biến E2E.
- `docs/DESIGN.md` — Hệ thiết kế Card-as-Centerpiece, hợp đồng token `--sh-*` trong `packages/engine/src/base.css`, sàn chữ `>=13px`/`>=16px`, SLA mở bìa `<=900ms`, cổng H1–H7.
- `docs/TEMPLATES-AND-TOPICS.md` — Kiến trúc 5 mẫu (4 mẫu M2 + blueprint Template 5), chủ đề sáng tạo, tiêu chí chống sến (`anti-cringe`) & rubric nhị phân 4 tiêu chí.
- `docs/ARCHITECTURE.md` — Cấu trúc monorepo hiện hành, luồng `sync-engine.mjs` -> `renderDocument()` -> `runtime.js`, định tuyến & CI.
- `docs/TAO-MAU-MOI.md` — Hướng dẫn viết mẫu mới bằng `composeInvitation()` / `defineTheme()`, thêm topic và chuẩn bị ảnh MD5 duy nhất.
- `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` — Đánh giá đa góc độ, phản biện kỹ thuật, phân tích nguyên nhân chóng mặt 3D & các bản vá M1–M2.
- `docs/CLAUDE-HANDOFF.md` — Tóm tắt bàn giao hiện trạng, đầu việc mở (Template 5, hoàn thiện M4, Supabase) cho Claude ở panel bên cạnh.
- `apps/web/AGENTS.md` — Lưu ý API Next.js 16 (bắt buộc đọc `node_modules/next/dist/docs/` trước khi sửa code trong `apps/web/`).
- *(Tài liệu lịch sử cũ đã lưu trữ tại `docs/archive/` — chỉ tham khảo khi tra cứu quá khứ, không dùng làm chuẩn viết code.)*

## Cấu trúc chính
- `apps/web/` — Next.js `16.4.6` + React `19.3.0` + Tailwind `4.3.3` (`/v2/`, `/v2/demo/[theme]/`, `/v2/demo/[theme]/[topic]/`). `predev`/`prebuild` chạy `apps/web/scripts/sync-engine.mjs` tự sinh `apps/web/src/lib/themes.generated.ts` và `apps/web/public/_e/`.
- `packages/engine/` — Bộ máy thiệp v2 thuần JS (**không React**): `defineTheme`, `composeInvitation`, `renderDocument`, `qrUrl`, `imgPair`, `tier.js`, `lib.js`, `stage3d.js`, `base.css`, `#sh-quick`.
- `packages/themes/` — 7 mẫu v2 đang hoạt động (`thiep-gap-doi`, `chieu-sau`, `hop-ky-uc`, `song-gia`, `cuon-phim`, `phong-trien-lam`, `to-hong`).
- `legacy/` — Site v1 đóng băng & 10 mẫu (`song-hy`, `thu-tay`, `ve-may-bay`, `khoa-tinh`, `den-long`, `cuon-phim`, `tin-nhan`, `thiep-gap`, `khung-theu`, `ca-phe-phin`), kèm `legacy/studio/`, `legacy/dat-thiep/`, `legacy/ban-hang/`.
- `supabase/` — `supabase/config.toml` (PG17) & `supabase/migrations/`.
- `tests/e2e/` — Bộ kiểm thử Playwright đa tầng (`tests/e2e/run.mjs`).

## Lệnh làm việc đã kiểm chứng
- `npm run dev:legacy` — Chạy máy chủ tĩnh `legacy/` ở cổng `3001`.
- `npm run dev` — Chạy Next.js `apps/web` ở cổng `3000` (chạy kèm `dev:legacy` nếu cần fallback).
- `npm test -w @sayhello/engine` — Chạy unit test `@sayhello/engine`.
- `node --test packages/themes/*/test/contract.test.js` — Kiểm tra hợp đồng 7/7 mẫu v2.
- `npm run lint -w @sayhello/web` & `npx --prefix apps/web tsc --noEmit --incremental false -p apps/web/tsconfig.json` — Kiểm tra lint & typecheck Next.js.
- `npm run build` — Đồng bộ `sync-engine.mjs` và build production Next.js (`@sayhello/web`).
- `npm test` — Chạy unit test `@sayhello/engine` + toàn bộ kiểm thử `@sayhello/legacy`.
- `npm run test:v2` — Smoke test v2 (`apps/web/tests/thiep-v2.mjs http://localhost:3000`).
- `node tests/e2e/run.mjs --tier=all` — Chạy bộ Playwright E2E đầy đủ Tiers 1–4 (cổng nghiêm ngặt, 0 pending).

## Ràng buộc không thương lượng
1. **Không React trong trang thiệp (`packages/engine/`, `packages/themes/`, `legacy/`).** Mọi thư viện nặng chỉ nạp qua `ctx.lib()` khi cần, giữ bìa mở trong `<= 900ms` (chuẩn `450ms`).
2. **Card-as-Centerpiece & Chống chóng mặt:** Không bay camera 3D, không rung lắc nhàn rỗi, không xoay chữ `CSS3DRenderer`, góc nghiêng tối đa `<= ±5°`, cấm hiệu ứng `infinite` phủ lớn. Bắt buộc hỗ trợ `?tier=lite`, `prefers-reduced-motion`, `bindContextLoss`.
3. **Tiếng Việt chuẩn & An toàn giao diện:** HTML escape qua `` html`...` ``; font bắt buộc có subset `vietnamese`; nhãn tiếng Việt `>= 13px`, thân văn bản `>= 16px`; tách chữ qua `splitText()`; kiểm tra ở `320×568`, `390×844` (Zalo WebView) và `1440×900`.
4. **Kiểm soát R1 & Vệ sinh repo:** Không đưa lại thuật ngữ/mẫu R1 bị loại bỏ vào code hay `docs/*.md`, `README.md`, `CLAUDE.md`; không tạo lại tệp README mặc định của Next.js trong `apps/web/`; không commit `.env`, `STUDIO_SECRET`, `service_role`, hay dữ liệu thật của cặp đôi.
