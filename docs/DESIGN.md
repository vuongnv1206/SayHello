# Hệ Thiết kế · SayHello 2.0 (Card-as-Centerpiece)

Tài liệu này quy định chuẩn thiết kế thống nhất cho toàn bộ mẫu thiệp v2 trên `@sayhello/engine` (`packages/engine/`) và giao diện trưng bày `/v2/` (`apps/web/src/app/v2/page.tsx`), hợp nhất các cổng hiệu quả H1–H7 và phép thử chống khuôn mẫu từ `docs/archive/KHONG-KHUON-MAU.md`.

---

## 1. Luận điểm thiết kế cốt lõi: `Layout × Topic × Moment`

1. **Tấm thiệp là nhân vật chính (Card-as-Centerpiece):** Mọi trải nghiệm bắt đầu và xoay quanh một tấm thiệp cưới có chất liệu rõ ràng (giấy Dó, sơn mài, hộp nhung, men sứ, lookbook biên tập). Ảnh cặp đôi và thông tin lễ là trọng tâm; kỹ thuật 3D/CSS chỉ phục vụ **chất liệu bề mặt** và **chiều sâu 2.5D bên trong khung ảnh**, không dựng thế giới 3D bay camera xa rời tấm thiệp.
2. **Ba trục tách bạch:**
   - **Layout (`layoutSpec`):** Khung kiến trúc và cách khách đi qua thiệp (`folio`, `lookbook`, `deck`, `split`, `scroll`, `stage`, `pager`, `hub`, `chat`, `custom` trong `packages/engine/src/define-theme.js`).
   - **Topic (`topics[]`):** Bộ không khí thẩm mỹ hoàn chỉnh gồm bảng màu CSS `--sh-*`, cặp font hỗ trợ `vietnamese`, chất liệu và `swatch`. Một mẫu có 2–3 topic đặc trưng, chuyển đổi qua `/v2/demo/[theme]/[topic]/` hoặc `?topic=<id>`.
   - **Signature Moment (`moment`):** Đúng **1 động tác chữ ký có tên** (`unseal-gleam`, `optical-push`, `deal-flip`, `seam-converge`), gắn với vật lý mở thiệp hoặc tương tác trọng tâm.
3. **Trang trưng bày `/v2` (`apps/web/src/app/v2/page.tsx`):** Thoát khỏi khuôn mẫu landing page nền tối điểm vàng cũ; dùng nền giấy sáng `#FAF8F4`, chữ mực `#1C1917`, nhấn son `#8E1B2C`, trình bày minh bạch thẻ *Layout*, *Signature Moment*, các *Topic* kèm vòng màu và nút mở thẳng bản tĩnh `?tier=lite`.

---

## 2. Hợp đồng Token CSS (`packages/engine/src/base.css`)

Toàn bộ bộ chọn mặc định trong `packages/engine/src/base.css` nằm trong `:where()` (độ ưu tiên `0`) để từng mẫu và từng `topic` ghi đè sạch sẽ mà không cần `!important` (ngoại trừ `.sh-gate[hidden]` và `[data-ev][hidden]` để bảo đảm trạng thái ẩn DOM tuyệt đối).

| Token (`:where(:root)`) | Giá trị mặc định (`base.css`) | Vai trò |
|---|---|---|
| `--sh-bg` | `#111` | Nền tổng thể ngoài tấm thiệp / trang |
| `--sh-surface` | `#1c1814` | Mặt giấy / nền thẻ chính |
| `--sh-ink` | `#f4ede1` | Màu chữ chính (bắt buộc tương phản `>= 4.5:1` trên `--sh-bg` / `--sh-surface`) |
| `--sh-muted` | `color-mix(in srgb, var(--sh-ink) 68%, transparent)` | Chữ phụ, chú thích |
| `--sh-accent` | `#e8a33d` | Màu nhấn nút chính, dấu triện, focus ring |
| `--sh-accent-ink` | `#1a1208` | Màu chữ trên nút `--sh-accent` |
| `--sh-foil` | `#d4b06a` | Ánh nhũ kim / đường chỉ son / viền trang trí |
| `--sh-soft` | `rgba(255,255,255,.18)` | Đường kẻ `hairline`, viền ô nhập liệu |
| `--sh-panel` | `var(--sh-surface)` | Nền hộp nổi `#sh-quick`, `.sh-group-note`, nút nhạc |
| `--sh-font-display` | `'Cormorant Garamond', Georgia, serif` | Font tiêu đề / tên cặp đôi |
| `--sh-font-body` | `'Be Vietnam Pro', system-ui, sans-serif` | Font thân bài & biểu mẫu |
| `--sh-font-mono` | `'Space Mono', ui-monospace, monospace` | Font mã / giờ `tabular-nums` (luôn `>= 13px`) |
| `--sh-radius` | `14px` | Bo góc cơ sở cho thành phần UI |
| `--sh-ease-tactile` | `cubic-bezier(0.22, 1, 0.36, 1)` | Đường cong gia tốc xúc giác chuẩn (`emil-design-eng`) |
| `--sh-ease` | `var(--sh-ease-tactile)` | Alias đường cong chuẩn |
| `--sh-dur-ui` | `240ms` | Thời lượng phản hồi điều khiển (`<= 280ms`) |

---

## 3. Chuẩn Chữ tiếng Việt & Giọng văn Hai Thanh điệu

1. **Sàn kích thước chữ bắt buộc (`packages/engine/src/base.css:18-19`):**
   - Thân văn bản (`body.sh`, `<p>`, `<input>`): **`font-size: max(16px, 1rem)`** (đồng thời ngăn iOS Safari tự zoom khi chạm ô nhập).
   - Chữ nhỏ / nhãn UI / đơn vị đếm ngược (`small`, nhãn phụ): **`>= 13px`** (`font-size: max(13px, 1em)`). Tuyệt đối cấm nhãn `10px–12px` có dấu chồng tiếng Việt.
2. **Bắt buộc bộ ký tự `vietnamese` trên Google Fonts:** Chỉ dùng các font hỗ trợ đầy đủ dấu tiếng Việt (ví dụ: `Be Vietnam Pro`, `Cormorant Garamond`, `Newsreader`, `Playfair Display`, `Bricolage Grotesque`, `Lora`, `Fraunces`, `Spectral`, `Space Mono`, `Dancing Script`, `Ephesis`). Kiểm tra kỹ trước khi thêm font mới.
3. **Tách chữ an toàn:** Luôn tách ký tự qua `splitText()` (`Intl.Segmenter`) trong `packages/engine/src/html.js`, không dùng `[...str]` kẻo vỡ dấu thanh.
4. **Hai thanh điệu (`packages/engine/src/voice.js`):**
   - `trang-trong`: Xưng hô lễ nghi với hai họ, người lớn tuổi (*"Trân trọng kính mời"*, *"Ông/Bà"*, *"Lễ Vu Quy & Lễ Thành Hôn"*) — dùng ở `thiep-gap-doi`, `song-gia`.
   - `than-mat`: Ấm áp, tự nhiên với bạn bè (*"Mời [Tên] tới chung vui"*) — dùng ở `chieu-sau`, `hop-ky-uc`.

---

## 4. SLA Mở Bìa, Chống Chóng Mặt & Khả năng Tiếp cận

1. **Thời gian mở bìa (`gateMs`):** Hạn mức tối đa **`<= 900ms`**, mục tiêu chuẩn **`<= 450ms`** (các mẫu M1–M2 dùng `gateMs: 450` với tự mở/bỏ qua `280ms` ở chế độ thường và `80ms` ở `reduced`). Không khóa khách bằng đếm ngược thụ động `2.3s–2.8s`.
2. **Chống chóng mặt & An toàn tiền đình:**
   - Cấm bay camera xuyên không gian 3D, cấm rung lắc camera nhàn rỗi, cấm quay camera xoay mặt chữ `CSS3DRenderer`.
   - Mọi góc nghiêng theo chuột/cảm biến (nếu dùng) chỉ tác động lên khung tranh hoặc ánh phản quang trong giới hạn **`<= ±5°`**.
   - Cấm hiệu ứng `infinite` phủ diện tích lớn (`.lap-lanh` cũ hoặc chớp nháy vô hạn).
3. **Tương tác & Bố cục đáp ứng (`320×568`, `390×844`, `1440×900`):**
   - Vùng chạm tối thiểu `44×44px` (`48px` cho nút `.sh-btn` và ô nhập), hỗ trợ `:focus-visible`, `touch-action: manipulation`.
   - Không tràn ngang (`overflow-x: clip`, `docOverflow === 0` ngay cả ở `320px`, như `.sh-cd` tự xuống dòng dưới `380px`).
   - Hỗ trợ đầy đủ **`?tier=lite`** và **`@media (prefers-reduced-motion: reduce)`**: hiển thị nguyên vẹn toàn bộ nội dung, ảnh, bản đồ, RSVP và QR mừng cưới không cần WebGL hay animation.

---

## 5. Cổng Hiệu quả H1–H7 & Phép thử Chống Khuôn mẫu

Mọi mẫu thiệp mới phải vượt qua **cổng hiệu quả H1–H7** trước khi chấm điểm sáng tạo, và vượt qua **hai phép thử tổng**:

- **H1 — Năm giây đầu:** Tên hai người, ngày dương (và âm), địa điểm và đường dẫn xác nhận RSVP phải tiếp cận được trong `<= 5s`.
- **H2 — Tôn trọng ảnh cưới:** Ảnh hiển thị rõ nét, không phủ lớp làm bệt màu da/váy cưới, xem hết được chỉ bằng thao tác quen thuộc (cuộn/chạm).
- **H3 — Không phải học cách dùng:** Cử chỉ chữ ký phải tự giải thích bằng hình và luôn có nút bấm/chạm thay thế chuẩn.
- **H4 — Trả lời thuận tiện:** Nút xác nhận RSVP tới được từ bất cứ đâu (qua nút trực tiếp hoặc `#sh-quick`); form gọn tối đa 3 trường chính.
- **H5 — Chữ đọc rõ:** Thân `>= 16px`, nhãn `>= 13px`, tương phản `>= 4.5:1` trên nền đặc hoặc có lớp lót. Thông tin bắt buộc nằm trong DOM HTML, không giấu độc quyền trong `<canvas>`.
- **H6 — Nhẹ trên Zalo WebView:** Ảnh tối ưu bằng `sharp`, thư viện nặng nạp sau khi mở bìa qua `ctx.lib()`, hoạt động mượt ở `390×844` và có phương án dự phòng `webglcontextlost`.
- **H7 — Khác biệt cấu trúc:** Mỗi mẫu mới phải khác các mẫu còn lại ở ít nhất 3 trục (cách đi qua thiệp, bố cục desktop/mobile, vị trí đặt thông tin, ẩn dụ vật liệu, khoảnh khắc chữ ký).
- **Phép thử Bịt logo & Hai giây:** Khi đặt 3 mẫu cạnh nhau ở chế độ đen trắng làm mờ nhẹ, phải phân biệt được từng mẫu chỉ bằng **bộ khung bố cục** chứ không dựa vào đồ trang trí.

*(Danh sách chi tiết 5 kiến trúc template, các topic và rubric nhị phân 4 tiêu chí xem tại `docs/TEMPLATES-AND-TOPICS.md`.)*
