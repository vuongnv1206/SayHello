# Kiến trúc · SayHello

## Công nghệ

| Phần | Dùng gì | Vì sao |
|---|---|---|
| Giao diện | HTML + CSS + JavaScript **ES module thuần**, không framework, không bước build | Nhẹ, mở nhanh, dễ sửa, hosting nào cũng chạy |
| Hosting | **Vercel** (tự đăng lại mỗi lần `main` thay đổi) | Người bán quen dùng. Địa chỉ: https://sayhello-wheat.vercel.app |
| Lưu dữ liệu | **Google Sheets + Apps Script** (`backend/apps-script.gs`) | Miễn phí, người bán mở Sheet là xem được |
| Ảnh | `sharp` (nén ảnh, `npm run images`) | Ảnh cưới 5MB còn ~200KB |
| QR ngân hàng | img.vietqr.io | Không cần đăng ký |
| Kiểm tra | Playwright (`npm test`) + GitHub Actions | Mở thử mọi trang trước khi lên |

## Cấu trúc thư mục

```
index.html            Trang chủ: các mẫu + bảng giá
dat-thiep/            Trang đặt thiệp (form, mã đơn, QR)
studio/               Studio cho cặp đôi + trang quản lý khách
core/                 Phần dùng chung cho mọi mẫu
  boot.js               Khởi động thiệp: đọc dữ liệu, nạp mẫu, dựng trang, mở bìa
  content.js            Đọc invite.json + phần cặp đôi đã sửa (Sheet), danh sách trường được sửa
  widgets.js            Các mục: đếm ngược, lịch, album, polaroid, bản đồ, xác nhận, lưu bút, hộp quà, lớp cào
  fx.js                 Hạt bay, pháo giấy, pháo hoa (canvas)
  chrome.js             Nhạc, thả tim, lời chúc bay, thanh tiến độ, xem ảnh lớn
  backend.js            Gửi/đọc dữ liệu với Apps Script (không có thì lưu trên máy)
  util.js, base.css
themes/<mẫu>/         theme.js (bố cục + câu chuyện) + theme.css; danh sách ở themes/index.json
<ten-cap-doi>/        Một thiệp: invite.json + images/ + index.html (sinh tự động)
demo-<mẫu>/           Thiệp mẫu của từng mẫu
backend/              apps-script.gs + HUONG-DAN.md
scripts/              build, new, images, studio-link, apps-script
tests/smoke.mjs       Kiểm tra tự động
shop.json             Giá 3 gói, tài khoản nhận tiền, Zalo, link nhận đơn
site.json             Địa chỉ web chính (cho ảnh xem trước)
docs/                 Tài liệu (file này)
```

## Luồng dữ liệu

**Khách mở thiệp**
1. `/<slug>/index.html` (có sẵn tiêu đề, ảnh xem trước) nạp `core/boot.js`.
2. `content.js` đọc `invite.json`, rồi hỏi Sheet `?type=content` (chờ tối đa 2,5 giây) lấy phần cặp đôi đã sửa, gộp lại.
3. `boot.js` nạp font + `theme.css`, gọi `theme.render(ctx)` dựng bìa và nội dung, gắn hiệu ứng.
4. Khách xác nhận / gửi lời chúc / thả tim → `backend.js` POST lên Apps Script → ghi vào tab mang tên `<slug>`.

**Cặp đôi sửa thiệp**
1. Link `/studio/?thiep=<slug>&ma=<mã>`. Mã = HMAC-SHA256(slug, `STUDIO_SECRET`), 16 ký tự đầu.
2. Sửa form → khung xem trước tải lại thiệp với dữ liệu nháp (postMessage).
3. Bấm Lưu → POST `type=content` kèm mã → Apps Script kiểm tra mã → ghi tab `_Nội dung`. Thiệp thật đổi ngay.

**Khách đặt thiệp**
1. `/dat-thiep/` đọc `shop.json` + `themes/index.json`.
2. Gửi đơn → tạo mã `SHxxxxxx` → POST `type=order` → tab `_Đơn hàng` (trạng thái "Chờ chuyển khoản").
3. Hiện QR VietQR đúng số tiền, nội dung = mã đơn. Người bán đối chiếu trong app ngân hàng.

## Bảo mật

- `STUDIO_SECRET` chỉ nằm trong `.env` trên máy người bán và trong Apps Script đã triển khai. Không bao giờ đưa lên GitHub.
- Apps Script chặn công thức (`=`, `+`, `-`, `@`) để Sheet không chạy nội dung khách gõ, giới hạn độ dài mọi trường.
- `ALLOWED` trong script để chỉ nhận dữ liệu từ thiệp đã bán.
- Kiểm tra tự động không bao giờ gửi dữ liệu lên Sheet thật.

Chi tiết cách viết một mẫu: [TAO-MAU-MOI.md](TAO-MAU-MOI.md). Quy trình bán: [BAN-THIEP.md](BAN-THIEP.md).
