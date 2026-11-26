# Tài liệu Tham mưu Thiết kế & Phát triển UX/UI — SayHello

> **Mục đích:** Tài liệu tham chiếu chuẩn cho mọi phiên Claude Code / agent khi nâng cấp 10 mẫu thiệp hiện hành (`M2`, `M3`), phát triển các mẫu thiệp điện ảnh thế hệ mới (`M4`, `M5`) và hoàn thiện trang trưng bày `/v2` (`M6`).
> **Cơ sở tổng hợp:**
> 1. Phương pháp luận thiết kế Anthropic (`frontend-design` & `codebase-design` tại `C:\Users\admin\.claude\skills\`).
> 2. Chuẩn bố cục & chuyển động tham chiếu từ `https://motionsites.ai/` (`Runway Lookbook`, `Living Portrait`, `Obsidian`, `Orbit Sphere`, `Particle Self`, `MORPHO`, `Aurel Liquid Hero`, `Ink Reveal`, `Roadster 3D`, `VHS Archive`).
> 3. Phản hồi trực tiếp của chủ dự án trong `docs/BRIEF-3D.md`, `docs/KHONG-KHUON-MAU.md`, `docs/REDESIGN.md`, `docs/Y-TUONG-DOT-2.md` và `docs/RULES.md`.

---

## Chương 1 [Trụ cột 1]: Tổng hợp chuẩn tham chiếu & Chẩn đoán sự lặp khuôn mẫu

### 1.1 Tam giác tham chiếu thiết kế của SayHello

Mọi quyết định giao diện, bố cục và chuyển động trong SayHello phải đứng trên **3 trụ chuẩn** sau:

1. **Anthropic `frontend-design` & `codebase-design`:**
   - **Gắn chặt với chất liệu và ngữ cảnh đám cưới Việt (Subject Grounding):** Thiết kế bắt nguồn từ vật thể, không gian và cảm xúc thực của buổi lễ — không áp khung trang trí ngẫu nhiên. Mở đầu (`hero`/`gate`) phải đưa ra vật thể đặc trưng nhất của thế giới mẫu đó (lá thư sáp, cửa sơn mài, bảng khởi hành, sợi tơ đỏ, khung tranh rọi đèn).
   - **Typography có chủ đích:** Dùng 1–2 họ chữ phân tách rõ vai trò, chiều dài đoạn văn `< 80ch`, độ tương phản cỡ chữ lớn/nhỏ mạnh (`>= 8:1` ở ít nhất 2 màn theo `KHONG-KHUON-MAU.md:57`). **Cấm** các thói quen lộ rõ AI: tô nghiêng/đổi màu đúng 1 từ trong tiêu đề, gắn nhãn IN HOA giãn chữ phía trên mọi mục, nối thông tin bằng `'A · B · C'`, đặt tên kiểu `'WORD — fragment'`, gắn đuôi `'→'` cho mọi nút, đánh số trang trí `01 / 02 / 03` khi nội dung không phải chuỗi bước.
   - **Chuyển động tiết chế, có dàn dựng:** Một chuỗi mở màn được tính toán nhịp (`animation-delay` / timeline) tốt hơn hàng loạt thẻ trượt lên rời rạc.
   - **Chống "AI Slop" mặc định:** Cấm lạm dụng nền kem `#F4F1EA` + cam đất `#D97757`, nền đen + 1 màu xanh neon/đỏ cam chói, hoặc chuỗi thẻ bo góc đều nhau có bóng `rgba(0,0,0,.1)` và dải gradient trang trí vô nghĩa.
   - **Mô-đun sâu (`codebase-design`):** Giữ giao diện lập trình nhỏ gọn ở ranh giới (`defineTheme`, `ctx.lib`, `[data-w]`, `data-sh`), giấu độ phức tạp WebGL/chuyển động vào bên trong cảnh để dễ kiểm thử và hạ cấp.

2. **Chuẩn `https://motionsites.ai/` (Chuyển hóa sang thiệp cưới Việt):**
   Mỗi mẫu thành công trên `motionsites.ai` đều ghép **3 thành phần không thể tách rời**: *(a) hệ màu & chất liệu rõ ràng + (b) ẩn dụ không gian riêng (spatial metaphor) + (c) hằng số vật lý chuyển động đặt tên được*. Bảng ánh xạ cho SayHello:

| Mẫu tham chiếu `motionsites.ai` | Cơ chế không gian & Vật lý cốt lõi | Áp dụng vào SayHello |
|---|---|---|
| `Runway Lookbook` / `Obsidian` | Hành lang tối, ánh sáng định hướng, ảnh khổ lớn bất đối xứng, chuyển trang có trọng lượng | `phong-trien-lam` (M5), `song-hy` (M2) |
| `Living Portrait` | Ảnh chân dung có chiều sâu 2.5D, nghiêng/rê chuột tạo thị sai bên trong khung | Bước vào trong ảnh ở `phong-trien-lam`, khung ảnh `thiep-gap` |
| `Orbit Sphere` / `Particle Self` | Quỹ đạo ảnh 3D xoay quanh tâm, hạt hội tụ thành hình thái mới khi cuộn | `bau-troi-anh` (M5), `to-hong` 2.0 (M4) |
| `MORPHO` | Biến đổi hình thái liên tục theo tương tác chạm/cuộn | Chữ ký / cánh hoa tụ tên ở `to-hong` 2.0 & `bau-troi-anh` |
| `Aurel Liquid Hero` / `Ink Reveal` | Bề mặt chất lỏng phản chiếu, shader gợn sóng (flowmap) theo con trỏ | `ho-guong` (M5), dấu mực chảy ở `thu-tay` |
| `Roadster 3D` | Camera chạy dọc đường cong spline + ánh sáng `RoomEnvironment` / PBR | Camera lướt sợi chỉ ở `to-hong` 2.0 |
| `VHS Archive` | Hạt phim, phụ đề, mã thời gian, khung chiếu 16:9 có độ nhiễu hữu cơ | `cuon-phim` v2 (M3) |

3. **Nguyên tắc `docs/BRIEF-3D.md` & `docs/KHONG-KHUON-MAU.md`:**
   - **Ảnh là nhân vật chính (Photo-First):** Cặp đôi thường có **6–30 ảnh cưới** và thông tin ngày/giờ/địa điểm/QR; rất nhiều cặp đôi không có câu chuyện dài để viết. Vì vậy phần `story` phải là tùy chọn (`when: ctx => ctx.has('story')`), không được để trống hay gãy nhịp khi thiếu chữ.
   - **Chủ đề là bộ thông số Khí quyển (Atmosphere Preset):** Ánh sáng, môi trường HDR, chất liệu, hạt không khí, bảng màu/LUT, nhạc và đường camera.
   - **Cân bằng khám phá & tốc độ:** Trải nghiệm đầy đủ có 4–6 khoảnh khắc "wow" kéo dài 2–4 phút nếu khách thích khám phá; nhưng khách vội vẫn nắm được ngày giờ, bản đồ và xác nhận tham dự trong **<= 10 giây** qua ngăn kéo `#sh-quick` ("Thông tin nhanh") và **<= 3 thao tác** tới RSVP.

---

### 1.2 Chẩn đoán sự lặp khuôn mẫu hiện tại (Bằng chứng xác minh trực tiếp trong mã nguồn)

Kiểm tra thực tế mã nguồn `D:\MyCode\SayHello` cho thấy 6 nguyên nhân khiến các mẫu v1 trông như *"10 lớp da bọc trên cùng 1 khung"*:

1. **Khung `max-width: 520px` khóa cứng toàn cục:**
   - `legacy/core/base.css:23` đặt `:where(main) { max-width: 520px; margin: 0 auto; background: var(--c-paper); overflow: hidden; }`.
   - 4 mẫu `tin-nhan/theme.css:11`, `thiep-gap/theme.css:8`, `khung-theu/theme.css:10`, `ca-phe-phin/theme.css:7` còn tự viết đè lại `main { max-width: 520px; }`. Trên màn hình desktop `1440px`, gần 64% chiều ngang bị bỏ trống thành hai dải đen/nền chết hai bên; ngoài ra `overflow: hidden` còn làm hỏng `position: sticky` bên trong `main`.
2. **Chuỗi 11 mục đồng phục (`11-section pipeline`):**
   - `ca-phe-phin/theme.js:22`, `khung-theu/theme.js:26`, `thiep-gap/theme.js:21` dùng y nguyên mảng 11 mục `['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks']`.
   - `cuon-phim/theme.js:46`, `den-long/theme.js:27`, `khoa-tinh/theme.js:24`, `tin-nhan/theme.js:40` dùng chung 11 mục tương tự (`story` thay `families`). Kết quả là thứ tự trải nghiệm ở 8/10 mẫu gần như trùng khớp.
3. **Markup `legacy/core/widgets.js` lặp nguyên xi:**
   - `W.countdown()`, `W.calendar()`, `W.gallery()`, `W.map()`, `W.rsvp()`, `W.guestbook()`, `W.gift()` sinh cấu trúc DOM giống nhau ở mọi mẫu (`widgets.js:18–297`). Đếm ngược ở đâu cũng là 4 ô `Ngày / Giờ / Phút / Giây`, album ở đâu cũng là `.show` + 6 `.thumbs`.
4. **Bão hòa `data-rv` (234 lần trong `legacy/themes/*.js`) & pháo hoa mặc định:**
   - Kiểm đếm thực tế cho thấy **234 thuộc tính `data-rv`** trong JS các mẫu: `cuon-phim` (**33**), `song-hy` (**32** trong JS + **7** trong CSS), `den-long` (**30**), `khoa-tinh` (**30**), `ve-may-bay` (**27**), `thu-tay` (**26**), `thiep-gap` (**20**), `khung-theu` (**20**), `ca-phe-phin` (**16**), chỉ `tin-nhan` (**0**). Hầu hết phần tử đều dùng chung một nhịp `opacity: 0 -> 1, .9s cubic-bezier(.2,.8,.2,1)` kèm pháo giấy lúc mở bìa và pháo hoa ở cuối trang.
5. **Ảnh demo trùng lặp 100% qua kiểm tra MD5:**
   - Ba mẫu yếu nhất (`legacy/demo-ca-phe-phin/images/`, `legacy/demo-khung-theu/images/`, `legacy/demo-thiep-gap/images/`) dùng chung **chính xác 7 file ảnh giống hệt nhau về mã MD5** (`anh1.jpg`–`anh6.jpg` và `xem-truoc.jpg`). `legacy/demo-thu-tay/images/` cũng trùng tiếp **cả 6 ảnh nội dung `anh1.jpg`–`anh6.jpg`**. Cộng với việc `thiep-gap` (78 dòng CSS), `khung-theu` (71 dòng CSS), `ca-phe-phin` (80 dòng CSS) quá mỏng, ba mẫu này trông như bản nhân bản đổi màu.
6. **Chữ tiếng Việt `< 13px` dính dấu & trang chủ `legacy/index.html`:**
   - Vi phạm cỡ chữ `< 13px` cho chữ in hoa / có dấu tiếng Việt xuất hiện tại: `packages/themes/cuon-phim/theme.css` (`10px–12px` ở `.hint`, `.kicker`, `.still small`, `.producers small`, `.slate dt`, `.tk-brand`, `.tk-grid small`, `.tk-stub small`, `.shot figcaption`, `.acc small`, `.roll small`), `thiep-gap/theme.css:60` (`10px`), `khung-theu/theme.css:51` (`12px`), `ca-phe-phin/theme.css` (`12px–12.5px`), `tin-nhan/theme.css` (`11px–12px`), `base.css:42,66` (`10px–11px`).
   - Ngay cả `legacy/index.html` cũng mang dấu hiệu AI-slop (`#14110f` + `#f4ede1`, nhấn 1 từ nghiêng `<em>một câu chuyện</em>`, thẻ `.phone` đồng dạng).

---

### 1.3 Vì sao 3 prototype đợt 2 thất bại (`"quá tệ, bỏ"`) & vì sao `to-hong.html` mới chỉ `"tạm được"`

- **R1 Hygiene đã hoàn tất:** Hai mẫu đã loại theo R1 (ghi nhận tại `docs/REDESIGN.md:9`) đã được dọn sạch hoàn toàn khỏi danh sách mẫu, điều hướng, UI, tài liệu hướng dẫn đang hoạt động và cấu hình dự án.
- **Ba prototype đợt 2 bị loại (`chu-la-hinh.html` 248 dòng, `hai-bo.html` 578 dòng, `hai-vong-lich.html` 792 dòng — đã xóa khỏi `legacy/proto/`):**
  - *Điểm làm được:* Đã phá bỏ khung 520px và cách cuộn cũ.
  - *Nguyên nhân thất bại chí mạng:* Vi phạm nguyên tắc **Subject Grounding** (`frontend-design`) và **Photo Primacy** (`BRIEF-3D.md`). Chúng biến thiệp cưới thành một bài tập đồ họa poster riso chói (`#2433ff`/`#ff3d8b`), bảng infographic chia hai cột đối đầu, hoặc mặt số kỹ thuật lạnh lẽo — đẩy ảnh cưới cô dâu chú rể xuống vai phụ, thiếu hẳn hơi thở ấm áp và cảm xúc khiến khách hàng sẵn lòng trả tiền.
- **Bản mẫu `legacy/proto/to-hong.html` (775 dòng — giữ làm tham chiếu cho M4):**
  - Được chủ dự án đánh giá `"tạm được — ý tưởng tốt, 3D hay nhưng chưa đủ đặc sắc"` vì còn **4 lỗ hổng lớn** (`docs/BRIEF-3D.md:12–17`):
    1. *Chất lượng hình ảnh:* Thiếu ánh sáng môi trường HDR (`RoomEnvironment`), thiếu tone mapping điện ảnh (`ACESFilmicToneMapping`), thiếu vật liệu PBR và hậu kỳ nên màu sắc và bố cục còn cảm giác "non nớt" kiểu demo WebGL.
    2. *Thiếu khoảnh khắc "wow":* Trải nghiệm quá ngắn, chưa tạo được 4–6 cao trào đáng nhớ trong nhịp 2–4 phút.
    3. *Tương tác thụ động:* Khách chủ yếu chỉ cuộn màn hình; tay khách chưa có việc để kéo, gảy, xoay, nghiêng hay chạm giữ.
    4. *Giả định sai về câu chuyện:* Mặc định cặp đôi có sẵn nhiều đoạn chữ kể chuyện thay vì lấy **6–30 bức ảnh cưới** làm tâm điểm.

---

## Chương 2 [Trụ cột 2]: Phương án nâng cấp toàn bộ 10 topic cũ được giữ lại

### 2.1 Quy tắc bắt buộc khi nâng cấp cả 10 mẫu v1 (`M2` & `M3`)

1. **Mở khóa không gian qua `legacy/core/base.css`:** Sử dụng `theme.layout = 'wide' | 'split' | 'full'` (hoặc biến `--card-max`, `--card-overflow: clip`) để thoát trần `520px` trên desktop `1440px` trong khi vẫn giữ tương thích 100% khi chạy kiểm thử chéo `?theme=<id>` trong `legacy/tests/smoke.mjs`.
2. **Xóa bỏ `data-rv` hàng loạt & pháo hoa mặc định:** Gắn `bodyClass: 'rv-custom'` (hoặc thay toàn bộ `data-rv="up"` đồng phục bằng chuyển động riêng theo **1 động từ chuyển động (Motion Verb)** đặc trưng của mẫu).
3. **Đưa ảnh cặp đôi lên vị trí trung tâm:** Ít nhất 1 màn đạt `>= 60–70%` diện tích hiển thị dành cho ảnh cưới; ẩn/tinh giản tự động khối chữ khi cặp đôi không nhập `story`.
4. **Tái thiết kế trực quan các khối chức năng:** Giữ nguyên hợp đồng thuộc tính `[data-w]` / tên trường form cho `widgets.js` (để không gãy backend Sheet & smoke test), nhưng đặt bảng đếm ngược, bản đồ, xác nhận RSVP (`<= 3` thao tác) và QR mừng cưới trực tiếp bên trong ẩn dụ đồ vật của mẫu.
5. **Tiếng Việt & bộ ảnh demo:** Mọi nhãn in hoa hoặc có dấu chồng **>= 13px**; mọi font Google đều có bộ `vietnamese`; **tách bộ ảnh demo độc lập (MD5 riêng biệt)** cho `demo-thiep-gap`, `demo-khung-theu`, `demo-ca-phe-phin`, `demo-thu-tay`.

---

### 2.2 Đặc tả nâng cấp chi tiết 10 topic cũ

#### 1. `song-hy` — Song Hỷ (Sân Lễ Sơn Mài Đông Dương) — *Milestone M2*
- **Giữ tinh hoa:** Cửa son mở hai cánh 3D, chữ Hỷ vàng kim, giọng trang trọng ("Song Gia"), 4 bảng màu Studio (`do-vang`, `ngoc-bich`, `hong-phan`, `navy-bac`).
- **Sửa lỗi:** Phá trần 520px + bỏ 32× `data-rv` trong JS & 7× trong CSS + bỏ pháo hoa mặc định + tinh gọn 487 dòng CSS nhồi đối xứng.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Ceremonial Courtyard (`layout: 'wide'`)**.
  - *Desktop:* Cổng sơn mài mở toàn màn hình (`100vw`) dẫn vào sân đình Đông Dương bất đối xứng — hai cột Song Gia đối diện nhau qua khoảng sân thoáng, ảnh cưới treo dạng bức trướng đứng cỡ lớn (`>= 70%` chiều cao viewport), lịch lễ là bài vị gỗ đặt song song với bản đồ, phiếu hồi âm khảm sơn mài.
  - *Mobile (`390px`):* Nhịp từng màn sân lễ thoáng rộng, không ép lưới chữ dày đặc.
- **Motion Verb & Choreography:** **Part & Illuminate (Vén cửa & Soi vàng)** — mở hai cánh cửa 3D (`rotateY`), vệt sáng vàng lướt chéo qua chữ Hỷ (`mask-position` shimmer nhẹ), đèn lồng 2 tầng parallax theo cuộn (0 pháo hoa).
- **Typography (Google Fonts `vietnamese`):** `Playfair Display` (tên & tiêu đề chính) + `Be Vietnam Pro` (nội dung `>= 15px`, nhãn `>= 13px`).
- **Bảng màu mặc định (6 hex):** Đỏ sơn mài `#A4161A`, Son thẫm `#52070C`, Vàng kim `#E6C27A`, Vàng đồng `#9E7835`, Lụa ngà `#FFF8EF`, Mực nâu `#381E17`.

#### 2. `thu-tay` — Thư Tay (Bàn Viết Thư Hoài Niệm) — *Milestone M2*
- **Giữ tinh hoa:** Bóc dấu sáp, chữ viết tay hiện dần, thẻ cào nhũ ngày cưới (`W.scratch`), ảnh con tem, polaroid kéo-ném (`W.polaroids`), vé xé cuống.
- **Sửa lỗi:** Phá hộp 520px, bỏ 26× `data-rv`, cấp bộ ảnh demo độc lập (không trùng MD5 với `thiep-gap`/`khung-theu`/`ca-phe-phin`).
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Tactile Writing Desk (`layout: 'wide'`)**.
  - *Desktop:* Mặt bàn gỗ óc chó trải rộng — nửa trái đặt phong bì dấu sáp + tờ thư giấy dó (`< 68ch`); nửa phải là cụm ảnh polaroid rải bất đối xứng có thể kéo/ném + thẻ cào nhũ ngày cưới + phiếu hồi âm chữ nhật nằm ngang.
  - *Mobile (`390px`):* Chồng giấy viết thư có thanh chuyển nhanh giữa Thư / Bàn ảnh / Hồi âm.
- **Motion Verb & Choreography:** **Unseal, Scratch & Toss (Bóc sáp, Cào nhũ & Ném ảnh)** — bẻ dấu sáp 2 mảnh + mở nắp phong bì `rotateX`, nét mực chạy theo SVG stroke, cào nhũ canvas, kéo thả polaroid có quán tính.
- **Typography:** `Cormorant Garamond` (tiêu đề) + `Ephesis` (chữ ký/tên) + `Lora` (nội dung thư `>= 16px`) + `Be Vietnam Pro` (nhãn `>= 13px`).
- **Bảng màu (6 hex):** Giấy dó `#F4EDE1`, Gỗ óc chó `#2B221D`, Mực xanh Phổ `#1F2A44`, Sáp đỏ `#8E1B2C`, Đồng thau `#B08D57`, Phấn hồng `#C98B8B`.

#### 3. `ve-may-bay` — Vé Máy Bay (Hành Trình Xuyên Lục Địa) — *Milestone M3*
- **Giữ tinh hoa:** Thẻ lên máy bay xé cuống, máy bay bay theo đường cuộn, bảng giờ bay lật chữ (split-flap), hộ chiếu đóng dấu, ô cửa sổ máy bay, vali mừng cưới.
- **Sửa lỗi:** Bỏ 27× `data-rv`, mở rộng khỏi 520px/540px để thẻ lên máy bay đúng tỉ lệ ngang thật trên desktop.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Transcontinental Route (`layout: 'wide'`)**.
  - *Desktop:* Hero toàn màn hình là bảng khởi hành sân bay kèm thẻ lên máy bay nằm ngang 2 cột (`~1160px`, phần cuống xé ở cạnh phải); các chặng kỷ niệm đi qua ô cửa sổ máy bay lớn (`65vh`), hộ chiếu mở 2 trang đối xứng.
  - *Mobile (`390px`):* Thẻ lên máy bay xếp dọc có đường răng cưa xé cuống ở giữa, ô cửa sổ lớn chiếm trọn bề ngang.
- **Motion Verb & Choreography:** **Tear, Fly & Flip (Xé cuống, Bay lướt & Lật bảng)** — kéo xé răng cưa, đường bay SVG chạy theo tiến độ cuộn, bảng giờ bay lật split-flap có chủ đích, đóng dấu mộc xác nhận khi gửi RSVP.
- **Typography:** `Big Shoulders Display` (biển báo) + `Fraunces` (tên & cảm xúc) + `JetBrains Mono` (chỉ số mã chuyến bay/giờ `>= 13px`, `tabular-nums`) + `Be Vietnam Pro` (nhãn tiếng Việt có dấu `>= 13px`).
- **Bảng màu (6 hex):** Trời bình minh `#8ECAE6`, Xanh bầu trời `#4A6FA5`, Giấy vé `#FFFAF0`, Hải quân `#14213D`, San hô `#E76F51`, Bạc hà `#2A9D8F`.

#### 4. `khoa-tinh` — Khóa Tình (Cầu Đêm Ánh Trăng) — *Milestone M3*
- **Giữ tinh hoa:** Ổ khóa 4 vòng số ngày cưới (+ nút `"Mở giúp tôi"` hỗ trợ tiếp cận), mặt dây chuyền đung đưa, chùm chìa khóa, lan can ảnh, ném chìa xuống sông.
- **Sửa lỗi:** Bỏ 30× `data-rv`, mở rộng khỏi cột 520px, thay khối vẽ cầu clip-art bằng cảnh sông đêm có chiều sâu ánh sáng phản chiếu.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Moonlit Bridge Panorama (`layout: 'full'`)**.
  - Lan can cầu trải ngang toàn màn hình phía trên mặt nước phản chiếu ánh đèn vàng; ảnh cưới treo thành mặt dây chuyền đồng thau/vàng hồng có ánh kim và bóng đổ; mỗi lời chúc khách gửi biến thành 1 ổ khóa khắc tên gắn lên lan can; thẻ đồng RSVP đặt ngay nhịp cầu chính.
- **Motion Verb & Choreography:** **Dial, Sway & Ripple (Xoay khớp, Đung đưa & Gợn sóng)** — 4 vòng số xoay có quán tính và khựng từ tính khi khớp ngày cưới; mặt dây chuyền đung đưa theo cuộn/chạm; thả chìa xuống nước tạo vòng sóng lan tỏa trên canvas.
- **Typography:** `Alex Brush` (tên cặp đôi khổ lớn) + `Spectral` (nội dung & tiêu đề) + `Be Vietnam Pro` (nhãn `>= 13px`).
- **Bảng màu (6 hex):** Đêm sâu `#0B1822`, Sông đêm `#13354A`, Đồng thau `#C9A227`, Vàng hồng `#D8A48F`, Đèn cầu `#FFCF8A`, Ngà ấm `#F7EFE3`.

#### 5. `den-long` — Đèn Lồng (Phố Hội Đêm Rằm) — *Milestone M3*
- **Giữ tinh hoa:** Thắp nến thả hoa đăng mở thiệp, dây đèn sáng dần, cổng trăng tường vàng, cửa chớp mở album, lời chúc thành hoa đăng, thả đèn trời.
- **Sửa lỗi:** Bỏ 30× `data-rv`, mở khóa khỏi hộp 520px, thay nhà phố/tường vàng CSS phẳng kiểu clip-art bằng lớp chiều sâu mái ngói – tường vôi cổ – sông Hoài.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Hội An Twilight River (`layout: 'full'`)**.
  - Nền toàn chiều rộng chia 3 lớp parallax (đêm sông Hoài, mái ngói cổ, tường vàng); cổng trăng cắt ảnh cưới tràn biên; trên `1440px`, cửa chớp gỗ mở hai bên hé lộ cặp ảnh lớn; dòng sông hoa đăng trôi suốt bề ngang ở phần lời chúc.
- **Motion Verb & Choreography:** **Kindle, Drift & Ascend (Thắp sáng, Trôi sông & Thả trời)** — chạm giữ/bấm thắp bấc nến bùng quầng sáng ấm, cửa chớp 3D mở góc `perspective`, hoa đăng trôi sin-wave, đèn trời bay lên khi gửi RSVP/kết thiệp.
- **Typography:** `Dancing Script` (tên lớn) + `Noto Serif Display` (tiêu đề) + `Be Vietnam Pro` (nội dung `>= 15px`, nhãn `>= 13px`).
- **Bảng màu (6 hex):** Đêm phố Hội `#0F1A2B`, Tường vàng cổ `#E8B84B`, Ngói đất nung `#8C2F1B`, Rêu cửa chớp `#2F6F5E`, Đèn lồng son `#C1121F`, Kem `#FDF3DC` *(tách biệt hoàn toàn khỏi cặp kem `#F4F1EA` + `#D97757` của AI-slop)*.

#### 6. `cuon-phim` — Cuộn Phim (Rạp Chiếu Phim v1 & v2) — *Milestone M3*
- **Giữ tinh hoa:** Đã lên v2 (`packages/themes/cuon-phim`, 9 cảnh: cần gạt máy chiếu, Web Audio tiếng tạch, 3-2-1 leader, rèm nhung, clapper, vé xé, ghế đôi, phụ đề, danh đề cuối phim).
- **Sửa lỗi:**
  - *Bản v1 (`legacy/themes/cuon-phim`):* Bỏ 33× `data-rv`, gỡ trần `520px` để màn ảnh và dải phim 35mm mở rộng trên desktop.
  - *Bản v2 (`packages/themes/cuon-phim`):* Nâng toàn bộ **11 nhóm selector chữ `10px/11px/12px`** trong `theme.css` lên **`>= 13px`** (`.hint`, `.kicker`, `.still small`, `.producers small`, `.slate dt`, `.tk-brand`, `.tk-grid small`, `.tk-stub small`, `.shot figcaption`, `.acc small`, `.roll small`); nâng bố cục `1440px` thành phòng chiếu 2 cột (ghi chú suất chiếu bên trái + màn ảnh 16:9 bên phải, vé đôi nằm ngang) và nâng `cinematic` bằng hạt bụi + tia chiếu máy chiếu mượt trên canvas/WebGL nhẹ.
- **Motion Verb & Choreography:** **Project & Scrub (Chiếu rọi & Tua cuộn)** — gạt cần bật máy chiếu, scrub kéo rèm nhung, clapper đóng theo ngưỡng cuộn, tua ngang dải phim 35mm, phụ đề mờ hiện theo nhịp.
- **Typography:** `Big Shoulders Display` + `Playfair Display` + `Space Mono` (chỉ cho mã giờ/số `>= 13px`) + `Be Vietnam Pro`.
- **Bảng màu (6 hex):** Rạp tối `#15120F`, Phim `#0D0B0A`, Nhung đỏ `#7D1A1D` (cùng `luc-bao` `#14574A`, `hai-quan` `#183A6B`), Hổ phách `#E8A33D`, Phụ đề vàng `#FFE27A`, Màn ảnh `#F5EFE3`.

#### 7. `tin-nhan` — Tin Nhắn (Hệ Điều Hành Trò Chuyện) — *Milestone M3*
- **Giữ tinh hoa:** Màn hình khóa đồng hồ thật + thông báo mời cưới, Web Audio `"ting"`, hiệu ứng `"đang soạn tin"`, danh thiếp, lịch hẹn, chip trả lời RSVP & bao lì xì.
- **Sửa lỗi:** Gỡ khóa `520px` trên desktop (`tin-nhan/theme.css:11`), nâng mọi nhãn `11px–12px` (`.nt small`, `.top small`, `.day span`, `.who`, `.tm`, `.invite-card small`) lên **`>= 13px`**, phóng lớn ảnh trong luồng trò chuyện.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Conversational OS (`layout: 'split'`)**.
  - *Desktop:* 2 khung thực thụ — **trái** là Hồ sơ đôi uyên ương cố định (ảnh hero lớn `>= 60vh`, bộ đếm ngược, bản đồ nhanh, danh thiếp hai họ); **phải** là luồng tin nhắn trực tiếp với thẻ ảnh vuốt ngang và chip trả lời RSVP 2 chạm.
  - *Mobile (`390px`):* Giao diện OS trò chuyện toàn màn hình với chồng thẻ ảnh vuốt ngang (photo-story deck) cỡ lớn trong luồng tin.
- **Motion Verb & Choreography:** **Type, Pop & Reply (Gõ, Nảy tin & Phản hồi)** — biến hình mượt từ trạng thái đang soạn thành bong bóng tin nhắn (không giật chiều cao), chồng thẻ ảnh vuốt có đàn hồi, chạm chip trả lời RSVP phản hồi tức thì.
- **Typography:** `Fraunces` (tên & tiêu đề danh thiếp) + `Be Vietnam Pro` (tin nhắn `>= 14px`, nhãn thời gian `>= 13px`).
- **Bảng màu (6 hex):** Kem giấy `#F6EFE6`, Sứ trắng `#FFFDFB`, Hồng phấn `#FDE6DC`, San hô `#E0644F`, Mòng két `#2F7D6D`, Chữ `#2D2420` *(giữ đủ palettes `san-ho`, `bac-ha`, `lavender`, `xanh-troi`)*.

#### 8. `thiep-gap` — Thiệp Gấp (Sách Pop-Up Kiến Trúc — *ĐẠI TU M2*)
- **Giữ tinh hoa:** Cơ chế mở thiệp giấy gấp kirigami đa lớp & ngăn kéo giấy đựng hộp quà mừng cưới.
- **Sửa lỗi nghiêm trọng:** Chỉ có 78 dòng CSS, bị khóa `520px`, 20× `data-rv`, thay ảnh cưới bằng hình cắt dán SVG chung chung, trùng 100% 7 file ảnh MD5 với `khung-theu` & `ca-phe-phin`, `.fold span` chỉ `10px`.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Architectural Pop-Up Book (`layout: 'wide'`)**.
  - *Desktop:* Trải sách mở 2 mặt ngang (`1180px`) có gáy gấp ở giữa — trang trái là **khung ảnh vòm đứng bật nổi 3D** dựng từ **ảnh cưới thật của cặp đôi** (3 lớp `translateZ` + bóng đổ thật); trang phải là thông tin lễ, bản đồ gấp giấy và phiếu RSVP; trang cuối là ngăn kéo giấy kéo ngang lấy QR.
  - *Mobile (`390px`):* Lật từng trang sách theo nếp gấp 3D kèm thanh chỉ báo số nếp gấp (`>= 13px`), không còn chuỗi 11 đoạn giống các mẫu khác.
- **Motion Verb & Choreography:** **Fold & Pop-Up (Gấp mở & Bật lớp 3D)** — bản lề `preserve-3d` dựng 3 lớp ảnh có độ trễ nối tiếp khi mở/lật trang; ngăn kéo giấy trượt ngang bằng cử chỉ kéo hoặc chạm.
- **Typography:** `Fraunces` (tên & tiêu đề) + `Be Vietnam Pro` (nội dung `>= 15px`, nhãn `>= 13px`).
- **Bảng màu (6 hex):** Giấy Kraft `#F2EBE0`, Kem giấy `#FFFAF1`, San hô sáng `#E0634C`, Ngọc bích `#2F8F83`, Cúc vạn thọ `#E9B44C`, Than chì `#2A2421` *(tách khỏi `#F4F1EA`+`#D97757` AI-slop)*. **Cấp bộ ảnh demo riêng 100% (MD5 độc lập).**

#### 9. `khung-theu` — Khung Thêu (Tấm Vải Lanh Thêu Tay — *ĐẠI TU M2*)
- **Giữ tinh hoa:** Cử chỉ nhấn giữ `1.8s` để đường chỉ thêu hoàn chỉnh trái tim (kèm nút `"Mở ngay"` cho bàn phím), chất liệu vải lanh thô, đường chỉ nét đứt.
- **Sửa lỗi nghiêm trọng:** Chỉ có 71 dòng CSS, khóa `520px`, 20× `data-rv`, trình chiếu ảnh lặp lại `W.gallery()` hệt mẫu khác, trùng 100% 7 file ảnh MD5, `.cloth-patch small` `12px`.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Artisan Linen Tapestry (`layout: 'wide'`)**.
  - Thoát hoàn toàn cột dọc căn giữa: mở ra tấm vải lanh khổ rộng (`1180px` desktop, zic-zac bất đối xứng trên `390px` mobile) với các khung thêu gỗ tròn nhiều kích cỡ (`180px / 240px / 360px`) đặt ảnh cưới lớn, xen kẽ miếng vải thêu thông tin lễ và nhãn dệt RSVP khâu viền chỉ thật.
- **Motion Verb & Choreography:** **Stitch & Unspool (Khâu chỉ & Kéo sợi)** — đường chỉ SVG (`stroke-dashoffset`) khâu nối giữa các khung ảnh theo tiến độ cuộn; bấm chọn xác nhận RSVP thêu mũi chữ thập (`×`) ngay trên miếng vải hồi âm.
- **Typography:** `Charm` (tên & chữ thêu tay) + `Lora` (lời mời) + `Be Vietnam Pro` (nhãn `>= 13px`).
- **Bảng màu (6 hex):** Vải lanh thô `#EFE7DA`, Lanh đậm `#E0D3BC`, Chỉ đất gốm `#B84A39`, Xanh xô thơm `#557A65`, Vàng mù tạt `#C8963E`, Gỗ óc chó `#4A3525` *(giữ palettes `dat-nung`, `cham`, `hong-sen`)*. **Cấp bộ ảnh demo riêng 100% (MD5 độc lập).**

#### 10. `ca-phe-phin` — Cà Phê Phin (Quán Quen & Thực Đơn Nếm — *ĐẠI TU M2*)
- **Giữ tinh hoa:** Phin cà phê nhỏ giọt đầy ly + hơi nóng, ẩn dụ thực đơn `"Ngày chung đôi"`, phiếu order RSVP, hũ tiền tip QR.
- **Sửa lỗi nghiêm trọng:** Chỉ có 80 dòng CSS, khóa `520px`, 16× `data-rv`, ly phin bằng khối CSS đơn sơ, trùng 100% 7 file ảnh MD5, nhiều nhãn `12px–12.5px`.
- **Bố cục Desktop (`1440px`) / Mobile (`390px`):** **Artisanal Café Table & Tasting Flight (`layout: 'wide'`)**.
  - *Desktop:* Mặt bàn gỗ mở **cuốn thực đơn gấp đôi 2 mặt thật** — mặt trái là ảnh cưới khổ lớn đặt trên đế lót ly giấy có chú thích; mặt phải là thực đơn ngày cưới, bản đồ quán, phiếu order RSVP có ô tích món/tham dự và QR trên đế lót ly.
  - *Mobile (`390px`):* Bộ thẻ thực đơn nếm (`tasting flight cards`) lật từng thẻ (Ảnh / Lịch lễ / Hồi âm Order) thay cho dải cuộn dọc dài 11 đoạn.
- **Motion Verb & Choreography:** **Brew, Steep & Stamp (Nhỏ giọt, Bốc khói & Đóng dấu Order)** — nhỏ giọt tăng mực cà phê kèm hơi nước SVG/canvas mịn; khi gửi phiếu order RSVP, đóng dấu cao su `"ĐÃ NHẬN ORDER"` nảy lực lò xo.
- **Typography:** `Playfair Display` (tiêu đề menu) + `Space Mono` (mã order/giờ `>= 13px`, không dùng cho chữ có dấu nhỏ) + `Be Vietnam Pro` (tiếng Việt `>= 14px`).
- **Bảng màu (6 hex):** Rang đậm `#261812`, Crema `#C98A4B`, Sữa ấm `#F4ECE1`, Giấy menu `#FAF3E6`, Mực dấu đỏ `#A63429`, Rêu nhạt `#4B6352` *(giữ palettes `nau-sua`, `matcha`, `hong-bac-xiu`)*. **Cấp bộ ảnh demo riêng 100% (MD5 độc lập).**

---

## Chương 3 [Trụ cột 3]: Đề xuất & Đặc tả các Topic mới Photo-First (Engine v2)

### 3.1 Kiến trúc & Ràng buộc chung cho mọi Topic v2 (`packages/themes/*`)

Dựa trực tiếp trên `docs/BRIEF-3D.md` và `packages/engine/`:
1. **Ảnh là nhân vật chính (`6–30 ảnh`):** Mọi chủ đề phải đẹp trọn vẹn khi cặp đôi chỉ tải lên 6–30 bức ảnh cưới và thông tin cốt lõi (tên, ngày, địa điểm, QR). Cảnh kể chuyện (`story`) luôn dùng `when: ctx => ctx.has('story')`.
2. **Chủ đề = Khí quyển + Tương tác không gian:** Không đóng khung theo kịch bản văn bản. Khách được tự tay kéo, xoay, chạm bước vào ảnh, nghiêng gyro, vẽ gợn sóng, thả đèn/sao — tạo **4–6 khoảnh khắc "wow"** trong nhịp **2–4 phút**.
3. **Chất lượng hình ảnh Awwwards (không "demo WebGL"):**
   - Với `Three.js r170` (nạp sau khi mở bìa qua `ctx.lib('three')` / `ctx.lib('three-post')`): sử dụng `PMREMGenerator` + `RoomEnvironment`, `ACESFilmicToneMapping` (`toneMappingExposure` tinh chỉnh), vật liệu PBR, sương mù/chiều sâu và 1 pass hậu kỳ nhẹ nửa độ phân giải (`UnrealBloomPass` dịu + `OutputPass` + vignette/grain).
   - Với shader thuần (`ho-guong`): dùng **OGL (~29KB)** hoặc shader Three.js nhẹ để chạy tốt `>= 50fps` trên WebView Zalo Android.
4. **An toàn di động & `#sh-quick`:**
   - DPR tối đa `1.5`, texture `<= 1024px`, giải mã qua `createImageBitmap`, tạm dừng vòng lặp `requestAnimationFrame` khi `document.hidden`.
   - Gắn `bindContextLoss(canvas, () => ctx.downgrade('webglcontextlost'))` để chuyển về giao diện DOM tĩnh (`motion.lite`) ngay nếu WebView thu hồi GPU.
   - Bắt buộc có đủ `motion.cinematic`, `motion.standard` và `motion.lite` (`define-theme.js:49`) + ngăn kéo **`#sh-quick` (<= 10s)**.

---

### 3.2 Đặc tả 5 Topic mới / nâng tầm (`M4`, `M5` & Lộ trình)

#### 1. `to-hong` 2.0 — Tơ Hồng (Flagship 3D — *Milestone M4*)
- **Liên hệ `motionsites.ai`:** `Particle Self` + `Roadster 3D` (camera spline + PBR `RoomEnvironment`).
- **Khắc phục triệt để 4 lỗi của `legacy/proto/to-hong.html`:**
  1. *Hình ảnh:* Nâng ánh sáng bằng `RoomEnvironment` + `ACESFilmicToneMapping` + sương chiều sâu; sợi tơ PBR ánh lụa đỏ có độ bóng + phát sáng dịu (`emissive`), ảnh cưới lồng khung đồng/lụa kích thước lớn.
  2. *Ảnh là chính:* 6–30 ảnh cặp đôi xếp dọc đường tơ thành chuỗi khung treo bất đối xứng (tự co giãn theo số ảnh thực tế); `story` là phần mở rộng tùy chọn.
  3. *Tương tác chủ động:* Kéo xoay camera tự do có quán tính + cảm biến nghiêng (gyroscope, xin quyền ngay cú chạm mở bìa).
  4. *Nhịp 2–4 phút với 5 khoảnh khắc "wow":*
     - **Wow 1 (Bìa):** Gảy/kéo sợi chỉ đỏ đang căng ngang để tạo sóng hài lộ tên cặp đôi.
     - **Wow 2:** Camera xuyên màn sương/cánh hoa tiến vào khung ảnh hero 2.5D.
     - **Wow 3:** Chạm bất kỳ khung ảnh nào trên đường tơ để dolly camera lại gần và soi nghiêng 3D.
     - **Wow 4:** Hai bảng Song Gia treo dải lụa lơ lửng + lịch lễ khắc lụa.
     - **Wow 5 (Cao trào kết):** Các sợi tơ hội tụ thành nút thắt phát sáng; khách nhấn giữ nút `"Thắt nút"` RSVP để thắt nút 3D và thả dải lụa mang tên khách.
- **Typography & Bảng màu (6 hex):** `Bricolage Grotesque` + `Newsreader` + `Be Vietnam Pro` (`>= 13px`). Preset *Sương Sớm*: `#EEF1F4`, Ánh ngọc `#D7E2EC`, Mực đá `#23303D`, Chỉ son `#C8102E`, Son đậm `#8E0B20`, Vàng ấm `#D9A86C` (cùng preset *Đêm Tơ Đỏ*: `#160D10`, `#261318`, `#FFF3EA`, `#C8102E`, `#E6C27A`).
- **Fallback `standard` / `lite`:** SVG sợi tơ động vẽ theo tiến độ cuộn (`stroke-dashoffset`) + bố cục ảnh lụa thoáng 2 cột (desktop) / 1 cột rộng (mobile), hoàn toàn không che chữ.

#### 2. `phong-trien-lam` — Phòng Triển Lãm Đêm (Ưu tiên #1 — *Milestone M5*)
- **Liên hệ `motionsites.ai`:** `Runway Lookbook` + `Living Portrait` + `Obsidian`.
- **Ý tưởng & Bố cục (`layout: 'stage'`):** Phòng tranh nghệ thuật đêm riêng của cặp đôi. Chiều dài hành lang **tự co giãn theo số ảnh thực tế (6–30 tấm)** để không bị trống hay thừa. Ảnh được đặt trong khung bảo tàng có đèn rọi spotlight, bóng đổ mềm lên tường; thông tin lễ nằm trên bảng chú thích cạnh tranh; RSVP & QR đặt trang trọng trên bục đá cẩm thạch cuối sảnh.
- **5 Khoảnh khắc "wow":**
  1. Mở cửa kính sảnh bảo tàng đêm ấm áp (bìa).
  2. **Bước vào trong ảnh (`Living Portrait`):** chạm một khung tranh, camera tiến vào và kích hoạt thị sai chiều sâu 2.5D theo con trỏ hoặc nghiêng máy.
  3. Hệ đèn rọi bật sáng dần theo bước di chuyển dọc hành lang.
  4. **Bức tường ghép ảnh (Mosaic Finale):** toàn bộ 6–30 bức ảnh hội tụ thành tên / chữ cái đầu của cô dâu chú rể.
  5. **Thắp đèn xác nhận:** mỗi khách gửi RSVP sẽ thắp sáng thêm một ngọn đèn treo tường trong sảnh triển lãm.
- **Typography & Bảng màu (5 hex):** `Cormorant Garamond` + `Be Vietnam Pro` (`>= 13px`). Preset *Đêm Obsidian*: `#111216`, Thạch cao đêm `#1B1D24`, Đèn gallery `#F5D08A`, Đồng xước `#B99153`, Kem bảo tàng `#F2EDE4` (cùng preset *Bảo Tàng Sáng*: `#ECEAE4`, `#FFFFFF`, `#1D232A`, `#9E6E3B`, `#6B5B45`).
- **Fallback `standard` / `lite`:** Lookbook triển lãm 2 cột ánh rọi CSS trên desktop, trình diễn từng khung có chú thích bảo tàng trên mobile.

#### 3. `bau-troi-anh` — Bầu Trời Ảnh (Chòm Sao Kỷ Niệm — *Milestone M5*)
- **Liên hệ `motionsites.ai`:** `Orbit Sphere` + `Particle Self` + `MORPHO`.
- **Ý tưởng & Bố cục (`layout: 'stage'`):** 6–30 bức ảnh cưới lơ lửng thành vòm chòm sao đa tầng bao quanh khách. Khách kéo ngón tay xoay 360° hoặc nghiêng điện thoại (gyro) để quan sát; chạm bất kỳ ảnh nào, camera bay mượt tới khung ảnh đó. Hỗ trợ **3 bộ khí quyển (Sky Presets)**: *Đêm sao* (`dem-sao`), *Hoàng hôn biển* (`hoang-hon`), *Mưa hoa anh đào* (`anh-dao`).
- **5 Khoảnh khắc "wow":**
  1. Bìa: chạm nối hai ngôi sao mang chữ cái đầu của cặp đôi để thắp sáng chòm sao tên hai người.
  2. Kéo xoay bầu trời 360° với dòng hạt sao phản ứng theo vận tốc kéo.
  3. Tap-to-fly dolly zoom vào từng ảnh kỷ niệm + xem chú thích nhẹ.
  4. **Hội tụ (`MORPHO`):** cuối hành trình, toàn bộ ảnh hút vào quỹ đạo tạo thành hình trái tim hoặc chữ cái đầu.
  5. **Thả sao RSVP:** khi khách xác nhận tham dự, một ngôi sao mang tên khách bay lên gia nhập bầu trời.
- **Typography & Bảng màu (5 hex):** `Playfair Display` + `Be Vietnam Pro` (`>= 13px`). Preset *Đêm sao*: Đêm thiên hà `#080D1A`, Tinh vân xanh `#162544`, Ánh sao `#FFE8B3`, Hồng bình minh `#E88D82`, Bạc ánh trăng `#DCE6F5`.
- **Fallback `standard` / `lite`:** Lưới chòm sao SVG nối các khung ảnh theo cuộn, bấm mở lightbox không cần WebGL.

#### 4. `ho-guong` — Hồ Gương Hoàng Hôn (Mặt Nước Phản Chiếu — *Milestone M5*)
- **Liên hệ `motionsites.ai`:** `Aurel Liquid Hero` + `Ink Reveal`.
- **Ý tưởng & Bố cục (`layout: 'stage'`):** Mặt hồ phẳng lặng lúc hoàng hôn phản chiếu tên cặp đôi và ánh nắng chiều. Sử dụng **OGL (~29KB)** (hoặc shader Three.js tối ưu) chạy **flowmap gợn sóng tương tác theo ngón tay/con trỏ** kết hợp phản chiếu mặt nước (planar/UV reflection tiết kiệm GPU cho mobile Zalo).
- **5 Khoảnh khắc "wow":**
  1. Bìa: chạm ngón tay xuống mặt hồ tạo gợn sóng xé tan làn sương lộ tên cô dâu chú rể.
  2. **Ảnh nổi từ mặt nước:** khi cuộn/vuốt, từng bức ảnh cưới từ dưới làn nước trong nổi dần lên cùng quầng sáng đồng ấm.
  3. Vẽ sóng trực tiếp bằng ngón tay làm bóng chữ và mặt phản chiếu gợn theo vật lý nước.
  4. Tấm bia đá ven hồ hiển thị ngày giờ, bản đồ và nút xác nhận.
  5. **Hoa đăng RSVP:** khi gửi xác nhận, khách thả một ngọn đèn hoa đăng mang tên mình trôi xa dần trên mặt hồ phản chiếu.
- **Typography & Bảng màu (5 hex):** `Noto Serif Display` + `Be Vietnam Pro` (`>= 13px`). Hoàng hôn hồ: Xanh thẫm hồ `#0E2431`, Hoàng hôn đồng `#D98245`, Vàng nắng chiều `#F6C270`, Sương tím nhạt `#463F57`, Kem phản chiếu `#FAF1E2`.
- **Fallback `standard` / `lite`:** Mặt nước chuyển sắc SVG `feTurbulence` tĩnh/nhẹ + ảnh xếp lớp dọc thoáng, RSVP hoa đăng 2D.

#### 5. `son-mai` — Sơn Mài Ánh Kim (Lộ trình mở rộng sau M5 — *Tier Điện ảnh nhẹ GPU*)
- **Ý tưởng:** Lấy cảm hứng từ tranh sơn mài khảm vỏ trứng & vàng quỳ (`REDESIGN.md:48`): bề mặt đen sâu, son thẫm, họa tiết khảm; khi cuộn hoặc nghiêng máy, ánh sáng specular chạy qua mặt sơn mài (`OGL` shader nhẹ) và mài lộ từng lớp ảnh cưới ánh vàng. Phù hợp cặp đôi thích truyền thống sang trọng mà không cần cảnh 3D không gian sâu.

---

## Chương 4 [Trụ cột 4a]: Ma trận Bố cục – Thiết kế – Animation & Ma trận Thư viện

### 4.1 Ma trận tổng hợp 15 Topic (10 Legacy Nâng cấp + 5 New/Roadmap)

| # | Topic | Mức / Gói | Nền tảng | Layout Desktop (`1440`) & Mobile (`390`) | Động từ chuyển động (Motion Verb) | Cao trào "Wow" chính | Cặp Font (`vietnamese`, `>=13px`) | Bảng màu cốt lõi (Hex) | Dự phòng `lite` / Reduced Motion |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `song-hy` | Nâng cấp (M2) | v1 (`wide`) | Sân lễ Đông Dương 2 cánh mở; trướng ảnh `70%` | **Part & Illuminate** (Vén cửa & Soi vàng) | Cửa son `rotateY`, ánh vàng lướt Hỷ, đèn parallax | `Playfair Display` + `Be Vietnam Pro` | `#A4161A`, `#52070C`, `#E6C27A`, `#9E7835`, `#FFF8EF`, `#381E17` | Bỏ 3D cửa/parallax, hiện sân lễ tĩnh rõ |
| 2 | `thu-tay` | Nâng cấp (M2) | v1 (`wide`) | Bàn viết thư 2 nửa (thư \| polaroid & cào nhũ) | **Unseal, Scratch & Toss** | Bẻ sáp, mực viết SVG, cào nhũ ngày, ném ảnh | `Cormorant Garamond` + `Ephesis` + `Lora` | `#F4EDE1`, `#2B221D`, `#1F2A44`, `#8E1B2C`, `#B08D57`, `#C98B8B` | Nắp thư mở sẵn, ảnh lưới tĩnh, thẻ ngày hiện rõ |
| 3 | `ve-may-bay` | Nâng cấp (M3) | v1 (`wide`) | Thẻ lên máy bay ngang 2 cột / dọc mobile | **Tear, Fly & Flip** | Xé cuống vé, máy bay theo đường cuộn, lật bảng, đóng mộc | `Big Shoulders Display` + `Fraunces` + `JetBrains Mono` | `#8ECAE6`, `#4A6FA5`, `#FFFAF0`, `#14213D`, `#E76F51`, `#2A9D8F` | Vé nằm phẳng đủ thông tin, không lật chữ |
| 4 | `khoa-tinh` | Nâng cấp (M3) | v1 (`full`) | Panorama lan can cầu trên sông đêm | **Dial, Sway & Ripple** | Xoay 4 vòng số, mặt dây chuyền đung đưa, thả chìa gợn sóng | `Alex Brush` + `Spectral` + `Be Vietnam Pro` | `#0B1822`, `#13354A`, `#C9A227`, `#D8A48F`, `#FFCF8A`, `#F7EFE3` | Nút `"Mở giúp tôi"` + lưới mặt dây chuyền tĩnh |
| 5 | `den-long` | Nâng cấp (M3) | v1 (`full`) | Sông Hoài 3 lớp, cổng trăng & cửa chớp 2 cột | **Kindle, Drift & Ascend** | Thắp bấc nến, mở cửa chớp 3D, hoa đăng trôi, thả đèn trời | `Dancing Script` + `Noto Serif Display` + `Be Vietnam Pro` | `#0F1A2B`, `#E8B84B`, `#8C2F1B`, `#2F6F5E`, `#C1121F`, `#FDF3DC` | Cửa mở sẵn, danh sách lời chúc thay đèn trôi |
| 6 | `cuon-phim` | Nâng cấp (M3) | v1 & v2 (`scroll`) | Phòng chiếu 2 cột (ghi chú \| màn 16:9) | **Project & Scrub** | Kéo cần chiếu, rèm nhung, clapper, tua dải 35mm, phụ đề | `Big Shoulders Display` + `Playfair Display` + `Space Mono` | `#15120F`, `#0D0B0A`, `#7D1A1D`, `#E8A33D`, `#FFE27A`, `#F5EFE3` | `motion.lite`: không pin, ảnh & phụ đề xếp rõ |
| 7 | `tin-nhan` | Nâng cấp (M3) | v1 (`split`) | OS 2 khung (Hồ sơ trái \| Chat phải) / Chat mobile | **Type, Pop & Reply** | Đang gõ mượt, chồng thẻ ảnh vuốt, chip RSVP 2 chạm | `Fraunces` + `Be Vietnam Pro` | `#F6EFE6`, `#FFFDFB`, `#FDE6DC`, `#E0644F`, `#2F7D6D`, `#2D2420` | Toàn bộ tin nhắn hiện ngay không trễ typing |
| 8 | `thiep-gap` | Đại tu (M2) | v1 (`wide`) | Sách Pop-Up 2 mặt / Lật nếp gấp mobile | **Fold & Pop-Up** | Bật 3 lớp ảnh cưới thật 3D, kéo ngăn giấy lấy QR | `Fraunces` + `Be Vietnam Pro` | `#F2EBE0`, `#FFFAF1`, `#E0634C`, `#2F8F83`, `#E9B44C`, `#2A2421` | Mở phẳng 2 trang, ảnh đứng rõ không 3D |
| 9 | `khung-theu` | Đại tu (M2) | v1 (`wide`) | Tấm vải lanh bất đối xứng nhiều cỡ khung | **Stitch & Unspool** | Giữ tay thêu tim, chỉ nối khung, thêu dấu `×` RSVP | `Charm` + `Lora` + `Be Vietnam Pro` | `#EFE7DA`, `#E0D3BC`, `#B84A39`, `#557A65`, `#C8963E`, `#4A3525` | Nút `"Mở ngay"`, đường chỉ tĩnh |
| 10 | `ca-phe-phin` | Đại tu (M2) | v1 (`wide`) | Thực đơn 2 mặt trên bàn gỗ / Thẻ nếm mobile | **Brew, Steep & Stamp** | Nhỏ giọt cà phê + khói ấm, đóng dấu cao su RSVP | `Playfair Display` + `Space Mono` + `Be Vietnam Pro` | `#261812`, `#C98A4B`, `#F4ECE1`, `#FAF3E6`, `#A63429`, `#4B6352` | Thực đơn & phiếu order mở sẵn không cần đợi pha |
| 11 | `to-hong` 2.0 | Flagship 3D (M4) | v2 (`stage`) | Không gian tơ đỏ PBR + 6–30 ảnh dọc spline | **Thread & Knot** (Xâu chỉ & Thắt nút) | Gảy tơ bìa, xuyên sương 2.5D, chạm zoom ảnh, thắt nút RSVP | `Bricolage Grotesque` + `Newsreader` + `Be Vietnam Pro` | `#EEF1F4`, `#D7E2EC`, `#23303D`, `#C8102E`, `#8E0B20`, `#D9A86C` | SVG đường chỉ theo cuộn + lưới ảnh 2D + `#sh-quick` |
| 12 | `phong-trien-lam` | Mới #1 (M5) | v2 (`stage`) | Hành lang bảo tàng co giãn theo 6–30 ảnh | **Enter & Illuminate** (Bước vào & Soi sáng) | Mở cửa sảnh, bước vào ảnh 2.5D, mosaic tên, thắp đèn RSVP | `Cormorant Garamond` + `Be Vietnam Pro` | `#111216`, `#1B1D24`, `#F5D08A`, `#B99153`, `#F2EDE4` | Lookbook triển lãm 2 cột + `#sh-quick` |
| 13 | `bau-troi-anh` | Mới (M5) | v2 (`stage`) | Vòm trời 3D xoay 360° (3 sky presets) | **Orbit & Converge** (Quỹ đạo & Hội tụ) | Nối 2 sao bìa, xoay gyro, tap-to-fly, tụ tim, thả sao RSVP | `Playfair Display` + `Be Vietnam Pro` | `#080D1A`, `#162544`, `#FFE8B3`, `#E88D82`, `#DCE6F5` | Lưới chòm sao SVG tĩnh + lightbox ảnh |
| 14 | `ho-guong` | Mới (M5) | v2 (`stage`) | Mặt hồ hoàng hôn phản chiếu tương tác | **Ripple & Emerge** (Gợn sóng & Nổi lên) | Chạm rẽ sương, vẽ sóng flowmap, ảnh nổi, thả hoa đăng RSVP | `Noto Serif Display` + `Be Vietnam Pro` | `#0E2431`, `#D98245`, `#F6C270`, `#463F57`, `#FAF1E2` | Mặt hồ SVG nhẹ + danh sách ảnh thoáng + hoa đăng 2D |
| 15 | `son-mai` | Lộ trình (sau M5) | v2 (`stage`) | Bề mặt sơn mài khảm vỏ trứng & vàng quỳ | **Burnish & Gleam** (Mài lớp & Ánh kim) | Ánh sáng lóe vàng theo nghiêng máy, mài lộ lớp ảnh cưới | `Noto Serif Display` + `Be Vietnam Pro` | `#181312`, `#6E1418`, `#D6AE5E`, `#EFE6D5`, `#2C221E` | Lớp ảnh khảm tĩnh rõ nét |

---

### 4.2 Ma trận Thư viện UI / Animation (Tách bạch tuyệt đối Zero-React vs React 19)

| Tầng kiến trúc | Phạm vi áp dụng | Thư viện được phép dùng | Cơ chế nạp & Ngưỡng an toàn | Tuyệt đối CẤM |
|---|---|---|---|---|
| **Tầng Invite (Zero-React)** | `packages/engine/`, `packages/themes/*`, `legacy/` | • `GSAP 3.13` + `ScrollTrigger` (`ctx.lib('scroll')`)<br>• `Three.js r170` + `RoomEnvironment` / `EffectComposer` / `UnrealBloomPass` / `OutputPass` (`ctx.lib('three')`, `ctx.lib('three-post')`)<br>• `OGL (~29KB)` cho shader mặt nước/sơn mài<br>• `Lenis 1.3.28` (`ctx.lib('lenis')`, tắt trên `lite` & iOS native)<br>• `Web Audio API`, `Canvas 2D`, `CSS 3D` | • Chỉ nạp sau khi khách mở bìa (`ctx.lib()`, trừ `prefetch`/`modulepreload` lúc nhàn rỗi).<br>• DPR `<= 1.5`, texture `<= 1024px`.<br>• Dừng `rAF` khi `document.hidden`.<br>• Bắt buộc `bindContextLoss(canvas, () => ctx.downgrade('webglcontextlost'))`. | ❌ **Cấm React, `motion`, `lucide-react` trong tầng Invite.**<br>❌ Cấm Lottie JSON nặng, shadow map thời gian thực nhiều nguồn, multi-pass DOF, GPGPU particle. |
| **Tầng Storefront & Studio (React 19)** | `apps/web/` (Next.js `16.4.6` + React `19.3.0` + Tailwind `4.3.3`) | • `motion` (`motion/react`) cho chuyển cảnh trang `/v2`, filter tabs `layoutId`, modal preview lò xo.<br>• `lucide-react` cho bộ icon Studio & dashboard.<br>• `clsx` / `tailwind-merge` (nếu cần). | • Trang `/v2` showcase dùng thumbnail/preview tĩnh hoặc canvas nhẹ, chỉ nạp live preview tương tác khi người dùng chọn mẫu. | ❌ Không nhúng bundle React vào `packages/engine` hoặc trang thiệp xuất bản `/v2/demo/[theme]`. |

---

## Chương 5 [Trụ cột 4b]: Quy trình 2-Pass Anti-AI-Slop & Hợp đồng Kỹ thuật

### 5.1 Quy trình Thiết kế 2-Pass Bắt buộc (Trước khi viết code M2–M6)

Mọi phiên làm việc tạo hoặc nâng cấp mẫu đều phải chạy đủ **2 lượt thiết kế** trước khi sửa `.js`/`.css`:

- **Pass 1 — Bản thiết kế cô đọng (5 mục bắt buộc):**
  1. *Subject Grounding:* 1 câu xác định vật thể/không gian thật của chủ đề và cách **ảnh cặp đôi (6–30 tấm)** giữ vai chính.
  2. *Color System:* Đúng 4–6 mã hex có tên vai trò (`bg`, `surface`, `ink`, `accent`, `highlight`). Kiểm tra không trùng `#F4F1EA`+`#D97757` hay nền đen + xanh neon.
  3. *Typography:* Chọn 1–2 họ chữ có bộ `vietnamese`, tỉ lệ cỡ lớn/nhỏ `>= 8:1`, chốt mọi nhãn tiếng Việt `>= 13px`.
  4. *Spatial Wireframe (ASCII):* Vẽ cả **Desktop (`1440px`)** và **Mobile (`390px`)**, chỉ rõ phần tử bất đối xứng/tràn biên, vị trí RSVP (`<= 3` thao tác) và nút `#sh-quick`.
  5. *Named Motion Verb & Rhythm:* Đặt tên 1 động từ chuyển động duy nhất + 1 chuỗi mở màn + 3–6 cao trào có chủ đích.

- **Pass 2 — Tự phản biện Anti-AI-Slop (Self-Critique Gate):**
  Đối chiếu bản Pass 1 với 4 bộ lọc sau; nếu vi phạm dù chỉ 1 mục, **phải sửa lại Pass 1 và ghi rõ lý do trước khi viết code**:
  1. *19 chữ ký khuôn mẫu (`docs/KHONG-KHUON-MAU.md:5–38`):* Có cột giữa `<= 520px`, 11 mục tuần tự, thẻ kem bo góc đồng loạt, nhãn mono in hoa giãn chữ, nối chuỗi `' · '`, đếm ngược 4 ô giống nhau, hay `fade-up` hàng loạt không?
  2. *5 dấu hiệu AI (`frontend-design` dòng 38–44):* Có từ đơn in nghiêng trong tiêu đề (`<em>một câu chuyện</em>`), eyebrow IN HOA trên mọi mục, mũi tên `'→'` ở nút, hay đánh số `01/02/03` vô nghĩa không?
  3. *Phép thử **Bịt Logo** (`KHONG-KHUON-MAU.md:41`):* Chuyển màn hình sang trắng đen + làm mờ `8px` — bố cục có tách biệt hẳn khỏi 2 mẫu khác không?
  4. *Phép thử **Hai Giây** (`KHONG-KHUON-MAU.md:42`):* Che đồ trang trí chủ đề đi — người xem có còn thấy khác biệt về cấu trúc không?

### 5.2 Hợp đồng Kỹ thuật đã chuẩn bị ở M1 cho M2–M6

- **Legacy (`legacy/core/base.css` & `boot.js`):**
  - `:root` cung cấp `--card-max: 520px`, `--card-overflow: hidden`, `--rv-dur: .9s`, `--rv-ease: cubic-bezier(.2, .8, .2, 1)`.
  - Mẫu nâng cấp chỉ cần khai báo `layout: 'wide' | 'split' | 'full'` và `bodyClass: 'rv-custom'` trong `theme.js` (hoặc đặt `--card-max` / `data-rv="custom"`), hoàn toàn không ảnh hưởng các mẫu chưa nâng cấp và giữ nguyên 100% kiểm thử `?theme=` của `legacy/tests/smoke.mjs`.
- **Engine v2 (`packages/engine/`):**
  - `render.js` tự nhúng `importmap` cho `'three'` (`three@0.170.0`) và `'three/addons/'`.
  - `ctx.lib('three')`, `ctx.lib('three-post')`, `ctx.lib('lenis')` nạp ESM lazy *sau* khi mở bìa và tự `modulepreload` lúc rảnh.
  - `bindContextLoss(canvas, () => ctx.downgrade('webglcontextlost'))` + `ctx.downgrade(reason)` chuẩn hóa cơ chế rơi về `motion.lite` an toàn trên Zalo Android WebView.

---

## Chương 6 [Trụ cột 4c]: Rubric Đánh giá Độc lập (Agent-as-Judge)

Mọi mẫu sau nâng cấp hoặc xây mới đều phải được kiểm tra độc lập trên **Desktop (`1440x900`)** và **Mobile (`390x844`)** ở cả 3 mức **`cinematic` / `standard` / `lite`** (hoặc desktop/mobile đầy đủ với v1).

### 6.1 Thang điểm 3 Tiêu chí (1–5 điểm; ĐẠT khi mọi tiêu chí >= 4 và 0 lỗi Hard-Fail)

| Tiêu chí & Trọng số | Điểm 1 (Kém — Loại) | Điểm 3 (Trung bình — Cần sửa) | Điểm 5 (Xuất sắc — Chuẩn sản phẩm) |
|---|---|---|---|
| **(a) Cấu trúc bố cục & Nhịp điệu nội dung riêng biệt** *(35%)* | Khóa cột giữa `<= 520px`, lặp chuỗi 11 mục cũ, thẻ kem bo góc giống nhau; trượt phép thử Bịt Logo. | Phá trần `520px` ở phần mở đầu nhưng thân trang vẫn quay về dải thẻ dọc xếp chồng đều đặn. | Ảnh chụp trắng đen + mờ `8px` nhận diện ngay lập tức; bố cục tối ưu riêng cho `1440px` và `390px`; ảnh cặp đôi đạt `>= 60–70%` ở màn chủ chốt; RSVP/map/gift hòa vào ẩn dụ, `<= 3` thao tác + `#sh-quick` đầy đủ. |
| **(b) Animation chuyên nghiệp có chủ đích gắn chủ đề** *(35%)* | Lạm dụng `data-rv` fade-up, pháo hoa mặc định, giật `< 30fps`, hoặc hiệu ứng trang trí rời rạc không liên quan chủ đề. | Mở bìa có ý tưởng nhưng chuyển cảnh bên trong mờ nhạt hoặc khách chỉ cuộn thụ động (như `to-hong.html` v1). | Có 1 động từ chuyển động rõ ràng, chuỗi mở có nhịp + 3–6 cao trào tương tác tay thật; vật lý mượt mà; phân tầng `cinematic`/`standard`/`lite` chuẩn; `prefers-reduced-motion` mở sạch không che chữ. |
| **(c) Khả năng đọc, Thẩm mỹ màu sắc & Trải nghiệm Desktop/Mobile** *(30%)* | Bảng màu AI-slop hoặc chói gắt; nhãn tiếng Việt `< 13px` dính dấu; nút nổi đè CTA; tràn ngang tại `390px`; lỗi console/404. | Đọc được nhưng bố cục desktop bị kéo dãn thô, hoặc mobile chật vùng chạm (`< 44px`). | Độ tương phản đạt chuẩn WCAG AA trở lên; chữ Việt sắc nét (`>= 14px` body, `>= 13px` nhãn); trải nghiệm mượt cả `1440x900` và `390x844`, vùng chạm `>= 44px`, focus ring rõ ràng, 0 lỗi console/asset. |

### 6.2 4 Cổng Loại Trực Tiếp (Hard-Fail Gates — Vi phạm 1 cổng = FAIL ngay)

1. **Cổng R1:** Còn xuất hiện bất kỳ tên, slug hoặc cấu hình của hai mẫu đã xóa theo R1 (`docs/REDESIGN.md:9`) trong giao diện, điều hướng, route hoặc cấu hình đang hoạt động.
2. **Cổng Kỹ thuật & Luồng dùng:** Có lỗi JS runtime, lỗi 404 tài nguyên/font, hoặc đứt bất kỳ luồng nào của người dùng (`open`, `?k=`, `?n=`, gửi RSVP, gửi lời chúc, mở `#sh-quick`).
3. **Cổng Fallback & Tiếp cận:** Thiếu `motion.lite`, nội dung bị kẹt/che khuất khi bật `prefers-reduced-motion: reduce`, hoặc treo màn hình khi xảy ra `webglcontextlost`.
4. **Cổng Hai Giây (`KHONG-KHUON-MAU.md`):** Khi che phần đồ trang trí chủ đề đi, bố cục vẫn giống hệt một mẫu khác trong dự án.
