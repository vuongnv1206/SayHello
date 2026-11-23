# Bán thiệp: từ đơn đặt tới đường dẫn thiệp

Trang đặt thiệp: **`/dat-thiep/`** (trang chủ có nút "Đặt thiệp ngay" và bảng giá dẫn tới đây).
Có thể chọn sẵn mẫu hoặc gói bằng link: `/dat-thiep/?mau=ve-may-bay&goi=nang-cao`.

## 1. Cài đặt một lần

Mở **`shop.json`** ở thư mục gốc:

| Trường | Ý nghĩa |
|---|---|
| `packages` | 3 gói: tên, giá (đồng), câu giới thiệu, danh sách quyền lợi. `featured: true` để làm nổi gói đó, `priceFrom: true` để hiện "từ …đ" |
| `giaTam` | Đang `true` vì giá là giá tạm. Đặt giá thật xong thì đổi thành `false` để ẩn dòng "Giá đang để tạm" |
| `bank` | Tài khoản **nhận tiền của Ngài**: `bankCode` (mã VietQR, vd. `MB`, `VCB`, `TCB`), tên ngân hàng, số tài khoản, tên chủ tài khoản (viết hoa không dấu) |
| `zalo` | Số Zalo để khách nhắn sau khi chuyển khoản |
| `orderSheetUrl` | Link Apps Script (dùng chung link với thiệp, xem `backend/HUONG-DAN.md`). Để trống thì đơn không ghi vào Sheet, khách vẫn thấy QR và nhắn Zalo |

Sửa xong thì commit, Vercel tự cập nhật.

## 2. Khi có đơn

1. Khách điền form, nhận **mã đơn** dạng `SH7K2QPX` và mã QR có sẵn số tiền, nội dung chuyển khoản = mã đơn.
2. Đơn ghi vào tab **`_Đơn hàng`** trong Google Sheet, cột Trạng thái là "Chờ chuyển khoản".
3. **Đối chiếu:** mở app ngân hàng, tìm giao dịch có nội dung chứa mã đơn, đúng số tiền thì đổi Trạng thái thành **"Đã nhận tiền"**. Khách cũng nhắn Zalo kèm ảnh chụp chuyển khoản.

## 3. Tạo thiệp từ đơn

Lấy tên, ngày, mẫu, đường dẫn trong dòng đơn rồi chạy:

```bash
npm run new -- minh-khang-thu-ha --theme ve-may-bay --groom "Minh Khang" --bride "Thu Hà" --date 2027-05-22
```

Lệnh tạo thư mục `minh-khang-thu-ha/` theo thiệp mẫu, điền sẵn tên và ngày (lịch lễ dời theo). Sau đó:

1. Thay ảnh trong `minh-khang-thu-ha/images/` (ảnh khách gửi qua Zalo), chạy `npm run images` để nén, rồi `npm run xem-truoc -- minh-khang-thu-ha` để làm ảnh xem trước (ảnh cưới + tên + ngày) hiện khi gửi link.
2. Điền `sheetUrl` trong `invite.json`, chạy `npm run build`, commit và đẩy lên. Vercel tự đăng.
3. `npm run studio-link -- minh-khang-thu-ha` để lấy link Studio và link quản lý khách, gửi cho cặp đôi.
4. Đổi Trạng thái đơn thành "Đã giao".

Phần còn lại (gia đình, lịch lễ, địa điểm, câu chữ, hành trình, tài khoản mừng cưới, **ảnh cưới và album**) cặp đôi tự sửa trong Studio. Ảnh cặp đôi tải lên nằm trong Drive của bạn. Khi cặp đôi đã đổi ảnh trong Studio thì ảnh trong Studio được ưu tiên; muốn thay ảnh hộ họ, hãy mở link Studio của họ thay vì sửa `invite.json`.

**Theo dõi:** trang `/ban-hang/` (lấy link: `npm run studio-link -- --ban-hang`) gom đơn chờ tiền, đám cưới sắp tới kèm lời nhắc soạn sẵn, số khách từng thiệp. Bật email nhắc hằng ngày và sao lưu hằng tuần theo [backend/HUONG-DAN.md](../backend/HUONG-DAN.md).

## Lệnh hỗ trợ

- `npm run doctor` soát lỗi trước khi giao (số giả, thiếu `sheetUrl`, ảnh nặng, thiếu ảnh xem trước, ngày cưới đã qua).
- `npm run sync-studio -- <thiệp> [--dry-run]` kéo phần cặp đôi đã sửa trong Studio về `invite.json`, làm lại ảnh xem trước và `index.html` để link gửi Zalo khớp nội dung mới. `--dry-run` chỉ in ra phần sẽ đổi.

## Gợi ý theo gói

- **Cơ bản:** làm như trên.
- **Nâng cao:** thêm link riêng cho từng khách (`/ten-cap-doi/?k=Tên+Khách`), nhạc riêng (`music` trong `invite.json`), tới 20 ảnh trong `images.album`.
- **Riêng:** làm mẫu mới theo `docs/TAO-MAU-MOI.md`.
