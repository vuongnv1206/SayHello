# Tiến độ · SayHello

Cập nhật: 2026-11-22. Web: https://sayhello-wheat.vercel.app

## Đã xong

| Giai đoạn | Nội dung |
|---|---|
| 1. Nền móng | Dựng lại repo thành bộ thiệp nhiều mẫu (`core/` + `themes/`), mỗi thiệp một thư mục. Xóa toàn bộ dữ liệu của cặp đôi gốc khỏi lịch sử Git. Kiểm tra tự động (Playwright + GitHub Actions). Cấu hình Vercel. |
| 1. Mẫu | **Song Hỷ** (chuyển từ thiệp gốc), **Thư Tay** (mới). |
| 2. Studio | Cặp đôi tự sửa thiệp, xem trước theo thiết bị, lưu là thiệp đổi ngay. Trang quản lý khách: thống kê, tìm, tải CSV. Mã sửa riêng từng thiệp (HMAC). |
| 3. Mẫu mới | **Vé Máy Bay**: xé cuống vé, máy bay bay theo đường cuộn, bảng giờ bay lật chữ, hộ chiếu đóng dấu, hành trình tình yêu (sửa trong Studio). Thêm ~20 ý tưởng mẫu. |
| 4. Bán thiệp | Bảng giá 3 gói (giá tạm), trang `/dat-thiep/`: mã đơn + QR VietQR, đơn ghi vào tab `_Đơn hàng`. Lệnh tạo thiệp từ đơn. Hướng dẫn đối chiếu ([BAN-THIEP.md](BAN-THIEP.md)). |
| Lên mạng | Vercel chạy ở `sayhello-wheat.vercel.app`, ảnh xem trước khi gửi Zalo/Facebook. |
| Google Sheets | Apps Script đã triển khai, nối với 3 thiệp mẫu và trang đặt thiệp. Đã thử thật: lời chúc, đơn hàng, thả tim. `npm run apps-script` tạo mã bí mật và chuẩn bị code. |
| Nhạc | Thay `nhac.mp3` (không rõ bản quyền) bằng 3 bài **tự sáng tác bằng code**: Hộp nhạc, Dạo bước, Bình minh. Cặp đôi chọn nhạc trong Studio. |
| Link mời | Trang quản lý khách có tab **Tạo link mời**: dán danh sách tên, ra link riêng từng khách, sao chép kèm lời mời, tải CSV. |
| Tài liệu | PRD, ARCHITECTURE, DESIGN, RULES, TASKS, PROGRESS trong `docs/`. |

## Lỗi / hạn chế đã biết

- Commit cũ có dữ liệu cặp đôi gốc có thể vẫn mở được trên GitHub nếu biết mã commit; xóa hẳn cần nhờ GitHub Support.
- Claude chưa điều khiển được Chrome của Ngài (tiện ích Claude in Chrome báo chưa kết nối), các bước trên Google/Vercel đang làm tay.
- Plugin Supabase không kết nối được (mạng chặn); hiện không cần vì dùng Google Sheets.
- 3 bài nhạc được tổng hợp bằng code, chưa có người nghe thử; chất lượng cần Ngài duyệt.
- `shop.json` còn giá tạm, tài khoản và Zalo giả (`0000000000`).
- Trên máy Ngài còn `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo` từ bản Next.js cũ (xóa tay được). Bản Next.js + Supabase dở dang được cất trong `git stash` ("backup truoc khi lay code moi").

## Bước tiếp theo

1. Ngài điền giá, tài khoản, Zalo → bật bán thật.
2. Nút "Đặt mẫu này" trên trang chủ, tải ảnh lên trong Studio.
3. Mẫu thứ 4: Cuộn Phim hoặc Mở Khóa Tình Yêu.
4. Tên miền riêng.

Danh sách đầy đủ: [TASKS.md](TASKS.md).
