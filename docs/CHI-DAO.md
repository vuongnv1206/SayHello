# Bảng chỉ đạo: agy → Claude

Vai trò (chủ dự án chốt ngày 26/11/2026): **agy chỉ đạo, Claude code chính.** Khi chỉ đạo của agy trái với lời chủ dự án thì làm theo chủ dự án.

## Cách làm việc

1. agy ghi việc cần làm vào mục **Việc được giao**, kèm tiêu chí "xong khi".
2. Claude làm theo thứ tự từ trên xuống, ghi trạng thái và mã commit vào mục **Báo cáo**.
3. agy chấm và góp ý ngay dưới báo cáo đó.
4. Chỉ một bên sửa code (Claude), để không đè lên việc của nhau. agy chỉ sửa file trong `docs/`.

## Chủ dự án đã chốt (agy cần tuân theo)

- Nhìn vào mẫu nào cũng phải nhận ra ngay là **thiệp cưới**: lời mời trang trọng, tên cô dâu chú rể là nhân vật chính.
- **Topic = ý tưởng xuyên suốt** (Photobooth, Thẻ Lên Máy Bay, Album Nhạc…), không phải bảng màu. Mỗi topic một kiểu bố cục và tương tác riêng.
- Tránh quê mùa, sến, chóng mặt. 3D (nếu có) chỉ để tạo chất liệu, camera không bay trong không gian.
- Dùng **ảnh minh hoạ mặc định** trong `assets/anh-minh-hoa/`, không tạo ảnh AI.
- **Chỉ làm trên nhánh `main`, không chia phiên bản** (không còn site cũ, đường dẫn `/v2`, nhánh `redesign`). Chốt ngày 26/11/2026.
- Thông tin ngày, giờ, nơi, trả lời phải dễ tìm. Kiểm tra ở khổ 390×844 và 1440×900.

## Hiện trạng (26/11/2026, sau khi cấu trúc lại)

- Một bộ mã duy nhất trên `main`: `apps/web`, `packages/engine`, `packages/themes` (8 mẫu).
- Site tĩnh cũ (10 mẫu, studio, đặt thiệp, bán hàng, Apps Script) đã xoá; còn trong lịch sử git trước lần cấu trúc lại.
- **Photobooth**: đã duyệt ("tạm ổn"). Còn lệch chuẩn mở bìa `<= 900ms` do đếm 3-2-1 (smoke test và E2E báo lỗi ở mẫu này).
- **Thẻ Lên Máy Bay**, **Album Nhạc**: bản thử ở `prototypes/` (mở thẳng `index.html`), đang chờ chủ dự án duyệt.
- **Trailer Phim**: chưa đạt, đã bỏ bản thử.
- Vercel: `sayhello-wheat.vercel.app` trả 404 trước khi cấu trúc lại. Cần đặt Root Directory là `apps/web`.

## Việc được giao

*(agy ghi ở đây)*

| # | Việc | Xong khi | Ngày giao |
|---|---|---|---|

## Báo cáo

*(Claude ghi trạng thái, agy góp ý bên dưới)*

### 26/11/2026: cấu trúc lại theo yêu cầu chủ dự án

- Phần làm dở sau `12e291b` đã commit (`b3ebf11`), Photobooth được giữ.
- Đã bỏ luật "ảnh mỗi mẫu phải có MD5 duy nhất toàn repo" vì trái với việc dùng ảnh minh hoạ mặc định.
- Đã bỏ các kiểm tra theo cột mốc (`R1`, `M1`–`M3`) và tài liệu lịch sử trong `docs/archive/`.

- Kết quả sau khi cấu trúc lại: test engine 38/38, hợp đồng mẫu 30/30, build, lint và kiểm tra kiểu đạt. Smoke và E2E chỉ còn lỗi ở Photobooth (bìa lâu hơn `900ms`, lớp lấp lánh `infinite`, tương phản chữ `.dai-dau`, các bước hồi âm hết thời gian chờ).
- `packages/themes/to-hong/test/e2e.mjs` (chạy riêng) lỗi ở nút "Thông tin nhanh" nằm ngoài khung nhìn; lỗi đã có từ `b3ebf11`.
- `docs/DESIGN-BRIEF.md` và `docs/CLAUDE-HANDOFF.md` agy đang sửa nên Claude chưa commit. Hai tệp này còn nhắc nhánh `redesign` và `docs/archive/`, cần agy cập nhật.
