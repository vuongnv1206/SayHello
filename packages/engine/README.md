# Bộ máy thiệp v2

JS thuần, không React, không bước build. Cùng một file chạy ở hai nơi:

- **Máy chủ** (`renderDocument`): dựng nguyên trang HTML, nên bìa hiện ngay, không phải chờ JS.
- **Trình duyệt** (`client/runtime.js`, nạp qua import map): điền tên khách, chọn mức chuyển động, gắn form và gọi `mount` của từng cảnh.

## Viết một mẫu

`packages/themes/<id>/` gồm `theme.js`, `theme.css`, `demo.json`, `package.json`. Sau khi tạo, đăng ký mẫu ở `apps/web/src/lib/themes.ts`. Xem mẫu đầy đủ ở `packages/themes/cuon-phim/`.

```js
import { defineTheme, html, splitText, rsvpForm, countdown, fmt } from '@sayhello/engine';

export default defineTheme({
  id: 'ten-mau', name: 'Tên mẫu', version: '1.0.0',
  tier: 'premium',                 // basic | premium | cinematic (gói giá)
  layout: 'scroll',                // scroll | pager | stage | hub | chat | custom
  voice: 'than-mat',               // hoặc 'trang-trong'
  fonts: 'https://fonts.googleapis.com/css2?family=...&display=swap',  // bắt buộc có bộ chữ tiếng Việt
  libs: ['scroll'],                // tải sẵn GSAP + ScrollTrigger trong lúc khách nhìn bìa
  scenes: [
    { id: 'bia', kind: 'gate', render: ctx => html`...`, mount(el, ctx) { /* gọi ctx.open() khi khách mở */ } },
    { id: 've', provides: ['when', 'where', 'rsvp'],
      render: ctx => html`${ctx.main.title} ${rsvpForm(ctx)}`,
      motion: { async standard(el, ctx) { const { gsap } = await ctx.lib('scroll'); /* ... */ }, lite: 'css' } },
  ],
});
```

**Nguyên tắc:**

- `render(ctx)` chỉ dùng dữ liệu trong `ctx`, không đọc `window`, vì hàm này chạy trên máy chủ. Tên khách đặt qua `ctx.guest()`, trình duyệt sẽ tự điền vào.
- Chèn dữ liệu bằng `html\`\``, hàm này tự thoát ký tự. `raw()` chỉ dùng cho chuỗi do mình viết.
- `provides` khai báo cảnh hiển thị gì. Nếu thiếu `when`, `where` hoặc `rsvp`, `defineTheme` ghi vào `fallback`. Ngăn kéo **Thông tin nhanh** luôn có trên trang thiệp.
- Có `motion.cinematic` thì bắt buộc có `motion.lite`. Mức `lite` không được ghim cảnh và không được che nội dung.
- Thư viện nặng (`scroll`, `gsap`, `three`, `three-post`, `lenis`) chỉ nạp sau khi bìa đã mở qua `ctx.lib()`:
  - `await ctx.lib('three')` → `{ THREE }` (Three.js r170 từ import map)
  - `await ctx.lib('three-post')` → `{ THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }`
  - `await ctx.lib('lenis')` → `{ Lenis }`
  - Nạp không được thì cảnh phải tự hiện ở dạng tĩnh hoặc gọi `ctx.downgrade('error')`.
- Với cảnh WebGL/Canvas, dùng `bindContextLoss(canvas, () => ctx.downgrade('webglcontextlost'))` (xuất từ `@sayhello/engine`) để chặn treo trang và hạ về mức `lite` khi WebView thu hồi ngữ cảnh đồ họa.
- Form dùng sẵn `rsvpForm`, `wishForm`, hoặc tự vẽ markup riêng với `data-sh="rsvp"` / `"wish"` và đúng tên trường (xem `src/blocks.js`).
- Tách chữ để làm hiệu ứng bằng `splitText`, không tách bằng `[...chuoi]`, nếu không dấu tiếng Việt sẽ bị rời khỏi chữ.

## Kiểm tra

```bash
npm test -w @sayhello/engine           # kiểm tra trên Node: hợp đồng mẫu, dựng HTML, thoát ký tự, chọn mức máy
npm run dev:legacy & npm run dev       # rồi mở http://localhost:3000/v2/demo/<id>/?k=Tên+khách&tier=lite
npm run test:v2                        # mở thử mọi mẫu v2 ở 3 mức chuyển động trong Chromium
```
