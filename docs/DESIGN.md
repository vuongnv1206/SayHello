# Thiết kế · SayHello

Nguyên tắc chung (rút từ skill *frontend-design* của Anthropic): mỗi mẫu có **một ý tưởng trung tâm**, màn mở bìa là khoảnh khắc đáng nhớ nhất, chữ có cá tính và **bắt buộc hỗ trợ tiếng Việt**, bảng màu có chủ đích, nền có chiều sâu, chuyển động có nhịp, điện thoại trước tiên. Chi tiết: [TAO-MAU-MOI.md](TAO-MAU-MOI.md#1-nguyên-tắc-thiết-kế).

## Biến màu dùng chung

Mỗi mẫu khai báo các biến này trên `:root` để phần dùng chung (`core/base.css`: nút, form, hộp quà, hộp cảm ơn) tự ăn theo:

| Biến | Ý nghĩa |
|---|---|
| `--c-bg` | Nền ngoài thiệp |
| `--c-paper` | Nền thiệp |
| `--c-ink` | Chữ chính |
| `--c-accent` / `--c-accent-ink` | Nút chính và chữ trên nút |
| `--c-soft` | Đường kẻ, viền nhạt |

`core/base.css` dùng `:where()` nên độ ưu tiên bằng 0: mẫu viết đè thoải mái, không cần `!important`.

## Các mẫu

### Song Hỷ: truyền thống
- **Ý tưởng:** cửa son mở hai cánh, đèn lồng, chữ Hỷ vàng kim, pháo hoa.
- **Màu:** đỏ son `#a4161a`, đỏ thẫm `#6a040f`, vàng kim `#e6c27a`, kem `#fff8ef`, mực nâu `#4a2a22`.
- **Chữ:** VL Bodega Script (tên, file riêng), Dancing Script, Playfair Display, Be Vietnam Pro.

### Thư Tay: hiện đại, lãng mạn
- **Ý tưởng:** lá thư trong phong bì: bóc dấu sáp, chữ hiện như đang viết, ảnh là con tem, ngày cưới dưới lớp nhũ cào, sự kiện là vé xé cuống, polaroid kéo ném, thư hồi âm.
- **Màu:** giấy dó `#f4ede1`, mực xanh than `#1f2a44`, sáp đỏ `#8e1b2c`, hồng phấn `#c98b8b`, vàng đồng `#b08d57`, bàn gỗ `#2b221d`. Nền có vân giấy (SVG noise).
- **Chữ:** Cormorant Garamond (tiêu đề), Ephesis (viết tay), Lora (nội dung).

### Vé Máy Bay: trẻ trung
- **Ý tưởng:** thẻ lên máy bay: xé cuống vé để mở, máy bay bay theo đường cuộn, bảng giờ bay lật chữ, hộ chiếu đóng dấu visa, ảnh qua ô cửa sổ, check-in, vali mừng cưới, hạ cánh.
- **Màu:** trời bình minh `#fbe3d0 → #8ecae6 → #4a6fa5`, giấy vé `#fffaf0`, xanh hải quân `#14213d`, cam san hô `#e76f51`, hổ phách `#f4a261`, bạc hà `#2a9d8f`.
- **Chữ:** Big Shoulders Display (biển báo sân bay), Fraunces nghiêng (cảm xúc), JetBrains Mono (dữ liệu vé).

### Khóa Tình: lãng mạn
- **Ý tưởng:** ổ khóa tình yêu trên cầu đêm: khách xoay 4 vòng số đúng ngày cưới (ngày·tháng) để mở, có nút "Mở giúp tôi" tự xoay. Mặt dây chuyền đung đưa, chùm chìa khóa kỷ niệm, thẻ kim loại khắc lịch lễ, ảnh treo lan can cầu, lời chúc thành ổ khóa, hộp nhẫn, cuối thiệp ném chìa xuống sông.
- **Màu:** đêm `#0b1822`, sông `#13354a`, đồng thau `#c9a227`, vàng hồng `#d8a48f`, đèn đường `#ffcf8a`, kem `#f7efe3`, ruy băng đỏ `#b23a48`.
- **Chữ:** Alex Brush (tên), Spectral (nội dung, tiêu đề nghiêng), Be Vietnam Pro (chữ nhỏ).

### Đèn Lồng: hoài cổ
- **Ý tưởng:** đêm rằm phố Hội An: khách chạm hoa đăng để thắp nến và thả xuống sông thì thiệp mở. Dây đèn lồng sáng dần khi cuộn tới, cổng trăng ôm ảnh trên tường vàng, đôi đèn lồng lụa ôm ảnh cô dâu chú rể, dãy nhà phố kể chuyện tình, biển gỗ ghi lịch lễ, đèn lồng đếm ngược, cửa chớp gỗ tự mở ra album, lời chúc thành hoa đăng trôi trên sông, phong bao lì xì, cuối thiệp thả đèn trời.
- **Màu:** đêm `#0f1a2b`, tường vàng `#f2c14e`, ngói `#8c2f1b`, gỗ `#4a2c1a`, cửa chớp xanh rêu `#2f6f5e`, đỏ đèn lồng `#c1121f`, cam `#f77f00`, vàng nến `#fcbf49`, hoa giấy `#e75480`, kem `#fdf3dc`.
- **Chữ:** Dancing Script (tên), Noto Serif Display nghiêng (tiêu đề, nội dung), Be Vietnam Pro (chữ nhỏ).

### Cuộn Phim: điện ảnh
- **Ý tưởng:** thiệp là một suất chiếu đặc biệt. Bìa là phòng chiếu tối: khách kéo cần máy chiếu, đèn chiếu bật, cuộn phim quay (có tiếng lạch cạch tự tạo bằng Web Audio), màn ảnh đếm 3-2-1 rồi thiệp mở. Bên trong: biển đèn rạp, rèm nhung mở ra ảnh cưới, câu mở đầu hiện như phụ đề, diễn viên chính trong khung phim, gia đình là "nhà sản xuất", mỗi kỷ niệm là một cảnh phim có bảng clapper đập khi cuộn tới, lịch lễ là vé xem phim, đếm ngược kiểu vòng đầu phim, album là dải phim 35mm vuốt ngang (chạm có tiếng tạch và chớp flash), sơ đồ ghế đôi giữ chỗ, lời chúc thành phụ đề, hộp bắp rang mừng cưới, cuối thiệp là danh đề chạy chữ (có tên khách mời).
- **Màu:** rạp tối `#15120f`, phim `#0d0b0a`, nhung đỏ `#7d1a1d`/`#a8262b`, hổ phách `#e8a33d`, phụ đề vàng `#ffe27a`, màn ảnh `#f5efe3`, vé giấy `#f3eadb`.
- **Chữ:** Big Shoulders Display (biển rạp, tiêu đề), Playfair Display nghiêng (tên), Space Mono (mã phim, nhãn nhỏ), Be Vietnam Pro (nội dung).

### Tin Nhắn: hiện đại
- **Ý tưởng:** thiệp là một nhóm chat. Bìa là màn hình khóa điện thoại (giờ thật của máy khách, ảnh cưới làm nền mờ) có thông báo "Gửi {khách}: Bạn có một lời mời đám cưới"; chạm thông báo thì nghe tiếng "ting" (tự tạo bằng Web Audio) và vào nhóm chat. Tin nhắn hiện lần lượt khi cuộn tới, trước mỗi tin là dấu "đang soạn tin" ngay tại chỗ (không làm trang giật). Nội dung: báo tin kèm ảnh và thẻ thiệp mời, danh thiếp hai người, bố mẹ gửi lời chào, tin nhắn cũ theo năm, thẻ lịch hẹn cho từng lễ, tin ghim đếm ngược, ảnh đã gửi (lưới ảnh, "+N"), chia sẻ vị trí, khách trả lời xác nhận và lời chúc trong bong bóng của mình, bao lì xì, cuối cùng là nhãn dán trái tim và "Đã xem".
- **Giao diện riêng**, không giống ứng dụng chat nào: nền kem chấm bi nhạt, bong bóng trắng (chú rể), hồng phấn (cô dâu), san hô (khách).
- **Màu:** nền `#f6efe6`, trắng ấm `#fffdfb`, hồng phấn `#fde6dc`, san hô `#e0644f`, xanh mòng két `#2f7d6d`, chữ `#2d2420`.
- **Chữ:** Fraunces (tên, tiêu đề), Be Vietnam Pro (tin nhắn).

## Trang bán hàng (trang chủ, đặt thiệp)
- Nền tối ấm `#14110f`, chữ kem `#f4ede1`, nhấn vàng đồng `#d9a86c`, đỏ rượu mờ làm ánh sáng nền.
- Chữ: Cormorant Garamond (tiêu đề), Be Vietnam Pro (nội dung).

## Studio (công cụ cho cặp đôi)
- Sáng, gọn, dễ đọc: nền `#f6f2ec`, bảng `#fffdf9`, chữ `#26211d`, nhấn đỏ rượu `#8e1b2c`.
- Chữ: Be Vietnam Pro. Nhóm thu gọn được (`details`), xem trước trong khung điện thoại / máy tính bảng / máy tính.

## Thành phần dùng chung (`core/widgets.js`)

| Thành phần | Mẫu tự trang trí bằng |
|---|---|
| Đếm ngược `.cd` | ô `.u`, số `b`, nhãn `span` |
| Lịch tháng `.cal` | ngày cưới `.on` |
| Album / polaroid | khung ảnh, độ nghiêng |
| Bản đồ `.map` + tab địa điểm | viền, nút |
| Xác nhận `form[data-w=rsvp]`, lưu bút `form[data-w=guestbook]` | `.choice span`, ô nhập, `.wish-item` |
| Hộp quà `.giftbox` | phần ruột tự vẽ (vd. vali, phong bì) |
| Lớp cào `scratch` | màu nhũ, chữ |
| Nhạc `.music`, thả tim `.love`, lời chúc bay `.fly-item`, hộp cảm ơn `.cheers-card` | màu, bóng |

## Hiệu ứng

- Gắn bằng thuộc tính: `data-rv` (hiện dần: up/left/right/zoom/flip/blur/drop), `data-type` (gõ chữ), `data-tilt`, `data-parallax`, `data-zoom` (xem ảnh lớn), `data-fireworks`.
- Hạt bay (canvas): `petals`, `sparkles`, `snow`, `hearts`, `leaves`, `bokeh`. Pháo giấy, pháo hoa.
- Luôn tôn trọng `prefers-reduced-motion`.
