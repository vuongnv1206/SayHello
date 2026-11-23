# Brief thiệp 3D: ảnh là nhân vật chính

Đây là tài liệu thảo luận chung giữa chủ dự án, Claude (Claude Code) và agy. Mỗi bên ghi ý kiến vào mục **Thảo luận** ở cuối file, ghi tên mình và ngày.

## 1. Nhận xét của chủ dự án (24/11/2026)

Chủ dự án đã xem 4 bản mẫu trong `legacy/proto/`:

- **Tơ Hồng** (`to-hong.html`, camera 3D bay theo sợi chỉ đỏ): "tạm được". Ý tưởng tốt, 3D hay, nhưng **chưa đủ đặc sắc**.
- **Chữ Là Hình, Hai Bờ, Hai Vòng Lịch:** quá tệ, bỏ.

Tơ Hồng còn thiếu bốn điều:

1. **Chất lượng hình ảnh:** ánh sáng, chất liệu và chiều sâu chưa ra cảm giác điện ảnh. Màu sắc và bố cục còn non nớt.
2. **Khoảnh khắc "wow":** chưa có, và trải nghiệm quá ngắn.
3. **Tương tác:** quá ít, khách chủ yếu chỉ cuộn.
4. **Câu chuyện:** không phải cặp đôi nào cũng có câu chuyện để kể. Thứ họ có chủ yếu là ảnh. Chủ đề chỉ nên đóng vai trò không khí, để thu hút người mua. Câu chuyện là của cặp đôi, không theo khuôn mình vẽ sẵn.

## 2. Nguyên tắc mới

1. **Ảnh là nội dung chính.** Thiệp phải đẹp khi cặp đôi chỉ có 6–30 tấm ảnh cưới và vài dòng thông tin. Chuyện tình là phần không bắt buộc.
2. **Chủ đề chỉ là không khí.** Mỗi chủ đề là một bộ thông số (preset):
   - ánh sáng, môi trường, chất liệu;
   - hạt và hiệu ứng khí quyển;
   - bảng màu và chỉnh màu (color grade);
   - nhạc;
   - đường đi của camera.

   Cùng một bộ ảnh đặt vào chủ đề khác sẽ cho cảm giác khác hẳn.
3. **Chất lượng hình ảnh đạt mức trang web đoạt giải, không phải mức "demo WebGL":**
   - ánh sáng có chủ đích, chất liệu PBR, ánh sáng môi trường HDR;
   - tone mapping ACES và chỉnh màu;
   - hạt phim, quầng sáng nhẹ (bloom), chiều sâu giả (fog, DOF giả).
4. **Dài và có nhịp.** Trải nghiệm kéo dài 2–4 phút nếu khách muốn khám phá, có 4–6 khoảnh khắc "wow". Khách vội vẫn xem được thông tin chính sau 10 giây qua nút "Thông tin nhanh".
5. **Tay khách luôn có việc để làm.** Khách kéo, xoay, nghiêng máy, chạm giữ, vuốt, thổi vào mic (tuỳ chọn). Mỗi khoảnh khắc "wow" đều do khách tự gây ra.
6. **Thông tin bắt buộc nằm trong không gian 3D**, không phải các mục chữ dán lên: tên, ngày, địa điểm, xác nhận tham dự, mừng cưới. Vẫn luôn có bản DOM dự phòng.

## 3. Kiến trúc đề xuất: "sân khấu ảnh" dùng chung, chủ đề là preset

```
Ảnh của cặp đôi (1–30)  ──►  Sân khấu ảnh 3D (engine)  ◄──  Preset chủ đề
  + tên, ngày, lễ, QR          các "cảnh" dựng sẵn             ánh sáng, môi trường, chất liệu,
                               (gallery, bầu trời ảnh,         hạt, màu, nhạc, camera
                                hồ gương, ...)
```

Máy chủ chuẩn bị ảnh khi cặp đôi tải lên:
- 2 cỡ (1024 và 2048px);
- ảnh mờ làm ảnh giữ chỗ;
- **depth map** để ảnh có chiều sâu 2.5D;
- vị trí khuôn mặt để tự cắt ảnh cho đẹp;
- màu chủ đạo để preset tự hoà màu với ảnh.

## 4. Ba cảnh trải nghiệm lấy ảnh làm gốc (để thảo luận)

### A. Phòng Triển Lãm Đêm

Phòng tranh riêng của hai người. Camera đi qua hành lang. Mỗi ảnh treo trong khung, có đèn rọi và bóng đổ mềm trên tường.

Các khoảnh khắc "wow":
- Khách chạm vào một bức ảnh thì **bước vào trong ảnh**: ảnh thành không gian 2.5D, nghiêng máy là thấy chiều sâu.
- Phòng cuối có **bức tường ảnh** ghép từ toàn bộ ảnh, và tự xếp thành tên hai người.
- Mỗi khách xác nhận thì **thêm một ngọn đèn** trong phòng.

Thông tin nằm trên bảng ghi chú cạnh tranh (giống bảo tàng), và trên tấm thiệp mời đặt trên bục ở sảnh.

### B. Bầu Trời Ảnh

Ảnh bay lơ lửng thành một chòm sao xung quanh khách. Khách nghiêng điện thoại để nhìn quanh. Chạm một ảnh thì camera bay tới.

Các khoảnh khắc "wow":
- Cuối hành trình, các ảnh **hút vào nhau thành hình trái tim hoặc chữ cái tên**.
- Khi xác nhận tham dự, khách **thả một ngôi sao** mang tên mình lên trời, và khách sau sẽ thấy ngôi sao đó.

Chủ đề có thể là đêm sao, hoàng hôn biển, hoặc mưa hoa anh đào.

### C. Hồ Gương

Ảnh trôi trên mặt nước phản chiếu lúc hoàng hôn. Ngón tay chạm nước làm gợn sóng thật.

Các khoảnh khắc "wow":
- Ảnh **nổi lên từ dưới nước**.
- Đèn hoa đăng xác nhận tham dự trôi đi xa dần.
- Mặt nước phản chiếu tên hai người.

**Tơ Hồng** vẫn giữ được: nó thành một *preset camera* (đi theo sợi chỉ đỏ) dùng được cho các cảnh trên, thay vì là một câu chuyện cố định.

## 5. Kỹ thuật chính

Xem thêm `docs/Y-TUONG-DOT-2.md`, mục kỹ thuật 3D.

- **Nền tảng:** Three.js r170, một canvas cố định, cuộn native điều khiển tiến trình. Tương tác chạm dùng pointer events cộng quán tính.
- **Chất lượng:** PBR + `RoomEnvironment`/HDR nhỏ, tone mapping ACES, một pass hậu kỳ gộp (bloom nhẹ, grain, vignette, color LUT) ở nửa độ phân giải.
- **Ảnh 2.5D:** depth map tạo trên máy chủ (Depth Anything), shader parallax theo con quay.
- **Hiệu năng:** đo FPS lúc tải, chia 3 mức chất lượng, DPR tối đa 1,5, texture tối đa 1024px, xử lý mất ngữ cảnh WebGL. Mức `lite` là bản DOM đẹp.
- **Màn chờ tải** là một phần của trải nghiệm (chủ dự án đã chấp nhận hiệu ứng nặng). Mục tiêu: khách thấy hình trong 2s, cảnh 3D đầy đủ trong 3–5s.

## 6. Câu hỏi mở

1. Chọn cảnh nào (A, B hay C) để làm bản mẫu chất lượng cao trước? Hay đề xuất cảnh khác?
2. Những trang 3D nào là chuẩn mực để so sánh (link cụ thể)?
3. Có nên dùng mô hình 3D thật (GLB: khung tranh, phòng, đèn) mua hoặc tự dựng, hay chỉ dùng hình khối dựng bằng code?
4. Nhạc: mỗi preset một bản nhạc riêng, nguồn nhạc lấy từ đâu (bản quyền)?
5. Agy và Claude chia việc thế nào? Ví dụ: một bên dựng engine sân khấu ảnh cùng preset đầu tiên, bên kia dựng cảnh thứ hai trên cùng engine. Hai bên thống nhất giao diện (API) của preset trong file này.

## Thảo luận

> Mỗi bên ghi thêm ý kiến bên dưới, kèm tên và ngày. Không xoá ý kiến của bên khác.

**Claude, 24/11/2026:** Tôi đề xuất làm **cảnh A (Phòng Triển Lãm Đêm)** trước, vì ba lý do:
- Nó tôn ảnh lên nhiều nhất: ảnh được treo, có đèn rọi, có khung.
- Cảnh này hợp với cả cặp đôi chỉ có 6 tấm ảnh lẫn cặp có 30 tấm, vì hành lang dài ngắn theo số ảnh.
- Nó có nhiều chỗ để tương tác: bước vào trong ảnh, bức tường ảnh, thắp đèn.

Song song, nên thống nhất ngay định dạng preset (JSON) để hai bên dựng cảnh độc lập với nhau.
