# Tạo mẫu thiệp mới

Mục tiêu của bộ thiệp là **mỗi mẫu là một trải nghiệm riêng**, không phải cùng một khung đổi màu. Phần dùng chung (`core/`) lo dữ liệu, hiệu ứng và các mục có hành vi phức tạp; mẫu thiệp tự quyết bố cục, câu chuyện và cảm giác.

## 1. Nguyên tắc thiết kế

Rút từ cách làm của skill *frontend-design* của Anthropic, áp vào thiệp cưới:

1. **Chọn một ý tưởng trung tâm trước khi viết code.** Thiệp là gì: một cánh cửa, một lá thư, một tấm vé máy bay, một cuộn phim, một trang báo cũ, một bản nhạc? Mọi chi tiết (bìa, cách mở, cách hiện ảnh, nút bấm) phải kể cùng câu chuyện đó. "Thư Tay" là lá thư nên ảnh là con tem, sự kiện là vé, xác nhận là thư hồi âm.
2. **Màn mở đầu là khoảnh khắc đáng nhớ nhất.** Khách nhìn bìa trước tiên. Hãy cho họ một hành động có cảm giác vật lý: mở cửa, bóc dấu sáp, kéo rèm, xé phong bì, lật vé.
3. **Chữ có cá tính.** Tránh Inter, Roboto, Arial. Ghép một font tiêu đề nổi bật với một font đọc dễ. Bắt buộc có bộ ký tự **vietnamese** trên Google Fonts (kiểm tra kỹ: Parisienne, Sacramento, Bodoni Moda, Caveat không có). Một số font có tiếng Việt: Cormorant Garamond, Playfair Display, Lora, Fraunces, Be Vietnam Pro, Dancing Script, Great Vibes, Ephesis, Pinyon Script, Alex Brush, Allura, Charm, Italianno.
4. **Bảng màu có chủ đích.** Một màu chủ đạo, một màu nhấn sắc, khai báo bằng biến CSS. Tránh gradient tím trên nền trắng kiểu "AI".
5. **Nền có chiều sâu.** Vân giấy, hạt nhiễu, hoa văn, ánh sáng, bóng đổ. Nền phẳng một màu làm thiệp trông rẻ.
6. **Chuyển động có nhịp.** Một màn mở bìa dàn dựng kỹ (dùng `animation-delay` nối tiếp) đáng giá hơn mười hiệu ứng rời rạc. Hiện dần khi cuộn tới, chạm vào thì có phản hồi.
7. **Bố cục bất ngờ.** Chữ tràn qua ảnh, phần tử xoay nghiêng, chồng lớp, khoảng trắng rộng. Không phải mục nào cũng là "tiêu đề giữa + nội dung giữa".
8. **Điện thoại trước tiên.** 95% khách mở thiệp trên điện thoại. Kiểm tra ở bề rộng 360-400px.
9. **Tôn trọng `prefers-reduced-motion`.** `core/` đã tự tắt hạt bay và hiệu ứng nặng; mẫu không nên thêm animation bắt buộc phải xem.

## 2. Cấu trúc một mẫu

```
themes/ten-mau/
  theme.js     export default { id, name, fonts, coverMs, defaults, render, mounted?, opened? }
  theme.css
```

Thêm mẫu vào `themes/index.json` và tạo thiệp mẫu `demo-ten-mau/` (sao chép một demo có sẵn, đổi `theme`).

### `theme.js`

```js
import { html, br, fmt, parts } from '../../core/util.js';

export default {
  id: 'ten-mau',
  name: 'Tên hiển thị',
  fonts: 'https://fonts.googleapis.com/css2?family=...&display=swap',
  coverMs: 2000,              // thời gian từ lúc bấm mở đến khi ẩn bìa
  cheersButton: 'btn',        // class nút "Đóng" của hộp cảm ơn
  defaults: {                 // invite.json ghi đè được mọi giá trị ở đây
    effects: { ambient: ['petals', 'sparkles'], colors: { petals: ['#...'] } },
    sections: ['hero', 'events', 'album', 'rsvp', 'guestbook', 'gift'],
    texts: { invite: '...' },
  },
  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx;
    return {
      cover: html`... <button data-open>Mở thiệp</button>`,
      main: html`...${W.countdown()} ...`,
    };
  },
  mounted(ctx, { cover, main }) {},   // sau khi gắn vào trang (tùy chọn)
  opened(ctx, instant) {},            // khi khách mở bìa (tùy chọn)
};
```

- `html\`\`` tự thoát ký tự đặc biệt trong dữ liệu, nên chèn tên khách thẳng vào an toàn. `br(text)` đổi `\n` thành xuống dòng.
- Bìa phải có ít nhất một phần tử `data-open`. Khi bấm, `core` thêm class `open` vào `#cover`, `opened` vào `body`, phát nhạc, chạy hạt bay; sau `coverMs` thêm `gone`.
- `ctx.has('gift')` cho biết một mục có được bật không (tự tắt hộp quà khi không có tài khoản, bản đồ khi không có địa điểm).

### `ctx` có gì

| | |
| --- | --- |
| `ctx.data` | `invite.json` đã gộp với `defaults` |
| `ctx.names` | `groom`, `bride`, `first`, `second`, `pair` ("A & B") theo `order` |
| `ctx.guest` | tên khách từ `?k=`, chuỗi rỗng nếu không có |
| `ctx.img(slot, i)` | ảnh ở ô `slot`, không có thì lấy `album[i]` |
| `ctx.album` | danh sách ảnh album |
| `ctx.fx` | `burst(x, y, n, {hearts, colors})`, `burstAt(el)`, `firework(x, y)` |
| `ctx.widgets` | các khối bên dưới |

### Khối có sẵn (`ctx.widgets`)

| Khối | Markup / class để tạo kiểu |
| --- | --- |
| `W.countdown({labels, done})` | `.cd .u b span`, `.cd-done` |
| `W.calendar()` | `.cal h3 .cal-grid span.wd/.wed/.eng` |
| `W.gcalUrl()` | trả về link Google Calendar |
| `W.gallery()` | `.show img.on`, `.thumbs`, `.hint` (trình chiếu + ảnh nhỏ) |
| `W.polaroids({captions})` | `.polas .pola img figcaption` (kéo ném, chạm để phóng to) |
| `W.map({btn})` | `.tabs button.on`, `.addr`, `.map iframe` |
| `W.rsvp({btn, yes, no})` | `.form .choice .row .msg` |
| `W.guestbook({btn, placeholder})` | `.form`, `.wishes .wish-item b p` |
| `W.gift({btn, hint, box})` | `.giftbox.open`, `.accounts .acc` (truyền `box` để vẽ hộp riêng) |
| `W.scratch(inner, {label, foil, ink})` | `.scratch .scratch-in`, `.scratch.revealed` (cào nhũ) |

### Hiệu ứng gắn bằng thuộc tính

| Thuộc tính | Tác dụng |
| --- | --- |
| `data-rv="up/left/right/zoom/flip/blur/drop"` | hiện dần khi cuộn tới (thêm class `in`) |
| `data-type="28"` | chữ hiện từng ký tự (ms mỗi ký tự) khi cuộn tới |
| `data-tilt="10"` | nghiêng 3D theo chuột |
| `data-parallax="0.18"` | trôi chậm hơn khi cuộn |
| `data-zoom` (trên `img`) | chạm để xem toàn màn hình |
| `data-fireworks` | bắn pháo hoa khi phần này trên màn hình, chạm để bắn thêm |

Các thành phần nổi (`.music`, `.love`, `.progress`, `.fly-item`, `.heart`, `.lb`, `.cheers`) đã có kiểu mặc định trong `core/base.css`; đặt các biến `--c-paper`, `--c-ink`, `--c-accent`... trong `:root` của mẫu là đủ, rồi viết đè nếu muốn.

## 3. Ý tưởng cho các mẫu tiếp theo

Đã làm: **Song Hỷ**, **Thư Tay**, **Vé Máy Bay**, **Khóa Tình** (Mở Khóa Tình Yêu), **Đèn Lồng** (Đèn Lồng Hội An). Mỗi ý tưởng dưới đây có một "cú chạm" chính (thứ khách nhớ và kể lại), không chỉ là đổi màu.

**Đồ vật kỷ niệm**
- **Cuộn Phim:** bìa là máy chiếu, kéo cần để bật đèn; ảnh chạy như khung phim 35mm có lỗ răng cưa, chữ hiện như phụ đề, có tiếng tạch máy ảnh.
- **Báo Xuân:** trang nhất tờ báo cũ "TIN VUI", tít lớn, cột chữ, ảnh in lưới chấm; khách lật trang như báo giấy, có mục "rao vặt" để gửi lời chúc.
- **Đĩa Than:** bìa là bìa album, kéo đĩa ra rồi đặt kim để phát nhạc cưới; các mục là danh sách bài hát, mặt B là album ảnh.
- **Băng Cát-sét:** tua băng bằng bút chì (kéo vòng tròn) để chuyển phần, nhãn băng viết tay tên cặp đôi.
- **Máy Ảnh Lấy Liền:** bấm nút chụp, ảnh trượt ra và hiện dần từ trắng sang màu; sổ lưu bút là bảng ghim ảnh.
- **Vườn Ép Hoa:** sổ ép hoa khô, lật trang 3D, mỗi trang một bông hoa và một kỷ niệm.

**Trò chơi nhỏ**
- **Mở Khóa Tình Yêu:** ổ khóa số, khách xoay đúng ngày cưới (gợi ý sẵn) để mở thiệp.
- **Ô Chữ:** điền ô chữ ngắn, hàng dọc hiện tên cô dâu chú rể.
- **Cào Vé Số:** cào ba ô trúng "giải đặc biệt" là ngày cưới, giờ, địa điểm.
- **Bói Bánh Quy May Mắn:** bẻ bánh quy, mảnh giấy bên trong là lời mời, mỗi khách một câu chúc vui khác nhau.
- **Mê Cung:** dẫn hai nhân vật nhỏ tìm nhau qua mê cung ngắn, gặp nhau thì thiệp mở.

**Không gian và ánh sáng**
- **Đêm Sao:** nền trời đêm, chạm để nối các ngôi sao thành tên cặp đôi, ngày cưới là một chòm sao.
- **Đèn Lồng Hội An:** thả đèn lồng trôi trên sông, mỗi đèn là một lời chúc của khách, chạm vào để đọc.
- **Tàu Đêm Thống Nhất:** vé tàu giấy, các ga dừng là cột mốc tình yêu, toa cuối là tiệc cưới.
- **Mùa Trong Năm:** cuộn trang là đi qua bốn mùa (hoa đào, nắng, lá vàng, tuyết), mùa cưới dừng lại.
- **Bản Đồ Kho Báu:** giấy da cũ, đường chấm đỏ dẫn tới chữ X là nơi tổ chức; khách xoay la bàn bằng cảm biến nghiêng máy.

**Văn hóa Việt**
- **Tranh Đông Hồ:** khắc gỗ, màu điệp, đám cưới chuột cách điệu, chữ thư pháp.
- **Áo Dài & Nón Lá:** nón lá xoay để lộ bài thơ ẩn dưới ánh sáng (hiệu ứng soi đèn).
- **Mâm Quả:** mở từng tráp ăn hỏi (trầu cau, bánh phu thê, trà, rượu), mỗi tráp là một phần thông tin.

**Hiện đại**
- **Tin Nhắn:** giao diện trò chuyện, tin nhắn của hai người hiện dần kể chuyện tình, cuối cùng gửi "lời mời"; khách trả lời bằng bong bóng chat.
- **Trang Web 1999:** giao diện máy tính cũ, cửa sổ bật lên, bộ đếm người xem, chữ chạy; hoài niệm vui.
- **Thời Tiết:** dự báo "100% khả năng hạnh phúc" vào ngày cưới, biểu đồ nhiệt độ là đếm ngược.
