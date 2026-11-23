# Kế hoạch làm lại · SayHello 2.0

Tổng hợp từ 4 subagent ngày 23/11/2026: chấm điểm UX/UI, sáng tác ý tưởng, kiến trúc kèm Supabase, tham khảo motionsites.ai.

**Quyết định đã chốt:**
- **Mô hình:** SaaS tự phục vụ. Cặp đôi tự đăng ký, tự chọn mẫu, trả tiền rồi xuất bản.
- **Chuyển động:** kiểu điện ảnh, chấp nhận nặng.
- **10 mẫu cũ:** giữ làm tham khảo, mẫu nào hay thì làm lại trên engine mới.
- **Đã xoá:** Gốm Ghép Vàng, Kính Vạn Hoa.
- **Kiến trúc:** Next.js + Supabase, **tạm dùng gói miễn phí** (Vercel Hobby, Supabase Free) trong lúc phát triển. Trước khi nhận tiền khách thật thì nâng gói: Vercel Hobby cấm dùng thương mại, còn Supabase Free tự tạm dừng sau 7 ngày không hoạt động.
- **Mẫu điện ảnh đầu tiên:** làm lại **Cuộn Phim** trên engine v2.
- **Pháp nhân:** cá nhân. Thanh toán qua **SePay hoặc Casso**: VietQR kèm webhook đọc biến động số dư.
- **Đăng nhập:** **email OTP + Google**. Trước khi đăng nhập, cặp đôi vẫn làm được bản nháp (đăng nhập ẩn danh).

---

## 1. Vì sao thiệp nào cũng giống nhau

Hiện dự án **không có 10 mẫu, mà là một khung kể chuyện với 10 lớp da**.

- **Cấu trúc bị khoá cứng.** `core/boot.js:67-74` chỉ nhận `{cover, main}`, tức một màn bìa cộng một cột cuộn dọc rộng tối đa 520px (`base.css:23`).
- **Thứ tự mục gần như giống nhau.** 7/10 mẫu dùng cùng chuỗi `hero, couple, story, events, countdown, album, map, rsvp, guestbook, gift, thanks`. Mẫu chỉ là một bảng tra cứu `{tênMục: hàm}`.
- **Widget sinh sẵn markup.** Phần xác nhận, lưu bút, quà và album có HTML giống hệt ở mọi mẫu. Câu chữ trong lõi xưng "quý khách", lệch với các mẫu xưng "mình/bạn".
- **Chuyển động lặp lại.** `data-rv` xuất hiện 230 lần, cùng 0,9s, cùng đường cong. Mở bìa luôn tung pháo giấy, cuối trang luôn bắn pháo hoa. Ngoài màn bìa, thiệp không có cao trào nào.
- **Ảnh demo trùng nhau.** Thiệp Gấp, Khung Thêu và Cà Phê Phin dùng chung một poster. Ngay cả bên trong, ba mẫu này cũng gần như là bản sao.

**Mẫu mạnh:**
- **Tin Nhắn:** chính hình thức chat đã là bố cục.
- **Vé Máy Bay:** có đường bay chạy xuyên trang, và gộp nhiều mục thành một vật thể (`board`).
- **Cuộn Phim:** chi tiết phong phú nhất.

**Mẫu yếu:** Khung Thêu, Thiệp Gấp, Cà Phê Phin.

## 2. Các lỗi UX lớn khác

1. **Nút xác nhận tham dự bị chôn sâu.** Nó nằm ở mục thứ 8/11, khách phải cuộn khoảng 10–15 màn hình mới tới. Thiệp cũng không có nút xác nhận dính trên màn hình.
2. **Mở chậm trên 4G.** Thiệp chờ Apps Script tối đa 2,5 giây trong lúc màn hình vẫn đen (`content.js:51-58`). Album tải toàn bộ ảnh cùng lúc, ảnh hero không được tải trước.
3. **Lớp nút chung đè lên nội dung.** Nút nhạc và nút tim che mất các nút khác. Lời chúc bay ngang đè lên tiêu đề. Lớp hạt bay nằm trên cả nội dung (z-index 90).
4. **Chữ khó đọc.** Có 57 chỗ cỡ chữ 9–11px viết hoa, các dấu chồng của tiếng Việt dính vào nhau.
5. **Trang chủ trưng mẫu như danh mục skin.** Poster ngang bị cắt vào khung dọc, có bug `fit` ở `index.html:144`, và không có đoạn mở bìa động nào.
6. **Chưa có phễu tự phục vụ.** Cặp đôi phải chuyển khoản trước, rồi chờ người bán gửi link Studio có mã. Studio có 14 nhóm trường và tải lại toàn bộ khung xem trước sau mỗi lần sửa.
7. **Lỗi khả năng tiếp cận.** Ô nhập không có nhãn, phím Tab đi lọt ra sau màn bìa, và không có nút dừng hiệu ứng.

## 3. Ý tưởng mẫu mới: đổi cách đi qua thiệp, không chỉ đổi da

| # | Mẫu | Cách đi qua thiệp | Khoảnh khắc đáng nhớ | Hạng |
|---|---|---|---|---|
| 1 | **Sơn Mài** | Cảnh ghim: cuộn đến đâu lớp vỏ trứng, vàng lá, son lộ ra đến đó (shader WebGL) | Ảnh cưới thành tranh sơn mài; nghiêng máy thấy vàng lóe sáng trên ảnh | Điện ảnh |
| 2 | **Lịch Bloc** | Vuốt để xé từng tờ lịch, không cuộn | Chạm giữ "Tua tới ngày cưới": hàng trăm tờ lật phần phật rồi dừng đúng ngày, có âm lịch và giờ hoàng đạo | Nâng cao |
| 3 | **Lụa Áo Dài** | Camera 3D đi dọc hàng lụa treo trên sào tre, mỗi tấm lụa in một ảnh | Vén tà áo lụa (mô phỏng vải) để mở thiệp | Điện ảnh |
| 4 | **Xe Đạp Hoa** | Cuộn dọc thành đạp xe ngang qua phố Hà Nội, mỗi mùa hoa là một năm yêu nhau | Giỏ hoa bung thành bó cưới phủ kín màn hình | Nâng cao/Điện ảnh |
| 5 | **Tráp Ăn Hỏi** | Mâm xoay, mở từng tráp theo thứ tự tuỳ ý | Tự tay têm miếng trầu cánh phượng | Nâng cao |

**Dự bị:**
- **Rối Nước:** Chú Tễu gọi tên khách. Chi phí minh hoạ cao.
- **Hẻm Nhà Mình:** thu phóng liền mạch từ hình chữ S vào tận cửa nhà.

**Mẫu cũ nên làm lại thành hạng điện ảnh:** Cuộn Phim (chuyển sang cảnh toàn màn hình), Tin Nhắn (thêm câu trả lời nhanh kiểu chat), Vé Máy Bay.

**Nguyên tắc chung:**
- Thông tin bắt buộc (ngày, địa điểm, bản đồ, xác nhận, quà) phải nằm **bên trong** ẩn dụ của mẫu.
- Luôn có nút **"Thông tin nhanh"** làm lưới an toàn cho người lớn tuổi.
- Mỗi thiệp có 3–4 cao trào có chủ đích.

## 4. Engine v2

**Mẫu khai báo:**

```js
defineTheme({
  id, version, tier: 'basic' | 'premium' | 'cinematic',
  layout: 'scroll' | 'pager' | 'stage' | 'hub' | 'chat' | 'custom',
  scenes: [{ id, kind: 'gate'|'content'|'finale', provides: ['rsvp'], requires: [...],
             render(ctx) /* chạy được trên server */, mount(el, ctx),
             motion: { cinematic: () => import(...), standard: () => import(...), lite: 'css' },
             poster /* bản tĩnh bắt buộc khi có WebGL */ }],
  slots: { photos: { min: 1, ideal: 6, max: 30 }, texts: {...}, story: { optional: true } },
  features: { rsvp: 'required', map: 'required', gift: 'optional' },
  voice: 'than-mat' | 'trang-trong',
  chrome: { music, love: false, flyingWishes: 'subtitles' },
  palettes, fonts, libs: ['gsap', 'ScrollTrigger', 'three'], budget: { critical: '80kb' },
})
```

**Core cung cấp:**
- **Dữ liệu chuẩn hoá**, chia theo nhịp: who, when, where, respond, wish, give, remember.
- **Dịch vụ không gắn giao diện:** `ctx.bind.rsvp(formEl)` và các dịch vụ tương tự, để mẫu tự vẽ form (dạng vé, bong bóng chat, phiếu order…).
- **Bộ điều hướng theo `layout`.** Nếu mẫu thiếu tính năng bắt buộc, core tự chèn ngăn kéo "Thông tin & Xác nhận".
- **`tier.js`:** chia máy làm 3 hạng (WebGL2, `deviceMemory`, đo FPS ở màn bìa, `saveData`, reduced-motion). Thư viện nặng chỉ tải sau lúc hiện bìa, máy yếu tự hạ hạng.
- **`motion.js`:** `pin`/`scrub`, `splitReveal`, `maskReveal`, `scatter`, `typewriter`, `blurStagger`, `scrubVideo`. Tách chữ bằng `Intl.Segmenter` để không làm rời dấu tiếng Việt.
- **Module tương tác và đồ hoạ:**
  - `gesture.js`: xé, xoay có quán tính, gập, giữ.
  - `sensors.js`: cảm biến nghiêng, xin quyền iOS ngay trong cú chạm bìa.
  - `gl.js`: một canvas chung, DPR tối đa 1,5, xử lý mất ngữ cảnh.
  - `lunar.js`: âm lịch, can chi.
- **Bọc v1:** mẫu cũ chạy nguyên trạng như một cảnh `gate` cộng một cảnh `scroll`.

## 5. Kiến trúc đề xuất

**Next.js (App Router) + Supabase, tổ chức thành monorepo:**

```
apps/web          Next.js: trang chủ, đăng nhập, trình sửa, thanh toán, route /[slug], ảnh OG
packages/engine   Engine JS thuần (không React): dựng HTML trên server, gắn hành vi ở trình duyệt
packages/schema   Zod: nội dung thiệp + khai báo mẫu
packages/themes/* Mỗi mẫu một gói, build bằng Vite
supabase/         migrations, Edge Functions, kiểm tra RLS
legacy/           site tĩnh hiện tại, phục vụ qua rewrites.fallback cho tới khi chuyển xong
```

- **Trang thiệp không chạy React.** Route `/[slug]` trả HTML do engine dựng, có ISR và `revalidateTag` khi xuất bản. Ảnh OG có phiên bản, sinh bằng `next/og` với font tiếng Việt.
- **Các bảng Supabase:** `profiles`, `invites` (draft/content/version/tier), `invite_members`, `content_revisions`, `guests`, `rsvps` (+ view `rsvp_latest`), `wishes`, `invite_stats`, `media`, `plans`, `entitlements`, `orders`, `payment_events`, `slug_reservations`, `coupons`, `audit_log`.
- **RLS:**
  - Khách (anon) chỉ gọi RPC `get_public_invite`, `submit_rsvp`, `submit_wish`, `add_hearts`.
  - `entitlements` và thanh toán chỉ service role được ghi.
  - Ảnh lưu trên Storage theo đường dẫn `{invite_id}/…`.
- **Realtime:** tường lời chúc và check-in dùng broadcast từ trigger.
- **Luồng tự phục vụ:**
  1. Gõ tên ở trang chủ.
  2. Chọn mẫu.
  3. Tạo nháp ngay bằng đăng nhập ẩn danh.
  4. Đi qua trình hướng dẫn 5 bước.
  5. Sửa thẳng trên bản xem trước.
  6. Lấy link xem trước có watermark.
  7. Đăng nhập (email OTP hoặc Google).
  8. Thanh toán.
  9. Xuất bản, nhận bộ chia sẻ.
  10. Theo dõi khách.
- **Thanh toán:** PayOS hoặc SePay, đặt sau lớp `PaymentProvider`. Webhook có chữ ký và chống xử lý lặp. Cron đối chiếu 10 phút một lần. Có nút "đánh dấu đã trả" bằng tay.
- **Chuyển thiệp cũ:** bắc cầu Apps Script sang Supabase, chép dữ liệu có chống trùng, chuyển từng thiệp một. Cặp đôi nhận lại thiệp bằng mã HMAC cũ.

**Chi phí cố định:** khoảng 45 USD/tháng.
- Vercel Pro 20 USD: gói Hobby cấm dùng thương mại.
- Supabase Pro 25 USD: gói miễn phí tự tạm dừng sau 7 ngày không hoạt động.

## 6. Lộ trình (khoảng 10–13 tuần)

| Pha | Nội dung | Ước lượng |
|---|---|---|
| 0 | Chốt quyết định, dựng monorepo, Next + Supabase chạy local, `legacy/` fallback, đo mốc Lighthouse | 2–3 ngày |
| 1 | Engine v2 + **1 mẫu điện ảnh đầu tiên** có đủ 3 hạng máy, CI theo `budget` | 2–2,5 tuần |
| 2 | Supabase, đăng nhập, trình sửa bản đầu (trình hướng dẫn, form từ schema, tự lưu, tải ảnh) | 2 tuần |
| 3 | Dựng trang trên server, xuất bản, slug, ảnh OG, bộ chia sẻ | 1–1,5 tuần |
| 4 | Gói giá, quyền lợi, thanh toán, webhook, trang quản trị | 1,5 tuần |
| 5 | Xác nhận, lời chúc, tường lời chúc realtime, check-in trên Supabase | 1 tuần |
| 6 | Chuyển thiệp cũ | 1 tuần |
| 7 | Làm lại mẫu cũ hay nhất, thêm mẫu mới, mã giảm giá, MoMo/VNPay | liên tục |

### Pha 0: đã làm (23/11/2026, nhánh `redesign`)

- Monorepo npm workspaces: `apps/web` (Next.js 16, Tailwind, Be Vietnam Pro), `packages/engine` (`defineTheme` + 5 test), `legacy/` (site bản 1, giữ nguyên), `supabase/` (bật đăng nhập ẩn danh, liên kết tài khoản, khung Google OAuth).
- `rewrites.fallback`: mọi đường dẫn Next chưa có (trang chủ, thiệp cũ, `core/`, ảnh) rơi về legacy. Đã kiểm tra `/`, `/demo-cuon-phim/`, `/core/boot.js`, `/.env` (404).
- `legacy/scripts/serve.mjs`: máy chủ tĩnh giống Vercel (`trailingSlash`), thay `npx serve`.
- CI tách hai job: legacy (build + Playwright) và v2 (test engine + build Next).
- **Chưa làm:** `supabase start` vì Docker Desktop đang tắt; lược đồ dữ liệu để sang Pha 2.

**Số đo mốc bản 1** (`legacy/scripts/do-toc-do.mjs`, 4G chậm: RTT 150ms, 1,6 Mbps, CPU chậm 4 lần; trung vị 3 lần):

| Trang | FCP | LCP | Bìa bấm được | KB trước khi bìa sẵn sàng |
|---|---|---|---|---|
| `/` | 1.28s | 3.26s | - | 252 |
| `/demo-song-hy/` | 5.68s | 7.08s | 5.95s | 170 |
| `/demo-cuon-phim/` | 6.09s | 8.74s | 7.77s | 727 |
| `/demo-tin-nhan/` | 6.21s | 7.57s | 7.27s | 310 |
| `/demo-thu-tay/` | 3.89s | 6.41s | 6.86s | 272 |

Mục tiêu bản 2: bìa hiện dưới 1,5s, bấm được dưới 2,5s trên cùng điều kiện. Cuộn Phim bản 1 tải 727 KB trước khi bìa sẵn sàng.

**Việc rẻ, nên làm ngay:** *(đã làm ở Pha 0)*
- Thay 3 poster demo đang trùng nhau.
- Sửa bug `fit` ở `index.html:144`.
- Đổi lời văn "quý khách" trong core cho khớp giọng của từng mẫu.

## 7. Câu hỏi còn mở

1. Bán dưới pháp nhân nào (cá nhân, hộ kinh doanh hay công ty)? Câu này quyết định dùng PayOS hay SePay, và có xuất hoá đơn không.
2. Gói miễn phí cho làm tới đâu? Chính sách hoàn tiền thế nào?
3. Đăng nhập bằng email OTP và Google có đủ không, hay cần Zalo hoặc số điện thoại?
4. Giá từng gói là bao nhiêu, mẫu nào thuộc hạng nào?
5. Ảnh lưu trên Supabase Storage hay Cloudflare R2? Ảnh giữ bao lâu sau khi thiệp hết hạn?
6. Hosting dùng Vercel Pro hay Cloudflare?
7. Có cần môi trường thử riêng thay vì đẩy thẳng lên `main` không?
8. Có tính đa người bán hoặc đa ngôn ngữ trong 12 tháng tới không?
9. Tuân thủ Nghị định 13/2023 về dữ liệu cá nhân: cần điều khoản, chính sách quyền riêng tư và sao lưu.
