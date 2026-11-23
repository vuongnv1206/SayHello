# Cài Google Sheets làm nơi lưu xác nhận, lời chúc và lượt thả tim

Không cần database hay máy chủ riêng. Làm **một lần**, dùng chung cho mọi thiệp.

## 1. Tạo Sheet và dán code

1. Ở thư mục dự án trên máy, chạy:
   ```bash
   npm run apps-script
   ```
   Lệnh này tự tạo mã bí mật `STUDIO_SECRET` (lưu trong file `.env`, không đưa lên GitHub), điền mã vào code Apps Script và **chép sẵn code vào clipboard**. Nếu không chép được, mở file `backend/apps-script.local.gs`, Ctrl+A rồi Ctrl+C.
2. Vào [sheets.new](https://sheets.new) tạo một Google Sheet mới, đặt tên ví dụ "SayHello – dữ liệu thiệp".
3. Menu **Tiện ích mở rộng → Apps Script**.
4. Trong khung code, Ctrl+A để chọn hết code mẫu, rồi Ctrl+V để dán.
5. Bấm biểu tượng **Lưu** (hình đĩa mềm).

## 2. Triển khai thành Web App

1. Bấm **Triển khai → Tùy chọn triển khai mới**.
2. Bánh răng cạnh "Chọn loại" → **Ứng dụng web**.
3. **Thực thi dưới dạng:** Tôi. **Người có quyền truy cập:** Bất kỳ ai.
4. Bấm **Triển khai**. Google hỏi quyền: **Cấp quyền truy cập** → chọn tài khoản → nếu hiện "Google chưa xác minh ứng dụng này" thì bấm **Nâng cao** → **Đi tới ... (không an toàn)** → **Cho phép**. Đây là script của chính bạn nên an toàn.
5. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).

## 3. Gắn vào thiệp

Dán URL vào `invite.json` của từng thiệp:

```json
"sheetUrl": "https://script.google.com/macros/s/XXXX/exec"
```

Lần đầu có khách gửi, Sheet tự tạo một tab tên đúng bằng đường dẫn của thiệp (ví dụ `minh-khang-thu-ha`).

## Gửi link cho cặp đôi

```bash
npm run studio-link -- ten-cap-doi
```

Gửi cặp đôi link **Studio** (để sửa thiệp) và link **Quản lý khách**. Hai link này có mã riêng, ai có link là sửa được, nên dặn cặp đôi không chia sẻ. Đổi `STUDIO_SECRET` là mọi link cũ hết hiệu lực.

## Cập nhật code Apps Script (khi dự án có bản mới)

1. Chạy `npm run apps-script` (code đã điền sẵn mã bí mật và địa chỉ web được chép vào clipboard).
2. Mở Apps Script của Sheet, Ctrl+A, Ctrl+V, **Lưu**.
3. **Triển khai → Quản lý các bản triển khai → bút chì (sửa) → Phiên bản: Phiên bản mới → Triển khai.** URL giữ nguyên, không cần sửa thiệp.
4. Nếu Google hỏi quyền mới (Drive, Gmail) thì cấp quyền như lần đầu.

## Nhắc ngày cưới, sao lưu, trang người bán (làm một lần)

1. Trong trình soạn Apps Script, chọn hàm **`caiDatTuDong`** ở thanh trên → **Chạy** → cấp quyền (Gmail để gửi email cho chính bạn, Drive để sao lưu và lưu ảnh).
2. Từ đó:
   - **8 giờ sáng mỗi ngày:** nếu có đám cưới còn 7 ngày hoặc 1 ngày (theo tab `_Đơn hàng`, hoặc ngày cặp đôi sửa trong Studio), bạn nhận một email gồm số Zalo cặp đôi và **lời nhắn soạn sẵn** có link quản lý khách. Chép lời nhắn gửi qua Zalo. Đơn có trạng thái "Đã hủy" thì không nhắc.
   - **3 giờ sáng thứ Hai:** sao lưu cả Sheet vào thư mục Drive **"SayHello – sao lưu"**, giữ 8 bản mới nhất (bản cũ vào thùng rác Drive, khôi phục được trong 30 ngày). Lượt thả tim được ghi kèm vào tab `_Thả tim`.
3. **Trang tổng hợp:** chạy `npm run studio-link -- --ban-hang` để lấy link `/ban-hang/?ma=...` (chỉ mình bạn dùng, đừng chia sẻ). Trang có: số đơn, đơn chờ tiền, doanh thu, đám cưới 30 ngày tới (nút **Chép lời nhắc**), số khách từng thiệp.

## Ảnh cặp đôi tải lên trong Studio

Ảnh được thu nhỏ trên máy cặp đôi (cạnh dài 1600px) rồi lưu vào Drive của bạn, thư mục **"SayHello – ảnh thiệp/<tên thiệp>"**, chế độ "ai có link đều xem được" để thiệp hiện ảnh. Mỗi thiệp tải tối đa 120 ảnh. Đừng xóa thư mục này khi thiệp còn dùng.

## Cột mới trong tab của từng thiệp

Bản mới thêm 4 cột cuối: **Mã khách** (để hai khách trùng tên không bị gộp), **Sự kiện** (khách dự buổi lễ nào), **Ghi chú** và **Ghim**. Tab cũ vẫn dùng được bình thường, không cần sửa tay. Cặp đôi ẩn/ghim lời chúc ngay trên trang quản lý khách; vẫn có thể gõ `x` vào cột **Ẩn** như trước. Danh sách khách mời cặp đôi lưu ở tab `_Khách mời` (chỉ mở được bằng link quản lý của chính thiệp đó).

## Hằng ngày

- **Xem ai đến:** mở tab của thiệp, lọc cột "Loại" = Xác nhận.
- **Ẩn lời chúc không phù hợp:** gõ `x` vào cột **Ẩn** của dòng đó. Thiệp sẽ không hiện nữa.
- **Gửi dữ liệu riêng cho cặp đôi:** chuột phải vào tab → Sao chép vào → Bảng tính mới, rồi chia sẻ bảng tính mới đó. Như vậy cặp đôi không thấy dữ liệu của thiệp khác.
- **Chống ghi rác:** điền danh sách thiệp đã bán vào `ALLOWED` ở đầu script, rồi triển khai lại (Triển khai → Quản lý → sửa → Phiên bản mới). URL không đổi.

## Cặp đôi muốn tự giữ dữ liệu?

Làm lại các bước trên bằng tài khoản Google của cặp đôi, rồi dán URL của họ vào `sheetUrl`. Mỗi thiệp có thể dùng Sheet khác nhau.

## Giới hạn

Apps Script miễn phí đủ cho hàng trăm thiệp cỡ bình thường (vài trăm khách mỗi thiệp). Nếu một ngày có quá nhiều lượt gửi cùng lúc, Google có thể chậm lại vài giây, thiệp vẫn hiển thị bình thường.
