# SayHello · Bộ thiệp cưới online

Làm thiệp cưới online để bán theo từng thiệp. Mỗi thiệp là **một thư mục** với đường dẫn riêng (`/ten-cap-doi/`), chọn một **mẫu thiệp** (theme) có trải nghiệm riêng, dùng chung bộ **hiệu ứng** và **mục** (đếm ngược, album, bản đồ, xác nhận tham dự, sổ lưu bút, hộp quà QR). Không cần database: xác nhận, lời chúc và lượt thả tim lưu vào **Google Sheets** qua Apps Script.

Toàn bộ là file tĩnh, không cần bước build phức tạp. Đang chạy trên Vercel: https://sayhello-wheat.vercel.app

**Tài liệu:** [PRD](docs/PRD.md) · [Kiến trúc](docs/ARCHITECTURE.md) · [Thiết kế](docs/DESIGN.md) · [Quy tắc](docs/RULES.md) · [Việc cần làm](docs/TASKS.md) · [Tiến độ](docs/PROGRESS.md) · [Tạo mẫu mới](docs/TAO-MAU-MOI.md) · [Bán thiệp](docs/BAN-THIEP.md)

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
| Vé Máy Bay | `/demo-ve-may-bay/` | Trẻ trung: xé cuống thẻ lên máy bay, máy bay bay theo đường cuộn, bảng giờ bay lật chữ, hộ chiếu đóng dấu, ảnh qua ô cửa sổ, vali mừng cưới |
| Khóa Tình | `/demo-khoa-tinh/` | Lãng mạn: xoay ổ khóa số đúng ngày cưới để mở, mặt dây chuyền đung đưa, chùm chìa khóa kỷ niệm, ảnh treo lan can cầu, hộp nhẫn, ném chìa xuống sông |
| Đèn Lồng | `/demo-den-long/` | Hoài cổ phố Hội: thả hoa đăng để mở, dây đèn lồng sáng dần, đôi đèn lồng ôm ảnh, cửa chớp gỗ mở album, lời chúc thành hoa đăng, thả đèn trời |
| Cuộn Phim | `/demo-cuon-phim/` | Điện ảnh: kéo cần máy chiếu, màn ảnh đếm 3-2-1, rèm nhung mở ảnh cưới, bảng clapper từng cảnh, vé xem phim, dải phim 35mm vuốt ngang (có tiếng tạch máy ảnh), lời chúc thành phụ đề, hộp bắp rang mừng cưới, danh đề cuối phim |
| Thiệp Gấp | `/demo-thiep-gap/` | Thủ công: mở nắp thiệp giấy gấp, các lớp giấy cắt (cổng hoa, đôi uyên ương) dựng đứng, giấy xếp chồng, ngăn kéo giấy đựng quà |
| Khung Thêu | `/demo-khung-theu/` | Mộc mạc: giữ ngón tay trên khung thêu để đường chỉ chạy thành họa tiết, mảnh vải vá, ảnh trong khung thêu tròn, túi gấm rút dây |
| Cà Phê Phin | `/demo-ca-phe-phin/` | Ấm cúng: chạm phin để cà phê nhỏ giọt đầy ly, thực đơn "Ngày chung đôi" kẻ chấm, phiếu order xác nhận, hũ tiền tip |
| Tin Nhắn | `/demo-tin-nhan/` | Hiện đại: thông báo trên màn hình khóa, nhóm chat hiện từng tin kèm "đang soạn tin", danh thiếp cô dâu chú rể, thẻ lịch hẹn, tin ghim đếm ngược, khách trả lời bằng bong bóng chat, bao lì xì, "Đã xem" |

> Thiệp dùng ES module nên phải mở qua máy chủ web, mở thẳng file `index.html` sẽ không chạy.

## Làm một thiệp mới cho khách

```bash
node scripts/new-invite.mjs minh-khang-thu-ha --theme song-hy
```

1. Sửa `minh-khang-thu-ha/invite.json`: tên, ngày giờ, gia đình, sự kiện, địa điểm, tài khoản mừng cưới, `sheetUrl`.
2. Thay ảnh trong `minh-khang-thu-ha/images/` (giữ tên file hoặc sửa đường dẫn trong `invite.json`). Ảnh `xem-truoc.jpg` (1200×630) là ảnh hiện khi gửi link qua Zalo/Facebook: lệnh tạo thiệp tự làm từ ảnh chính + tên + ngày cưới; thay ảnh xong chạy `npm run xem-truoc -- minh-khang-thu-ha` để làm lại (thêm `--anh images/anh3.jpg` để chọn ảnh khác).
3. Chạy `npm run images -- minh-khang-thu-ha` để nén ảnh (ảnh cưới thật 3-8MB sẽ còn khoảng 150-300KB, tự xoay đúng chiều và bỏ vị trí GPS). Lệnh này ghi đè ảnh, nên giữ ảnh gốc ở nơi khác.
4. Chạy `node scripts/build.mjs minh-khang-thu-ha` để sinh lại `index.html` (tiêu đề và ảnh xem trước).
5. Chạy `npm test` để mở thử mọi thiệp, rồi đưa lên hosting. Link gửi khách: `https://ten-mien/minh-khang-thu-ha/`.

**Đổi mẫu:** sửa `"theme"` trong `invite.json` rồi build lại. Ảnh dùng chung được, mỗi mẫu đọc ảnh theo tên ô (`hero`, `couple`, `groom`, `bride`, `thanks`, `album`...); thiếu ô nào sẽ lấy ảnh trong `album`.

**Xem nhanh mẫu khác mà không sửa file:** thêm `?theme=thu-tay` vào link.

### Link riêng cho từng khách

Thêm `?k=Tên+khách` vào link: `.../minh-khang-thu-ha/?k=Chị+Lan`. Cặp đôi tự tạo hàng loạt ở trang Quản lý khách, tab **Tạo link mời**. Bìa thiệp sẽ ghi "Trân trọng kính mời Chị Lan", tên được điền sẵn vào ô xác nhận và lời chúc.

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
- `music`: đường dẫn file nhạc, vd. `../assets/music/dao-buoc.mp3` (3 bài có sẵn, xem `assets/music/README.md`). Để trống thì không có nút nhạc.

## Cặp đôi tự sửa thiệp (Studio)

Mỗi thiệp có một link Studio riêng, có mã sửa bí mật. Cặp đôi sửa tên, ngày giờ, gia đình, lịch lễ, bản đồ, câu chữ, các phần hiện trên thiệp, hiệu ứng, tài khoản mừng cưới, và đổi mẫu thiệp. Mọi thay đổi hiện ngay trong khung xem trước (điện thoại, máy tính bảng, máy tính, bìa hoặc bên trong, xem như một khách cụ thể). Bấm **Lưu** là thiệp thật cập nhật luôn, không cần build lại.

```bash
npm run studio-link -- minh-khang-thu-ha
```

In ra link Studio và link trang **Quản lý khách** (số người sẽ đến, chia theo nhà trai/nhà gái, lời chúc, tải file Excel). Cần `STUDIO_SECRET` trong file `.env`, giống chuỗi trong Apps Script.

Ảnh, nhạc và `sheetUrl` vẫn do người bán quản lý trong `invite.json`. Nội dung cặp đôi sửa nằm ở tab `_Nội dung` trong Google Sheet. Thêm `?goc=1` vào link thiệp để xem bản gốc chưa có phần cặp đôi sửa.

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

## Bán thiệp

Trang **`/dat-thiep/`**: khách chọn mẫu, chọn gói, nhận mã đơn và mã QR chuyển khoản. Giá, tài khoản nhận tiền, số Zalo nằm trong `shop.json`. Đối chiếu tiền và tạo thiệp từ đơn: [docs/BAN-THIEP.md](docs/BAN-THIEP.md).
