# Hướng dẫn tạo mẫu và chủ đề mới (`@sayhello/engine`)

> Mẫu mới dùng bộ máy `@sayhello/engine` (`packages/engine/`) theo mô hình **Card-as-Centerpiece (`Layout × Topic × Moment`)**.

---

## 1. Điều kiện tiên quyết trước khi viết code

Đọc kỹ `docs/DESIGN.md` và `docs/TEMPLATES-AND-TOPICS.md` để chốt trước 4 thông số:
1. **Kiến trúc bố cục (`layout`):** Một trong các giá trị hợp lệ của `LAYOUTS` trong `packages/engine/src/define-theme.js` (`folio`, `lookbook`, `deck`, `split`, `scroll`, `pager`, `stage`, `hub`, `chat`, `custom`). Tuyệt đối không dùng khung cột đơn hẹp lặp lại mọi mẫu khác.
2. **Khoảnh khắc chữ ký (`moment`):** Đúng 1 động tác vật lý có tên (`id`, `verb`, `verbLabel`, `trigger`, `durationMs`, `easing`, `reducedFallback`), tôn trọng giới hạn mở bìa **`<= 900ms`** (khuyến nghị `gateMs: 450`). Nghi thức dài hơn: xem ngoại lệ `data-ritual` trong `docs/RULES.md`.
3. **Danh sách chủ đề (`topics`):** Ít nhất 2 chủ đề tinh tế, chống sến, mỗi chủ đề có `id`, `name`, `desc`, `swatch`, `themeColor`, và bộ biến `vars` (`--sh-bg`, `--sh-surface`, `--sh-ink`, `--sh-accent`, `--sh-accent-ink`, `--sh-foil`, `--sh-soft`, `--sh-panel`, `--sh-font-display`, `--sh-font-body`).
4. **Kịch bản tĩnh (`?tier=lite` & `prefers-reduced-motion`):** Mọi cảnh dùng chuyển động nặng hoặc WebGL (`motion.cinematic`) bắt buộc khai báo `motion.lite` với đầy đủ thông tin và biểu mẫu RSVP.

---

## 2. Cấu trúc một gói mẫu (`packages/themes/<id>/`)

Nhờ cơ chế tự động quét của `apps/web/scripts/sync-engine.mjs`, bạn **không cần sửa tay 5 tệp đăng ký** ở `apps/web/` nữa. Chỉ cần tạo đúng các tệp sau trong `packages/themes/<id>/`:

```text
packages/themes/<id>/
├── package.json            # name: "@sayhello/theme-<id>", type: "module", peer/dep "@sayhello/engine"
├── theme.js                # export default defineTheme(...) hoặc composeInvitation(...)
├── theme.css               # Kiểu dáng riêng ghi đè mượt lên packages/engine/src/base.css
├── demo.json               # Dữ liệu cặp đôi giả lập (tên giả, số 0000000000, có guestGroups)
├── images/                 # Ảnh cưới tự chứa (anh1..6.jpg, xem-truoc.jpg, tuỳ chọn *-nguoi.webp)
└── test/
    └── contract.test.js    # Kiểm tra hợp đồng, renderDocument, XSS, prototype pollution & ảnh
```

*(Tham khảo triển khai thực tế tại `packages/themes/thiep-gap-doi/`, `packages/themes/chieu-sau/`, `packages/themes/hop-ky-uc/`, `packages/themes/song-gia/`.)*

---

## 3. Khai báo `theme.js` với `composeInvitation` / `defineTheme`

```js
import {
  composeInvitation, html, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt
} from '@sayhello/engine';

export default composeInvitation({
  id: 'ten-mau',
  name: 'Tên Mẫu',
  version: '1.0.0',
  tier: 'cinematic',
  layout: { id: 'folio', spread: '2-leaf' },
  voice: 'trang-trong', // hoặc 'than-mat'
  themeColor: '#FAF8F4',
  tagline: 'Mô tả ngắn về cấu trúc & chất liệu',
  // Bắt buộc chọn font có subset vietnamese trên Google Fonts
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Newsreader:ital,wght@0,400;0,600;1,400&display=swap',
  gateMs: 450,
  moment: {
    id: 'ten-khoanh-khac',
    verb: 'unseal',
    verbLabel: 'Nhãn hiển thị trên Showcase',
    trigger: 'click',
    durationMs: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-fade',
  },
  topics: [
    {
      id: 'chu-de-1',
      name: 'Tên Chủ Đề 1',
      desc: 'Mô tả vật liệu & sắc độ.',
      swatch: ['#FAF8F4', '#8E1B2C'],
      themeColor: '#FAF8F4',
      vars: {
        '--sh-bg': '#FAF8F4',
        '--sh-surface': '#F1ECE3',
        '--sh-ink': '#1C1917',
        '--sh-accent': '#8E1B2C',
        '--sh-accent-ink': '#FAF8F4',
        '--sh-foil': '#B88D48',
        '--sh-soft': 'rgba(28, 25, 23, 0.16)',
        '--sh-panel': '#F1ECE3',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  gate: {
    id: 'bia',
    kind: 'gate',
    render: ({ names, date, guest }) => html`... <button type="button" data-open>Mở thiệp</button>`,
    mount(el, ctx) {
      el.querySelector('[data-open]')?.addEventListener('click', () => ctx.open());
    },
  },
  scenes: [
    {
      id: 'noi-dung',
      provides: ['when', 'where', 'rsvp', 'album', 'gift', 'guestbook'],
      render: ctx => html`... ${rsvpForm(ctx)} ...`,
    },
  ],
});
```

### Quy tắc kỹ thuật bắt buộc trong `theme.js` & `theme.css`
1. **Không đọc `window`/`document` trong `render(ctx)`:** `renderDocument()` chạy trên server Next.js (`apps/web/src/app/demo/[theme]/route.ts`). Mọi tương tác DOM chỉ viết trong `mount(el, ctx)` hoặc `motion.standard/cinematic(el, ctx)`.
2. **Bảo mật HTML & chữ tiếng Việt:** Luôn dùng `` html`...` `` để tự động escape; chỉ dùng `raw()` cho SVG tĩnh do bạn tự viết. Tách chữ bằng `splitText()` từ `@sayhello/engine`, dùng `plain()` và `qrUrl(account, 'Mung cuoi ' + plain(ctx.guest))` (giữ mã hóa `%20`, không dùng `+`).
3. **Lớp cắt ảnh 2.5D (`ctx.imgPair`):** Nếu mẫu tách tiền cảnh nhân vật, dùng `ctx.imgPair(slot, i)` trong `packages/engine/src/model.js` và đặt overscan đối xứng (như `--cs-bleed: 10px` trong `packages/themes/chieu-sau/theme.css`) kèm fallback `.no-fg` khi thiếu tệp cutout.
4. **Sàn chữ & Không tràn ngang:** Mọi nhãn tiếng Việt `>= 13px`, đoạn văn bản `<p>` `>= 16px`, `.sh-scene { overflow-x: clip; }`, không dùng `loading="lazy"` ở ảnh bìa/ảnh đầu, không dùng animation `infinite` trên lớp phủ lớn.

---

## 4. Thêm Topic mới vào mẫu đã có (không cần đụng Layout)

1. Mở `packages/themes/<id>/theme.js`, thêm một phần tử vào mảng `topics` với `id` mới (chữ thường, gạch ngang, không dấu), `name`, `desc`, `swatch`, `themeColor` và đủ bộ biến `--sh-*`.
2. Nếu topic dùng họ font mới, bổ sung vào chuỗi `fonts` (kiểm tra chắc chắn Google Fonts có subset `vietnamese`).
3. Kiểm tra tương phản màu chữ `--sh-ink` trên `--sh-bg` / `--sh-surface` đạt `>= 4.5:1` (chuẩn WCAG AA).
4. Chạy đồng bộ và kiểm thử: `apps/web/scripts/sync-engine.mjs` sẽ tự động đưa topic mới vào trang `/` và sinh route SSG `/demo/<id>/<topic>/`.

---

## 5. Ảnh của mẫu

1. **Tự chứa:** đặt ảnh trong `packages/themes/<id>/images/`, không trỏ đường dẫn ra ngoài gói mẫu.
2. **Dùng ảnh minh hoạ mặc định** trong `assets/anh-minh-hoa/` (chép vào `images/` của mẫu). Không tạo ảnh AI, không dùng ảnh thật của cặp đôi. Hai mẫu được phép dùng chung một bộ ảnh.
3. **Nhẹ cho 4G:** nén JPEG/WebP chất lượng `80–85`, tỷ lệ khung `3:4` hoặc `4:5`; trong một mẫu không để hai tệp trùng nhau.

---

## 6. Kiểm tra hợp đồng & E2E trước khi hoàn thành

1. Viết `packages/themes/<id>/test/contract.test.js` kiểm tra:
   - Export hợp lệ qua `defineTheme` / `composeInvitation`, có `topics` và `moment`.
   - `renderDocument` chạy sạch ở mọi topic, thoát mã XSS (`<script>`), an toàn trước `?topic=__proto__`.
   - Đủ ảnh, trong mẫu không có hai tệp trùng nhau.
2. Chạy đầy đủ bộ lệnh kiểm tra:
   ```powershell
   npm test -w @sayhello/engine
   node --test packages/themes/<id>/test/contract.test.js
   npm run build
   npm run test:smoke      # cần `npm run dev` đang chạy
   npm run test:e2e
   ```
3. Kiểm tra bằng mắt ảnh chụp Playwright ở `320×568`, `390×844` và `1440×900` dựa trên **Rubric nhị phân 4 tiêu chí** trong `docs/TEMPLATES-AND-TOPICS.md`.

---

## 7. Làm mẫu song song (nhiều người, nhiều tác tử)

Mỗi mẫu một người, chỉ viết trong thư mục của mình. Không sửa `packages/engine/`, `apps/`, `tests/`, tài liệu chung hay mẫu của người khác; cần đổi phần chung thì ghi yêu cầu vào báo cáo.

1. Tạo khung: `node tests/new-theme.mjs <id> <bộ ảnh> <tên nhạc>`. Thư mục nằm ở `packages/themes-wip/<id>/` (git bỏ qua) nên mẫu dở không làm hỏng build.
   - Bộ ảnh trong `assets/anh-minh-hoa/`: `ca-phe-phin`, `cuon-phim`, `den-long`, `khoa-tinh`, `khung-theu`, `song-hy`, `thiep-gap`, `thu-tay`, `tin-nhan`, `ve-may-bay`.
   - Nhạc: `binh-minh`, `dao-buoc`, `hop-nhac`.
2. Viết `theme.js` và `theme.css`. Mẫu tham khảo gần nhất: `packages/themes/the-len-may-bay/`, `packages/themes/album-nhac/`.
3. Soát đến khi đạt hết: `node tests/preview-theme.mjs packages/themes-wip/<id> --shots <thư mục ảnh>` và `node --test packages/themes-wip/<id>/test/contract.test.js`. Xem ảnh chụp bằng mắt.
4. Báo người tích hợp. Người tích hợp chuyển thư mục sang `packages/themes/`, chạy `npm test`, `npm run build`, smoke và E2E, rồi commit.

### Chủ dự án đã chốt

- Nhìn vào phải nhận ra ngay là **thiệp cưới**: lời mời trang trọng, tên cô dâu chú rể là nhân vật chính, ngày dương và âm lịch, địa điểm, hồi âm tìm thấy ngay.
- Mỗi mẫu một **bố cục và tương tác riêng**, không chỉ đổi màu. Mỗi chủ đề đổi cả khung, chất liệu hoặc nhịp đọc bằng `html[data-topic="..."]`.
- Đẹp, hiện đại, tinh tế. Tránh quê mùa, sến, chóng mặt; không vẽ đồ vật kiểu clip-art bằng CSS.

### Lỗi hay gặp

- Bộ chọn `h2` theo mẫu phải giới hạn trong cảnh, nếu không sẽ tràn sang ngăn "Thông tin nhanh" (`#sh-quick`) hoặc đè màu tên trên nền tối.
- Chữ trên ảnh cần nền đặc (`background-color`) phía sau, không chỉ gradient.
- Nút chọn trong form: giữ cách của engine (ô radio ẩn, `span` làm nút), chỉ đổi kiểu `span`.
- `.sh-cd span` mặc định `opacity: .8`; đặt `opacity: 1` nếu chữ đã nhạt.
- Mọi thứ có `transform: rotate` quá `6deg`, `infinite`, chữ dưới `13px`, hay tràn ngang ở `320px` đều bị test chặn.
- Nút mở bìa (`data-open`) phải thấy được trên màn `320×568` và bấm được ngay; bìa mở xong trong `900ms`.
- Git Bash đổi đối số bắt đầu bằng `/` thành đường dẫn Windows: dùng tên nhạc trần như trên.

