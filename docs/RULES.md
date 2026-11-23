# Quy tắc · SayHello

Áp dụng cho mọi người và mọi AI viết code trong dự án này.

## Quy trình

1. **Đẩy thẳng lên `main`**, không tạo nhánh, không PR (chủ dự án yêu cầu). Sau khi đẩy, kiểm tra GitHub Actions xanh.
   - *Ngoại lệ tạm, chờ chủ dự án xác nhận:* bản 2 (monorepo, [REDESIGN.md](REDESIGN.md)) làm ở nhánh `redesign`, vì chuyển site vào `legacy/` sẽ làm hỏng bản đang tự deploy từ `main` cho tới khi cấu hình lại Vercel. Sửa gấp cho thiệp đang bán vẫn làm trên `main`.
2. **Commit nhỏ, mỗi commit một chức năng**, thông điệp **ngắn bằng tiếng Việt** (vd. "Thêm mẫu Vé Máy Bay").
3. Chạy `npm test` trước khi đẩy. Sửa `invite.json` hay `site.json` thì chạy `npm run build` để sinh lại `index.html` (CI báo lỗi nếu quên).
4. Cập nhật `docs/PROGRESS.md` và `docs/TASKS.md` khi xong một việc.

## Viết code

- **Bản 1 (`legacy/`): không framework, không bước build.** HTML/CSS/JS ES module thuần, chạy được khi mở qua bất kỳ máy chủ tĩnh nào.
- **Bản 2:** ứng dụng ở `apps/web` dùng Next.js 16 (đọc `apps/web/AGENTS.md` và tài liệu trong `node_modules/next/dist/docs/` trước khi viết, API khác các bản cũ). Trang thiệp của khách **không chạy React**: dựng bằng `packages/engine` (JS thuần, chạy được cả trên máy chủ).
- Mẫu v2 khai báo bằng `defineTheme` (`packages/engine`). Cảnh có chuyển động điện ảnh bắt buộc có bản `lite` cho máy yếu và `prefers-reduced-motion`.
- Thư viện nặng (GSAP, Three.js) chỉ nạp sau khi bìa đã hiện, không bao giờ chặn lần hiện đầu tiên.
- Chèn dữ liệu vào HTML **chỉ qua `html\`\``** (tự thoát ký tự). Dùng `raw()` chỉ cho chuỗi do mình viết (vd. SVG), không bao giờ cho dữ liệu khách nhập.
- Câu chữ hiển thị viết **tiếng Việt có dấu**, tự nhiên, xưng hô phù hợp thiệp cưới.
- Font mới phải có bộ ký tự **vietnamese** trên Google Fonts.
- Mẫu mới phải chạy được với dữ liệu của mọi thiệp mẫu (`?theme=<id>`), CI kiểm tra điều này.
- Phần dùng chung đặt trong `core/`; mẫu chỉ lo bố cục và câu chuyện. Không sửa `core/` để phục vụ riêng một mẫu nếu có cách khác.
- Mọi hiệu ứng phải tắt được khi `prefers-reduced-motion` và không chặn khách đọc nội dung.
- Kiểm tra giao diện ở **bề rộng 360–400px** trước tiên.

## Tuyệt đối không

- ❌ Đưa **`STUDIO_SECRET`**, file `.env` (`legacy/.env`, `apps/web/.env.local`, `supabase/.env`), `backend/*.local.gs`, khóa `service_role` của Supabase, mật khẩu, khóa API lên GitHub hoặc viết vào chat/tài liệu.
- ❌ Đưa **dữ liệu thật của cặp đôi** (tên, số tài khoản, ảnh, số điện thoại) vào thiệp mẫu hay tài liệu. Thiệp mẫu dùng tên giả và số `0000000000`.
- ❌ Để kiểm tra tự động ghi dữ liệu vào **Google Sheet thật**.
- ❌ Dùng **nhạc, ảnh, font không rõ bản quyền**.
- ❌ Chép y nguyên thiết kế của dịch vụ thiệp khác. Mỗi mẫu phải là ý tưởng riêng.
- ❌ Ghi đè lịch sử Git (`push --force`) lên `main` khi chưa được chủ dự án đồng ý.
- ❌ Xóa dữ liệu trong Sheet, xóa thiệp đã bán, đổi `STUDIO_SECRET` (làm mọi link Studio cũ hết hạn) khi chưa được đồng ý.
- ❌ Tự nhập mật khẩu, thông tin thẻ, hay thực hiện thanh toán thay chủ dự án.
