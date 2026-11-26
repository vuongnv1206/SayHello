# Bàn giao & Phối hợp với Claude (`CLAUDE-HANDOFF.md`)

> Tài liệu ngữ cảnh nhanh giúp trợ lý AI (Claude ở panel bên cạnh) nắm đúng hiện trạng `D:\MyCode\SayHello` sau các cột mốc **M1**, **M2**, **E2E Track** và **M3**, không phải đọc lại kho tài liệu cũ trong `docs/archive/`.

---

## 1. Bản đồ Kho mã nguồn hiện hành

- **`apps/web/` (`@sayhello/web`)**: Next.js `16.4.6` + React `19.3.0` + Tailwind `4.3.3` (`apps/web/AGENTS.md` lưu ý đọc `node_modules/next/dist/docs/`).
  - `apps/web/scripts/sync-engine.mjs`: Tự động quét `packages/themes/*`, chép sang `apps/web/public/_e/` và sinh `apps/web/src/lib/themes.generated.ts` + `apps/web/public/_e/manifest.json`.
  - Routes hoạt động: `/v2/` (`apps/web/src/app/v2/page.tsx`), `/v2/demo/[theme]/` (`apps/web/src/app/v2/demo/[theme]/route.ts`), `/v2/demo/[theme]/[topic]/` (`apps/web/src/app/v2/demo/[theme]/[topic]/route.ts`). Mọi route chưa có chuyển tiếp về `LEGACY_ORIGIN` (`http://localhost:3001`) qua `apps/web/next.config.ts`.
  - Nhạc nền tự chứa: `apps/web/public/assets/music/` (`binh-minh.mp3`, `dao-buoc.mp3`, `hop-nhac.mp3`).
- **`packages/engine/` (`@sayhello/engine`)**: Bộ máy thiệp ESM thuần (**không React**).
  - `packages/engine/src/define-theme.js`: `defineTheme`, `composeInvitation`, `composeTheme`, `LAYOUTS` (`scroll`, `pager`, `stage`, `hub`, `chat`, `folio`, `lookbook`, `deck`, `split`, `custom`).
  - `packages/engine/src/model.js`: `buildContext`, `qrUrl` (VietQR `%20`), `imgPair` (tách lớp 2.5D).
  - `packages/engine/src/render.js` & `packages/engine/src/client/runtime.js`: Hỗ trợ `?topic=` / `?p=` kèm bảo vệ chống `__proto__`.
  - `packages/engine/src/base.css`: Token `--sh-*`, sàn chữ `16px`/`13px`, `.sh-gate[hidden]`, responsive `.sh-cd`.
- **`packages/themes/`**:
  - **7 mẫu v2 đang hoạt động (đã đăng ký trên `/v2/`):**
    1. `packages/themes/thiep-gap-doi/` (`folio` × `unseal-gleam`, 3 topics: `son-mai`, `giay-do`, `lua-nga`)
    2. `packages/themes/chieu-sau/` (`lookbook` × `optical-push` 2.5D, 3 topics: `suong-da-lat`, `dem-sai-gon`, `chang-vang-bien`)
    3. `packages/themes/hop-ky-uc/` (`deck` × `deal-flip`, 2 topics: `hop-nhung`, `buu-thiep`)
    4. `packages/themes/song-gia/` (`split` × `seam-converge`, 2 topics: `gom-su`, `hai-thanh-pho`)
    5. `packages/themes/cuon-phim/` (`scroll`, 3 palettes, ảnh tự chứa trong `packages/themes/cuon-phim/images/`)
    6. `packages/themes/phong-trien-lam/` (`stage`, 4 palettes, `gallery3d.js` camera phẳng)
    7. `packages/themes/to-hong/` (`stage`, 2 palettes, `thread3d.js` camera phẳng + `motion2d.js`)
- **`legacy/` (`@sayhello/legacy`)**: Đóng băng, gồm 10 mẫu v1 (`song-hy`, `thu-tay`, `ve-may-bay`, `khoa-tinh`, `den-long`, `cuon-phim`, `tin-nhan`, `thiep-gap`, `khung-theu`, `ca-phe-phin`), `legacy/studio/`, `legacy/dat-thiep/`, `legacy/ban-hang/`.
- **`supabase/`**: `supabase/config.toml` (PostgreSQL 17, Anonymous Sign-ins bật) + `supabase/migrations/` (chưa có SQL migration).
- **`tests/e2e/` & `apps/web/tests/thiep-v2.mjs`**: Bộ kiểm thử Playwright Tiers 1–4 + `tier1-r1-r2.mjs` (`checkM3Docs()`).
- **`docs/`**: Bộ tài liệu chuẩn đã đồng bộ + `docs/archive/` chứa 12 tài liệu lịch sử cũ.

---

## 2. Tóm tắt thay đổi đã hoàn thành qua M1 → M3

- **M1 (Hoàn thành):** Dọn tệp rác/nguyên mẫu cũ, gộp `plain()`/`qrUrl()` vào `@sayhello/engine`, khử xoay/rung camera 3D ở `phong-trien-lam` (`gallery3d.js`) và `to-hong` (`thread3d.js`), nối `to-hong` vào `apps/web`, sửa 6 lỗi `cuon-phim` (`gateMs: 450`, nhãn `>=13px`, `.flicker` hữu hạn, `overflow-x: clip`, ảnh riêng, VietQR `%20`), tự chứa nhạc nền.
- **M2 (Hoàn thành):** Chuẩn hóa hợp đồng `Layout × Topic × Moment` (`composeInvitation`), thay đăng ký 5 tệp bằng `apps/web/scripts/sync-engine.mjs`, nâng cấp trang `/v2/` và thêm route `/v2/demo/[theme]/[topic]/`, dựng 4 mẫu mới (`thiep-gap-doi`, `chieu-sau`, `hop-ky-uc`, `song-gia`) đạt 4/4 tiêu chí Rubric nhị phân và E2E `PASS=150 / PENDING_MILESTONE=7 / FAIL=0`. *(Lưu ý: 11 tệp tinh chỉnh M2 Iter 2–4 trong `packages/engine/` và `packages/themes/` đang ở trạng thái working tree chưa commit trên nhánh `redesign` cùng đợt cập nhật M3.)*
- **E2E Track (Hoàn thành):** Hoàn thiện khung kiểm thử 4 tầng tại `tests/e2e/run.mjs`.
- **M3 (Hoàn thành):** Di chuyển 12 tài liệu lỗi thời sang `docs/archive/` kèm `docs/archive/README.md`, viết mới và đồng bộ toàn bộ `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md`, `docs/TEMPLATES-AND-TOPICS.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/TAO-MAU-MOI.md`, `docs/RULES.md`, `docs/CLAUDE-HANDOFF.md`, `README.md`, và `CLAUDE.md`.
- **M4 Pha 1 (Đã dọn dẹp):** Gỡ bỏ gói WIP `photobooth` cùng `EXCLUDED_WIP` trong `apps/web/scripts/sync-engine.mjs`, đồng bộ `packages/engine/README.md` theo hợp đồng M2, đưa toàn bộ 7 mẫu v2 về trạng thái `0` pending.

---

## 3. Các lệnh kiểm tra đã xác minh chạy được

```powershell
# 1. Unit test bộ máy @sayhello/engine
npm test -w @sayhello/engine

# 2. Hợp đồng 7/7 mẫu v2 có bộ test riêng
node --test packages/themes/*/test/contract.test.js

# 3. Lint & Typecheck Next.js (@sayhello/web)
npm run lint -w @sayhello/web
npx --prefix apps/web tsc --noEmit --incremental false -p apps/web/tsconfig.json

# 4. Build Next.js SSG (chạy sync-engine.mjs trước đó) & kiểm tra toàn repo
npm run build
npm test

# 5. Kiểm thử Playwright E2E (tự động khởi chạy/dò server)
node tests/e2e/run.mjs --tier=all

# 6. Smoke test v2 (khi dev:legacy :3001 và web :3000 đang chạy)
npm run test:v2
```

---

## 4. Các đầu việc mở cần phối hợp xử lý tiếp

1. **Hoàn thiện Milestone M4 (Tier-5 Hardening & Rubric cuối):**
   Bổ sung kiểm thử đối kháng Tier-5, đánh giá độc lập 4 tiêu chí Rubric nhị phân và kiểm toán toàn kho mã nguồn.
2. **Triển khai Template 5 — *Editorial Monograph*:**
   Bản thiết kế chi tiết đã có trong `docs/TEMPLATES-AND-TOPICS.md` (chương lật bất đối xứng, khoảnh khắc *Develop & Register*, 3 chủ đề *Thực Vật Ép Khô*, *Lưu Bút Kiến Trúc*, *Ấn Bản Khổ Lớn*).
3. **Pha Supabase SaaS Backend (`supabase/migrations/` + Studio v2):**
   Thiết kế lược đồ CSDL PostgreSQL 17, tích hợp trình chỉnh sửa tự phục vụ trên `apps/web/` và kích hoạt lại thư viện `@supabase/*` khi bắt đầu viết tính năng lưu trữ thực tế.

---

## 5. Quy ước cộng tác khi làm việc tiếp

- **Luôn đọc `CLAUDE.md` và `docs/RULES.md` trước khi sửa code**; mọi thay đổi thực hiện trên nhánh `redesign`, không đẩy thẳng `main`.
- **Không tự tạo lại tệp README mặc định trong `apps/web/`** (nằm trong danh sách `LEGACY_JUNK_FILES` của `tests/e2e/lib/registries.mjs`, tạo lại sẽ làm rớt `tier1-r1-r2.mjs`).
- **Không dùng các thuật ngữ bị cấm theo R1** trong bất kỳ tệp mã nguồn hoặc `docs/*.md`, `README.md`, `CLAUDE.md`.
- **Mọi mẫu mới hoặc topic mới** phải chấm đạt **4/4 tiêu chí Rubric nhị phân** trong `docs/TEMPLATES-AND-TOPICS.md` và vượt qua kiểm thử Playwright ở `320×568`, `390×844`, `1440×900`.
