# Kho lưu trữ tài liệu cũ (`docs/archive/`)

Thư mục này lưu giữ **12 tài liệu lịch sử** thuộc giai đoạn v1 (site tĩnh gốc repo), giai đoạn thử nghiệm 3D không gian ban đầu, và các bản nháp trước khi tái cấu trúc **Milestone M1–M3**. Các tài liệu này được giữ lại chỉ để tra cứu ngữ cảnh lịch sử — **không dùng làm chuẩn thực thi** cho mã nguồn hiện tại.

> **Tài liệu chuẩn đang hiệu lực nằm trực tiếp trong `docs/`:**
> - [ASSESSMENT-AND-RESTRUCTURING-PLAN.md](../ASSESSMENT-AND-RESTRUCTURING-PLAN.md) — Đánh giá đa góc độ, phản biện thẳng thắn, phân tích nguyên nhân chóng mặt 3D & kế hoạch tái cấu trúc
> - [TEMPLATES-AND-TOPICS.md](../TEMPLATES-AND-TOPICS.md) — Kiến trúc 5 mẫu (Card-as-Centerpiece), chủ đề sáng tạo, tiêu chí chống sến (anti-cringe) & rubric nhị phân 4 tiêu chí
> - [DESIGN.md](../DESIGN.md) — Hệ thiết kế `Layout × Topic × Moment`, hợp đồng token `--sh-*`, chuẩn chữ tiếng Việt & cổng chất lượng
> - [ARCHITECTURE.md](../ARCHITECTURE.md) — Kiến trúc monorepo hiện hành (`apps/web/`, `packages/engine/`, `packages/themes/`, `legacy/`, `supabase/`, `tests/e2e/`)
> - [TAO-MAU-MOI.md](../TAO-MAU-MOI.md) — Hướng dẫn phát triển mẫu & chủ đề mới trên `@sayhello/engine`
> - [RULES.md](../RULES.md) — Quy trình Git (`redesign`), quy tắc viết code, bảo mật & kiểm thử E2E
> - [CLAUDE-HANDOFF.md](../CLAUDE-HANDOFF.md) — Bối cảnh bàn giao & cộng tác cho Claude ở panel bên cạnh

## Danh mục 12 tài liệu đã lưu trữ

| Tệp lưu trữ | Giai đoạn / Bản chất | Lý do thay thế & loại khỏi `docs/` chính | Tài liệu thay thế hiệu lực |
|---|---|---|---|
| `PROGRESS.md` | Nhật ký tiến độ v1 (trước monorepo) | Dùng cấu trúc thư mục gốc cũ và chứa tên mẫu đã loại bỏ theo R1, gây nhiễu kiểm tra tĩnh `tier1-r1-r2`. | `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md`, `docs/CLAUDE-HANDOFF.md` |
| `PROPOSAL.md` | Đề xuất v1 (trước monorepo) | Mô tả mô hình non-SaaS v1 và các mẫu đã xóa theo R1; sai khác với kiến trúc monorepo v2 hiện tại. | `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` |
| `REDESIGN.md` | Lộ trình làm lại ngày 23/11 | Chứa tên mẫu R1 đã xóa, giả định kiến trúc cũ (tách gói schema rời, build Vite từng mẫu) đã được thay bằng `@sayhello/engine` + `sync-engine.mjs`. | `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md`, `docs/ARCHITECTURE.md` |
| `PRD.md` | Đặc tả sản phẩm v1 | Ghi "không phải SaaS", "không cần database" và liệt kê đường dẫn gốc v1 thay vì `legacy/` + `apps/web/` + `supabase/`. | `docs/ARCHITECTURE.md`, `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` |
| `TASKS.md` | Danh sách việc v1 | Tham chiếu `shop.json` ở gốc repo và quy trình bán thủ công v1, không còn khớp với các workspace hiện tại. | `docs/CLAUDE-HANDOFF.md`, `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` |
| `BRIEF-3D.md` | Brief 3D không gian | Cổ vũ camera bay qua hành lang/hồ/bầu trời 3D và ép khám phá 2–4 phút; mâu thuẫn với chuẩn **Card-as-Centerpiece** đã chốt. | `docs/DESIGN.md`, `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` |
| `Y-TUONG-3D-HO-GUONG-BAU-TROI.md` | Ý tưởng `ho-guong` & `bau-troi-anh` | Hai mẫu này gây khó nhìn/chóng mặt và đã được cất vào tag Git `archive/v2-themes-2026-11`. | `docs/TEMPLATES-AND-TOPICS.md` |
| `Y-TUONG-DOT-2.md` | Brainstorm đợt 2 | Tham chiếu các nguyên mẫu HTML đã bị xóa (`chu-la-hinh`, `hai-bo`, `hai-vong-lich`, nguyên mẫu `to-hong` cũ). | `docs/TEMPLATES-AND-TOPICS.md` |
| `THAM-MUU-THIET-KE.md` | Tài liệu tham mưu trước tái cấu trúc | Đề xuất 3D không gian (`bau-troi-anh` 360°, `ho-guong`), mô tả trạng thái cũ của các mẫu `legacy/` trước commit `1e5f6e8`, và dẫn đường dẫn cục bộ máy cá nhân. | `docs/DESIGN.md`, `docs/TEMPLATES-AND-TOPICS.md` |
| `BAN-THIEP.md` | Hướng dẫn vận hành bán thiệp v1 | Hướng dẫn chạy lệnh gốc repo (`npm run new`, `npm run build` cho `legacy/`) và đọc `shop.json` gốc thay vì `legacy/README.md` và `-w @sayhello/legacy`. | `legacy/README.md`, `docs/RULES.md` |
| `KE-HOACH-TAI-CAU-TRUC.md` | Bản nháp thảo luận 25/11/2026 | Bản nháp đã hoàn thành vai trò định hướng; toàn bộ phân tích, phản biện và lộ trình đã được chuẩn hóa thành kế hoạch chính thức sau M1–M2. | `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` |
| `KHONG-KHUON-MAU.md` | Bảng kiểm chống khuôn mẫu 24/11/2026 | 19 thói quen khuôn mẫu, cổng hiệu quả H1–H7 và hai phép thử **Bịt logo** / **Hai giây** đã được hợp nhất trực tiếp vào chuẩn thiết kế và rubric hiện hành. | `docs/DESIGN.md`, `docs/TEMPLATES-AND-TOPICS.md` |
