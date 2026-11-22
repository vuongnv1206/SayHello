# Cài Google Sheets làm nơi lưu xác nhận, lời chúc và lượt thả tim

Không cần database hay máy chủ riêng. Làm **một lần**, dùng chung cho mọi thiệp.

## 1. Tạo Sheet và dán code

1. Vào [sheets.new](https://sheets.new) tạo một Google Sheet mới, đặt tên ví dụ "SayHello – dữ liệu thiệp".
2. Menu **Tiện ích mở rộng → Apps Script**.
3. Xóa hết code mẫu, dán toàn bộ nội dung file [`apps-script.gs`](apps-script.gs).
4. Sửa dòng `STUDIO_SECRET` thành một chuỗi bí mật của riêng Ngài (dài, khó đoán). Ghi đúng chuỗi đó vào file `.env` ở thư mục dự án trên máy: `STUDIO_SECRET=chuoi-cua-ban`. File `.env` không được đưa lên GitHub.
5. Bấm **Lưu**.

## 2. Triển khai thành Web App

1. Bấm **Triển khai → Tùy chọn triển khai mới**.
2. Bánh răng cạnh "Chọn loại" → **Ứng dụng web**.
3. **Thực thi dưới dạng:** Tôi. **Người có quyền truy cập:** Bất kỳ ai.
4. Bấm **Triển khai**, cấp quyền cho tài khoản Google của bạn.
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

## Hằng ngày

- **Xem ai đến:** mở tab của thiệp, lọc cột "Loại" = Xác nhận.
- **Ẩn lời chúc không phù hợp:** gõ `x` vào cột **Ẩn** của dòng đó. Thiệp sẽ không hiện nữa.
- **Gửi dữ liệu riêng cho cặp đôi:** chuột phải vào tab → Sao chép vào → Bảng tính mới, rồi chia sẻ bảng tính mới đó. Như vậy cặp đôi không thấy dữ liệu của thiệp khác.
- **Chống ghi rác:** điền danh sách thiệp đã bán vào `ALLOWED` ở đầu script, rồi triển khai lại (Triển khai → Quản lý → sửa → Phiên bản mới). URL không đổi.

## Cặp đôi muốn tự giữ dữ liệu?

Làm lại các bước trên bằng tài khoản Google của cặp đôi, rồi dán URL của họ vào `sheetUrl`. Mỗi thiệp có thể dùng Sheet khác nhau.

## Giới hạn

Apps Script miễn phí đủ cho hàng trăm thiệp cỡ bình thường (vài trăm khách mỗi thiệp). Nếu một ngày có quá nhiều lượt gửi cùng lúc, Google có thể chậm lại vài giây, thiệp vẫn hiển thị bình thường.
