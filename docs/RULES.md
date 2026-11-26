# Quy tắc kỹ thuật và quy trình · SayHello

## 1. Git

- **Chỉ làm trên nhánh `main`.** Không tạo nhánh phát triển song song, không chia phiên bản trong mã (không `v2`, không thư mục bản cũ). Lịch sử cũ nằm trong git.
- Thông điệp commit ngắn gọn bằng tiếng Việt, mỗi commit một mục tiêu.
- Chạy `npm test`, `npm run build` và `npm run test:smoke` trước khi đẩy. Chỉ đẩy khi chủ dự án đồng ý.
- Không `push --force` lên `main`.
- Đổi cấu trúc, mẫu hoặc lệnh thì cập nhật `README.md`, `CLAUDE.md` và `docs/` trong cùng commit. Tài liệu hết dùng thì xoá.

## 2. Ràng buộc mã nguồn

1. **Không React trong trang thiệp** (`packages/engine/`, `packages/themes/*`): thiệp dựng bằng HTML/JS thuần từ `renderDocument()` rồi nâng cấp qua `packages/engine/src/client/runtime.js`.
2. **Next.js 16** trong `apps/web/`: đọc `apps/web/AGENTS.md` và `node_modules/next/dist/docs/` trước khi sửa.
3. **Mở bìa và chuyển động:**
   - Mở bìa xong trong `<= 900ms` (chuẩn `450ms`).
   - Không xoay camera 3D tự do, không rung lắc camera, không hiệu ứng `infinite` trên lớp phủ lớn.
   - Có bản tĩnh `?tier=lite`, theo `prefers-reduced-motion`, gắn `bindContextLoss` khi dùng WebGL.
4. **Chữ và tương phản:** thân bài `>= 16px`, nhãn tiếng Việt `>= 13px`, tương phản `>= 4.5:1`, font có bộ ký tự `vietnamese`, tách chữ bằng `splitText()`, không tràn ngang ở `320×568`, `390×844`, `1440×900`.
5. **An toàn:** HTML escape qua `` html`...` `` (`raw()` chỉ cho chuỗi tĩnh tự viết); chặn `?topic=__proto__`; link VietQR qua `qrUrl()` hoặc `encodeURIComponent`.
6. **Ảnh:** dùng ảnh minh hoạ mặc định trong `assets/anh-minh-hoa/`, không tạo ảnh AI.

## 3. Bảo mật và dữ liệu

- Không commit `.env`, khoá `service_role` của Supabase, mật khẩu hay token.
- Không đưa dữ liệu thật của cặp đôi (tên, số điện thoại, tài khoản, ảnh) vào `demo.json`, `docs/` hay test. Dùng tên giả và số `0000000000`.
- Kiểm thử tự động không được ghi vào Google Sheet thật (các bộ test chặn `script.google.com`).
