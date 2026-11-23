# Việc cần làm · SayHello

Làm từng bước nhỏ, xong bước nào đánh dấu `[x]` và ghi vào [PROGRESS.md](PROGRESS.md).

## Chủ dự án (cần Ngài làm)

- [ ] Điền **giá thật** cho 3 gói trong `shop.json`, rồi đổi `"giaTam": false`.
- [ ] Điền **tài khoản nhận tiền** (`bank`: mã ngân hàng VietQR, số, tên chủ tài khoản viết hoa không dấu) và **số Zalo** trong `shop.json`.
- [ ] Xóa 2 dòng thử trong Google Sheet: tab `demo-thu-tay` (lời chúc "Thử hệ thống") và tab `_Đơn hàng` (đơn "Thử Hệ Thống").
- [ ] Thử Studio: `git pull`, rồi `npm run studio-link -- demo-thu-tay`, mở link, sửa, Lưu.
- [ ] Nghe thử 3 bài nhạc trong `assets/music/`, bài nào chưa ưng thì báo để làm lại hoặc thay.
- [ ] **Sửa quyền đẩy code lên GitHub:** máy đang đăng nhập GitHub bằng tài khoản không có quyền ghi vào `vuongnv1206/SayHello` (lỗi 403), nên các commit mới chưa lên được. Đăng nhập lại đúng tài khoản rồi `git push`.
- [ ] **Cập nhật Apps Script** (bản mới có tải ảnh, trang người bán, nhắc cưới, sao lưu): làm theo mục "Cập nhật code Apps Script" và "Nhắc ngày cưới, sao lưu, trang người bán" trong [backend/HUONG-DAN.md](../backend/HUONG-DAN.md). Xong thì thử tải một ảnh trong Studio của `demo-thu-tay`.
- [ ] Chọn **tên miền** (khi sẵn sàng), Claude hướng dẫn gắn vào Vercel.

## Phát triển (Claude làm)

### Gần
- [ ] Gắn tên miền riêng vào Vercel + cập nhật `site.json` (chờ tên miền).
- [ ] Điền `ALLOWED` trong Apps Script khi có thiệp bán đầu tiên (chống ghi rác).
- [x] Trang chủ: nút "Đặt mẫu này" trên từng mẫu (đi thẳng tới `/dat-thiep/?mau=...`).
- [x] Studio: tải ảnh lên (qua thư mục Google Drive của người bán), để cặp đôi tự thay ảnh.
- [x] Ảnh xem trước (`xem-truoc.jpg`) tự tạo từ ảnh cưới + tên cặp đôi khi tạo thiệp (`npm run xem-truoc`).

### Mẫu mới (mỗi mẫu một ý tưởng riêng, xem ý tưởng trong [TAO-MAU-MOI.md](TAO-MAU-MOI.md#3-ý-tưởng-cho-các-mẫu-tiếp-theo))
- [x] **Cuộn Phim** (mẫu `cuon-phim`): kéo cần máy chiếu, đếm 3-2-1, khung phim 35mm, phụ đề, danh đề cuối phim.
- [x] **Mở Khóa Tình Yêu** (mẫu `khoa-tinh`): xoay ổ khóa số đúng ngày cưới để mở thiệp.
- [x] **Đèn Lồng Hội An** (mẫu `den-long`): thả đèn trôi sông, mỗi đèn một lời chúc.
- [x] **Tin Nhắn** (mẫu `tin-nhan`): màn hình khóa có thông báo, nhóm chat kể chuyện tình, khách trả lời bằng bong bóng chat.

### Vận hành
- [x] Trang tổng hợp cho người bán: số đơn, đơn chờ tiền, thiệp sắp tới ngày cưới (đọc từ Sheet) · `/ban-hang/`.
- [x] Tự nhắc cặp đôi trước ngày cưới (email mỗi sáng cho người bán, kèm lời nhắn soạn sẵn có link quản lý khách).
- [x] Sao lưu Sheet định kỳ (mỗi thứ Hai, giữ 8 bản trên Drive).

### Đề xuất mở rộng (từ [PROPOSAL.md](PROPOSAL.md), chờ Ngài duyệt)

**Pha 1: sửa lỗi thật, việc nhỏ**
- [ ] Nhạc trên iPhone: 4 mẫu (`khoa-tinh`, `den-long`, `cuon-phim`, `tin-nhan`) mở thiệp trong `setTimeout`, Safari có thể chặn nhạc. Mở khóa nhạc (tắt tiếng) ngay lúc khách chạm bìa.
- [ ] Khách trùng tên bị gộp làm một: `latest()` ở `studio/khach.html` và `readAdmin()` ở Apps Script gộp xác nhận theo tên. Đổi sang mã khách.
- [ ] Studio: thêm ô sửa `rsvp` (số khách tối đa, các lựa chọn bên nhà trai/gái); sửa gợi ý `groom.bio` (6/7 mẫu dùng, không chỉ 2).
- [ ] Hộp mừng cưới: QR VietQR tự điền nội dung "Mung cuoi <tên khách>" (`addInfo`).
- [ ] Trang chủ: ảnh tĩnh thay iframe, chạm mới tải mẫu; ô "thử tên hai bạn".
- [ ] `npm run sync-studio -- <thiệp>` (kéo bản sửa Studio về `invite.json` + ảnh xem trước) và `npm run doctor` (soát lỗi trước khi giao).

**Pha 2: cặp đôi tự làm nhiều hơn**
- [ ] Nhóm khách `?n=` (nhà trai/nhà gái/bạn bè): lời mời, buổi lễ, địa điểm riêng theo nhóm.
- [ ] Ảnh thẻ mời có tên khách + QR trong trang quản lý khách (gửi Zalo cho người lớn tuổi).
- [ ] Xác nhận tham dự: chọn buổi lễ, ghi chú ăn chay/xe đón, gửi kèm lời chúc.
- [ ] Cặp đôi tự ẩn/ghim lời chúc trên web; danh sách khách mời lưu trên Sheet (tab riêng có mã), đánh dấu "đã gửi".
- [ ] Bảng màu có sẵn cho từng mẫu, chọn trong Studio.

**Pha 3: vòng đời thiệp, ngày cưới**
- [ ] Sau ngày cưới chuyển sang trang kỷ niệm; hết hạn gói thì hiện trang lưu niệm (không 404).
- [ ] Tên miền riêng cho gói Riêng: `publicUrl`/`assetBase`, CORS trong `vercel.json`.
- [ ] Màn hình lời chúc tại tiệc `?wall=1`; xếp bàn và check-in.
- [ ] `/dat-thiep/`: báo trùng đường dẫn, tra cứu trạng thái mã đơn.
- [ ] 5 ý tưởng mẫu mới: Thiệp Gấp Pop-up, Khung Thêu, Cà Phê Phin, Bình Gốm Kintsugi, Kính Vạn Hoa.

## Đã xong
Xem [PROGRESS.md](PROGRESS.md).
