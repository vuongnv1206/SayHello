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

- **Vé Máy Bay:** bìa là boarding pass, kéo để xé cuống; hành trình tình yêu là đường bay qua các thành phố; giờ cưới là giờ cất cánh.
- **Cuộn Phim:** bìa là máy chiếu bật đèn, ảnh chạy như khung phim 35mm, chữ hiện như phụ đề, có tiếng tạch máy ảnh.
- **Báo Xuân:** trang nhất tờ báo cũ "Tin vui", tít lớn, cột chữ, ảnh in lưới chấm, tem giá báo.
- **Đêm Sao:** nền trời đêm, chạm để nối các ngôi sao thành tên cặp đôi, ngày cưới là một chòm sao.
- **Vườn Ép Hoa:** sổ ép hoa khô, lật trang 3D, mỗi trang một bông hoa và một kỷ niệm.
- **Đĩa Than:** bìa là đĩa nhựa, kéo kim để phát nhạc cưới, các mục là danh sách bài hát.
