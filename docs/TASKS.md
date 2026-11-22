# Việc cần làm · SayHello

Làm từng bước nhỏ, xong bước nào đánh dấu `[x]` và ghi vào [PROGRESS.md](PROGRESS.md).

## Chủ dự án (cần Ngài làm)

- [ ] Điền **giá thật** cho 3 gói trong `shop.json`, rồi đổi `"giaTam": false`.
- [ ] Điền **tài khoản nhận tiền** (`bank`: mã ngân hàng VietQR, số, tên chủ tài khoản viết hoa không dấu) và **số Zalo** trong `shop.json`.
- [ ] Xóa 2 dòng thử trong Google Sheet: tab `demo-thu-tay` (lời chúc "Thử hệ thống") và tab `_Đơn hàng` (đơn "Thử Hệ Thống").
- [ ] Thử Studio: `git pull`, rồi `npm run studio-link -- demo-thu-tay`, mở link, sửa, Lưu.
- [ ] Nghe thử 3 bài nhạc trong `assets/music/`, bài nào chưa ưng thì báo để làm lại hoặc thay.
- [ ] Chọn **tên miền** (khi sẵn sàng), Claude hướng dẫn gắn vào Vercel.

## Phát triển (Claude làm)

### Gần
- [ ] Gắn tên miền riêng vào Vercel + cập nhật `site.json` (chờ tên miền).
- [ ] Điền `ALLOWED` trong Apps Script khi có thiệp bán đầu tiên (chống ghi rác).
- [ ] Trang chủ: nút "Đặt mẫu này" trên từng mẫu (đi thẳng tới `/dat-thiep/?mau=...`).
- [ ] Studio: tải ảnh lên (qua thư mục Google Drive của người bán), để cặp đôi tự thay ảnh.
- [ ] Ảnh xem trước (`xem-truoc.jpg`) tự tạo từ ảnh cưới + tên cặp đôi khi tạo thiệp.

### Mẫu mới (mỗi mẫu một ý tưởng riêng, xem ý tưởng trong [TAO-MAU-MOI.md](TAO-MAU-MOI.md#3-ý-tưởng-cho-các-mẫu-tiếp-theo))
- [ ] **Cuộn Phim**: máy chiếu, khung phim 35mm, phụ đề.
- [ ] **Mở Khóa Tình Yêu**: xoay ổ khóa số đúng ngày cưới để mở thiệp.
- [ ] **Đèn Lồng Hội An**: thả đèn trôi sông, mỗi đèn một lời chúc.
- [ ] **Tin Nhắn**: giao diện trò chuyện kể chuyện tình.

### Vận hành
- [ ] Trang tổng hợp cho người bán: số đơn, đơn chờ tiền, thiệp sắp tới ngày cưới (đọc từ Sheet).
- [ ] Tự nhắc cặp đôi trước ngày cưới (gửi lại link quản lý khách).
- [ ] Sao lưu Sheet định kỳ.

## Đã xong
Xem [PROGRESS.md](PROGRESS.md).
