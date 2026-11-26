# Ý tưởng 3D: Hồ Gương và Bầu Trời Ảnh (24/11/2026)

## Bối cảnh

Hai bản nháp đầu của agy đều không đạt:
- **Hồ Gương:** cột thẻ bo góc giữa màn hình, nền tối viền vàng, nút viên thuốc, đếm ngược 4 ô. Cảnh 3D chỉ là hình nền.
- **Bầu Trời Ảnh:** quá nặng, treo trình duyệt.

Claude cho hai subagent thiết kế lại từ đầu. Yêu cầu: khác hẳn Phòng Triển Lãm về ẩn dụ không gian, ngôn ngữ camera, động từ chuyển động, tương tác và bảng màu. Claude viết code, agy góp ý vào file này.

Hạ tầng dùng chung cho cả ba mẫu 3D nằm ở `packages/engine/src/client/stage3d.js`. Module này lo các việc dễ sai:
- nạp thư viện có hẹn giờ;
- từ chối GPU phần mềm;
- vòng đời, tải ảnh lên GPU từng tấm một;
- hậu kỳ an toàn cho ảnh;
- chữ đặt trong không gian 3D (CSS3D);
- tự hạ mức khi FPS thấp.

## Hồ Gương: "Vớt"

**Ẩn dụ:** khách nhìn từ trên thuyền xuống mặt hồ lặng. Ảnh nằm dưới nước, khách vớt từng tấm lên.

**Camera:** nhìn từ trên xuống và trôi theo đường cong. Khi nhìn dốc, khách thấy xuyên vào nước; khi nhìn sát mặt nước, mặt nước thành gương.

**Ảnh nào cũng hợp:**
- Dưới nước, mọi ảnh cùng một sắc nước, nên bộ ảnh lẫn lộn màu vẫn trông thống nhất.
- Vớt lên rồi, ảnh giữ nguyên màu gốc và có bóng phản chiếu bên dưới, không cần khung.

**Thứ tự điểm dừng:**
1. Mặt nước có tên hai người.
2. Ảnh chính.
3. Cọc đo nước: ngày cưới khắc thành vạch trên cọc; mực nước dâng dần thay cho đồng hồ đếm ngược.
4. Ảnh.
5. Bến gỗ: tấm biển ghi giờ lễ, link chỉ đường.
6. Ảnh.
7. Thả hoa đăng (giữ chỗ).
8. Bờ xa có đèn của các khách trước.
9. Kết.

**Khoảnh khắc "wow" do tay khách gây ra:**
- Chạm mặt nước: gợn sóng làm tan bóng tên.
- Giữ để vớt ảnh (khách dừng lâu thì ảnh tự lên).
- Vẽ lên nước bằng ngón tay.
- Thả hoa đăng khi giữ chỗ.
- Giữ để mặt nước lặng thành gương (kết).

**Bảng màu mặc định "Sương sớm":**

| Vai trò | Mã màu |
|---|---|
| Sương | `#d6dcd8` |
| Nước xám ngọc | `#5d7673` |
| Nước sâu | `#1c2a2b` |
| Mực | `#132020` |
| Đèn son | `#e2522b` |
| Tre | `#9a8a63` |

Hai biến thể: "Mưa bóng mây" và "Đêm trăng" (ánh bạc, không vàng).

**Chữ:** Bricolage Grotesque cho tên và ngày, Be Vietnam Pro cho nội dung.

**Tránh:** hoàng hôn cam, vàng, hoa sen clip-art.

## Bầu Trời Ảnh: "Hái sao"

**Ẩn dụ:** khách nằm giữa đồng lúc chạng vạng ngắm trời. Camera không di chuyển, chỉ xoay như cái đầu, bằng con quay hoặc kéo tay. Đường chân trời là dãy đồi tạo từ tên hai người, nên bầu trời có chỗ neo, không giống hình nền vũ trụ.

**Ảnh nào cũng hợp:**
- Mỗi ảnh bắt đầu là một ngôi sao mang màu trung bình của chính ảnh đó, nên bộ ảnh nào cũng tạo ra bầu trời màu riêng.
- Ảnh giữ nguyên tỉ lệ, như phim dương bản được chiếu sáng từ sau.

**Cách đi:**
- Xoay đầu: con quay hoặc kéo tay.
- Cuộn trang điều khiển thời gian, từ chạng vạng tới đêm khuya, không làm trang trôi.
- Dải la bàn dưới đáy màn hình có vạch cho từng ảnh và từng thông tin, chạm vào là xoay tới. Đây cũng là đường đi cho bàn phím và trình đọc màn hình.

**Thông tin theo hướng:**

| Hướng | Nội dung |
|---|---|
| Bắc | Tên, trăng đúng pha ngày cưới, ngày dương và âm |
| Đông | Địa điểm |
| Nam | Giữ chỗ |
| Tây | Quà mừng |
| Đỉnh đầu | Sổ lưu bút, mỗi khách là một ngôi sao |

**Khoảnh khắc "wow":**
- Ngước lên: các ngôi sao sáng dần.
- Nhìn vào một ngôi sao: sao nở thành ảnh, và đường mắt khách nhìn vẽ nên chòm sao.
- Chạm: hái ảnh xuống tay; vuốt để xem ảnh khác, hất lên để trả lại trời.
- Cuộn để kéo đêm xuống.
- Giữ mặt trăng: mọi ảnh bay về ghép thành chữ cái đầu tên hai người.
- Giữ chỗ: một con đom đóm bay lên thành ngôi sao mang tên khách.

**Bảng màu mặc định "Giờ Xanh":**

| Vai trò | Mã màu |
|---|---|
| Đỉnh trời (mực xăng dầu) | `#142A3B` |
| Sương chân trời | `#6F9AA6` |
| Dải ráng chiều (men ngọc) | `#C9D4B8` |
| Đồi | `#0B1512` |
| Điểm nhấn: nét chòm sao, đom đóm, sao của khách | `#D8F26B` |
| Chữ | `#EEF2EC` |

**Chữ:** Fraunces (nét đứng, không nghiêng) cho tên, Be Vietnam Pro cho nội dung.

**Giới hạn hiệu năng:** tối đa 40 lần vẽ mỗi khung hình. Bầu trời tô bằng dải màu chuyển và một ảnh mây làm sẵn, không tính toán phức tạp cho từng điểm ảnh.

## Thảo luận

> Agy góp ý bên dưới, ghi tên và ngày.
