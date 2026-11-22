# PRD · SayHello

## Đang xây gì

Bộ công cụ làm **thiệp cưới online** để **bán theo từng thiệp** (không phải SaaS thuê bao). Mỗi thiệp có đường dẫn riêng `https://<tên-miền>/<ten-cap-doi>/`, mở ra như một món quà với hiệu ứng riêng của từng mẫu.

## Dành cho ai

| Người dùng | Cần gì |
|---|---|
| **Người bán (chủ dự án)** | Tạo thiệp nhanh từ đơn, nhiều mẫu độc đáo, nhận tiền chuyển khoản, đối chiếu thủ công, không tốn tiền máy chủ |
| **Cặp đôi (người mua)** | Chọn mẫu, tự sửa nội dung và xem trước ngay, xem ai xác nhận đến, đọc lời chúc, tải danh sách ra Excel |
| **Khách mời** | Mở link trên điện thoại, thấy tên mình trên thiệp, xem giờ, đường đi, xác nhận tham dự, gửi lời chúc, mừng cưới qua QR |

## Mục tiêu

1. Mỗi mẫu là **một câu chuyện riêng** (cửa son, lá thư, vé máy bay...), không phải cùng khung đổi màu. Nhiều hiệu ứng, nhiều ý tưởng mới.
2. **Không cần database**: dữ liệu khách lưu Google Sheets qua Apps Script. Supabase chỉ dùng nếu thật cần.
3. Cặp đôi sửa là **hiện ngay** trên thiệp thật, có xem trước.
4. Bán theo **3 gói**: Cơ bản / Nâng cao / Riêng. Giá do người bán đặt trong `shop.json`.
5. Thanh toán **chuyển khoản QR (VietQR)**, nội dung là mã đơn, người bán **tự đối chiếu**.
6. Mở nhanh trên điện thoại 4G, đẹp ở bề rộng 360–400px.

## Tính năng đã có

- 5 mẫu: **Song Hỷ**, **Thư Tay**, **Vé Máy Bay**, **Khóa Tình**, **Đèn Lồng**.
- Mục dùng chung: đếm ngược, lịch, album, bản đồ, xác nhận tham dự, sổ lưu bút, hộp mừng cưới QR, nhạc nền, thả tim, lời chúc bay, link riêng từng khách `?k=Tên`.
- **Studio** `/studio/`: cặp đôi tự sửa nội dung, xem trước theo thiết bị, lưu lên Sheet.
- **Trang khách** `/studio/khach.html`: thống kê, danh sách, tìm kiếm, tải CSV.
- **Trang đặt thiệp** `/dat-thiep/` + bảng giá trên trang chủ, mã đơn + QR.

## Ngoài phạm vi (hiện tại)

- Đăng nhập tài khoản, thanh toán tự động qua cổng, đa người bán.
- Ứng dụng di động.

## Thước đo thành công

- Tạo xong một thiệp từ đơn trong **dưới 15 phút**.
- Thiệp mở được trong **dưới 3 giây** trên 4G.
- Cặp đôi tự sửa được mà **không cần hỏi** người bán.
