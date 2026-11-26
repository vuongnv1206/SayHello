# Brainstorm đợt 2: thoát khỏi khuôn mẫu (24/11/2026)

**Phản hồi của chủ dự án:** các ý tưởng đợt 1 chỉ đổi chủ đề, còn bố cục và cách thiết kế vẫn chung một khuôn, "nhìn là biết".

Đợt 2 có 3 subagent:
- chẩn đoán khuôn mẫu và đề xuất 6 ngôn ngữ hình ảnh;
- nghiên cứu kỹ thuật 3D/WebGL;
- 8 ý tưởng lấy bố cục và cách chạm làm gốc.

Bảng kiểm rút ra từ đợt này nằm ở [KHONG-KHUON-MAU.md](KHONG-KHUON-MAU.md). Bản mẫu chạy được đặt ở `legacy/proto/`, xem tại `/proto/<tên>.html`.

## Sáu ngôn ngữ hình ảnh (không phải sáu chủ đề)

| Hướng | Cốt lõi | Động từ chuyển động | Rủi ro máy yếu |
|---|---|---|---|
| **Sa Bàn** (3D) | Khu phố thu nhỏ có tilt-shift, cuộn đưa camera qua 5 trạm. Mỗi khách xác nhận thì một ô cửa sáng đèn. | dolly | Cao, cần bản video tua theo cuộn |
| **Chữ Là Hình** | Áp phích in riso hai mực, chữ chiếm 60–90% diện tích và tràn mép, ảnh thành halftone. Xác nhận bằng chữ "CÓ"/"TIẾC" khổng lồ. | in đè | Thấp |
| **Toàn Khung** | Ảnh phủ kín màn hình kiểu Stories, giao diện chỉ là chú thích tạp chí, màu lấy từ ảnh. | chớp flash, cắt cứng | Trung bình (dung lượng ảnh) |
| **Mặt Bàn** | Nhìn từ trên xuống mặt bàn đầy đồ thật (ảnh chụp), kéo, ném, lật được. Xác nhận bằng cách ký phiếu hồi âm. | ném, lật | Trung bình (cần chụp đạo cụ) |
| **Gạch Bông Sinh Hoạ** | Hoa văn sinh ra từ tên và ngày, mỗi khách một biến thể. Ảnh thành ảnh khảm gạch. | lật gạch | Thấp đến trung bình |
| **Đồ Chơi Giao Diện** | Thiệp là đồ chơi điện tử: núm xoay ngày, công tắc xác nhận, máy in nhiệt in ra ảnh. | bật công tắc | Thấp |

## Tám ý tưởng lấy bố cục làm gốc

| Ý tưởng | Cách chạm cốt lõi | Độc đáo / Khả thi / Dễ bán |
|---|---|---|
| **Hai Bờ** | Màn chia đôi: nhà trai đi lên, nhà gái đi xuống, hội tụ ở năm quen nhau. Kéo vạch về phía bên mình dự. | 4 / 4 / 5 |
| **Tờ Giấy Gấp** | Một tờ giấy gấp kiểu bản đồ, mở từng nếp. Gấp góc nghĩa là "có". | 4 / 3 / 4 |
| **Chữ Dọn Nhà** | Một nhóm chữ khổ lớn liên tục xếp lại thành tên, ngày, địa chỉ (GSAP Flip). | 4 / 3 / 3 |
| **Hai Vòng Lịch** | Mặt số có vòng dương và vòng âm, xoay tới khi khớp ngày cưới. Xác nhận như khoá số. | 5 / 3 / 4 |
| **Hạt Chữ** | Zoom vô hạn vào chữ lồng dệt từ hàng nghìn chữ nhỏ. | 5 / 2 / 2 |
| **Bản Đồ Xóm** | Chấm mang tên khách tự dắt mình qua xóm, bước vào cổng tiệc là xác nhận. | 3 / 3 / 4 |
| **Sợi Chỉ** | Một đường chỉ liền viết tên, uốn thành ngày, khâu qua các lễ. Thắt nút là xác nhận (không có cử chỉ cắt chỉ). | 4 / 4 / 4 |
| **Nhóm Ba Người** | Nhắn tin ba người có rẽ nhánh. Xưng hô đúng vai từng khách (`?ho=chú&xung=cháu`). | 3 / 5 / 5 |

Phát hiện có giá trị dùng chung cho mọi mẫu:
- **Cặp xưng hô theo từng khách** (chú/cháu, anh/em…).
- **Lịch âm làm cơ chế chính**, không chỉ là một dòng ghi chú.
- **Hai họ chia đôi**: bố mẹ hai bên, hai tài khoản mừng cưới. Đây là dữ liệu thật của đám cưới Việt, không phải trang trí.

## Kỹ thuật 3D chạy được trên điện thoại (đánh giá cho WebView của Zalo trên Android tầm trung)

**Mức A (từ 50fps):**
- hé lộ ảnh bằng shader nhiễu (noise dissolve);
- méo ảnh theo vận tốc cuộn kèm hạt phim;
- dải ảnh cong vô tận;
- lật trang 3D;
- phong bì 3D;
- hạt tụ thành tên;
- gợn nước theo ngón tay (flowmap);
- chuyển cảnh bằng displacement;
- chữ SDF uốn cong (troika-three-text, hỗ trợ dấu tiếng Việt);
- cánh hoa instancing;
- ảnh 2.5D có chiều sâu (depth map tạo trên máy chủ);
- giọt nhầy (gooey);
- chuyển cảnh kiểu "đường nối" (Codrops SeamTransitions, chạy bằng ES module thuần).

**Mức B (phải giảm thông số):**
- camera bay qua hơn 20 ảnh;
- mực loang (fluid sim);
- ảnh tan thành hạt;
- vải lụa Verlet;
- chuỗi khung hình kiểu Apple.

**Không dùng:** kính khúc xạ thật, bóng đổ thời gian thực, DOF/bloom nhiều pass, GPGPU particle, thế giới vật lý kiểu Bruno Simon.

**Quy tắc hiệu năng:**
- Dùng một canvas cố định toàn màn hình, cuộn native để lấy tiến trình. Tránh ghim DOM dài bằng ScrollTrigger.
- DPR tối đa 1,5 (máy yếu dùng 1). Texture ≤ 1024px, giải mã bằng `createImageBitmap`, mỗi khung hình upload tối đa một texture.
- Biên dịch shader trong lúc bìa đang hiện.
- Khi `webglcontextlost`: chuyển về bản DOM có sẵn trong HTML.
- Chỉ render khi có thay đổi. Dừng hẳn khi tab bị ẩn.
- Có HUD `?debug=1` để đo trong Zalo, vì bản Zalo phát hành không debug được bằng `chrome://inspect`.
- Thư viện: OGL (~29KB) là nền; three.js chỉ khi cần chữ SDF uốn cong hoặc GLTF.

**Ba công thức cho mẫu cao cấp:**
- **Tơ Hồng:** camera bay theo dải lụa đỏ, ảnh treo hai bên, hạt tụ thành tên, kết bằng nút thắt.
- **Sổ Cưới:** phong bì 3D, album lật trang bằng tay, ảnh 2.5D, cánh hoa ép.
- **Mực Tàu:** quẹt tay để mực loang hé ảnh, tên viết bằng hạt mực, dấu triện "Hỷ".

## Bản mẫu đang dựng

| Bản mẫu | Đường dẫn | Kiểu chạm |
|---|---|---|
| Chữ Là Hình | `/proto/chu-la-hinh.html` | Lật áp phích (chạm, vuốt) |
| Hai Bờ | `/proto/hai-bo.html` | Cuộn điều khiển hai dòng thời gian ngược chiều |
| Tơ Hồng (3D) | `/proto/to-hong.html` | Cuộn điều khiển camera WebGL |
| Hai Vòng Lịch | `/proto/hai-vong-lich.html` | Xoay mặt số |
