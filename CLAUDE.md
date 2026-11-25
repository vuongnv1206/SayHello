# SayHello — Hướng dẫn phát triển dự án (Root Index)

Monorepo nền tảng thiệp cưới tự phục vụ (nhánh `redesign`), chạy song song 2 thế hệ qua `apps/web/next.config.ts` (`rewrites.fallback` -> `LEGACY_ORIGIN` cổng `3001`).

## Tài liệu bắt buộc đọc trước khi sửa code
- `docs/RULES.md` — Quy trình git, bảo mật, quy tắc viết code & danh sách cấm tuyệt đối.
- `docs/THAM-MUU-THIET-KE.md` — Tài liệu tham mưu UX/UI chuẩn (`motionsites.ai` + Anthropic `frontend-design` / `codebase-design`), chẩn đoán khuôn mẫu, phương án 10 mẫu cũ + các mẫu photo-first mới, ma trận thư viện, quy trình 2-Pass Anti-AI-Slop & rubric Agent-as-Judge.
- `docs/BRIEF-3D.md` — Nguyên tắc lấy ảnh cặp đôi (6–30 ảnh) làm trung tâm, chủ đề là bộ thông số khí quyển, yêu cầu chất lượng 3D/shader & tương tác.
- `apps/web/AGENTS.md` — Cảnh báo Next.js 16 (bắt buộc đọc `node_modules/next/dist/docs/` trước khi sửa code trong `apps/web`).

## Cấu trúc chính
- `apps/web/` — Next.js `16.4.6` + React `19.3.0` + Tailwind `4.3.3` (trang chủ `/v2`, `/v2/demo/[theme]`, Studio). `predev`/`prebuild` tự đồng bộ engine sang `public/_e/`.
- `packages/engine/` — Bộ máy thiệp v2 thuần JS (**không React**): `defineTheme`, `renderDocument`, `tier.js` (`cinematic`/`standard`/`lite`, `bindContextLoss`), `lib.js` (`scroll`, `three`, `three-post`, `lenis`), `#sh-quick`.
- `packages/themes/*` — Các mẫu thiệp v2 (`cuon-phim`, `to-hong`, `phong-trien-lam`; các mẫu v2 cũ khác cất ở tag `archive/v2-themes-2026-11`). Kế hoạch tái cấu trúc: `docs/KE-HOACH-TAI-CAU-TRUC.md`.
- `legacy/` — Site & 10 mẫu thiệp v1 (`song-hy`, `thu-tay`, `ve-may-bay`, `khoa-tinh`, `den-long`, `cuon-phim`, `tin-nhan`, `thiep-gap`, `khung-theu`, `ca-phe-phin`).

## Lệnh làm việc chính
- `npm run dev:legacy` — Chạy máy chủ tĩnh `legacy/` ở cổng `3001`.
- `npm run dev` — Chạy Next.js `apps/web` ở cổng `3000` (cần chạy kèm `dev:legacy` để fallback hoạt động).
- `npm run build -w @sayhello/legacy` — Sinh lại HTML cho `legacy/` sau khi sửa `invite.json` hoặc `legacy/index.html`.
- `npm test` — Chạy unit test `@sayhello/engine` + Playwright test `@sayhello/legacy` (bao gồm cross-theme `?theme=`).
- `npm run test:v2` — Chạy Playwright test v2 (`apps/web/tests/thiep-v2.mjs`) qua `cinematic`/`standard`/`lite` & `?n=`.
- `npm run lint -w @sayhello/web`, `npx --prefix apps/web tsc --noEmit -p apps/web/tsconfig.json`, `npm run build` — Kiểm tra lint, typecheck và build production.

## Ràng buộc không thương lượng
1. **Không React trong trang thiệp (`packages/engine`, `packages/themes/*`, `legacy/`).** Mọi thư viện nặng (`gsap`, `three`, `three-post`, `ogl`, `lenis`) chỉ nạp lazy qua `ctx.lib()` *sau khi mở bìa*.
2. **Bắt buộc `motion.lite` & `webglcontextlost` fallback** cho mọi mẫu dùng animation nặng/WebGL; kiểm tra mobile `390x844` (Zalo WebView) và desktop `1440x900`.
3. **Tiếng Việt chuẩn:** HTML escape qua `html\`\``; mọi font mới phải có bộ `vietnamese`; nhãn tiếng Việt viết hoa/dấu chồng phải `>= 13px`; tách chữ bằng `Intl.Segmenter` (`splitText`).
4. **Quy trình 2-Pass Anti-AI-Slop:** Chốt 4–6 hex token, font role, ASCII wireframe (desktop + mobile), named motion verb và tự phản biện trước `docs/KHONG-KHUON-MAU.md` trước khi viết code giao diện.
5. **R1 & Bảo mật:** Tuyệt đối không đưa lại hai mẫu đã xóa theo R1 (`docs/REDESIGN.md:9`); không commit `.env`, `STUDIO_SECRET`, khóa Supabase `service_role`, hay dữ liệu thật của cặp đôi.
