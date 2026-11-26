# Bộ máy thiệp v2 (`@sayhello/engine`)

JS thuần (ES module), không React, không bước build riêng cho từng mẫu. Cùng một tệp mẫu chạy ở hai nơi:

- **Máy chủ** (`renderDocument`): dựng nguyên trang HTML đầy đủ (kèm biến chủ đề `--sh-*`, `data-layout`, `data-moment`, `data-topic`, import map và script khởi tạo sớm `?topic=` / `?tier=` chống prototype pollution), nên bìa hiện ngay không cần chờ JS.
- **Trình duyệt** (`client/runtime.js`, nạp qua import map): điền tên khách (`?k=`), lọc nhóm khách (`?n=`), áp dụng chủ đề (`?topic=` / `ctx.setTopic()`), đo FPS chọn mức chuyển động (`?tier=`), gắn dịch vụ RSVP/lưu bút/nhạc (`services.js`, `backend.js`) và gọi `mount` / `motion` của từng cảnh.

## Viết một mẫu (`packages/themes/<id>/`)

Mỗi mẫu đặt trong `packages/themes/<id>/` gồm `package.json`, `theme.js`, `theme.css`, `demo.json`, thư mục ảnh tự chứa `images/` và `test/contract.test.js`.

**Không cần đăng ký thủ công:** `apps/web/scripts/sync-engine.mjs` tự động quét `packages/themes/*` (khi chạy `npm run dev`, `npm run build` hoặc `npm run sync -w @sayhello/web`), sao chép tài nguyên sang `apps/web/public/_e/` và sinh `apps/web/public/_e/manifest.json` cùng `apps/web/src/lib/themes.generated.ts`.

Xem triển khai mẫu theo kiến trúc `Layout × Topic × Moment` tại `packages/themes/thiep-gap-doi/`, `packages/themes/chieu-sau/`, `packages/themes/hop-ky-uc/`, `packages/themes/song-gia/` (và mẫu cuộn/3D tại `packages/themes/cuon-phim/`, `packages/themes/phong-trien-lam/`, `packages/themes/to-hong/`).

```js
import {
  composeInvitation, html, splitText, plain, qrUrl,
  rsvpForm, wishForm, wishList, countdown, fmt,
} from '@sayhello/engine';

export default composeInvitation({
  id: 'ten-mau',
  name: 'Tên mẫu',
  version: '1.0.0',
  tier: 'cinematic',               // basic | premium | cinematic
  layout: { id: 'folio', spread: '2-leaf' }, // LAYOUTS: scroll | pager | stage | hub | chat | folio | lookbook | deck | split | custom
  voice: 'than-mat',               // 'than-mat' hoặc 'trang-trong'
  gateMs: 450,                     // hạn mức SLA mở bìa <= 900ms (mặc định runtime: 900ms)
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600&display=swap', // bắt buộc có subset vietnamese
  libs: ['scroll'],                // nạp trước không chặn khi khách đang nhìn bìa (scroll | gsap | three | three-post | lenis)
  moment: {
    id: 'unseal-gleam',
    verb: 'unseal',
    verbLabel: 'Mở niêm phong & ánh nhũ',
    trigger: 'click',
    durationMs: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-fade',
  },
  topics: [
    {
      id: 'chu-de-1',
      name: 'Chủ đề 1',
      swatch: ['#FAF8F4', '#8E1B2C'],
      themeColor: '#FAF8F4',
      vars: {
        '--sh-bg': '#FAF8F4',
        '--sh-surface': '#F1ECE3',
        '--sh-ink': '#1C1917',
        '--sh-accent': '#8E1B2C',
        '--sh-accent-ink': '#FAF8F4',
        '--sh-foil': '#B88D48',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  gate: {
    id: 'bia',
    kind: 'gate',
    render: ctx => html`... ${ctx.guest()} <button type="button" data-open>Mở thiệp</button>`,
    mount(el, ctx) { el.querySelector('[data-open]')?.addEventListener('click', () => ctx.open()); },
  },
  scenes: [
    {
      id: 've',
      provides: ['when', 'where', 'rsvp'],
      render: ctx => {
        const { bg, fg } = ctx.imgPair('hero', 0); // ảnh nền + lớp tách người 2.5D (fg: '' nếu không có cutout)
        return html`... ${rsvpForm(ctx)} ...`;
      },
      motion: {
        async standard(el, ctx) { const { gsap } = await ctx.lib('scroll'); /* ... */ },
        lite: 'css',
      },
    },
  ],
});
```

*(Có thể dùng trực tiếp `defineTheme(...)` hoặc `composeInvitation(...)` / alias `composeTheme(...)`. `defineTheme` đóng băng `layoutSpec`, `moment`, `topics` và tự đồng bộ `topics` sang `palettes` nếu chưa khai báo riêng.)*

## API chính xuất từ `@sayhello/engine` (`src/index.js`)

- **Khai báo mẫu & hằng số (`define-theme.js`):** `defineTheme`, `composeInvitation`, `composeTheme`, `LAYOUTS`, `TIERS`, `SCENE_KINDS`, `FEATURES`.
- **Dựng HTML an toàn & chữ Việt (`html.js`):** `html`, `raw`, `esc`, `br`, `toStr`, `graphemes`, `splitText`, `plain` (bỏ dấu tiếng Việt cho nội dung chuyển khoản / VietQR).
- **Ngày giờ & dữ liệu (`date.js`, `model.js`, `voice.js`):** `parts`, `fmt`, `gcalUrl`, `buildContext`, `merge`, `mapUrl`, `qrUrl` (dựng link VietQR mã hóa `%20`), `createVoice`, `VOICES`.
- **Khối giao diện & dựng trang (`blocks.js`, `render.js`):** `rsvpForm`, `wishForm`, `wishList`, `countdown`, `quickInfo` (`#sh-quick`), `renderDocument`.
- **Mức chuyển động & WebGL (`tier.js`, `client/stage3d.js`):** `pickMotion`, `MOTION`, `measureFps`, `bindContextLoss`. Các cảnh 3D dùng chung hạ tầng tại `@sayhello/engine/client/stage3d.js` (`loadThree`, `createLife`, `makeRenderer`, `createPost`, `createPhotoLoader`, `clonePlate`, `scrollStops`, `fpsGuard`, `barOnly`, `recoverContext`, `startLoop`, `disposeScene`).

## Token CSS nền (`src/base.css`)

Toàn bộ luật mặc định nằm trong `:where()` (độ ưu tiên `0`) để mẫu và `topics[].vars` ghi đè tự do, đồng thời khóa sàn chữ `max(16px, 1rem)` trên `body.sh` và `max(13px, 1em)` trên `small`:

- Màu & bề mặt: `--sh-bg`, `--sh-surface`, `--sh-ink`, `--sh-muted`, `--sh-accent`, `--sh-accent-ink`, `--sh-foil`, `--sh-soft`, `--sh-panel`
- Chữ & chuyển động: `--sh-font-display`, `--sh-font-body`, `--sh-font-mono`, `--sh-radius`, `--sh-ease-tactile`, `--sh-ease`, `--sh-dur-ui`

## Nguyên tắc bắt buộc

- `render(ctx)` chỉ dùng dữ liệu trong `ctx`, tuyệt đối không đọc `window`/`document` vì chạy trên máy chủ. Tên khách đặt qua `ctx.guest()`, ảnh 2.5D dùng `ctx.imgPair(slot, i)`.
- Chèn dữ liệu bằng `` html`...` `` để tự thoát ký tự; `raw()` chỉ dùng cho chuỗi tĩnh tự viết.
- `provides` khai báo cảnh hiển thị tính năng gì (`FEATURES`). Nếu thiếu `when`, `where` hoặc `rsvp`, `defineTheme` ghi vào `fallback` và ngăn kéo **Thông tin nhanh (`#sh-quick`)** tự hiển thị form RSVP.
- Có `motion.cinematic` thì bắt buộc có `motion.lite`. Mức `lite` (`?tier=lite` hoặc `prefers-reduced-motion`) không được ghim cảnh, không chạy WebGL và không che nội dung.
- Mở bìa hoàn tất trong `<= 900ms` (khuyến nghị `gateMs: 450`); không bay camera 3D, không rung lắc nhàn rỗi, không hiệu ứng `infinite` phủ diện tích lớn, góc nghiêng tối đa `<= ±5°`.
- Thư viện nặng (`scroll`, `gsap`, `three`, `three-post`, `lenis`) chỉ nạp sau khi mở bìa qua `ctx.lib()`:
  - `await ctx.lib('three')` → `{ THREE }` (Three.js r170 từ import map)
  - `await ctx.lib('three-post')` → `{ THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }`
  - `await ctx.lib('lenis')` → `{ Lenis }`
  - Nếu nạp lỗi, cảnh phải tự hiện ở dạng tĩnh hoặc gọi `ctx.downgrade('error')`.
- Với cảnh WebGL/Canvas, luôn gắn `bindContextLoss(canvas, () => ctx.downgrade('webglcontextlost'))` (hoặc dùng `stage3d.js`).
- Form dùng sẵn `rsvpForm`, `wishForm`, hoặc markup riêng có `data-sh="rsvp"` / `"wish"` và đúng tên trường (xem `src/blocks.js`).
- Tách chữ để làm hiệu ứng bằng `splitText`, không tách bằng `[...chuoi]`, để không vỡ dấu tiếng Việt.

## Kiểm tra

```bash
npm test -w @sayhello/engine                              # unit test trên Node (hợp đồng M2, renderDocument, XSS, stage3d)
node --test packages/themes/<id>/test/contract.test.js    # kiểm tra hợp đồng & MD5 của từng mẫu
npm run sync -w @sayhello/web                             # đồng bộ engine & mẫu sang apps/web/public/_e/
npm run dev:legacy & npm run dev                          # mở /v2/ hoặc /v2/demo/<id>/?k=Tên+khách&topic=<id>&tier=lite
npm run test:v2                                           # kiểm tra mọi mẫu v2 ở 3 mức chuyển động trong Chromium
```
