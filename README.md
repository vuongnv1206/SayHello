# SayHello · Thiệp cưới online

Cặp đôi tự làm thiệp cưới online, mỗi mẫu là một trải nghiệm riêng (không phải cùng khung đổi màu), gửi khách qua Zalo, nhận xác nhận và lời chúc ngay trên điện thoại.

Đang chuyển từ **bản 1** (site tĩnh, người bán làm thiệp từ đơn, dữ liệu trên Google Sheets) sang **bản 2** (SaaS tự phục vụ, Next.js + Supabase, bộ máy thiệp có cảnh và chuyển động điện ảnh). Kế hoạch đầy đủ: [docs/REDESIGN.md](docs/REDESIGN.md).

## Cấu trúc

```
apps/web/          Next.js 16: trang chủ mới, đăng nhập, trình sửa, thanh toán, route thiệp /[slug] (đang xây)
packages/engine/   Bộ máy thiệp v2 (JS thuần, không React): khai báo mẫu, cảnh, hạng chuyển động
supabase/          Cấu hình, migrations, Edge Functions
legacy/            Site tĩnh bản 1, vẫn phục vụ các thiệp đã bán. Hướng dẫn: legacy/README.md
docs/              PRD, kiến trúc, thiết kế, quy tắc, kế hoạch làm lại
```

Đường dẫn nào `apps/web` chưa có (kể cả trang chủ và mọi thiệp cũ) sẽ tự rơi về `legacy/` qua `rewrites.fallback` trong `apps/web/next.config.ts`, nên link thiệp đã gửi khách không bao giờ hỏng.

## Chạy trên máy

```bash
npm install                       # một lần, cho cả monorepo (npm workspaces)
npx playwright install chromium   # một lần, để chạy kiểm tra
npm run dev:legacy                # site bản 1 ở http://localhost:3001
npm run dev                       # Next.js ở http://localhost:3000 (chuyển tiếp sang 3001 khi chưa có route)
npm test                          # kiểm tra bộ máy thiệp + mở thử mọi thiệp bản 1
```

Supabase chạy cục bộ cần Docker Desktop đang bật:

```bash
npm run db:start                  # lần đầu tải image, khá lâu
npm run db:stop
```

## Chạy song song với bản đang bán

- Nhánh `main` vẫn là site bản 1 đang deploy tự động trên Vercel.
- Bản 2 phát triển ở nhánh `redesign`. Khi gộp vào `main`, Vercel cần hai project: một trỏ vào `legacy/` (Root Directory), một trỏ vào `apps/web` với biến `LEGACY_ORIGIN` là địa chỉ project kia.
