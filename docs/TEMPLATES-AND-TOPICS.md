# Kiến trúc 5 Template, Hệ Chủ đề (Topics) & Chuẩn Chống Sến (`Anti-Cringe`)

> **Mục tiêu cốt lõi:** Chấm dứt tình trạng "một khung cột dọc 520px mặc 10 lớp áo" và tình trạng "bay camera 3D chóng mặt". Mỗi template trong SayHello phải khác biệt thực chất về **bố cục cấu trúc**, **khoảnh khắc tương tác chữ ký (Signature Moment)**, và **bộ chủ đề thẩm mỹ (Topics)** — trong khi luôn giữ **Tấm thiệp cưới làm trung tâm** (*Card-as-Centerpiece*).

---

## 1. Năm Kiến trúc Template (Card-as-Centerpiece)

Hiện tại **4 template đầu tiên** đã được triển khai hoàn chỉnh trong `packages/themes/` và đăng ký qua `apps/web/scripts/sync-engine.mjs`; **Template thứ 5** là bản thiết kế kiến trúc cho pha kế tiếp.

### Template 1: Thiệp Gấp Đôi (`packages/themes/thiep-gap-doi/`) — Tactile Folio *(Đã triển khai)*

- **Thông số engine:** `layout: { id: 'folio', spread: '2-leaf', stickyLeft: true }`, `voice: 'trang-trong'`, `gateMs: 450`.
- **Khoảnh khắc chữ ký (`moment`):** `unseal-gleam` (*Mở niêm phong & ánh nhũ*, `verb: 'unseal'`, `durationMs: 450`, `easing: 'cubic-bezier(0.22, 1, 0.36, 1)'`, `reducedFallback: 'instant-fade'`).
- **Khác biệt cấu trúc (Desktop vs. Mobile):**
  - *Bìa mở:* Niêm phong vật lý chính giữa thiệp; chạm để bóc mở mượt `<= 450ms` (luôn bỏ qua được).
  - *Desktop (`1440px`):* Sách gấp hai cánh thực thụ — **cánh trái (`.fg-left`) ghim cố định** giữ nguyên tấm thiệp mời ép kim (tên cặp đôi, monogram, ngày dương/âm, địa điểm, nút RSVP); **cánh phải** cuộn độc lập các trang ảnh cưới, song gia và phiếu hồi âm.
  - *Mobile (`390px`):* Phân tầng thành các nếp gấp giấy ba lớp với đường gân giấy và viền dập chìm.
- **Điểm nhấn "Wow" kiểm chứng được:** Ánh sáng phản quang `.fg-foil` lướt nhẹ trên bề mặt chữ ép kim theo con trỏ chuột (không xoay hình học khung chữ, không rung lắc).
- **Chủ đề (`topics`) đi kèm:**
  1. `son-mai` — **Sơn Mài Khảm Trai:** Sơn mài huyết dụ trầm (`#2B0D11`), nhũ vàng ấm (`#D6B26E`), chữ ngà (`#F4ECE1`), `Cormorant Garamond` + `Be Vietnam Pro`.
  2. `giay-do` — **Giấy Dó & Triện Mộc:** Giấy Dó sợi ấm (`#F5F0E6`), mực than (`#1F2421`), triện son (`#B22A22`), `Newsreader` + `Be Vietnam Pro`.
  3. `lua-nga` — **Lụa Ngà & Giấy Can:** Giấy bông ngà (`#FAF8F4`), mực than đá (`#2D2926`), vàng sâm panh (`#C6A972`), phong cách *quiet luxury*.

### Template 2: Chiều Sâu (`packages/themes/chieu-sau/`) — Cinema Lookbook *(Đã triển khai)*

- **Thông số engine:** `layout: { id: 'lookbook', split: '62-38', alternating: true }`, `voice: 'than-mat'`, `gateMs: 450`.
- **Khoảnh khắc chữ ký (`moment`):** `optical-push` (*Đẩy tiêu cự 2.5D trong khung hình*, `verb: 'push-in'`, `trigger: 'scroll'`, `reducedFallback: 'static-frame'`).
- **Khác biệt cấu trúc:**
  - *Desktop (`1440px`):* Bố cục Lookbook bất đối xứng **62% khung ảnh tràn biên / 38% cột chữ biên tập**, đảo chiều trái–phải luân phiên qua từng trang.
  - *Mobile (`390px`):* Ảnh điện ảnh tràn chiều rộng kèm dải thông tin mời cưới sắc nét ngay chân khung hình.
- **Điểm nhấn "Wow" kiểm chứng được (Lấy cảm hứng `higgsfield.ai`):** Dùng `ctx.imgPair()` trong `packages/engine/src/model.js` để tách lớp nền (`.cs-bg`), chữ nền nghệ thuật (`.cs-big`) và tiền cảnh nhân vật tách nền (`.cs-fg`, định dạng `.webp`) bên trong cùng một khung cắt. Khi cuộn, biến `--p ∈ [-1, 1]` tạo hiệu ứng **đẩy tiêu cự quang học (optical push-in)** nhẹ nhàng giữa hai lớp, được bảo vệ bằng hộp overscan bốn cạnh `--cs-bleed: 10px` (triệt tiêu hở viền subpixel ở mọi màn hình `320px..1440px`) và tự hạ về `.no-fg` nếu thiếu ảnh tách lớp.
- **Chủ đề (`topics`) đi kèm:**
  1. `suong-da-lat` — **Sương Đà Lạt:** Xanh thông sương sớm (`#DDE3DF`), mực lá thông (`#1C2621`), nhấn nâu hổ phách (`#724322`), `Newsreader` + `Be Vietnam Pro`.
  2. `dem-sai-gon` — **Đêm Sài Gòn 90s:** Nhựa đường đêm (`#121316`), ánh đèn đường hổ phách (`#E2A86B`), tiêu đề `Bricolage Grotesque`.
  3. `chang-vang-bien` — **Chạng Vạng Biển:** Xanh đá ven biển (`#1D2E3A`), cát muối ngà (`#F3F0EA`), đường kẻ chân trời tối giản.

### Template 3: Hộp Ký Ức (`packages/themes/hop-ky-uc/`) — Jewel-Box Deck *(Đã triển khai)*

- **Thông số engine:** `layout: { id: 'deck', tabs: 4, interactiveDeck: true }`, `voice: 'than-mat'`, `gateMs: 450`.
- **Khoảnh khắc chữ ký (`moment`):** `deal-flip` (*Chia thẻ & lật mặt sau*, `verb: 'deal'`, `trigger: 'click'`, `durationMs: 260`, `reducedFallback: 'instant-swap'`).
- **Khác biệt cấu trúc:**
  - Tối ưu riêng cho cặp đôi có **6–12 ảnh** và khách mời mở nhanh trên Zalo (không bắt cuộn dài vô tận).
  - Giao diện hộp đựng giữ tấm thiệp ở trung tâm với **thanh chuyển 4 ngăn** (*Thiệp Mời · Album · Giờ & Đường · Xác Nhận & Quà*). Form RSVP và Sổ lưu bút luôn sẵn sàng không bị khóa sau tab ẩn gây kẹt tương tác.
- **Điểm nhấn "Wow" kiểm chứng được:** Chia thẻ ảnh với lò xo tắt dần mượt `260ms`; bấm **"Lật mặt sau"** trên thẻ ảnh để lật duy nhất thẻ đó (`.jb-back`, kích hoạt chủ động bằng click — tuyệt đối không tự xoay), và khi gửi RSVP thẻ hồi âm trượt gọn vào ngăn cất (`.is-tucked`). Độ tương phản bề mặt thẻ luôn đạt chuẩn AA (`>= 4.54:1`).
- **Chủ đề (`topics`) đi kèm:**
  1. `hop-nhung` — **Hộp Nhung Monogram:** Hộp nhung rêu đậm (`#1A2E26`), bộ thẻ bông ngà (`#FBF8F2`), chỉ đồng (`#8D6A32`).
  2. `buu-thiep` — **Bưu Thiếp Hồi Âm:** Xanh hải quân (`#1A2B42`), giấy bưu thiếp răng cưa (`#F4EFE6`), dấu bưu điện đỏ son (`#B84238`) — nâng cấp di sản thiệp du lịch một cách tinh tế, không dùng clip-art bảng điện tử sân bay.

### Template 4: Song Gia (`packages/themes/song-gia/`) — Dual-House Convergence *(Đã triển khai)*

- **Thông số engine:** `layout: { id: 'split', ratio: '50-50', dualHouse: true }`, `voice: 'trang-trong'`, `gateMs: 450`.
- **Khoảnh khắc chữ ký (`moment`):** `seam-converge` (*Hội tụ hai nhà & kết nút tơ*, `verb: 'converge'`, `trigger: 'click'`, `durationMs: 450`, `reducedFallback: 'instant-join'`).
- **Khác biệt cấu trúc:**
  - Thiết kế chuyên biệt cho đám cưới truyền thống Việt Nam có **hai gia đình (Nhà Trai & Nhà Gái)**, hai nghi lễ (*Lễ Vu Quy* / *Lễ Thành Hôn*) và hai tài khoản mừng cưới.
  - *Desktop (`1440px`):* Sân khấu **chia đôi 50/50** qua đường chỉ son ở giữa, rồi hội tụ về một tấm thiệp Thành Hôn thống nhất.
  - *Mobile (`390px`):* Bộ chuyển 3 nút cố định (*Cả Hai | Khách Nhà Trai | Khách Nhà Gái*) giữ khoảng cách an toàn với `.sh-group-note` và làm dịu cột còn lại bằng `color-mix()` (giữ nguyên `opacity: 1` và tương phản `>= 4.92:1` để người lớn tuổi đọc rõ).
- **Điểm nhấn "Wow" kiểm chứng được:** Đường tơ ở bìa khép hai nửa thiệp lại khi mở; cuối thiệp hiển thị nút tơ hình học 2D vẽ bằng `polarKnotPath()` SVG (kế thừa tinh hoa mỹ thuật của `to-hong` nhưng không gây chóng mặt 3D).
- **Chủ đề (`topics`) đi kèm:**
  1. `gom-su` — **Song Gia Gốm Sứ:** Men sứ Chu Đậu (`#F6F4EF`), chàm lam (`#1E3250`), đường chỉ son (`#B02E26`), `Playfair Display` + `Be Vietnam Pro`.
  2. `hai-thanh-pho` — **Hai Thành Phố Một Ngày:** Giấy lanh ấm (`#F5F2EC`), xanh rêu trầm (`#3D5A4C`), đất nung (`#A84632`), nối tọa độ hai thành phố (*Hà Nội ↔ TP.HCM*).

### Template 5: Editorial Monograph — Tạp Chí & Thực Vật Ép Khô *(Kế hoạch — Chưa triển khai code)*

> **Lưu ý trạng thái:** Template 5 hiện là **bản thiết kế chuẩn hóa cho pha triển khai tiếp theo**, chưa có mã nguồn trong `packages/themes/`.

- **Mục tiêu cấu trúc:** Bù đắp mảnh ghép sách nghệ thuật (*art-book / editorial monograph*) theo lưới 12 cột bất đối xứng kiểu Thụy Sĩ trên desktop (chương trượt ngang theo trang) và thanh chỉ mục chương dính trên đầu trang mobile (`01 Thư Mời / 02 Lễ Cưới / 03 Lưu Bút`).
- **Khoảnh khắc chữ ký dự kiến (`moment`):** `develop-register` (*Rửa tông ảnh buồng tối & căn lưới chữ*) — ảnh cưới chuyển nhẹ từ sắc độ giấy ảnh bạc sang màu tự nhiên trong `450ms` `cubic-bezier(0.23, 1, 0.32, 1)`, còn phần RSVP thiết kế như **Phiếu Mượn Sách / Colophon** xé gọn ở trang cuối.
- **Chủ đề dự kiến:**
  1. **Thực Vật Ép Khô (Herbarium):** Ảnh chụp macro thực vật Việt Nam ép khô thật (đài sen, lá ô liu, dương xỉ) dán băng giấy lưu trữ cạnh chân dung cặp đôi — tuyệt đối không dùng hoa vector.
  2. **Lưu Bút Kiến Trúc:** Giấy xám xương (`#EFECE6`), mực than chì (`#1E1E1E`), sơ đồ đường đi dạng bản vẽ mặt bằng kiến trúc, bảng giờ `tabular-nums`.
  3. **Ấn Bản Khổ Lớn:** Thay thế hướng "Báo Xuân" cũ bằng báo nghệ thuật tinh giản, đường kẻ mảnh, monogram khắc nét.

---

### Chủ đề khác nhau về cấu trúc

Ngoài bảng màu và phông chữ, mỗi chủ đề của bốn mẫu trên có khung, chất liệu và nhịp đọc riêng, viết bằng `html[data-topic="..."]` ở cuối `theme.css`:

| Mẫu | Chủ đề | Khác biệt cấu trúc |
|---|---|---|
| Thiệp Gấp Đôi | `son-mai` | Hai đường chỉ nhũ, ảnh vòm, lịch lễ căn giữa |
| | `giay-do` | Lá thư căn trái, triện vuông, lịch lễ kẻ dòng |
| | `lua-nga` | Đường chỉ dọc thay huy hiệu, lịch lễ dạng bảng giờ bên trái |
| Chiều Sâu | `suong-da-lat` | Khung bo mềm tan vào sương, chữ căn giữa |
| | `dem-sai-gon` | Dải phim đục lỗ, giờ lễ cỡ lớn kiểu cuống vé |
| | `chang-vang-bien` | Ảnh ngang một cột, đường chân trời, lịch lễ theo hàng |
| Hộp Ký Ức | `hop-nhung` | Viền chỉ đôi, ảnh vòm |
| | `buu-thiep` | Viền thư máy bay, con tem, ảnh ngang có lề trắng |
| Song Gia | `gom-su` | Viền men đôi, chân dung trong đĩa tròn |
| | `hai-thanh-pho` | Đường nối hai điểm, lịch lễ là chặng đường |

Trên điện thoại, các tờ của Thiệp Gấp Đôi có nếp gấp. Thanh ngăn thẻ của Hộp Ký Ức dính trên đầu và sáng theo phần đang xem; nội dung vẫn nằm đủ trên một trang.

---

## 2. Các mẫu khác đang có

| Mẫu | Ghi chú |
|---|---|
| `the-len-may-bay` | Tấm vé là thiệp mời, cuống vé là phiếu hồi âm; dựng từ bản thử cùng tên. Bảng giờ bay lật chữ nhưng nút mở bấm được ngay. Chờ chủ dự án duyệt. |
| `album-nhac` | Đĩa than bìa gập, chương trình cưới là danh sách bài, hồi âm kèm xin một bài; đĩa không quay vòng. Chờ chủ dự án duyệt. |
| `photobooth` | Góc chụp tiệc cưới, chủ dự án đã duyệt. Nghi thức đếm 3-2-1 (`data-ritual`) kèm nút "Xem thiệp ngay" (`data-skip`). |
| `cuon-phim` | Cuộn điện ảnh, mở bìa `450ms`. |
| `phong-trien-lam`, `to-hong` | Sân khấu 3D camera phẳng, nguồn kỹ thuật `stage3d.js` / `polarKnotPath`. |

---

## 3. Liên kết kỹ năng thiết kế & tham khảo chuyển động vào mã nguồn

Toàn bộ kiến trúc không trích dẫn suông mà ánh xạ trực tiếp từ 3 nguồn tham khảo cốt lõi vào token CSS, hàm hợp đồng `defineTheme` và tiêu chí kiểm thử:

1. **`https://mcpservers.org/agent-skills`** (`frontend-design`, `emil-design-eng`, `impeccable`, `frontend-ui-engineering`):
   - *`frontend-design`:* Bám sát vật liệu chủ đề thay vì đổ bóng hộp/gradient chung chung; tách kiến trúc 4 layout thực thụ (`folio`, `lookbook`, `deck`, `split`) với tỷ lệ tương phản chữ biên tập rõ rệt.
   - *`emil-design-eng`:* Phản hồi UI `<= 280ms` (`--sh-dur-ui: 240ms`), đường cong gia tốc chuẩn `--sh-ease-tactile: cubic-bezier(0.22, 1, 0.36, 1)` trong `packages/engine/src/base.css`, cấm `scale(0)` hay hoạt ảnh vô ích, ép quy trình đánh giá **Before / After / Why**.
   - *`impeccable`:* Lưu giữ tài liệu thiết kế thống nhất (`docs/DESIGN.md`, `docs/TEMPLATES-AND-TOPICS.md`), tách biến `--sh-*` độ ưu tiên bằng `0` qua `:where(:root)` giúp mọi topic giữ tương phản chuẩn AA.
   - *`frontend-ui-engineering`:* Đảm bảo vùng chạm tối thiểu `44–48px`, `touch-action: manipulation`, viền `:focus-visible`, và sàn chữ tiếng Việt `>= 13px` / `>= 16px`.
2. **`https://motionsites.ai/`**:
   - Đưa mỗi template gắn chặt với **1 động từ chuyển động có tên & thông số vật lý tường minh** (`moment: { id, verb, verbLabel, trigger, durationMs, easing, reducedFallback }`) trong `packages/engine/src/define-theme.js`, thay thế hàng loạt hiệu ứng cuộn `data-rv` mờ dần đơn điệu.
3. **`https://higgsfield.ai/` ("Highfield")**:
   - Chuyển hóa tư duy *Director of Photography* (đẩy tiêu cự nhẹ vào tĩnh vật chân dung thay vì bay camera khắp phòng 3D) thành cơ chế `ctx.imgPair` + `.cs-bg` / `.cs-fg` / `--p` / `--cs-bleed: 10px` trong `packages/themes/chieu-sau/`.

---

## 4. Tiêu chí Chống Sến (`Anti-Cringe`) & Rubric Nhị Phân 4 Tiêu Chí

Các quy tắc tinh hoa từ bảng kiểm chống khuôn mẫu được hợp nhất tại đây thành chuẩn kiểm duyệt bắt buộc:

### 4.1 Bộ lọc Chống Sến (Vi phạm bất kỳ mục nào = Chưa đạt)

- **Thẩm mỹ & Vật liệu:**
  - Không vẽ đồ vật minh họa bằng CSS gradient kiểu clip-art (ly cà phê, nơ, vòm giả). Dùng ảnh chụp thật, chất liệu giấy/vải/sơn mài, đường kẻ mảnh `hairline` hoặc shader vật lý.
  - Không dùng bảng màu mặc định kiểu landing page AI (nền `#14110f` + chữ vàng `#d9a86c`, hoặc kem nhạt + san hô lặp lại không có chất liệu).
  - Không lạm dụng hộp bo góc đổ bóng chồng tầng; tối đa 1 ẩn dụ nâng mặt phẳng.
  - **Phép thử Bịt logo & Hai giây:** Đặt 3 màn hình thiệp cạnh nhau ở chế độ đen trắng mờ nhẹ — vẫn nhận ra template nào nhờ cấu trúc khung hình chứ không phải nhờ đồ trang trí.
  - **Phép thử ảnh tĩnh (Still-frame):** Chụp ảnh màn hình ở bất kỳ điểm cuộn nào đều cân đối, không bị cắt dở chữ hay đè nút.
- **Ngôn từ & Văn hóa Việt:**
  - Cấm sáo ngữ mặc định (*"hạnh phúc mãi mãi"*, *"hai đầu thương nhớ"*, *"ngày đầu tiên của mãi mãi"*, *"100% khả năng hạnh phúc"*, *"Rạp Hạnh Phúc"*) và cấm chèn chữ Anh vô nghĩa (*"SAVE THE DATE"*, *"OUR LOVE STORY"*) làm nhãn chính trên thiệp thuần Việt.
  - Không dùng emoji (`💌`, `📌`, `📅`, `🥰`) trong giao diện thiệp trang trọng/biên tập.
  - Mục **Câu chuyện (`story`)** luôn là tùy chọn (`optional`), không bao giờ bắt ép hiện văn mẫu nếu cặp đôi chỉ muốn trưng ảnh.
  - Tách thông tin bằng lưới hoặc ngắt dòng rõ ràng, hạn chế chuỗi nối `" · "` dày đặc ở dữ liệu quan trọng.
- **Chuyển động & Chống chóng mặt:**
  - **Không xoay liên tục (`infinite`), không rung camera nhàn rỗi, không bay spline.**
  - Nếu có nghiêng theo con trỏ/cảm biến, chỉ áp dụng cho góc ánh sáng hoặc khung ảnh ở biên độ **`<= ±5°`**, tuyệt đối không xoay chữ làm mất nét đọc.
  - Màn mở bìa giải phóng nội dung trong **`<= 900ms`** (khuyến nghị `<= 450ms`), luôn có nút bỏ qua hoặc mở tức thì.
  - Âm thanh tắt mặc định, chỉ phát khi khách bấm bật; mọi template dùng WebGL/chuyển động nặng bắt buộc có bản tĩnh `?tier=lite` và tuân thủ `prefers-reduced-motion` giữ nguyên bố cục và đầy đủ thông tin.

### 4.2 Rubric Nhị Phân 4 Tiêu Chí (`Đạt / Chưa đạt`)

Mỗi template muốn được duyệt đưa vào sản phẩm phải đạt **4/4 tiêu chí** khi kiểm tra độc lập trên desktop (`1440×900`) và mobile (`390×844` & `320×568`):

| # | Tiêu chí | Yêu cầu kiểm chứng bắt buộc | Kết quả |
|---|---|---|---|
| **1** | **Tấm thiệp là trung tâm (Card-as-Centerpiece)** | Ngay sau khi mở bìa và ở trạng thái nghỉ, tấm thiệp (Tên cặp đôi, Ngày dương + âm, Địa điểm, Nút RSVP) hiển thị trong `<= 5s` làm trọng tâm, không bị chìm trong khung cảnh 3D trống rỗng hay bị ẩn sau 10+ điểm dừng. | `Đạt / Chưa đạt` |
| **2** | **Chống chóng mặt & An toàn tiền đình** | Không có phần tử lớn hoặc vòng xoay `infinite`, không rung lắc camera tự do, không xoay camera `CSS3DRenderer`; mọi độ nghiêng khung/sáng giới hạn `<= ±5°`. | `Đạt / Chưa đạt` |
| **3** | **Chủ đề độc đáo, chống sến & chuẩn chữ Việt** | Chủ đề mang bản sắc văn hóa/vật liệu tinh tế, 0 sáo ngữ/clip-art rẻ tiền, chữ thân `>= 16px`, nhãn tiếng Việt `>= 13px`, tương phản văn bản `>= 4.5:1`, không tràn ngang `docOverflow = 0`. | `Đạt / Chưa đạt` |
| **4** | **Điểm nhấn "Wow" kiểm chứng được & `tier=lite` tương đương** | Chụp ảnh/tương tác Playwright chứng minh rõ khoảnh khắc chữ ký (`unseal-gleam`, `optical-push`, `deal-flip`, `seam-converge`, hoặc `develop-register`), đồng thời chế độ `?tier=lite` & `prefers-reduced-motion` hiển thị đầy đủ 100% nội dung và thao tác RSVP/Quà bình thường. | `Đạt / Chưa đạt` |
