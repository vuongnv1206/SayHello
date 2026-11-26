# Kiến trúc · SayHello

## 1. Thành phần

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| `apps/web/` | Next.js `16.4.6`, React `19.3.0`, Tailwind `4.3.3`, TypeScript | Trang bộ sưu tập và các route thiệp mẫu (SSG) |
| `packages/engine/` | JavaScript ES module thuần | `defineTheme` / `composeInvitation`, dựng HTML trên máy chủ, runtime trình duyệt |
| `packages/themes/` | ESM + CSS + ảnh | Mỗi thư mục một mẫu |
| `supabase/` | Supabase CLI, PostgreSQL 17 | Đã cấu hình cục bộ, `migrations/` còn trống |
| `tests/` | Playwright | `smoke.mjs` và `e2e/` (tầng 1–4) |

## 2. Thư mục

```text
├── apps/web/
│   ├── next.config.ts                  # cacheComponents, trailingSlash, transpilePackages
│   ├── scripts/sync-engine.mjs         # packages/* -> public/_e/ + themes.generated.ts
│   ├── src/app/page.tsx                # Trang bộ sưu tập /
│   ├── src/app/demo/[theme]/route.ts          # /demo/<mẫu>/ (nhận ?topic=)
│   ├── src/app/demo/[theme]/[topic]/route.ts  # /demo/<mẫu>/<chủ đề>/
│   ├── src/lib/                        # theme-types.ts, themes.ts, themes.generated.ts (tự sinh)
│   └── public/assets/music/            # Nhạc nền
├── packages/
│   ├── engine/src/                     # index.js, define-theme.js, render.js, model.js, blocks.js, tier.js, base.css, client/
│   ├── engine/test/
│   └── themes/<id>/                    # theme.js, theme.css, demo.json, images/, test/
├── assets/anh-minh-hoa/                # Ảnh minh hoạ mặc định
├── prototypes/                         # Bản thử topic chờ duyệt
├── supabase/
├── tests/
└── docs/
```

## 3. Luồng dựng trang

### 3.1 Đồng bộ (`apps/web/scripts/sync-engine.mjs`)
Chạy trước `npm run dev` và `npm run build`:
1. Chép `packages/engine/src/` vào `apps/web/public/_e/engine/`.
2. Quét `packages/themes/*` có `theme.js` và `demo.json`.
3. Chép tệp tĩnh của từng mẫu vào `public/_e/themes/<id>/`.
4. Sinh `public/_e/manifest.json` và `src/lib/themes.generated.ts`. Thêm mẫu mới không cần đăng ký tay.

### 3.2 Dựng HTML (`packages/engine/src/render.js`)
1. Route gọi `renderDocument(theme, demo, { assetBase, topic })`.
2. `defineTheme()` / `composeInvitation()` chuẩn hoá `layoutSpec`, `moment`, `topics`, kiểm tra cảnh `gate` đứng đầu và `motion.lite` đi kèm `motion.cinematic`.
3. Chủ đề chọn theo thứ tự `opts.topic` -> `invite.topic` -> `invite.palette` -> `theme.defaultTopic` -> `topics[0]`; kiểm tra tên biến CSS và URL font; gắn `data-layout`, `data-moment`, `data-topic`, import map và `<script id="sh-data">`.
4. Script sớm đọc `?topic=` / `?p=` trước khung hình đầu, chặn prototype pollution.

### 3.3 Trên trình duyệt (`packages/engine/src/client/runtime.js`)
1. `boot(theme)` điền tên khách (`?k=`), lọc nhóm khách (`?n=`), gắn nhạc và biểu mẫu (`services.js`: hồi âm, lời chúc, đếm ngược, `#sh-quick`).
2. Chọn mức chuyển động theo FPS, `?tier=` hoặc `prefers-reduced-motion`.
3. Bìa hiện ngay từ HTML tĩnh; thư viện nặng chỉ nạp qua `ctx.lib()`.
4. Mở bìa: `.sh-gate` được ẩn và phát sự kiện `open`.

Hồi âm và lời chúc: `client/backend.js` gửi tới `sheetUrl` (Google Apps Script) nếu thiệp có khai báo, không thì chỉ lưu trên máy khách. Repo hiện không có máy chủ nhận dữ liệu; phần này chờ Supabase.

## 4. Định tuyến và CI

- `/` — bộ sưu tập; `/demo/<mẫu>/` và `/demo/<mẫu>/<chủ đề>/` — thiệp mẫu (`?k=`, `?n=`, `?tier=`, `?topic=`).
- Triển khai Vercel từ thư mục gốc theo `vercel.json`: `npm ci`, `npm run build`, chép `apps/web/public` ra `public/`, đầu ra `apps/web/.next`. `next` khai thêm ở `package.json` gốc để Vercel nhận ra khung Next.js; giữ cùng phiên bản với `apps/web`.
- `.github/workflows/check.yml` (push và pull request vào `main`, Node 22): `npm test`, build, lint, typecheck, smoke test.
