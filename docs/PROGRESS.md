# Tiến độ · SayHello

Cập nhật: 2026-11-23. Web: https://sayhello-wheat.vercel.app

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
| 5. Mẫu thứ 4 | **Khóa Tình**: xoay ổ khóa số đúng ngày cưới để mở thiệp, mặt dây chuyền, chùm chìa khóa, ảnh treo lan can, ném chìa xuống sông. Trang chủ có nút **Đặt mẫu này** cho từng mẫu. |
| 6. Mẫu thứ 5 | **Đèn Lồng** (Hội An): thả hoa đăng để mở thiệp, dây đèn lồng sáng dần khi cuộn, cửa chớp gỗ mở album, lời chúc thành hoa đăng, thả đèn trời. |
| Ảnh xem trước | `npm run xem-truoc -- <thiệp>` ghép ảnh cưới + tên + ngày thành ảnh 1200×630 khi gửi link; `npm run new` tự chạy. |
| 7. Mẫu thứ 6 | **Cuộn Phim**: kéo cần máy chiếu, màn ảnh đếm 3-2-1, rèm nhung, bảng clapper từng cảnh, vé xem phim, dải phim 35mm vuốt ngang có tiếng tạch máy ảnh, lời chúc thành phụ đề, hộp bắp rang, danh đề cuối phim. |
| 8. Mẫu thứ 7 | **Tin Nhắn**: màn hình khóa có thông báo tin nhắn mời cưới, nhóm chat hiện từng tin kèm "đang soạn tin", danh thiếp, thẻ lịch hẹn, tin ghim đếm ngược, khách xác nhận và chúc bằng bong bóng chat, bao lì xì, "Đã xem". |
| 9. Vận hành | **Studio tải ảnh**: cặp đôi tự đổi ảnh chính, ảnh cô dâu chú rể, thêm/bớt/sắp xếp album; ảnh thu nhỏ trên máy rồi lưu vào Drive người bán. **Trang `/ban-hang/`**: số đơn, đơn chờ tiền, doanh thu, đám cưới 30 ngày tới (chép lời nhắc), số khách từng thiệp. **Email nhắc** đám cưới còn 7 và 1 ngày, **sao lưu Sheet** mỗi tuần. Code Apps Script có bộ kiểm tra giả lập Google (`tests/apps-script.mjs`, chạy trong `npm test`). |
| 10. Pha 1 đề xuất | Nhạc mở khóa ở lần chạm đầu (iPhone), khách trùng tên không bị gộp (mã khách ẩn danh, cột "Mã khách" mới trong Sheet), Studio có ô sửa xác nhận tham dự, QR mừng cưới điền sẵn tên khách, trang chủ chỉ tải mẫu khi chạm + ô thử tên, lệnh `npm run sync-studio` và `npm run doctor`. |
| Tài liệu | PRD, ARCHITECTURE, DESIGN, RULES, TASKS, PROGRESS trong `docs/`. |

## Lỗi / hạn chế đã biết

- Commit cũ có dữ liệu cặp đôi gốc có thể vẫn mở được trên GitHub nếu biết mã commit; xóa hẳn cần nhờ GitHub Support.
- Claude chưa điều khiển được Chrome của Ngài (tiện ích Claude in Chrome báo chưa kết nối), các bước trên Google/Vercel đang làm tay.
- Plugin Supabase không kết nối được (mạng chặn); hiện không cần vì dùng Google Sheets.
- 3 bài nhạc được tổng hợp bằng code, chưa có người nghe thử; chất lượng cần Ngài duyệt.
- Phần Apps Script mới (tải ảnh lên Drive, trang người bán, email nhắc, sao lưu) mới được kiểm tra trên Google giả lập, chưa chạy trên Google thật vì chưa triển khai lại.
- Ảnh tải lên dùng link `lh3.googleusercontent.com/d/<id>` của Drive; nếu Google đổi cách phục vụ ảnh công khai thì cần đổi sang chỗ lưu khác.
- Chưa đẩy được lên GitHub: tài khoản GitHub trên máy không có quyền ghi (403).
- `shop.json` còn giá tạm, tài khoản và Zalo giả (`0000000000`).
- Trên máy Ngài còn `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo` từ bản Next.js cũ (xóa tay được). Bản Next.js + Supabase dở dang được cất trong `git stash` ("backup truoc khi lay code moi").

## Bước tiếp theo

1. Ngài điền giá, tài khoản, Zalo → bật bán thật.
2. Tải ảnh lên trong Studio (cặp đôi tự thay ảnh).
3. Ngài dán lại Apps Script, triển khai bản mới, chạy `caiDatTuDong` (xem backend/HUONG-DAN.md).
4. Tên miền riêng.

Danh sách đầy đủ: [TASKS.md](TASKS.md).
