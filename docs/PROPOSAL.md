# Đề xuất Ý tưởng Mở rộng & Đặc tả Trọng tâm · SayHello

> **Tài liệu đề xuất (Proposal Only):** Tài liệu này tổng hợp kết quả khảo sát hiện trạng mã nguồn tại `D:\MyCode\SayHello`, đề xuất các ý tưởng mới **không trùng lặp** với tính năng hiện có hay backlog đã ghi (R1), và cung cấp đặc tả chi tiết cho **5 Ý tưởng Trọng tâm** (R2) theo đúng kiến trúc thuần HTML/CSS/JS ES module + Vercel tĩnh + Google Apps Script của dự án.

---

## 1. Bối cảnh, Hiện trạng Dự án & Ranh giới Chống Trùng Lặp

### 1.1. Tóm tắt Kiến trúc & Hiện trạng Mã nguồn

SayHello là bộ công cụ làm **thiệp cưới online bán theo từng thiệp** (không phải SaaS thuê bao), triển khai tĩnh trên Vercel (`site.json:2`: `https://sayhello-wheat.vercel.app`) với chi phí máy chủ và cơ sở dữ liệu bằng 0.

| Thành phần | Tệp / Thư mục thực tế | Hiện trạng đã xây dựng & vận hành |
|---|---|---|
| **Cấu hình & Hosting** | `package.json:1-20`, `vercel.json:1-13`, `.vercelignore:1-10`, `site.json:1-5`, `shop.json:1-58` | `"type": "module"`, không có `dependencies` runtime (`devDependencies` chỉ có `playwright` và `sharp`). `vercel.json` cấu hình `"framework": null`, `"outputDirectory": "."`, `no-cache` cho `/(.*)/invite.json`. `shop.json` định nghĩa 3 gói (`co-ban` 199.000đ / 6 tháng, `nang-cao` 399.000đ / 12 tháng, `rieng` từ 1.490.000đ / không hết hạn), hiện vẫn bật `"giaTam": true` và số Zalo/STK giữ chỗ `0000000000`. |
| **Core Engine** | `core/boot.js`, `core/content.js`, `core/backend.js`, `core/util.js`, `core/fx.js`, `core/chrome.js`, `core/widgets.js`, `core/base.css` | Nạp `invite.json` + bản sửa từ Sheet `_Nội dung` (`core/content.js:46-54`, timeout 2.5s, bỏ qua với `?goc=1`), hỗ trợ `?theme=`, `?open=1`, `?studio=1` (`fromStudio()` dòng 35-43), `EDITABLE` (`core/content.js:7`, gồm `'rsvp'`, `'images'`), `cleanImages()` lọc ảnh + `captions` (`core/content.js:13-20`), tên khách `?k=`/`?khach=`/`#k=`/`#khach=` (`core/util.js:45-49`), 10 widget (`core/widgets.js`), 6 hiệu ứng thuộc tính, 6 loại hạt canvas (`fx.js`), nhạc nền, thả tim gom tối đa 50 lượt/lần, lời chúc bay 3 làn, modal cụng ly `cheers`, lightbox và CSS `:where()` độ ưu tiên 0 (`core/base.css`). |
| **7 Mẫu thiệp chính thức** | `themes/index.json:1-104`, `themes/{song-hy,thu-tay,ve-may-bay,khoa-tinh,den-long,cuon-phim,tin-nhan}/` và 7 thư mục `demo-*/` | Đã commit đầy đủ 7 mẫu: **Song Hỷ**, **Thư Tay**, **Vé Máy Bay**, **Khóa Tình**, **Đèn Lồng**, **Cuộn Phim**, **Tin Nhắn** (commits `4fc79af`, `fe6588d`). |
| **Studio & Quản lý khách** | `studio/index.html`, `studio/studio.js:1-428`, `studio/studio.css`, `studio/khach.html` | Cặp đôi tự sửa thiệp qua `?thiep=<slug>&ma=<key>` (HMAC-SHA256 16 ký tự), xem trước tức thì qua `postMessage` trên 3 khung thiết bị, chế độ `cover`/`inside`, thử tên khách `?k=`, tải ảnh lên Drive & nhập `images.captions` (`studio/studio.js:253-302`), lưu nháp `localStorage` và lưu lên tab `_Nội dung` (`352-371`). `studio/khach.html` thống kê số khách đến theo `side`, tìm kiếm, xuất CSV UTF-8 BOM, và tab `Tạo link mời` sinh hàng loạt link `?k=`. |
| **Trang chủ, Đặt thiệp & Bán hàng** | `index.html:1-132`, `dat-thiep/index.html:1-158`, `dat-thiep/dat-thiep.js:1-156`, `ban-hang/index.html:1-174` | `index.html` dựng danh sách 7 mẫu từ `themes/index.json` và 3 gói từ `shop.json`. `/dat-thiep/` hỗ trợ chọn sẵn `?mau=`/`?goi=`, tự tạo `slug`, sinh mã đơn `SHxxxxxx`, POST `type=order` vào tab `_Đơn hàng`, hiển thị mã VietQR `compact2.png` điền sẵn số tiền và `addInfo=code`, chép câu nhắn Zalo vào clipboard. `ban-hang/index.html` cung cấp trang tổng hợp đơn hàng/thiệp cho người bán. |
| **Backend Google Apps Script** | `backend/apps-script.gs:1-423`, `backend/HUONG-DAN.md:1-75` | Một script dùng chung mọi thiệp: `doGet` (`53-65`) xử lý `admin` (`55`, gọi `readAdmin()` tại `311-325`), `hearts`, `content` (công khai, không `validKey`), `guests` (yêu cầu `validKey`), `wishes` (lọc cột `Ẩn` trống, `MAX_WISHES = 300` tại dòng 51); `doPost` (`67-106`) xử lý `order`, `heart`, `upload` (`79-82`), `content` (tối đa `45000` ký tự tại dòng 87), `rsvp`, `wish`. Tự động hóa vận hành gồm `nhacCuoi()` (`353-360`), `saoLuu()` (`365-379`) và `caiDatTuDong()` (`382-389`). Bảo mật bằng `ALLOWED` (`30`), `STUDIO_SECRET` (`34`), `cut()` (`415-419`) và `LockService` (`91-92`). |
| **Scripts & Kiểm thử** | `scripts/{build,new-invite,optimize-images,xem-truoc,studio-link,apps-script}.mjs`, `scripts/tao-nhac.py`, `tests/{smoke,apps-script}.mjs`, `.github/workflows/check.yml` | Đầy đủ CLI tạo thiệp từ đơn, nén ảnh bằng `sharp`, tự ghép ảnh OG `1200x630` (`xem-truoc.jpg`), sinh HTML tĩnh cho từng thiệp, tạo link Studio HMAC, tổng hợp 3 bản nhạc MP3 miễn bản quyền, và kiểm thử tự động (`tests/apps-script.mjs` + Playwright `tests/smoke.mjs` ở `390x844`). |

### 1.2. Ranh giới Chống Trùng Lặp (Những gì ĐÃ CÓ hoặc ĐÃ GHI trong Backlog)

Để đảm bảo toàn bộ ý tưởng trong đề xuất này đều **mới thực sự**, tài liệu loại trừ hoàn toàn các hạng mục sau:

- **Tính năng đã chạy trong mã nguồn:** Thư mục tĩnh theo slug (`/<slug>/`), chuyển mẫu qua `?theme=`, bỏ qua bìa `?open=1`, bỏ qua bản sửa `?goc=1`, cá nhân hóa tên khách `?k=`, 7 mẫu thiệp đã commit (`song-hy`..`tin-nhan`), 10 widget ở `core/widgets.js`, 6 loại hạt + pháo giấy/pháo hoa ở `core/fx.js`, nhạc nền/thả tim/lời chúc bay/`cheers`/lightbox ở `core/chrome.js`, Studio chỉnh sửa & xem trước realtime + tải ảnh Drive & chú thích ảnh (`studio/studio.js:253-302`), `khach.html` thống kê/RSVP/lời chúc/tạo link `?k=` hàng loạt/CSV, `/dat-thiep/` tạo đơn `SHxxxxxx` + VietQR, `ban-hang/index.html`, `xem-truoc.mjs`, `optimize-images.mjs`, `tao-nhac.py`, `smoke.mjs` & `tests/apps-script.mjs`.
- **Đầu việc đã ghi trong `docs/TASKS.md` (phân rõ `[x]` đã hoàn thành trong mã nguồn & `[ ]` còn mở):**
  - Studio tải ảnh lên qua thư mục Google Drive của người bán (`docs/TASKS.md:22`, đã đánh dấu `[x]` hoàn thành trong mã nguồn & `docs/PROGRESS.md:23`, chờ chủ dự án cập nhật Apps Script theo `docs/TASKS.md:13`).
  - Trang tổng hợp cho người bán đọc `_Đơn hàng`, đếm đơn chờ tiền và thiệp sắp cưới (`docs/TASKS.md:32`, đã đánh dấu `[x]` hoàn thành tại `ban-hang/index.html` & `docs/PROGRESS.md:23`).
  - Tự nhắc cặp đôi trước ngày cưới và gửi lại link quản lý khách (`docs/TASKS.md:33`, đã đánh dấu `[x]` hoàn thành tại `backend/apps-script.gs:353-360`).
  - Sao lưu Google Sheet định kỳ (`docs/TASKS.md:34`, đã đánh dấu `[x]` hoàn thành tại `backend/apps-script.gs:365-379`).
  - Gắn tên miền riêng vào Vercel + điền `ALLOWED` trong Apps Script (`docs/TASKS.md:19-20`, vẫn `[ ]` đang mở).
- **Ý tưởng mẫu thiệp đã liệt kê trong `docs/TAO-MAU-MOI.md:105-135`:**
  - *Đã xong:* `Cuộn Phim`, `Mở Khóa Tình Yêu` (`khoa-tinh`), `Đèn Lồng Hội An` (`den-long`), `Tin Nhắn` (`tin-nhan`).
  - *Đã ghi ý tưởng:* `Báo Xuân`, `Đĩa Than`, `Băng Cát-sét`, `Máy Ảnh Lấy Liền`, `Vườn Ép Hoa`, `Ô Chữ`, `Cào Vé Số`, `Bói Bánh Quy May Mắn`, `Mê Cung`, `Đêm Sao`, `Tàu Đêm Thống Nhất`, `Mùa Trong Năm`, `Bản Đồ Kho Báu`, `Tranh Đông Hồ`, `Áo Dài & Nón Lá`, `Mâm Quả`, `Trang Web 1999`, `Thời Tiết`.

---

## 2. Phân tích Khoảng trống Theo Hành trình Người dùng

Qua đối chiếu trực tiếp mã nguồn hiện tại với 3 nhóm người dùng trong `docs/PRD.md:9-13` và mục tiêu hiệu năng `docs/PRD.md:37-41`, có 5 nhóm khoảng trống rõ rệt:

1. **Khách mời (360–400px trên mạng 4G):**
   - Link `?k=` (`core/util.js:45-49`) chỉ thay một chuỗi tên, chưa phân tách được khách **Nhà trai / Nhà gái / Bạn bè** khi đám cưới có nhiều buổi lễ khác thành phố (`demo-song-hy/invite.json:29-43` Hà Nội & Đà Nẵng, `demo-cuon-phim/invite.json:33-46` Lễ Vu Quy & Tiệc Cưới).
   - `W.rsvp` (`core/widgets.js:127-152`) chưa cho chọn tham dự buổi lễ nào, chưa có ghi chú ăn chay/dị ứng/xe đưa đón, và bắt khách gõ lại tên 2 lần giữa RSVP và Lưu bút.
   - 4/7 mẫu (`themes/khoa-tinh/theme.js:221`, `themes/den-long/theme.js:221`, `themes/cuon-phim/theme.js:263`, `themes/tin-nhan/theme.js:209`) gọi `ctx.open(false)` trong `setTimeout`, khiến `chrome.playMusic()` (`core/boot.js:73`) chạy ngoài cử chỉ chạm đồng bộ (và `core/chrome.js:56-57` đặt `audio.preload = 'none'`) nên dễ bị Safari iOS chặn phát nhạc.
   - `W.gcalUrl` (`core/widgets.js:45-52`) chỉ hỗ trợ Google Calendar (thiếu file `.ics` cho iPhone Calendar), toàn bộ nhãn ngày giờ/biểu mẫu (`core/util.js:26`, `core/widgets.js:41,127-160` và các `themes/*/theme.js` như `themes/tin-nhan/theme.js:9`) đều đặt cứng tiếng Việt (thiếu song ngữ `vi`/`en`), và chưa có chế độ chữ lớn/tương phản cao cho người lớn tuổi.
2. **Cặp đôi (Studio & `khach.html`):**
   - `studio/khach.html:72` và `backend/apps-script.gs:315` (`readAdmin()`) cùng khử trùng lặp RSVP bằng tên viết thường (`r.name.trim().toLowerCase()` / `r.name.toLowerCase().trim()`), làm **ghi đè dữ liệu** nếu hai khách trùng tên (vd. "Chị Lan", "Minh") trên cả bảng thống kê cặp đôi lẫn `/ban-hang/`, và không cho khách tự sửa phản hồi an toàn.
   - `studio/khach.html:89-91` chỉ đọc lời chúc và thấy chữ `(đã ẩn)`, không có nút **ẩn/hiện hay ghim lời chúc** ngay trên web (vẫn phải nhờ người bán gõ `x` vào Sheet theo `backend/HUONG-DAN.md:65`). Tab `Tạo link mời` (`studio/khach.html:96-123`) mới lưu nháp thô ở `localStorage` một máy, chưa có trạng thái "đã gửi", chưa import CSV nhiều cột, chưa fetch/gộp `?type=content` (`studio/khach.html:140-144` chỉ fetch `invite.json` và `?type=guests`), và chưa tạo được **ảnh thẻ mời có QR** để gửi người lớn tuổi qua Zalo.
   - `studio/studio.js:101-207` mới bổ sung phần tải ảnh & nhập `images.captions` (`253-302`), nhưng vẫn **thiếu hoàn toàn ô chỉnh `rsvp`** (`maxGuests`, `sides` dù `core/content.js:7` đã liệt kê `'rsvp'`); gợi ý `groom.bio` tại `studio/studio.js:119` cũng lỗi thời khi hiện 6/7 mẫu (trừ `song-hy`) dùng `bio`.
   - `core/base.css:4-14` khai báo biến `--c-*` cho các khối dùng chung, nhưng kiểm tra toàn bộ **7/7** tệp `themes/*/theme.css` cho thấy có **`0` tham chiếu `var(--c-*)`** trong selector riêng của theme (mỗi mẫu dùng biến riêng như `--wall`, `--velvet`, `--wax`, `--brass` cùng 40–121 mã màu hex cứng) và Studio chưa có bảng màu preset cho cặp đôi chọn.
   - Hộp mừng cưới `W.gift` (`core/widgets.js:197`) chỉ tạo QR chứa `accountName`, không điền sẵn `addInfo` mang tên khách để dễ đối chiếu sao kê.
3. **Vận hành, Bán hàng & Vòng đời Thiệp:**
   - `index.html:100-106` đã đặt `<iframe loading="lazy">` ở dòng 100 cho từng thẻ mẫu, nhưng khi cuộn qua danh sách 7 mẫu (và sẽ tăng lên 10+), trình duyệt vẫn tải đồng thời nhiều `<iframe>` đầy đủ (font, JS, ảnh, vòng lặp canvas `core/fx.js:95-118`), gây nặng trên 4G.
   - `/dat-thiep/` (`dat-thiep/dat-thiep.js:62-70`) chỉ kiểm tra định dạng `slug` chứ chưa kiểm tra trùng với thư mục hoặc đơn đã đặt; chưa có khung xem thử tên cặp đôi trực tiếp trước khi đặt, cũng chưa có nơi tra cứu trạng thái mã đơn `SHxxxxxx`.
   - Khi cặp đôi sửa tên/ngày/mẫu trong Studio (`studio/studio.js:360-361`), `invite.json` và `images/xem-truoc.jpg` trên disk không tự đồng bộ lại (`scripts/build.mjs:15-39` chỉ đọc `invite.json`), làm ảnh OG khi chia sẻ Zalo/Facebook bị lệch với nội dung mới.
   - Các cam kết thương mại trong `shop.json:24,40,52,54` (hạn 6 tháng, 12 tháng, vĩnh viễn, tên miền riêng) chưa có cơ chế thực thi trong `core/boot.js` và `scripts/build.mjs:20-22,38,45-46` (đường dẫn tương đối `../core/` và `og:url` `${base}/${slug}/` hỏng nếu chạy ở root domain riêng, đồng thời `vercel.json:8-12` thiếu header CORS `Access-Control-Allow-Origin`).

---

## 3. Kết quả Brainstorm Toàn Cảnh (R1)

Các ý tưởng mới được tổ chức thành **4 trụ cột**, hoàn toàn không trùng lặp với tính năng hiện có hay backlog ở `docs/TASKS.md` và `docs/TAO-MAU-MOI.md`. *(Các ý tưởng đánh dấu ★ được chọn để đặc tả chi tiết ở Phần 4.)*

### Trụ cột 1 — Khách mời & Trải nghiệm

| Mã | Tên ý tưởng | Mô tả ngắn & Điểm mới so với hiện trạng |
|---|---|---|
| **K1 ★** | **Cá nhân hóa theo Nhóm khách / Vai vế (`?k=` + `?n=`) & Lọc sự kiện/bản đồ** | Gắn nhãn nhóm (`nha-trai`, `nha-gai`, `ban-be`, `vip`) vào URL để đổi câu xưng hô, lọc hoặc ưu tiên đúng buổi lễ và tab bản đồ liên quan, hiển thị dress code/xe đưa đón theo nhóm thay vì một nội dung chung. |
| **K2 ★** | **RSVP Đa nghi thức Thông minh (Nhu cầu riêng, Không đè trùng tên)** | Cho phép tích chọn từng lễ trong `d.events`, ghi chú ăn chay/trẻ em, tùy chọn gửi kèm lời chúc trong 1 lần bấm, và gắn mã định danh nhẹ để tránh ghi đè người trùng tên. |
| **K3** | **Xuất lịch iPhone/Outlook (`.ics`) & Lịch trình trong ngày (Timeline)** | Tạo chuỗi `text/calendar` `.ics` ngay trên trình duyệt (data URI/Blob) bổ sung bên cạnh `W.gcalUrl()` (`core/widgets.js:45-52`), kèm khối timeline giờ đón khách – làm lễ – khai tiệc – chụp ảnh. |
| **K4** | **Chế độ Song ngữ Việt / Anh (`vi`/`en` + `?lang=en`)** | Bổ sung từ điển UI nhỏ trong `core/util.js` (và truyền nhãn qua helper cho cả `core/widgets.js` lẫn các chuỗi tiếng Việt đặt cứng trong `themes/*/theme.js`, vd. `themes/tin-nhan/theme.js:9`) cho tên thứ, đếm ngược, vai vế, nút RSVP/Guestbook/Gift/Cheers và hỗ trợ nhánh dữ liệu `texts_en` hoặc nút chuyển ngôn ngữ cho đám cưới có khách nước ngoài. |
| **K5** | **Chế độ "Dễ Đọc" cho Người lớn tuổi / Mạng yếu (`?lite=1`)** | Một công tắc trên góc hoặc tham số URL giúp tắt canvas hạt bay, tăng cỡ chữ cơ sở, chuyển font viết tay sang font nét rõ và giữ nguyên đầy đủ thông tin giờ lễ, bản đồ, xác nhận. |
| **K6 ★** | **VietQR Mừng cưới Tự điền Tên Khách (`addInfo`)** | Tự ghép lời chúc/tên khách chuẩn hóa không dấu từ `?k=` hoặc ô nhập RSVP vào tham số `addInfo` của `img.vietqr.io` (`core/widgets.js:197`), giúp cô dâu chú rể đối chiếu sao kê không nhầm người gửi. |

### Trụ cột 2 — Cặp đôi & Studio

| Mã | Tên ý tưởng | Mô tả ngắn & Điểm mới so với hiện trạng |
|---|---|---|
| **S1 ★** | **Thẻ mời Ảnh tĩnh Cá nhân hóa Kèm Mã QR (Canvas Share Card)** | Ngay trong `studio/khach.html`, vẽ ảnh thiệp mời PNG/JPG (4:5 hoặc 9:16) theo màu mẫu đang chọn, ghi *"Trân trọng kính mời [Tên khách]"* + ngày giờ + mã QR trỏ về link `?k=`, tiện gửi ảnh qua Zalo cho họ hàng lớn tuổi. |
| **S2 ★** | **Kiểm duyệt & Ghim Lời chúc Trực tiếp trong `studio/khach.html`** | Thêm action `moderate_wish` trong Apps Script (xác thực `validKey`, đối chiếu `at + name + message`) để cặp đôi ẩn/hiện hoặc ghim 1–3 lời chúc hay nhất lên đầu sổ lưu bút ngay trên web, không cần nhờ người bán sửa tay cột `Ẩn` trong Sheet. |
| **S3 ★** | **Theo dõi Tiến độ Gửi thiệp, Import Danh sách & Check-in Bàn tiệc** | Nâng cấp `studio/khach.html` cho dán/import CSV nhiều cột (Tên, Nhóm, Bàn), đánh dấu "Đã gửi", lọc "Đã gửi nhưng chưa RSVP", lưu đồng bộ lên tab riêng bảo vệ bằng `validKey` (tách biệt hoàn toàn khỏi `_Nội dung` công khai), và chế độ lễ tân gán bàn + check-in tại sảnh. |
| **S4 ★** | **Bảng màu Preset theo Mẫu (Biến Theme riêng & `--c-*`) & Hoàn thiện Editor Studio** | Khai báo 3–4 bảng màu an toàn độ tương phản cho mỗi theme tác động trực tiếp lên bộ biến CSS riêng của từng mẫu (và đồng bộ `--c-*` cho `core/base.css`); đồng thời bổ sung editor `rsvp` (`maxGuests`, `sides`), chuẩn hóa hoàn toàn `images.captions` (`studio/studio.js:286-290`) và sửa mô tả `groom.bio` bị cũ ở `studio/studio.js:119`. |

### Trụ cột 3 — Vận hành & Phễu bán hàng

| Mã | Tên ý tưởng | Mô tả ngắn & Điểm mới so với hiện trạng |
|---|---|---|
| **V1 ★** | **Động cơ Vòng đời Thiệp (`lifecycle`: Memory Mode, Hết hạn mềm & `assetBase`)** | Thực thi đúng cam kết `shop.json`: tự chuyển sang **Chế độ Kỷ niệm** sau ngày cưới (ẩn RSVP, mở link album ảnh full tiệc), hiển thị trang **Hết hạn mềm** sau 6/12 tháng thay vì xóa gây 404, và hỗ trợ `assetBase` + CORS Vercel cho gói tên miền riêng. |
| **V2 ★** | **Tường Lời chúc Sảnh tiệc Trực tiếp (`?wall=1` Live Wedding Wall + QR bàn tiệc)** | Giao diện trình chiếu màn hình LED tại nhà hàng (`?wall=1`): hiển thị ảnh cưới chạy nền, tổng tim realtime, lời chúc mới tự polling định kỳ mỗi 10–15 giây và mã QR lớn để khách tại bàn tiệc quét gửi lời chúc hiện ngay lên màn hình. |
| **V3 ★** | **Tối ưu Trang chủ 4G (`Click-to-Interact` Preview) & Xem thử Tên Live trước khi đặt** | Thay 7 `<iframe>` (`loading="lazy"` ở `index.html:100`) trên trang chủ bằng ảnh xem trước tĩnh + nút mở `<iframe>` khi bấm; bổ sung ô nhập tên 2 người + ngày cưới để khách xem thử tên mình hiện ngay trên mẫu qua `postMessage`. |
| **V4 ★** | **Chống trùng Slug, Tra cứu Đơn `SHxxxxxx` & Bộ CLI `sync-studio` / `doctor`** | Kiểm tra trùng `slug` và tra cứu trạng thái đơn `SHxxxxxx` trên `/dat-thiep/`; bổ sung `npm run sync-studio` (kéo `_Nội dung` về cập nhật `invite.json` + `xem-truoc.jpg` + `build.mjs`) và `npm run doctor` kiểm lỗi trước xuất bản (kèm mở khóa Audio đồng bộ trên Safari iOS). |

### Trụ cột 4 — Ý tưởng Mẫu thiệp mới *(Không trùng 22 ý tưởng trong `docs/TAO-MAU-MOI.md`)*

Mỗi ý tưởng dưới đây đều mang **một tương tác vật lý / câu chuyện trung tâm riêng**, giữ chuẩn mobile 360–400px và tôn trọng `prefers-reduced-motion`:

| Mã | Tên mẫu đề xuất | Cú chạm trung tâm & Trải nghiệm xuyên suốt |
|---|---|---|
| **M1** | **Thiệp Gấp Pop-up (Kirigami)** | Bìa là tấm thiệp giấy gấp đôi; kéo mở góc giấy làm **mô hình giấy 3D nhiều lớp** (cổng hoa, đôi uyên ương, nhà thờ/tư gia) bật dựng lên theo hiệu ứng CSS 3D `perspective`. Khi cuộn, từng mục mở ra như các trang sách pop-up nối tiếp; hộp mừng cưới là ngăn kéo giấy ẩn dưới đáy thiệp. |
| **M2** | **Sổ Lưu Bút Vải Thêu (Khung Thêu Tay)** | Bìa là khung thêu gỗ tròn căng vải linen; khách kéo kim chỉ nối nốt đường thêu chữ viết tắt đôi bạn để mở thiệp. Các tiêu đề mục dùng họa tiết mũi thêu chữ thập/móc xích SVG animate `stroke-dashoffset`, album đóng khung căng vải, hộp quà là túi gấm rút dây. |
| **M3** | **Góc Quán Cà Phê Phin (Quán Quen Ngày Đầu)** | Bìa là mặt bàn gỗ ấm với **ly thủy tinh & phin cà phê nhôm**; khách chạm nhấc nắp phin / chạm giữ để những giọt cà phê nhỏ xuống làm làn hơi ấm bốc lên và hòa tan thành bức ảnh đôi mở thiệp. Bên trong trình bày theo thực đơn *"Menu Ngày Chung Đôi"* (Khai vị là chuyện hai đứa, Món chính là lịch lễ, Tráng miệng là album & lời chúc dạng phiếu ghi order bàn), hộp mừng cưới là hũ tiền tip thủy tinh. |
| **M4** | **Chiếc Bình Gốm Ghép Vàng (Kintsugi)** | Bìa là hai mảnh gốm sứ rạn ghép lại khi khách chạm giữ để đường vân vàng kim chảy nối liền vết nứt, tượng trưng cho hai mảnh ghép hòa làm một. Nền thiệp men ngọc rạn nhẹ, đường dẫn vàng mảnh nối các cột mốc kỷ niệm. |
| **M5** | **Kính Vạn Hoa Ký Ức** | Bìa là ống kính vạn hoa tròn phản chiếu ảnh cưới đa giác đối xứng; khách xoay vòng ống kính 90° để các mảnh màu khớp vào đúng khung ảnh đôi và mở thiệp. Phù hợp với đám cưới hiện đại, nghệ thuật, nhiều màu sắc rực rỡ. |

---

## 4. Đặc tả Chi tiết 5 Ý tưởng Trọng tâm (R2)

Năm ý tưởng trọng tâm dưới đây được tổng hợp từ các hạng mục có tác động cao nhất trong phần brainstorm (nhóm **K1+S1**, **K2+S3**, **S2+S3+S4**, **V1+V2+K6**, và **V3+V4**), bao phủ trọn vẹn 3 vai trò người dùng và khớp trực tiếp với kiến trúc SayHello.

---

### Ý tưởng Trọng tâm 1: Cá nhân hóa theo Nhóm khách / Vai vế & Thẻ mời ảnh QR Zalo

#### 1.1. Vấn đề / nhu cầu giải quyết
- Hiện tại `core/util.js:45-49` (`guestName()`) chỉ đọc duy nhất một chuỗi tên từ `?k=` / `?khach=` / `#k=` / `#khach=`, và `studio/khach.html:97` chỉ sinh URL dạng `.../<slug>/?k=<tên>`.
- Trong đám cưới Việt Nam có nhiều buổi lễ khác nhau (vd. `demo-song-hy/invite.json:29-43` tổ chức Lễ Ăn Hỏi tại Đà Nẵng và Lễ Thành Hôn tại Hà Nội; `demo-cuon-phim/invite.json:33-46` có Lễ Vu Quy buổi sáng và Tiệc Cưới buổi tối), mọi khách mời hiện vẫn phải đọc chung một danh sách sự kiện, một lời xưng hô chung và tab bản đồ mặc định đầu tiên (`core/widgets.js:122`).
- Đồng thời, `scripts/xem-truoc.mjs` chỉ tạo một ảnh OG `xem-truoc.jpg` dùng chung cho cả thiệp. Khi cặp đôi gửi link thiệp cho họ hàng lớn tuổi hoặc khách VIP qua Zalo/Messenger, chỉ gửi một đường dẫn văn bản dễ tạo cảm giác thiếu trang trọng hoặc khiến người nhận ngại bấm vì sợ link lạ.

#### 1.2. Đối tượng sử dụng
- **Cặp đôi:** Dễ dàng phân nhóm khách mời (Nhà trai, Nhà gái, Bạn cô dâu, Bạn chú rể, Đồng nghiệp, VIP), tạo nhanh ảnh thẻ mời có sẵn tên + mã QR để gửi Zalo/Messenger hoặc in kẹp thiệp giấy.
- **Khách mời:** Nhận được ảnh mời chỉn chu mang đúng tên mình; khi mở link hoặc quét QR thấy ngay lời xưng hô phù hợp vai vế, buổi lễ và địa điểm dành riêng cho nhóm mình, kèm hướng dẫn trang phục/xe đưa đón nếu có.

#### 1.3. Mô tả ý tưởng và giá trị mang lại
1. **Mở rộng cấu hình nhóm khách (`guestGroups`) trong `invite.json` & Studio:**
   - Thêm trường tùy chọn `guestGroups` (bổ sung vào `EDITABLE` trong `core/content.js:7`): mỗi nhóm gồm `{ id, label, greeting, eventIndexes, defaultPlace, dressCode, note }`. Ví dụ nhóm `nha-gai` có `greeting: "Trân trọng kính mời"`, `eventIndexes: [0]`, `defaultPlace: 1`, `note: "Xe đón họ nhà gái xuất phát lúc 07:00"`.
   - Mở rộng `core/util.js` thêm `guestGroup()` đọc tham số `?n=` (hoặc `?nhom=`, `#n=`), đưa `ctx.group` vào `ctx` tại `core/boot.js:22-37`.
   - Cập nhật `studio/khach.html:140-144`: ngoài `../${slug}/invite.json` và `?type=guests`, `khach.html` cần fetch và gộp thêm `?invite=${slug}&type=content` (qua `merge(inv, pickEditable(edits))`) để hiển thị đúng các `guestGroups` và bảng màu mới nhất mà cặp đôi vừa chỉnh trong Studio.
   - Khi có `ctx.group` hợp lệ:
     - `ctx.data.events` có thể hiển thị huy hiệu **"Dành riêng cho quý khách"** hoặc chỉ hiện các sự kiện thuộc `eventIndexes` (kèm nút nhỏ *"Xem toàn bộ lịch lễ"* để khách không bị khóa thông tin).
     - `W.map` (`core/widgets.js:107-122`) tự chọn tab `defaultPlace` làm địa điểm mặc định thay vì luôn `set(0)`.
     - Hiển thị thêm thẻ thông tin nhóm (dress code / ghi chú xe đưa đón) nếu nhóm đó có khai báo.
2. **Trình tạo Thẻ mời Ảnh QR thuần Client-side trong `studio/khach.html`:**
   - Ngay tại tab `Tạo link mời` (`studio/khach.html:98-123`), mỗi dòng khách cho phép chọn **Nhóm** (sinh URL `?k=...&n=...`, hoặc dùng `publicUrl` nếu thiệp chạy tên miền riêng) và bấm **"Tải ảnh mời QR"** (hoặc tải nhiều ảnh).
   - Dùng `<canvas>` thuần trên trình duyệt kết hợp một bộ sinh ma trận QR JS hỗ trợ tối thiểu **QR Version 6–11+** (mức sửa lỗi `L`/`M`, khoảng ~4–5KB không phụ thuộc ngoài, nhúng thành helper ES module trong `studio/`) để chứa trọn URL tiếng Việt mã hóa UTF-8 percent-encoded dài `110–220+` byte (vì tên khách tối đa 60 ký tự theo `core/util.js:48` kèm `?k=...&n=...`), vẽ tấm ảnh PNG tỷ lệ `1080×1350` (4:5):
     - Nền phối theo bảng màu của mẫu đang chọn (`themeColor` / palette của mẫu) hoặc ảnh `images.hero` làm nền mờ. Vì `images.hero` là đường dẫn tương đối theo thư mục `<slug>/` (vd. `images/anh1.jpg`), `studio/khach.html` phải quy đổi thành `../${slug}/${hero}` (nếu là đường dẫn tương đối) trước khi nạp vào `Image`.
     - Tên cặp đôi, ngày giờ lễ tương ứng với nhóm khách, câu *"Trân trọng kính mời [Tên khách]"*. Cần bổ sung các trọng lượng không nghiêng & đậm cho `Cormorant Garamond` (vd. `wght@400;600;1,500`) vào `<link>` Google Fonts ở `studio/khach.html:10` (hiện chỉ nạp `ital,wght@1,500`) và gọi `await document.fonts.ready` + `document.fonts.load(...)` trước khi vẽ chữ tiếng Việt lên Canvas.
     - Mã QR trỏ thẳng tới URL cá nhân hóa `https://.../<slug>/?k=...&n=...`.
3. **Giá trị mang lại:** Tăng rõ rệt giá trị chuyển đổi của gói **Nâng cao** (`shop.json:28-41`, vốn bán chạy nhờ tính năng link riêng từng khách) và giảm sai sót đi nhầm giờ/nhầm sảnh tiệc của khách mời.

#### 1.4. Mức độ phù hợp với dự án hiện tại
- **Hoàn toàn phù hợp với kiến trúc SayHello:** Không cần backend sinh ảnh (Serverless Image Generation), không cần lưu thêm bảng vào Google Sheet để giữ dữ liệu ở `guestGroups` trong `_Nội dung` hoặc `invite.json`.
- Tận dụng trực tiếp `guestName()` (`core/util.js:45-49`), `W.map` (`core/widgets.js:99-124`), và tab `Tạo link mời` có sẵn ở `studio/khach.html:96-123`. Tương thích 100% với các thiệp cũ không dùng `?n=` (khi không có `?n=`, thiệp chạy y hệt hiện tại).

#### 1.5. Đánh giá sơ bộ tính khả thi / rủi ro
- **Tính khả thi:** Cao. Toàn bộ phần vẽ Canvas + QR chạy offline trên trình duyệt cặp đôi.
- **Rủi ro & giảm thiểu:**
  1. *Lỗi font / mất nét chữ tiếng Việt trên Canvas:* `studio/khach.html:10` hiện chỉ nạp `Cormorant Garamond` italic 500; cần bổ sung đủ weight thường/đậm vào `<link>` font và gọi `await document.fonts.ready` + `document.fonts.load(...)` đúng `font-style`/`weight` trước khi `fillText`.
  2. *Nhiễm bẩn Canvas (`SecurityError` khi gọi `toBlob()`) với ảnh ngoài:* Nếu về sau `images.hero` trỏ tới URL ngoài không có header CORS (vd. ảnh Google Drive theo `IMAGE_OK` ở `core/content.js:9`), `drawImage` sẽ taint Canvas. Cần gắn `img.crossOrigin = 'anonymous'` khi tải ảnh, và nếu lỗi tải/CORS thì tự động fallback sang nền phối màu gradient theo bảng màu của mẫu (không vẽ ảnh taint).
  3. *Tràn dung lượng QR với tên tiếng Việt dài + dấu:* Dùng bộ sinh QR hỗ trợ Version `6–11+` (Byte mode, tối thiểu ~250–300 byte ở mức `L`/`M`) thay vì bộ QR mini chỉ hỗ trợ Version 1–4.
  4. *Trình duyệt di động chặn tải nhiều file PNG cùng lúc khi xuất hàng loạt:* Cho phép tải từng ảnh bằng nút bấm riêng, hoặc đóng gói file `.zip` không nén (Stored ZIP ~40 dòng JS thuần) khi xuất > 3 ảnh.
  5. *Khách dùng thiệp cũ thiếu `guestGroups`:* Nếu `n` không khớp nhóm nào, im lặng bỏ qua và hiển thị đầy đủ tất cả sự kiện/địa điểm như mặc định.

---

### Ý tưởng Trọng tâm 2: RSVP Đa nghi thức Thông minh, Sửa phản hồi Không đè Trùng tên & Check-in Bàn tiệc

#### 2.1. Vấn đề / nhu cầu giải quyết
- `core/widgets.js:127-152` (`W.rsvp`) hiện chỉ thu 4 trường cố định: `name`, `attend` (`Có`/`Không`), `guests` (`1..maxGuests`), `side`. Khách mời không thể chọn mình sẽ đi **Lễ Vu Quy / Lễ Thành Hôn / Tiệc tối**, không có ô ghi chú **ăn chay, dị ứng hải sản, đi xe đưa đón hay có trẻ nhỏ**.
- Để vừa xác nhận tham dự vừa gửi lời chúc, khách phải nhập tên và bấm gửi ở **hai form tách biệt** (`W.rsvp` dòng 130 và `W.guestbook` dòng 156).
- **Lỗi mất dữ liệu nghiêm trọng tại `studio/khach.html:72` và `backend/apps-script.gs:315` (`readAdmin()`):**
  ```js
  const latest = list => [...list.reduce((m, r) => m.set(r.name.trim().toLowerCase(), r), new Map()).values()];
  ```
  Hàm `latest()` (và `readAdmin()` tại `backend/apps-script.gs:315` với `last[r.name.toLowerCase().trim()] = r`) khử trùng lặp chỉ bằng tên viết thường. Nếu có hai khách cùng tên (ví dụ hai người cùng gõ `"Minh"` hoặc `"Chị Lan"`), người gửi sau sẽ **ghi đè và làm mất hoàn toàn lượt xác nhận của người trước** trên cả bảng thống kê cặp đôi lẫn `/ban-hang/`.
- Tại tiệc cưới thực tế, cặp đôi chưa có công cụ nhẹ nhàng ngay trên `studio/khach.html` để xếp bàn tiệc cho những khách đã xác nhận `Có` và đánh dấu check-in khi khách đến sảnh.

#### 2.2. Đối tượng sử dụng
- **Khách mời:** Xác nhận đúng buổi lễ tham gia, báo trước nhu cầu ăn chay/xe đón, gửi kèm lời chúc trong 1 thao tác, và có thể bấm sửa lại số người đi nếu kế hoạch thay đổi.
- **Cặp đôi & Ban lễ tân gia đình:** Nắm chính xác số lượng mâm cỗ theo **từng buổi lễ**, phân biệt rõ khách trùng tên, xếp sơ đồ bàn và mở chế độ check-in nhanh trên điện thoại/iPad tại bàn đón khách.

#### 2.3. Mô tả ý tưởng và giá trị mang lại
1. **Nâng cấp biểu mẫu `W.rsvp` (`core/widgets.js`):**
   - **Chọn sự kiện tham dự:** Nếu `d.events.length > 1` (và `d.rsvp?.pickEvents !== false`), hiển thị danh sách checkbox theo `d.events` (mặc định tích sẵn lễ chính hoặc các lễ thuộc nhóm `?n=` của khách).
   - **Tùy chọn nhu cầu riêng & ghi chú:** Thêm ô `note` (tối đa 160 ký tự, placeholder *"Ăn chay, dị ứng, đi cùng em bé, đăng ký xe…"*), có thể bật/tắt trong `d.rsvp`.
   - **Tích hợp gửi kèm lời chúc:** Thêm checkbox tùy chọn *"Gửi kèm lời chúc lên sổ lưu bút"* (mở ra ô textarea ngắn; nếu điền thì sau khi gửi RSVP thành công, hệ thống tự đẩy tiếp `type=wish` mà không bắt nhập lại tên).
   - **Sửa phản hồi bằng mã phiên/SĐT nhẹ:** Khi khách gửi RSVP lần đầu, client sinh hoặc lưu một `rsvpToken` ngẫu nhiên 8 ký tự trong `localStorage` (`sayhello:<slug>:rsvp`) và có ô tùy chọn *4 số cuối SĐT / biệt danh phân biệt* (`tag`). Lần sau quay lại trên cùng thiết bị, form hiển thị dòng *"Bạn đã gửi xác nhận trước đó — Gửi lại để cập nhật"*.
2. **Mở rộng `HEADERS` & Khắc phục `latest()`:**
   - Trong `backend/apps-script.gs:50`, mở rộng `HEADERS` thêm ở cuối: `'Sự kiện'`, `'Ghi chú'`, `'Mã khách'` (và `'Ghim'` cho Ý tưởng 3 — tổng 12 cột).
   - Hàm `latest()` ở `studio/khach.html:72` và vòng gộp trong `readAdmin()` ở `backend/apps-script.gs:315` cùng đổi khóa gộp từ tên viết thường thành:
     - Nếu có `r.guestId` (từ `rsvpToken` hoặc SĐT): gộp theo `guestId`.
     - Nếu không có `guestId` (dữ liệu cũ hoặc khách không lưu): **không tự gộp đè theo tên giống nhau** (hoặc chỉ gộp nếu trùng cả `name + side` trong cùng một ngày/hiển thị cảnh báo *"Có 2 khách trùng tên"* để cặp đôi tự chọn giữ/ẩn) nhằm giữ số liệu `/ban-hang/` đồng nhất với `khach.html`.
   - Thêm thẻ thống kê theo từng buổi lễ (vd. *Lễ Vu Quy: 42 người · Tiệc tối: 185 người*) trong `studio/khach.html`.
3. **Tab Gán bàn & Check-in (`studio/khach.html`):**
   - Bổ sung tab **Bàn tiệc & Check-in** trong `studio/khach.html`: cặp đôi gán số bàn (`Bàn 1`, `VIP 2`...) cho từng khách xác nhận đến, hỗ trợ lọc theo bàn/chưa xếp bàn và nút chạm một lần để đánh dấu **Đã tới** tại sảnh tiệc (lưu vào tab riêng `_BanTiec` / `_Checkin` trong Apps Script, xác thực bằng `validKey`).
4. **Giá trị mang lại:** Biến `SayHello` từ "thiệp mời đẹp" thành công cụ quản lý khách mời thực dụng cho cả trước và trong ngày cưới, giảm lãng phí đặt dư/thiếu bàn tiệc.

#### 2.4. Mức độ phù hợp với dự án hiện tại
- Khớp 100% với cấu trúc Google Sheets một tab mỗi thiệp ở `backend/apps-script.gs:110-121`, tái sử dụng mảng `d.events` sẵn có trong mọi `invite.json` và trường `'rsvp'` đã được liệt kê sẵn trong `EDITABLE` (`core/content.js:7`).
- Giao diện form và bảng check-in giữ nguyên thiết kế nhẹ, responsive trên màn hình 360–400px của `core/base.css` và `studio/khach.html`.

#### 2.5. Đánh giá sơ bộ tính khả thi / rủi ro
- **Tính khả thi:** Cao.
- **Rủi ro & giảm thiểu:**
  1. *Tab Sheet của các thiệp đã tạo trước đó chỉ có 8 cột `HEADERS`:* Trong `backend/apps-script.gs`, cả `readGuests(slug)` (dòng 184) lẫn `readWishes(slug)` (dòng 126) đều đang đọc cứng `HEADERS.length` cột. Cả hai hàm bắt buộc phải kiểm tra `const cols = Math.min(HEADERS.length, sh.getLastColumn())` (và đọc an toàn `r[8] || ''`, `r[9] || ''`...) để không bao giờ lỗi phạm vi cột với tab 8 cột cũ.
  2. *Giới hạn 45.000 ký tự của tab `_Nội dung` (`backend/apps-script.gs:87`):* Nếu tiệc có 400–500 khách, dữ liệu gán bàn và trạng thái check-in **không nhét vào `_Nội dung`** mà lưu vào tab riêng có xác thực `validKey` để tránh vừa chạm ngưỡng `too_big` vừa làm lộ thông tin qua `?type=content` công khai.
  3. *Nhiều lễ tân check-in cùng lúc trên 2 điện thoại:* Apps Script có sẵn `LockService.getScriptLock()` (`backend/apps-script.gs:91-92`); thêm cơ chế tự tải lại nhẹ (polling 15s hoặc nút Làm mới) để hai máy đồng bộ danh sách khách đã đến.

---

### Ý tưởng Trọng tâm 3: Tự chủ Toàn diện cho Cặp đôi trong Studio & `khach.html`

#### 3.1. Vấn đề / nhu cầu giải quyết
- **Mục tiêu `docs/PRD.md:41` ("Cặp đôi tự sửa được mà không cần hỏi người bán") chưa trọn vẹn ở 4 điểm trong mã nguồn:**
  1. *Kiểm duyệt lời chúc thủ công qua người bán:* `backend/HUONG-DAN.md:65` và `backend/apps-script.gs:22,130` yêu cầu mở Google Sheet gõ `"x"` vào cột `Ẩn`. Trong `studio/khach.html:89-91`, cặp đôi chỉ được xem chữ `<i>(đã ẩn)</i>`, không có quyền tự ẩn lời chúc spam/khiếm nhã hoặc ghim lời chúc thân thiết lên đầu.
  2. *Thiếu quản lý tiến độ gửi thiệp:* Tab `Tạo link mời` (`studio/khach.html:96-123`) chỉ có một ô `<textarea>` lưu thô ở `localStorage` của trình duyệt hiện tại (`sayhello:guests:<slug>`). Cặp đôi không biết đã gửi link cho ai, ai đã gửi mà chưa RSVP, mất dữ liệu nếu đổi từ máy tính sang điện thoại; đồng thời `studio/khach.html:140-144` chưa fetch và gộp `?type=content` từ Sheet.
  3. *Studio thiếu giao diện cho cấu hình `rsvp` & gợi ý `bio` bị cũ (trong khi đã có `images.captions`):* `core/content.js:7,18` cho phép `'rsvp'` và `'images'` trong `EDITABLE` (`studio/studio.js:253-302` vừa bổ sung giao diện tải ảnh & nhập `images.captions` khớp 5 mẫu `thu-tay:137`, `khoa-tinh:141`, `den-long:146`, `cuon-phim:172`, `tin-nhan:146`), nhưng `studio/studio.js:101-207` vẫn **hoàn toàn không dựng ô nhập** cho `rsvp` (`maxGuests`, `sides`). Ngoài ra, gợi ý ở `studio/studio.js:119` vẫn ghi lỗi thời *"Hiện ở mẫu Thư Tay và Vé Máy Bay"* dù hiện có tới 6/7 mẫu (trừ `song-hy`) dùng `person.bio`.
  4. *Hệ biến màu thực tế trong các theme tách rời khỏi `--c-*`:* `core/base.css:4-14` và `docs/DESIGN.md:5-17` khai báo `--c-bg`, `--c-paper`, `--c-ink`, `--c-accent`, `--c-accent-ink`, `--c-soft` cho phần dùng chung, nhưng kiểm tra thực tế trên cả **7/7** tệp `themes/*/theme.css` cho thấy có **`0` tham chiếu `var(--c-*)`** trong các selector riêng của theme (thay vào đó, mỗi mẫu dùng bộ biến riêng như `--red`/`--gold`, `--paper`/`--wax`, `--wall`/`--coral`, `--velvet`/`--amber`, `--brass`/`--night` kèm **40–121 mã màu hex đặt cứng** mỗi theme). Studio chưa có bảng màu preset để cặp đôi đổi tone an toàn (`shop.json:19`).

#### 3.2. Đối tượng sử dụng
- **Cặp đôi:** Tự chủ 100% từ tinh chỉnh nội dung, chú thích ảnh, cấu hình RSVP, đổi bảng màu hài hòa theo concept cưới, đến quản lý tiến độ gửi thiệp và dọn lời chúc không phù hợp.
- **Người bán:** Giảm gần như toàn bộ yêu cầu hỗ trợ vặt qua Zalo (*"Em ẩn giúp anh lời chúc này"*, *"Em đổi giúp chị chữ nút RSVP thành Khách nhà cô dâu/chú rể"*).

#### 3.3. Mô tả ý tưởng và giá trị mang lại
1. **Duyệt & Ghim Lời chúc trực tiếp trong `studio/khach.html`:**
   - Mở rộng `backend/apps-script.gs` thêm action POST xác thực bằng `validKey(slug, d.key)`:
     - `type: 'moderate_wish'` (**bắt buộc đối chiếu khóa kép `at` (ISO ms) + `name` + `message`**, tuyệt đối không dùng `rowId` đơn lẻ để tránh sửa nhầm dòng nếu người bán xóa dòng thử nghiệm như `docs/TASKS.md:9` hoặc sắp xếp Sheet): cập nhật cột `Ẩn` (`'x'` / `''`) và cột `Ghim` (`'pin'` / `''`, cột mới cuối `HEADERS`) bên trong `LockService` (`backend/apps-script.gs:91-92`).
   - `readWishes(slug)` (`backend/apps-script.gs:123-133`) phải kiểm tra `sh.getLastColumn()` (tương thích ngược tab 8 cột cũ tại dòng 126) và **quét toàn bộ các dòng** để thu thập đủ mọi lời chúc đang có `Ghim` (ngay cả khi lời chúc được ghim nằm sâu hơn ngưỡng `MAX_WISHES = 300` mới nhất tại dòng 128), rồi đẩy nhóm `pinned` lên đầu danh sách trả về.
   - Trên tab `Lời chúc` của `studio/khach.html`, mỗi dòng có 2 nút nhỏ: **Ẩn / Hiện** và **Ghim lên đầu**.
2. **Nâng cấp Tab `Tạo link mời` thành Trình quản lý Danh sách Gửi thiệp Bảo mật:**
   - Hỗ trợ dán nhanh từ Excel/Google Sheets (tách Tab/dấu phẩy gồm `Tên | Nhóm | Ghi chú`) hoặc nhập file CSV.
   - Mỗi khách có nút trạng thái **Đã gửi** và tự đối chiếu chéo với mảng `data.rsvps` để gắn nhãn: `Chưa gửi` / `Đã gửi · Chờ phản hồi` / `Đã xác nhận (Có/Không)`.
   - **Đồng bộ qua tab/endpoint riêng có xác thực `validKey` (tuyệt đối KHÔNG dùng `saveContent` / `_Nội dung`):** Lưu danh sách khách mời vào tab riêng `_KhachMoi` (hoặc sheet/cột tách biệt theo `slug`), đọc qua `GET ?invite=<slug>&type=invite_list&key=...` và ghi qua `POST { invite, type: 'invite_list', key, rows: [...] }` với `validKey(slug, key)`, `LockService` và `cut()`. Việc tách khỏi `_Nội dung` là bắt buộc vì: (a) `?type=content` (`backend/apps-script.gs:59`) là endpoint công khai không xác thực `validKey` (sẽ làm lộ danh sách khách và ghi chú riêng tư), (b) `studio/studio.js:360-361` gửi đè toàn bộ `clean(state)` lên `saveContent` (sẽ xóa sạch danh sách khách mỗi khi cặp đôi bấm Lưu trong Studio), và (c) danh sách 300–500 khách sẽ làm phình gói JSON công khai trên 4G và chạm giới hạn `45000` ký tự (`backend/apps-script.gs:87`).
   - Cập nhật `studio/khach.html:140-144` fetch & merge thêm `?type=content` để đồng bộ `guestGroups` và thông tin cặp đôi mới nhất từ Studio.
3. **Bảng màu Preset theo Mẫu (`palettes`) trong `studio/studio.js` & `core/boot.js`:**
   - Vì cả 7/7 `themes/*/theme.css` không tham chiếu `var(--c-*)` trong selector của riêng mình, mỗi `theme.js` hỗ trợ đổi màu sẽ khai báo `palettes: [{ id, name, swatch, vars: { ... } }]` gồm 3–4 phối màu chuẩn WCAG AA ghi đè trực tiếp **bộ biến CSS riêng của chính mẫu đó** (ví dụ `thu-tay`: `--paper`, `--paper-2`, `--ink`, `--wax`, `--desk`; `tin-nhan`: `--wall`, `--blush`, `--coral`, `--teal`, `--ink`; `song-hy`: `--red`, `--red-deep`, `--red-dark`, `--gold`, `--cream`, `--ink`...) **kèm** bộ `--c-*` tương ứng cho `core/base.css` (hoặc gắn `data-palette="<id>"` lên `<html>` đi cùng khối CSS `[data-palette="..."]` riêng trong `theme.css`).
   - Những mẫu được kích hoạt `palettes` phải rà soát chuyển các mã màu hex đặt cứng liên quan (40–121 chỗ/theme) sang biến CSS của mẫu để toàn bộ bề mặt, viền, tiêu đề và nút đổi màu đồng nhất.
   - `studio/studio.js` hiển thị các ô màu mẫu để cặp đôi chọn (lưu `palette` vào `EDITABLE`); `core/boot.js` đọc `data.palette`, tra cứu preset hợp lệ trong `theme.palettes` và áp biến lên `document.documentElement.style` (hoặc đặt `data-palette`) ngay khi khởi động.
4. **Hoàn thiện các trường bị thiếu trong `studio/studio.js`:**
   - Thêm nhóm cài đặt **Xác nhận tham dự (`rsvp`)**: số khách tối đa mỗi lượt (`maxGuests`), danh sách lựa chọn vai vế (`sides`), bật/tắt chọn từng lễ & ô ghi chú ăn uống.
   - **Chuẩn hóa hoàn toàn trên `images.captions` (không tạo khóa mới `texts.albumCaptions`):** Tận dụng `'images'` đã có trong `EDITABLE` (`core/content.js:7`) và `cleanImages()` (`core/content.js:13-20`) vốn đã bảo vệ đường dẫn ảnh qua `IMAGE_OK` và whitelist sẵn `im.captions` (`slice(0, 30)`, tối đa `80` ký tự ở dòng 18), cũng như ô nhập `caps[i]` mới thêm tại `studio/studio.js:286-290` — giúp tất cả 5 mẫu hiện có (`thu-tay:137`, `khoa-tinh:141`, `den-long:146`, `cuon-phim:172`, `tin-nhan:146`) hiển thị đồng bộ mà không tạo khóa lệch chuẩn.
   - Cập nhật dòng gợi ý `groom.bio` tại `studio/studio.js:119` khớp cả 6 mẫu có dùng `bio` (`Thư Tay`, `Vé Máy Bay`, `Khóa Tình`, `Đèn Lồng`, `Cuộn Phim`, `Tin Nhắn`).
5. **Giá trị mang lại:** Khép kín trải nghiệm tự phục vụ (self-service), hiện thực hóa đúng lời hứa thương mại của `shop.json:19` và `docs/PRD.md:41`.

#### 3.4. Mức độ phù hợp với dự án hiện tại
- Khai thác triệt để nền tảng đã chuẩn bị sẵn nhưng chưa nối UI: `EDITABLE` đã có `'rsvp'` và `'images'` (`core/content.js:7`), `cleanImages()` đã lọc sẵn `images.captions` (`core/content.js:18`), `backend/apps-script.gs` đã có sẵn cột `Ẩn` và `validKey`.

#### 3.5. Đánh giá sơ bộ tính khả thi / rủi ro
- **Tính khả thi:** Cao.
- **Rủi ro & giảm thiểu:**
  1. *Cả 7/7 `themes/*/theme.css` hiện có `0` tham chiếu `var(--c-*)` và chứa 40–121 mã hex đặt cứng:* Không giả định chỉ đổi `--c-paper`/`--c-accent` là đổi màu theme; triển khai `palettes` theo lộ trình từng mẫu (ưu tiên các mẫu ít hex cứng trước như `tin-nhan` 40 hex, `thu-tay` 43 hex), chuyển các màu chủ đạo sang biến riêng của mẫu và áp đồng thời biến theme + `--c-*`.
  2. *Xác định sai dòng khi ẩn/ghim lời chúc nếu dữ liệu Sheet bị xóa hoặc sắp xếp lại:* Tuyệt đối không khớp theo `rowId` đơn lẻ; dùng khóa tổng hợp `at` (ISO ms) + `name` + `message` khi thực thi `moderate_wish` trong `LockService`, và trả về lỗi rõ nếu không tìm thấy dòng khớp chính xác.
  3. *Bảo vệ đường dẫn ảnh khi cặp đôi sửa `images.captions`:* Giữ nguyên `cleanImages()` (`core/content.js:13-20`) vốn kiểm tra `IMAGE_OK` nghiêm ngặt cho `IMAGE_SLOTS` & `album` và tách riêng `captions`, đồng thời duy trì cơ chế của `studio/studio.js:358` tránh ghi đè `images` nếu cặp đôi không thay đổi ảnh.

---

### Ý tưởng Trọng tâm 4: Động cơ Vòng đời Thiệp, Thực thi Gói dịch vụ & Tường Lời chúc Sảnh tiệc

#### 4.1. Vấn đề / nhu cầu giải quyết
- **Khoảng trống giữa `shop.json` và mã nguồn:** `shop.json:24,40,54` cam kết thời hạn sử dụng rõ ràng (`Cơ bản`: 6 tháng, `Nâng cao`: 12 tháng, `Riêng`: không hết hạn) và `shop.json:52` hứa gắn tên miền riêng cho gói Riêng. Thực tế hiện tại, `core/boot.js` không đọc bất kỳ trường `package` hay `expiresAt` nào; `scripts/build.mjs:20-22,38,45-46` ghép cứng `${base}/${slug}/` cho `og:url`/`og:image` và dùng đường dẫn tương đối `../core/boot.js`, `../themes/...`; `studio/studio.js:312,389,422` và `studio/khach.html:140` cũng ghép cứng `../${slug}/`; đồng thời `vercel.json:8-12` hiện chỉ cấu hình `Cache-Control` mà **thiếu hoàn toàn header CORS `Access-Control-Allow-Origin`** nên `<script type="module">`, `import(...)`, và `@font-face` (`themes/song-hy/theme.css:18`) sẽ bị chặn khi nạp cross-origin từ một tên miền `Riêng`.
- **Trải nghiệm sau ngày cưới bị "đóng băng":** Khi `d.date` đã qua, `W.countdown` (`core/widgets.js:28`) chỉ ẩn bộ đếm và hiện một dòng chữ đơn điệu, trong khi nút "Xác nhận tham dự" và lời mời "sắp tổ chức" vẫn còn nguyên.
- **Lãng phí dữ liệu tại buổi tiệc trực tiếp & khó đối chiếu tiền mừng:** Trong tiệc cưới tại nhà hàng, khách đã gửi hàng chục lời chúc và thả tim trên Google Sheet nhưng dữ liệu này chỉ nằm yên trong điện thoại. Đồng thời, `W.gift` (`core/widgets.js:197`) tạo QR VietQR chỉ có `accountName`, không điền sẵn `addInfo` nên cặp đôi khó biết khoản chuyển khoản là của khách nào.

#### 4.2. Đối tượng sử dụng
- **Người bán:** Thực thi tự động thời hạn gói dịch vụ (6/12 tháng) mà không phải nhớ lịch xóa tay; tạo thêm doanh thu upsell gia hạn gói vĩnh viễn và bán gói `Riêng` tên miền riêng đúng kỹ thuật.
- **Cặp đôi:** Sở hữu trang kỷ niệm sau cưới có gắn album ảnh full từ thợ chụp, trình chiếu **Tường Lời chúc Sảnh tiệc** ấn tượng ngay trên màn hình LED nhà hàng, và đối chiếu tiền mừng cưới nhanh nhờ nội dung chuyển khoản tự điền tên.
- **Khách mời:** Quét mã QR đặt tại bàn tiệc để gửi lời chúc & ảnh tim bay trực tiếp lên màn hình lớn trong tiệc, và chuyển khoản mừng cưới nhanh không cần gõ tay nội dung.

#### 4.3. Mô tả ý tưởng và giá trị mang lại
1. **Cấu hình `lifecycle` & Chế độ Sau ngày cưới (Memory Mode):**
   - Bổ sung vào `invite.json` (do người bán quản lý, **tuyệt đối giữ `lifecycle` NGOÀI `EDITABLE` trong `core/content.js:7`** để cặp đôi không thể tự sửa `expiresAt` hay `package` qua `?type=content`):
     ```json
     "lifecycle": {
       "package": "nang-cao",
       "expiresAt": "2028-05-22"
     },
     "afterWedding": { "enabled": true, "albumUrl": "", "thankNote": "" }
     ```
   - Chỉ cho phép cặp đôi bật/tắt `afterWedding` (`enabled`, `albumUrl`, `thankNote`) qua một khóa riêng trong `EDITABLE` nếu cần, tách hẳn khỏi `lifecycle`.
   - Khi `Date.now() > Date.parse(d.date) + 24 * 3600e3` và `afterWedding.enabled`:
     - `core/boot.js` gắn class `is-memory` lên `body`, thay dải thông báo nhẹ *"Kỷ niệm ngày chung đôi"* + hiển thị nút **"Xem trọn bộ ảnh ngày cưới"** nếu có `albumUrl`, ẩn form RSVP (giữ lại Album, Sổ lưu bút và Nút thả tim).
2. **Hết hạn mềm (Graceful Expiry) thay vì xóa gây 404:**
   - Khi vượt quá `lifecycle.expiresAt` (nếu có và khác `null`), thay vì xóa thư mục làm hỏng link cũ của khách, `core/boot.js` dựng một màn hình lưu niệm tối giản, sang trọng: tên cặp đôi, ngày cưới, lời cảm ơn ngắn và nút liên hệ SayHello/cặp đôi để gia hạn lưu giữ vĩnh viễn (không hết hạn).
3. **Hỗ trợ Tên miền riêng (`assetBase` + `publicUrl` + CORS Vercel):**
   - Bổ sung trường tùy chọn `assetBase` (mặc định `..`, hoặc URL site chính `https://sayhello-wheat.vercel.app`) và `publicUrl` (vd. `https://minhkhangthuha.vn`) trong `invite.json`.
   - **Cấu hình CORS trên `vercel.json`:** Bổ sung header `Access-Control-Allow-Origin: *` trong `vercel.json:8-12` cho các đường dẫn `/core/(.*)`, `/themes/(.*)` (bao gồm font `.otf`/`.woff2` như `themes/song-hy/theme.css:18` `fonts/vl-bodega-script.otf`), và `/assets/(.*)` để trình duyệt cho phép nạp ES `<script type="module">`, dynamic `import()`, CSS và `@font-face` cross-origin trên tên miền riêng.
   - **Xử lý root domain trong `scripts/build.mjs` & `studio/`:**
     - `scripts/build.mjs:20-22,38` kiểm tra `d.publicUrl`: nếu có (thiệp triển khai ở root custom domain), xuất `og:url` là `${publicUrl}/` và `og:image` là `${publicUrl}/${img}` (thay vì `${base}/${slug}/...`), đồng thời sinh thẻ `<script type="module" src="${assetBase}/core/boot.js">` và `modulepreload` theo `assetBase`.
     - Trong `core/boot.js` và regex `MUSIC_OK` (`core/content.js:8`), chuẩn hóa đường dẫn nhạc/tài nguyên dùng `assetBase` khi chạy ngoài domain gốc.
     - Trong `studio/studio.js:312,389,422` và `studio/khach.html:97,140`: dùng `inv.publicUrl` (nếu có) khi tạo URL mời khách và link mở thiệp, đồng thời đảm bảo `studio/` trên site chính vẫn đọc được `invite.json` của thiệp hoặc đọc từ thư mục `<slug>/` tương ứng trên repo.
4. **Tường Lời chúc Sảnh tiệc (`?wall=1` Live Wedding Wall) & VietQR tự điền tên khách:**
   - **Live Wedding Wall (`?wall=1`):** Khi mở link `<slug>/?wall=1` trên laptop cắm màn hình LED sảnh tiệc, `core/boot.js` kích hoạt module hiển thị toàn màn hình (`16:9`, không cần mở bìa): trình chiếu slideshow ảnh cưới (`ctx.album`), tên cặp đôi, đồng hồ đếm tim realtime, thẻ lời chúc mới nhất tự động chạy/cuộn mượt và **một mã QR lớn ở góc màn hình** trỏ về `<slug>/?open=1#guestbook` để khách tại bàn tiệc quét và thấy lời chúc của mình hiện lên màn hình sau mỗi chu kỳ polling (12–15 giây). (Hoặc in QR đặt sẵn tại bàn tiệc qua tab mới trong `studio/khach.html`).
   - **VietQR tự điền tên (`W.gift`):** Trong `core/widgets.js:197`, chuẩn hóa `ctx.guest` (hoặc tên người dùng vừa nhập ở RSVP) thành chuỗi không dấu dạng `"Mung cuoi <TenKhach>"` (tối đa 50 ký tự) gắn vào tham số `&addInfo=...` của URL `img.vietqr.io`, kèm một ô nhỏ cho khách tự sửa trước khi quét QR.
5. **Giá trị mang lại:** Tạo ra điểm bán hàng độc đáo (USP) cho gói **Nâng cao** và **Riêng**, biến thiệp online từ công cụ mời trước cưới thành điểm nhấn tương tác ngay trong tiệc cưới và trang kỷ niệm sau cưới.

#### 4.4. Mức độ phù hợp với dự án hiện tại
- Mở rộng tự nhiên trên `core/boot.js`, `core/backend.js` (sẵn có `wishes()` và `hearts()`), `core/widgets.js:197`, `vercel.json` và `scripts/build.mjs` mà không cần thêm server, database hay WebSocket (polling 15s trên 1 máy chiếu sảnh tiệc tốn rất ít quota Apps Script).

#### 4.5. Đánh giá sơ bộ tính khả thi / rủi ro
- **Tính khả thi:** Cao.
- **Rủi ro & giảm thiểu:**
  1. *Lỗi CORS hoặc hỏng đường dẫn tương đối trên tên miền `Riêng`:* Bắt buộc khai báo `Access-Control-Allow-Origin: *` trong `vercel.json` cho `/core/(.*)`, `/themes/(.*)` (cả `.otf`/`.woff2`) và `/assets/(.*)` trước khi gắn domain riêng đầu tiên; đồng thời giữ `lifecycle` ngoài `EDITABLE` (`core/content.js:7`).
  2. *Hạn mức thực thi Apps Script khi màn hình Wall polling liên tục suốt 3–4 tiếng tiệc cưới:* Chỉ polling mỗi 15–20 giây (`~720–960` request GET trong 4 tiếng, hoàn toàn nằm trong hạn mức miễn phí của Google Apps Script); tạm dừng polling khi `document.hidden === true`, và nếu lỗi mạng thì giữ danh sách đang có + tự backoff.
  3. *Khách tại sảnh tiệc quét QR gửi lời chúc trêu chọc/không phù hợp hiện thẳng lên màn hình LED:* Thêm tùy chọn trong `Wall` chỉ hiện lời chúc sau khi kiểm duyệt (`moderationMode`), hoặc nút tạm dừng/ẩn nhanh ngay trên màn hình điều khiển của MC/cặp đôi.
  4. *Thiệp mẫu (`demo-*`) và `tests/smoke.mjs` bị ảnh hưởng bởi `expiresAt` hoặc `afterWedding`:* Quy ước mọi `demo-*` không đặt `expiresAt` (hoặc đặt ngày tương lai xa), và `core/boot.js` không kích hoạt màn hình hết hạn khi đang ở chế độ `?studio=1`.

---

### Ý tưởng Trọng tâm 5: Tối ưu Phễu Bán hàng, Đồng bộ Studio–Build & Kiểm định Di động

#### 5.1. Vấn đề / nhu cầu giải quyết
- **Nghẽn hiệu năng 4G ngay ở Trang chủ (`index.html:100-106`):** Dù `index.html:100` đã đặt sẵn `<iframe loading="lazy">` cho mỗi thẻ mẫu, khi người dùng cuộn qua danh sách 7 mẫu (`tin-nhan` đã thêm vào `themes/index.json:89-104`, và sẽ tiếp tục tăng lên 10+), trình duyệt vẫn nạp đầy đủ nhiều trang con song song (HTML, CSS, Google Fonts, JS ES module, ảnh và vòng lặp `requestAnimationFrame` canvas `core/fx.js:95-118`), làm nặng máy trên mạng 4G và ảnh hưởng mục tiêu `<3s` (`docs/PRD.md:40`).
- **Ma sát trong phễu đặt thiệp (`/dat-thiep/`):**
  - Khách chưa xem thử được tên của chính mình và ngày cưới hiện lên mẫu thiệp như thế nào trước khi quyết định chuyển khoản.
  - `dat-thiep/dat-thiep.js:62-70` chỉ kiểm tra regex định dạng `slug`, **không kiểm tra trùng** với các thư mục thiệp đã bán trên site hay đơn đang chờ xử lý.
  - Sau khi chuyển khoản, khách không có nơi kiểm tra nhanh trạng thái mã đơn `SHxxxxxx` (`Chờ chuyển khoản` / `Đã nhận tiền` / `Đã giao`) ngoài việc nhắn hỏi thủ công qua Zalo.
- **Đứt gãy Đồng bộ Studio – OG Preview & Lỗi Audio iOS Safari:**
  - `studio/studio.js:360-361` lưu bản sửa cặp đôi vào Sheet `_Nội dung`, nhưng `scripts/build.mjs:15-39` và `scripts/xem-truoc.mjs:19-55` chỉ đọc `invite.json` trên ổ đĩa → **thẻ `<title>`, `og:title`, `og:description` và ảnh `xem-truoc.jpg` gửi qua Zalo/Facebook bị lỗi thời** nếu cặp đôi đổi tên hiển thị, ngày cưới hoặc mẫu thiệp trong Studio.
  - 4/7 mẫu (`themes/khoa-tinh/theme.js:221`, `themes/den-long/theme.js:221`, `themes/cuon-phim/theme.js:263`, `themes/tin-nhan/theme.js:209`) gọi `ctx.open(false)` bên trong `setTimeout(650..2300ms)`. Theo `core/boot.js:73` và `core/chrome.js:56-57` (`audio.preload = 'none'`), `chrome.playMusic()` chạy ở thời điểm đó nằm ngoài cử chỉ chạm đồng bộ nên bị **Safari iOS / WebKit chặn phát nhạc nền**.
  - Chưa có lệnh kiểm lỗi tự động trước khi giao thiệp (ví dụ sót số `0000000000`, thiếu `sheetUrl`, ảnh vượt quá 350KB, hoặc lỗi tràn ngang ở màn hình `360px`).

#### 5.2. Đối tượng sử dụng
- **Khách mua thiệp (Cặp đôi tiềm năng):** Lướt trang chủ mượt trên 4G, nhập thử tên mình xem thiệp sống động ngay lập tức, an tâm đặt đơn không lo trùng đường dẫn và tự tra cứu tiến độ xử lý đơn `SHxxxxxx`.
- **Khách mời dùng iPhone (Safari/Zalo in-app browser):** Nhạc nền phát trơn tru khi mở khóa/thả hoa đăng/kéo cần máy chiếu/chạm thông báo tin nhắn; ảnh chia sẻ Zalo luôn đúng tên/ngày mới nhất.
- **Người bán / Kỹ thuật viên:** Một lệnh đồng bộ toàn bộ chỉnh sửa Studio về `invite.json` + ảnh OG + HTML tĩnh, và một lệnh `doctor` kiểm tra chất lượng trước khi push.

#### 5.3. Mô tả ý tưởng và giá trị mang lại
1. **Tối ưu Trang chủ (`index.html`) — Click-to-Interact Preview & Xem thử Tên trực tiếp:**
   - Mặc định mỗi thẻ mẫu trên `index.html` thay `<iframe loading="lazy">` bằng ảnh xem trước tĩnh nhẹ (`demo-<mẫu>/images/xem-truoc.jpg` hoặc ảnh bìa tối ưu ~40KB) kèm nút **"Chạm để tương tác thử"**. Chỉ khi người dùng bấm vào (hoặc mở modal xem thử), trang mới tạo và nạp `<iframe>` của mẫu đó — giảm số iframe tải lúc mở/cuộn từ 7+ xuống **0**.
   - Thêm thanh **"Thử tên hai bạn ngay"** ở đầu lưới mẫu: khách gõ tên chú rể, tên cô dâu, ngày cưới → khi bấm xem thử mẫu, URL hoặc `postMessage` (`sayhello:data` đã có sẵn ở `core/content.js:35-43`) truyền tên thật vào bản demo để khách thấy tên mình hiện ngay trên cửa son/vé máy bay/cuộn phim/nhóm chat.
2. **Chống trùng Slug & Tra cứu Đơn `SHxxxxxx` trên `/dat-thiep/`:**
   - Trong `scripts/build.mjs`, tự xuất thêm file nhẹ `invites.json` (chỉ chứa mảng các `slug` đang tồn tại, ~1KB) hoặc bổ sung `GET ?type=check_slug&slug=...` + `GET ?type=order_status&code=SHxxxxxx` trong `backend/apps-script.gs`.
   - **Thứ tự điều phối bắt buộc trong `backend/apps-script.gs:53-65` (`doGet`):** Các endpoint `check_slug` và `order_status` phải được kiểm tra và trả kết quả **trước lệnh `cleanSlug(p.invite)` (dòng 56) / bộ lọc `ALLOWED` (dòng 410)** — tương tự cách `p.type === 'admin'` đang chạy ở dòng 55 — vì `slug` khách đặt mới hoặc mã đơn `SHxxxxxx` không nằm trong `ALLOWED`.
   - Khi khách gõ `slug` trên `/dat-thiep/`, kiểm tra ngay và gợi ý thêm hậu tố (`-2027` hoặc `-wedding`) nếu đã tồn tại.
   - Bổ sung mục **"Tra cứu đơn đã đặt"** nhập mã `SHxxxxxx` + 4 số cuối SĐT để xem trạng thái hiện tại từ tab `_Đơn hàng` (`Chờ chuyển khoản` → `Đã nhận tiền` → `Đã giao`). Lưu ý `ORDER_HEADERS` (`backend/apps-script.gs:49`) có cột 10 (`Đường dẫn`, chỉ số 9) là cột tùy chọn do người bán tự điền khi giao thiệp, nên `inviteUrl` chỉ trả về khi đơn đã giao và cột 10 có giá trị hợp lệ.
3. **Hai lệnh CLI mới cho Người bán (`scripts/`):**
   - `npm run sync-studio -- <slug>`: fetch `?invite=<slug>&type=content` từ `sheetUrl` trong `<slug>/invite.json`, gộp các trường `EDITABLE` vào `invite.json`, tự chạy lại `makePreview(slug)` (`scripts/xem-truoc.mjs`) và `buildInvite(slug)` (`scripts/build.mjs`) để ảnh OG Zalo và thẻ `<meta>` khớp 100% với những gì cặp đôi đã sửa.
   - `npm run doctor -- [slug]`: rà soát tự động trước khi giao thiệp: cảnh báo nếu `shop.json` còn `giaTam: true` hoặc `0000000000`; kiểm tra từng thiệp có `0000000000` trong `accounts`, thiếu `sheetUrl`, ảnh nặng > 350KB, thiếu `images/xem-truoc.jpg`, ngày cưới đã qua (trừ demo), hoặc tài liệu/index chưa khớp `themes/index.json`. Mở rộng `tests/smoke.mjs` kiểm tra thêm `document.documentElement.scrollWidth <= window.innerWidth` ở độ rộng `360px`.
4. **Mở khóa Audio đồng bộ tin cậy trên iOS Safari (`core/chrome.js` & `core/boot.js`):**
   - Bổ sung `chrome.unlockMusic()` gọi **đồng bộ** `audio.muted = true; audio.play().catch(() => {})` và giữ trạng thái phát im lặng liên tục cho tới lúc mở thiệp xong (tuyệt đối **không** gọi `audio.play()` rồi lập tức `audio.pause()`, vì `core/chrome.js:57` đặt `audio.preload = 'none'` nên gọi `pause()` ngay sẽ ném `AbortError` trước khi nạp xong audio và không giữ được phiên mở khóa WebKit qua các `setTimeout` 650–2300ms).
   - **Xử lý đúng capture-phase & gesture từng mẫu:** Vì `themes/den-long/theme.js:214-222`, `themes/cuon-phim/theme.js:257-264` và `themes/tin-nhan/theme.js:203-210` đều gắn listener `click` ở **capture phase** (`true`) kèm `e.stopImmediatePropagation()`, còn `themes/khoa-tinh/theme.js:229-238` dùng `pointerdown`/`pointerup` trên `[data-dial]`, nên `core/boot.js` cần gắn listener mở khóa `{ capture: true, once: true }` trên `cover` cho `pointerdown` / `touchend` / `click` (hoặc truyền `ctx.unlockMusic` để các hàm bìa gọi trực tiếp ở đầu handler tương tác đầu tiên). Khi `open(false)` chạy, `chrome.playMusic()` chỉ cần đặt `audio.currentTime = 0; audio.muted = false;` (gọi thêm `audio.play()` nếu vì lý do nào đó đang tạm dừng) để nhạc vang lên chính xác và kích hoạt sự kiện `play` hiện nút `.music.on` (`core/chrome.js:58`).
5. **Giá trị mang lại:** Tăng tỷ lệ chuyển đổi từ trang chủ (tải nhanh trên 4G + hiệu ứng "wow" khi thấy tên mình trước khi mua), giảm thời gian hỗ trợ tra cứu đơn, và nâng cao chất lượng kỹ thuật đồng đều trên iPhone/Zalo.

#### 5.4. Mức độ phù hợp với dự án hiện tại
- Bám sát 100% chuỗi công cụ Node hiện có (`scripts/build.mjs`, `scripts/xem-truoc.mjs`, `tests/smoke.mjs`), tái sử dụng giao thức `postMessage` (`core/content.js:35-43`) và tab `_Đơn hàng` (`backend/apps-script.gs:229-254`) mà không thêm bất kỳ dependency ngoài nào.

#### 5.5. Đánh giá sơ bộ tính khả thi / rủi ro
- **Tính khả thi:** Rất cao, nhiều phần có thể làm độc lập và kiểm chứng ngay bằng Playwright trong `tests/smoke.mjs`.
- **Rủi ro & giảm thiểu:**
  1. *Lộ thông tin riêng tư khi tra cứu đơn `SHxxxxxx` qua Apps Script:* Không trả về SĐT hay ghi chú cá nhân; yêu cầu khớp cả `code` (`SHxxxxxx`) lẫn 4 số cuối SĐT đặt hàng (`phoneLast4`), và chỉ trả về `status`, `themeName`, `packName`, và `inviteUrl` (nếu trạng thái đã giao và cột `Đường dẫn` đã được điền).
  2. *`sync-studio` ghi đè nhầm chỉnh sửa tay mới hơn trên máy người bán:* Luôn in diff các trường sắp cập nhật và hỗ trợ cờ `--dry-run` để xem trước trước khi ghi `invite.json`.
  3. *Tương tác `unlockMusic()` phát âm thanh sớm hoặc mất đồng bộ nút nhạc trên iOS:* Đặt `audio.muted = true` suốt thời gian animation mở bìa (`650–2300ms`) và đặt `audio.currentTime = 0; audio.muted = false;` khi `open(false)` chạy; khi cặp đôi/khách bấm nút tắt nhạc hoặc ẩn tab (`visibilitychange` ở `core/chrome.js:63`), vẫn xử lý bình thường.

---

## 5. Lộ trình Đề xuất & Ma trận Bảo toàn Kiến trúc

### 5.1. Lộ trình Triển khai Đề xuất (3 Pha)

| Pha | Trọng tâm | Hạng mục ưu tiên | Giá trị đạt được |
|---|---|---|---|
| **Pha 1: Quick Wins & Sửa đứt gãy kỹ thuật** | Không đổi lớn về backend, khắc phục ngay các lỗ hổng thực tế | • Sửa mở khóa Audio iOS (`core/chrome.js`, `core/boot.js` với capture-phase muted unlock cho 4 mẫu)<br>• Sửa lỗi đè trùng tên `latest()` ở `studio/khach.html:72` & `readAdmin()` ở `backend/apps-script.gs:315` + merge `?type=content` (`140-144`)<br>• Click-to-Interact Preview trên `index.html` + xem thử tên live<br>• Bổ sung form `rsvp` (`maxGuests`, `sides`) & sửa gợi ý `groom.bio` (`119`) trong `studio/studio.js`<br>• VietQR tự điền `addInfo` (`core/widgets.js:197`) + CLI `sync-studio` & `doctor` | Trang chủ mở <3s trên 4G, không mất RSVP trùng tên, phát nhạc ổn định trên iPhone, OG Zalo luôn đúng. |
| **Pha 2: Tự chủ Studio & Cá nhân hóa Sâu** | Nâng cấp `studio/`, `khach.html`, `W.rsvp` và bổ sung cột cuối `HEADERS` | • Cá nhân hóa nhóm khách `?n=` & lọc sự kiện/bản đồ mặc định<br>• Trình tạo ảnh mời QR Canvas trong `studio/khach.html` (QR v6–11+, đủ font weight, CORS fallback)<br>• RSVP đa nghi thức + ghi chú riêng + sửa phản hồi<br>• Duyệt/ghim lời chúc (`at+name+message`, scan đủ pin) + tab `_KhachMoi` bảo mật `validKey` + bảng màu preset theo biến từng theme | Cặp đôi tự vận hành 100% không cần hỏi người bán; gói Nâng cao có khác biệt vượt trội. |
| **Pha 3: Vòng đời Thương mại & Trải nghiệm Sảnh tiệc** | Thực thi gói `shop.json` & mở rộng giá trị ngày cưới | • `lifecycle` (Memory Mode sau cưới, hết hạn mềm 6/12 tháng, giữ ngoài `EDITABLE`)<br>• `assetBase` + `publicUrl` + CORS `vercel.json` cho gói `Riêng` tên miền riêng<br>• Tường Lời chúc Sảnh tiệc (`?wall=1`) + Tab Check-in Bàn tiệc<br>• Kiểm tra trùng slug & tra cứu đơn `SHxxxxxx` trên `/dat-thiep/` | Vận hành thương mại khép kín từ đặt đơn → giao thiệp → ngày cưới → gia hạn lưu niệm. |

### 5.2. Ma trận Tác động Dự kiến *(Chỉ phục vụ tham khảo lập kế hoạch sau này)*

- **Tài liệu này tuân thủ tuyệt đối R3:** Không có bất kỳ tệp mã nguồn, cấu hình hay tài liệu hiện có nào trong `D:\MyCode\SayHello` bị chỉnh sửa trong phạm vi đề xuất.
- Khi được phê duyệt triển khai ở các pha sau, các module dự kiến chạm tới gồm:
  - `core/`: `boot.js`, `content.js`, `util.js`, `chrome.js`, `widgets.js`, `base.css` (giữ nguyên hợp đồng `html\`\``, `:where()`, `prefers-reduced-motion`).
  - `themes/*/theme.css`: bổ sung biến & rule `palettes` ở các mẫu hỗ trợ đổi bảng màu.
  - `studio/`: `studio.js`, `khach.html`, `studio.css`.
  - `dat-thiep/`, `index.html` & `vercel.json`: `index.html`, `dat-thiep/dat-thiep.js`, `dat-thiep/index.html`, `vercel.json` (CORS cho `/core/*`, `/themes/*`, `/assets/*`).
  - `backend/`: `apps-script.gs` (mở rộng cột ở cuối `HEADERS`, guard `sh.getLastColumn()`, tab `_KhachMoi` bảo mật `validKey`, xử lý `check_slug`/`order_status` trước `cleanSlug`).
  - `scripts/` & `tests/`: `build.mjs`, `tests/smoke.mjs`, bổ sung `sync-studio.mjs` và `doctor.mjs`.
- **Nguyên tắc bất biến (`docs/RULES.md` & `docs/PRD.md`):** Tiếp tục giữ nguyên kiến trúc thuần ES module, không framework, không database ngoài, ưu tiên hiển thị chuẩn trên di động `360–400px` và dữ liệu tương thích ngược với mọi `invite.json` hiện hữu.
