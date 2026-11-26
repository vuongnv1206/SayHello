# Quy tắc kỹ thuật & Quy trình làm việc · SayHello

Áp dụng bắt buộc cho mọi thành viên và trợ lý AI tham gia phát triển kho mã nguồn `D:\MyCode\SayHello`.

---

## 1. Quy trình Git & Nhánh làm việc

1. **Nhánh phát triển hiện hành là `redesign`:** Phát triển bản v2 (`apps/web/`, `packages/engine/`, `packages/themes/`, `docs/`, `tests/e2e/`) trên nhánh `redesign` rồi tạo **Pull Request vào `main`**, chờ `.github/workflows/check.yml` xanh hoàn toàn trước khi gộp. **Không đẩy trực tiếp code thử nghiệm lên `main`** để bảo vệ bản `legacy/` đang chạy phục vụ khách hàng thật.
2. **Thông điệp commit ngắn gọn bằng tiếng Việt**, mỗi commit gói gọn một mục tiêu rõ ràng.
3. **Đồng bộ tài liệu khi đổi cấu trúc:** Khi thêm mẫu, đổi hợp đồng engine hoặc thay đổi lệnh chạy, cập nhật tương ứng `docs/ARCHITECTURE.md`, `docs/TEMPLATES-AND-TOPICS.md` và `docs/CLAUDE-HANDOFF.md`. Không giữ tài liệu mâu thuẫn với đĩa; mọi tài liệu lỗi thời phải đưa vào `docs/archive/`.

---

## 2. Phân biệt lệnh gốc Repo vs. Workspace `legacy/`

| Lệnh | Phạm vi thực thi | Ghi chú quan trọng |
|---|---|---|
| `npm run dev` | `@sayhello/web` (`:3000`) | Tự chạy `sync-engine.mjs` trước (`predev`). Cần chạy kèm `dev:legacy` nếu kiểm tra fallback route cũ. |
| `npm run dev:legacy` | `@sayhello/legacy` (`:3001`) | Phục vụ trang chủ v1, Studio v1, `/dat-thiep/`, `/demo-*`. |
| `npm run build` | `@sayhello/web` | **Build Next.js 16 + SSG**, chạy `sync-engine.mjs` trước đó. **Không** phải lệnh build của `legacy/`. |
| `npm run build -w @sayhello/legacy` | `@sayhello/legacy` | Sinh lại các trang `index.html` trong `legacy/` (CI báo lỗi nếu sửa `invite.json`/`site.json` mà quên chạy lệnh này). |
| `npm test` | `@sayhello/engine` + `@sayhello/legacy` | Chạy unit test engine (`node --test`) và bộ kiểm thử `legacy/`. |
| `npm test -w @sayhello/engine` | `@sayhello/engine` | Chạy nhanh unit test bộ máy v2. |
| `npm run test:v2` | `apps/web/tests/thiep-v2.mjs` | Smoke test Playwright cho các mẫu v2 tại `http://localhost:3000`. |
| `node tests/e2e/run.mjs --tier=all` | `tests/e2e/` | Bộ kiểm thử Playwright đầy đủ 4 tầng (Tiers 1–4, 0 pending). |

---

## 3. Ràng buộc mã nguồn & Chất lượng bắt buộc (E2E Invariants)

1. **Không dùng React trong trang thiệp (`packages/engine/`, `packages/themes/*`, `legacy/`):** Thiệp của khách render bằng HTML/JS thuần từ `renderDocument()` và nâng cấp tuần tự qua `packages/engine/src/client/runtime.js`.
2. **Tuân thủ Next.js 16 trong `apps/web/`:** Đọc `apps/web/AGENTS.md` và tài liệu trong `node_modules/next/dist/docs/` trước khi sửa code Next.js.
3. **Khống chế thời gian mở bìa & chuyển động an toàn:**
   - Mở bìa hoàn tất trong **`<= 900ms`** (chuẩn `450ms`).
   - Không xoay camera 3D tự do, không rung lắc camera nhàn rỗi, không đặt hiệu ứng `infinite` trên lớp phủ diện tích lớn.
   - Bắt buộc có bản tĩnh `?tier=lite`, hỗ trợ `prefers-reduced-motion`, và gắn `bindContextLoss` khi dùng WebGL.
4. **Sàn chữ tiếng Việt & tương phản:**
   - Thân văn bản `>= 16px`, nhãn tiếng Việt có dấu `>= 13px`, tương phản `>= 4.5:1`.
   - Mọi font mới phải có bộ ký tự `vietnamese`; tách chữ bằng `splitText()` (`Intl.Segmenter`).
   - Không tràn ngang (`docOverflow = 0`) trên cả `320×568`, `390×844` và `1440×900`.
5. **An toàn dữ liệu & VietQR:**
   - HTML escape qua `` html`...` ``; chỉ dùng `raw()` cho chuỗi tĩnh nội bộ; bảo vệ trước `?topic=__proto__`.
   - Link VietQR qua `qrUrl()` hoặc `encodeURIComponent` (`%20`, không dùng dấu `+` cho khoảng trắng).
   - Ảnh mỗi mẫu/demo phải có **MD5 duy nhất**, không trùng lặp giữa các thư mục mẫu.
6. **Vệ sinh mã nguồn & tệp cấm R1:**
   - Tuyệt đối không đưa lại các mẫu đã loại bỏ theo R1 vào mã nguồn hoạt động hay tài liệu hiện hành (`docs/*.md`, `README.md`, `CLAUDE.md`) — kiểm tra bởi `tests/e2e/specs/tier1-r1-r2.mjs`.
   - Giữ `legacy/` ổn định (chỉ sửa lỗi nếu cần); không tái tạo tệp README mặc định của `create-next-app` trong `apps/web/` (nằm trong danh sách `LEGACY_JUNK_FILES` của `tests/e2e/lib/registries.mjs`).

---

## 4. Quy tắc Bảo mật & Dữ liệu

- ❌ **Không bao giờ commit** `STUDIO_SECRET`, tệp `.env` (như `legacy/.env` hay biến môi trường cục bộ), tệp `.local.gs` (như `legacy/backend/apps-script.local.gs`), khóa `service_role` Supabase, mật khẩu hoặc token API lên Git hay ghi vào tài liệu.
- ❌ **Không đưa dữ liệu thật của cặp đôi** (tên thật, số điện thoại, số tài khoản ngân hàng, ảnh cá nhân) vào `demo.json`, `docs/` hay test. Chỉ dùng tên giả và số `0000000000`.
- ❌ **Không để kiểm thử tự động ghi vào Google Sheet thật** của khách hàng đang vận hành.
- ❌ **Không dùng `push --force`** lên `main` hoặc xóa dữ liệu thiệp đã bán.
