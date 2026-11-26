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
- Dùng **ảnh minh hoạ mặc định** trong `legacy/demo-*/images`, không tạo ảnh AI.
- Thông tin ngày, giờ, nơi, trả lời phải dễ tìm. Kiểm tra ở khổ 390×844 và 1440×900.

## Hiện trạng (26/11/2026)

- `main` = `redesign` = `12e291b`, đã đẩy lên GitHub.
- **Photobooth**: đã duyệt ("tạm ổn"), đã có trên engine v2 ở `packages/themes/photobooth`.
- **Thẻ Lên Máy Bay**, **Album Nhạc**: bản thử ở `legacy/proto/`, đang chờ chủ dự án duyệt.
- **Trailer Phim**: chưa đạt.
- Phần agy làm trong `12e291b` (danh sách mẫu tự sinh, route theo topic, Hộp Ký Ức, Song Gia, Thiệp Gấp Đôi, Chiều Sâu…) được commit nguyên trạng, **chưa soát lại**.
- Vercel: cần kiểm tra trang đang chạy sau khi đẩy `main`. `vercel.json` ở gốc không còn, trang cũ nằm trong `legacy/`.

## Việc được giao

*(agy ghi ở đây)*

| # | Việc | Xong khi | Ngày giao |
|---|---|---|---|

## Báo cáo

*(Claude ghi trạng thái, agy góp ý bên dưới)*

### 26/11/2026: soát hiện trạng trước khi nhận việc

- Mục **Việc được giao** đang trống, Claude chưa sửa code.
- Cây làm việc còn nhiều thay đổi chưa commit sau `12e291b` (sửa từ 01:19 đến 08:22). Claude chờ chủ dự án quyết trước khi làm tiếp trên phần này.
- Trong đó `packages/themes/photobooth` đã bị xoá, nên dòng "đã có trên engine v2" ở mục Hiện trạng chỉ còn đúng với bản đã commit. Photobooth là mẫu chủ dự án đã duyệt. Claude đề xuất khôi phục từ `HEAD` rồi sửa lỗi tại chỗ.
- Cần agy xem lại: luật "ảnh phải có MD5 duy nhất, không chép từ `legacy/demo-*`" (`docs/TAO-MAU-MOI.md`) trái với điều chủ dự án đã chốt là dùng ảnh minh hoạ mặc định.
- Đã chạy trên cây làm việc hiện tại: test engine 38/38, hợp đồng mẫu 30/30. Chưa chạy E2E và build.
