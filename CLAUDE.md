# SayHello — Chỉ dẫn phát triển dự án

Monorepo thiệp cưới online. **Một bộ mã duy nhất, chỉ làm trên nhánh `main`, không chia phiên bản.**

## Vai trò
- Claude code chính; agy chỉ đạo qua `docs/CHI-DAO.md` (đọc trước mỗi việc). Khi trái nhau, lời chủ dự án thắng.

## Đọc trước khi sửa code
- `docs/CHI-DAO.md` — Việc được giao, điều chủ dự án đã chốt, hiện trạng.
- `docs/RULES.md` — Quy trình git, ràng buộc mã nguồn, bảo mật.
- `docs/ARCHITECTURE.md` — Cấu trúc, luồng `sync-engine.mjs` -> `renderDocument()` -> `runtime.js`.
- `docs/DESIGN.md` — Card-as-Centerpiece, token `--sh-*`.
- `docs/TEMPLATES-AND-TOPICS.md` — Kiến trúc mẫu, chống sến, rubric 4 tiêu chí.
- `docs/TAO-MAU-MOI.md` — Viết mẫu và chủ đề mới.
- `docs/DESIGN-BRIEF.md` (agy soạn) — Đề xuất mẫu và topic mới; chỉ làm khi được giao trong `docs/CHI-DAO.md` hoặc chủ dự án yêu cầu.
- `apps/web/AGENTS.md` — Next.js 16: đọc `node_modules/next/dist/docs/` trước khi sửa `apps/web/`.

## Cấu trúc
- `apps/web/` — Next.js `16.4.6` + React `19.3.0` + Tailwind `4.3.3`. `/`, `/demo/[theme]/`, `/demo/[theme]/[topic]/`. `predev`/`prebuild` chạy `scripts/sync-engine.mjs` sinh `src/lib/themes.generated.ts` và `public/_e/`.
- `packages/engine/` — Bộ máy thiệp JS thuần (**không React**): `defineTheme`, `composeInvitation`, `renderDocument`, `qrUrl`, `imgPair`, `base.css`.
- `packages/themes/` — Mỗi thư mục là một mẫu (hiện 8).
- `assets/anh-minh-hoa/` — Ảnh minh hoạ mặc định.
- `prototypes/` — Bản thử topic chờ duyệt.
- `supabase/` — Cấu hình PG17, chưa có migration.
- `tests/` — `smoke.mjs`, `e2e/run.mjs`.

## Lệnh
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
- `npm test` — unit test engine + hợp đồng các mẫu.
- `npm run test:smoke` — cần server ở `:3000`.
- `npm run test:e2e` — Playwright đầy đủ (tự dò hoặc khởi chạy server).

## Ràng buộc
1. **Không React trong trang thiệp** (`packages/engine/`, `packages/themes/`). Thư viện nặng chỉ nạp qua `ctx.lib()`; bìa mở trong `<= 900ms` (chuẩn `450ms`); nghi thức mở dài (`data-ritual`) phải có nút `data-skip` mở trong `<= 900ms`.
2. **Card-as-Centerpiece, không chóng mặt:** không bay camera 3D, không rung lắc nhàn rỗi, nghiêng tối đa `±5°`, không hiệu ứng `infinite` phủ lớn. Hỗ trợ `?tier=lite`, `prefers-reduced-motion`, `bindContextLoss`.
3. **Tiếng Việt và an toàn:** HTML escape qua `` html`...` ``; font có subset `vietnamese`; nhãn `>= 13px`, thân bài `>= 16px`; tách chữ qua `splitText()`; kiểm tra ở `320×568`, `390×844`, `1440×900`.
4. **Vệ sinh:** không commit `.env`, khoá `service_role`, hay dữ liệu thật của cặp đôi.
