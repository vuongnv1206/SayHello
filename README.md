# SayHello · Thiệp cưới online

Nền tảng thiệp cưới online lấy **tấm thiệp làm trung tâm** (*Card-as-Centerpiece*): mỗi mẫu là một kiến trúc bố cục riêng (`Layout × Topic × Moment`), mở nhanh trên điện thoại qua Zalo, hiện ngay tên cô dâu chú rể, ngày dương và âm lịch, địa điểm và nút xác nhận tham dự.

## Cấu trúc

```text
apps/web/            Next.js 16 + Tailwind 4: trang bộ sưu tập /, thiệp mẫu /demo/<mẫu>/ và /demo/<mẫu>/<chủ đề>/
packages/engine/     Bộ máy thiệp (JS thuần, không React)
packages/themes/     Các mẫu thiệp, tự đồng bộ vào apps/web khi dev và build
assets/anh-minh-hoa/ Ảnh minh hoạ mặc định để dựng mẫu và bản thử
prototypes/          Bản thử topic đang chờ duyệt (mở thẳng index.html)
supabase/            Cấu hình Supabase cục bộ (PostgreSQL 17), chưa có migration
tests/               smoke.mjs và bộ kiểm thử Playwright e2e/
docs/                Tài liệu hiện hành
```

## Mẫu thiệp

| Mẫu (`/demo/<id>/`) | Bố cục × khoảnh khắc | Chủ đề / bảng màu |
|---|---|---|
| Thiệp Gấp Đôi `thiep-gap-doi` | Folio 2 cánh × mở niêm phong | `son-mai`, `giay-do`, `lua-nga` |
| Chiều Sâu `chieu-sau` | Lookbook × đẩy tiêu cự 2.5D | `suong-da-lat`, `dem-sai-gon`, `chang-vang-bien` |
| Hộp Ký Ức `hop-ky-uc` | Hộp thẻ × chia và lật thẻ | `hop-nhung`, `buu-thiep` |
| Song Gia `song-gia` | Chia đôi hai nhà × kết nút tơ | `gom-su`, `hai-thanh-pho` |
| Photobooth `photobooth` | Góc chụp tiệc cưới × in dải ảnh | `dem-xanh`, `dem-ruou`, `rung-dem` |
| Cuộn Phim `cuon-phim` | Cuộn điện ảnh | `nhung-do`, `luc-bao`, `hai-quan` |
| Phòng Triển Lãm `phong-trien-lam` | Sân khấu 3D camera phẳng | `xam-luc`, `nhung-man`, `thach-cao`, `men-lam` |
| Tơ Hồng `to-hong` | Sân khấu tơ chỉ camera phẳng | `suong-som`, `dem-to-do` |

## Chạy và kiểm thử

```bash
npm install                       # cài phụ thuộc toàn repo
npx playwright install chromium   # trình duyệt cho kiểm thử (một lần)

npm run dev                       # http://localhost:3000
npm test                          # unit test engine + hợp đồng các mẫu
npm run lint && npm run typecheck
npm run build
npm run test:smoke                # mở thử mọi mẫu ở :3000
npm run test:e2e                  # bộ Playwright đầy đủ
```

Supabase cục bộ (cần Docker Desktop): `npm run db:start`, `npm run db:stop`, `npm run db:reset`.

Triển khai Vercel: đặt **Root Directory** là `apps/web`.

## Tài liệu (`docs/`)

- `CHI-DAO.md` — Bảng chỉ đạo và hiện trạng.
- `RULES.md` — Quy trình git, ràng buộc mã nguồn, bảo mật.
- `ARCHITECTURE.md` — Cấu trúc và luồng dựng trang.
- `DESIGN.md` — Hệ thiết kế, token `--sh-*`, chuẩn chữ tiếng Việt.
- `TEMPLATES-AND-TOPICS.md` — Kiến trúc mẫu, chủ đề, tiêu chí duyệt.
- `TAO-MAU-MOI.md` — Hướng dẫn tạo mẫu và chủ đề mới.
