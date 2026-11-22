# SayHello · Bộ thiệp cưới online

Làm thiệp cưới online để bán theo từng thiệp. Mỗi thiệp là **một thư mục** với đường dẫn riêng (`/ten-cap-doi/`), chọn một **mẫu thiệp** (theme) có trải nghiệm riêng, dùng chung bộ **hiệu ứng** và **mục** (đếm ngược, album, bản đồ, xác nhận tham dự, sổ lưu bút, hộp quà QR). Không cần database: xác nhận, lời chúc và lượt thả tim lưu vào **Google Sheets** qua Apps Script.

Toàn bộ là file tĩnh, không cần bước build phức tạp: đưa lên Firebase Hosting, Netlify, Vercel hay GitHub Pages đều chạy.

## Xem thử

```bash
npm install                      # lần đầu
npx playwright install chromium  # lần đầu, để chạy npm test
npx serve .                      # hoặc: python3 -m http.server
```

Mở `http://localhost:3000/` để xem trang giới thiệu các mẫu, hoặc thẳng vào thiệp mẫu:

| Mẫu | Thiệp mẫu | Phong cách |
| --- | --- | --- |
| Song Hỷ | `/demo-song-hy/` | Truyền thống: cửa son mở hai cánh, đèn lồng, chữ Hỷ, pháo hoa |
| Thư Tay | `/demo-thu-tay/` | Hiện đại: bóc dấu sáp, lá thư viết tay, cào nhũ lộ ngày cưới, polaroid kéo ném, vé mời |

> Thiệp dùng ES module nên phải mở qua máy chủ web, mở thẳng file `index.html` sẽ không chạy.

## Làm một thiệp mới cho khách

```bash
node scripts/new-invite.mjs minh-khang-thu-ha --theme song-hy
```

1. Sửa `minh-khang-thu-ha/invite.json`: tên, ngày giờ, gia đình, sự kiện, địa điểm, tài khoản mừng cưới, `sheetUrl`.
2. Thay ảnh trong `minh-khang-thu-ha/images/` (giữ tên file hoặc sửa đường dẫn trong `invite.json`). Ảnh `xem-truoc.jpg` cỡ 1200×630 là ảnh hiện khi gửi link qua Zalo/Facebook.
3. Chạy `npm run images -- minh-khang-thu-ha` để nén ảnh (ảnh cưới thật 3-8MB sẽ còn khoảng 150-300KB, tự xoay đúng chiều và bỏ vị trí GPS). Lệnh này ghi đè ảnh, nên giữ ảnh gốc ở nơi khác.
4. Chạy `node scripts/build.mjs minh-khang-thu-ha` để sinh lại `index.html` (tiêu đề và ảnh xem trước).
5. Chạy `npm test` để mở thử mọi thiệp, rồi đưa lên hosting. Link gửi khách: `https://ten-mien/minh-khang-thu-ha/`.

**Đổi mẫu:** sửa `"theme"` trong `invite.json` rồi build lại. Ảnh dùng chung được, mỗi mẫu đọc ảnh theo tên ô (`hero`, `couple`, `groom`, `bride`, `thanks`, `album`...); thiếu ô nào sẽ lấy ảnh trong `album`.

**Xem nhanh mẫu khác mà không sửa file:** thêm `?theme=thu-tay` vào link.

### Link riêng cho từng khách

Thêm `?k=Tên+khách` vào link: `.../minh-khang-thu-ha/?k=Chị+Lan`. Bìa thiệp sẽ ghi "Trân trọng kính mời Chị Lan", tên được điền sẵn vào ô xác nhận và lời chúc.

`?open=1` bỏ qua bìa (tiện khi xem lại).

### `invite.json`

Xem hai thiệp mẫu để có đầy đủ các trường. Những điểm cần biết:

- `date`: giờ Lễ Thành Hôn, dạng `2027-01-10T10:30:00+07:00`. Dùng cho đếm ngược, lịch, Google Calendar.
- `order`: `"groom-first"` (thiệp nhà trai) hoặc `"bride-first"` (thiệp nhà gái).
- `sections`: thứ tự và các mục được bật. Bỏ tên một mục khỏi danh sách để ẩn nó. Không ghi thì dùng mặc định của mẫu.
- `texts`: ghi đè câu chữ của mẫu (lời mời, câu trích dẫn, lời cảm ơn...). Xem `defaults.texts` trong `themes/<mẫu>/theme.js`.
- `effects`: `ambient` (`petals`, `sparkles`, `snow`, `hearts`, `leaves`, `bokeh`, có thể kết hợp), `colors`, `density`, và tắt từng thứ bằng `false`: `loveButton`, `flyingWishes`, `tapHearts`, `progress`.
- `accounts`: có `qr` (ảnh QR sẵn) hoặc `bankCode` theo [vietqr.io](https://vietqr.io) (VCB, TCB, MB, ACB, BIDV, ICB...) để tự tạo QR. Để mảng rỗng thì ẩn hộp quà.
- `sheetUrl`: URL Apps Script. Để trống thì thiệp vẫn chạy nhưng dữ liệu chỉ lưu trên máy khách (để thử).
- `music`: đường dẫn file nhạc. Để trống thì không có nút nhạc.

## Google Sheets (không cần database)

Một script dùng chung cho mọi thiệp, mỗi thiệp tự có một tab riêng. Hướng dẫn cài từng bước: [backend/HUONG-DAN.md](backend/HUONG-DAN.md).

## Cấu trúc

```
index.html            Trang giới thiệu các mẫu (để bán)
site.json             baseUrl của trang web (cho ảnh xem trước khi chia sẻ link)
core/                 Phần dùng chung cho mọi mẫu
  boot.js             Đọc invite.json, nạp mẫu, dựng trang, mở bìa
  widgets.js          Các mục: đếm ngược, lịch, album, polaroid, bản đồ, xác nhận, lưu bút, hộp quà, cào nhũ
                      Hiệu ứng theo thuộc tính: data-rv, data-type, data-tilt, data-parallax, data-zoom, data-fireworks
  fx.js               Hạt bay trên canvas: cánh hoa, kim tuyến, tuyết, tim, lá vàng, bokeh, pháo giấy, pháo hoa
  chrome.js           Nhạc nền, nút thả tim, lời chúc bay ngang, tim bay khi chạm, xem ảnh, lời cảm ơn
  backend.js          Gửi/đọc dữ liệu Google Sheets
  base.css            Kiểu mặc định độ ưu tiên 0 cho mọi thành phần dùng chung
themes/<mẫu>/         theme.js (bố cục + câu chữ mặc định) và theme.css
themes/index.json     Danh sách mẫu hiện trên trang giới thiệu
demo-<mẫu>/           Thiệp mẫu, cũng là bản gốc để sao chép khi tạo thiệp mới
<ten-cap-doi>/        Mỗi thiệp bán ra: invite.json + images/ + index.html (sinh tự động)
backend/              Code Apps Script và hướng dẫn
scripts/              new-invite.mjs, build.mjs
assets/music/         Nhạc nền dùng chung
```

## Tạo mẫu thiệp mới

Xem [docs/TAO-MAU-MOI.md](docs/TAO-MAU-MOI.md): cách một mẫu hoạt động, các khối có sẵn, và nguyên tắc thiết kế để mỗi mẫu thật sự khác nhau.
