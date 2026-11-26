# SayHello · Thiệp cưới online

Nền tảng thiệp cưới online lấy **Tấm thiệp làm trung tâm** (*Card-as-Centerpiece*): mỗi mẫu là một kiến trúc bố cục riêng (`Layout × Topic × Moment`), mở nhanh trên điện thoại qua Zalo, hiển thị ngay tên cô dâu chú rể, ngày dương/âm lịch, địa điểm và nút xác nhận tham dự (RSVP) trong 5 giây đầu.

Dự án vận hành song song **thế hệ 2** (`apps/web/`, `packages/engine/`, `packages/themes/`) trên nhánh `redesign` và **thế hệ 1 đóng băng** (`legacy/`) qua `rewrites.fallback` trong `apps/web/next.config.ts` để bảo đảm mọi link thiệp cũ đã gửi khách luôn hoạt động.

## Kiến trúc kho mã nguồn

```text
apps/web/          Next.js 16 + Tailwind 4: Showcase /v2/, /v2/demo/[theme]/, /v2/demo/[theme]/[topic]/
packages/engine/   Bộ máy thiệp v2 (JS thuần, không React): defineTheme, composeInvitation, renderDocument, base.css
packages/themes/   7 mẫu v2 đang hoạt động (tự động đồng bộ bởi sync-engine.mjs)
legacy/            Site tĩnh thế hệ 1 đóng băng: 10 mẫu v1, /, /dat-thiep/, /studio/, /ban-hang/
supabase/          Cấu hình Supabase cục bộ (PostgreSQL 17) & migrations cho pha SaaS tiếp theo
tests/e2e/         Bộ kiểm thử Playwright đa tầng (Tiers 1–4)
docs/              Bộ tài liệu chuẩn hiện hành (tài liệu cũ lưu tại docs/archive/)
```

## Bộ mẫu thiệp hiện có

- **Thế hệ 2 (`packages/themes/`, truy cập tại `/v2/` và `/v2/demo/<id>/`):**
  1. **Thiệp Gấp Đôi (`thiep-gap-doi`)** — *Folio 2 cánh* × *Mở niêm phong & ánh nhũ* (`son-mai`, `giay-do`, `lua-nga`)
  2. **Chiều Sâu (`chieu-sau`)** — *Lookbook 62/38* × *Đẩy tiêu cự 2.5D* (`suong-da-lat`, `dem-sai-gon`, `chang-vang-bien`)
  3. **Hộp Ký Ức (`hop-ky-uc`)** — *Hộp thẻ 4 ngăn* × *Chia thẻ & lật mặt sau* (`hop-nhung`, `buu-thiep`)
  4. **Song Gia (`song-gia`)** — *Chia đôi 50/50 hai nhà* × *Hội tụ & kết nút tơ* (`gom-su`, `hai-thanh-pho`)
  5. **Cuộn Phim (`cuon-phim`)** — *Cuộn điện ảnh* (`nhung-do`, `luc-bao`, `hai-quan`)
  6. **Phòng Triển Lãm (`phong-trien-lam`)** — *Sân khấu 3D camera phẳng* (`xam-luc`, `nhung-man`, `thach-cao`, `men-lam`)
  7. **Tơ Hồng (`to-hong`)** — *Sân khấu tơ chỉ camera phẳng* (`suong-som`, `dem-to-do`)
- **Thế hệ 1 (`legacy/`, 10 mẫu đóng băng):** `song-hy`, `thu-tay`, `ve-may-bay`, `khoa-tinh`, `den-long`, `cuon-phim`, `tin-nhan`, `thiep-gap`, `khung-theu`, `ca-phe-phin` (cùng các đường dẫn `/`, `/dat-thiep/`, `/studio/`, `/ban-hang/`).

## Chạy nhanh & Kiểm thử

```bash
npm install                       # cài phụ thuộc toàn monorepo (npm workspaces)
npx playwright install chromium   # cài trình duyệt cho E2E (một lần)

npm run dev:legacy                # chạy site v1 tại http://localhost:3001
npm run dev                       # chạy Next.js v2 tại http://localhost:3000 (fallback sang :3001)

npm test -w @sayhello/engine      # unit test @sayhello/engine
npm run lint -w @sayhello/web     # ESLint cho apps/web
npx --prefix apps/web tsc --noEmit --incremental false -p apps/web/tsconfig.json
npm run build                     # đồng bộ sync-engine.mjs + build Next.js
npm test                          # test @sayhello/engine + @sayhello/legacy
npm run test:v2                   # smoke test các mẫu v2 tại :3000
node tests/e2e/run.mjs --tier=all
```

Supabase cục bộ (khi bật Docker Desktop): `npm run db:start` / `npm run db:stop` / `npm run db:reset`.

## Danh mục tài liệu (`docs/`)

- `docs/ASSESSMENT-AND-RESTRUCTURING-PLAN.md` — Đánh giá đa góc độ, phản biện kỹ thuật, giải phẫu 3D chóng mặt & lộ trình tái cấu trúc
- `docs/TEMPLATES-AND-TOPICS.md` — Kiến trúc 5 mẫu, chủ đề sáng tạo, tiêu chí chống sến & rubric nhị phân 4 tiêu chí
- `docs/DESIGN.md` — Hệ thiết kế `Layout × Topic × Moment`, token `--sh-*` & chuẩn chữ tiếng Việt
- `docs/ARCHITECTURE.md` — Kiến trúc monorepo, luồng dữ liệu, định tuyến & CI
- `docs/TAO-MAU-MOI.md` — Hướng dẫn tạo mẫu/chủ đề mới trên `@sayhello/engine`
- `docs/RULES.md` — Quy trình Git (`redesign`), quy tắc bảo mật & bất biến kiểm thử
- `docs/CLAUDE-HANDOFF.md` — Tóm tắt bàn giao cho cộng tác AI ở panel bên cạnh
- `docs/archive/README.md` — Mục lục 12 tài liệu lịch sử đã lưu trữ
