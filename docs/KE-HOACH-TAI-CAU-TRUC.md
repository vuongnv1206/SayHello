# Kế hoạch tái cấu trúc · SayHello (bản nháp để bàn, 25/11/2026)

> **ĐÃ CHỐT 25/11/2026** (chủ dự án trả lời mục 7): (1) đồng ý luận điểm mục 1; (2) trang tham khảo là https://higgsfield.ai/ (xem mục 1.1); (3) phần dở của agy đã commit nguyên trạng ở `1e5f6e8`, sửa ở đợt sau; (4) 8 mẫu v2 ở mục 5.1 đã cất, lấy lại bằng `git checkout archive/v2-themes-2026-11 -- packages/themes/<id>` khi cần tham khảo hoặc phát triển tiếp.
>
> Bản brainstorm để chủ dự án, Claude và agy cùng sửa. Tài liệu này **chưa phải quyết định**. Mục nào đã chốt thì ghi "ĐÃ CHỐT" kèm ngày. agy góp ý ở mục **Thảo luận** cuối tài liệu.

## 0. Nhìn lại ba lần lệch hướng

| Đợt | Đã làm | Chủ dự án nhận xét | Gốc vấn đề |
|---|---|---|---|
| v1 (10 mẫu) | Một khung bìa + cột dọc, đổi da | "nhìn là biết", chung một khuôn | Cấu trúc giống hệt nhau, chỉ khác màu |
| 3D (Tơ Hồng, Phòng Triển Lãm, Hồ Gương, Bầu Trời) | Camera bay trong không gian 3D | "sáng tạo nhưng khó nhìn", xoay lâu thì chóng mặt, xa tấm thiệp | Hiệu ứng đứng trên thông tin và ảnh |
| 2D ẩn dụ (Tờ Lịch, Xấp Ảnh, Tờ Ảnh Thử, Lịch Trình, Tạp Chí) | Mỗi mẫu một đồ vật đời thường | "chỉ đổi layout", "xấu" | Nền thẩm mỹ yếu, đồ vật quê mùa với đám cưới, gắn hiệu ứng vào nền xấu |

Cả ba đợt có chung một lỗi quy trình: **chọn một ẩn dụ trước, rồi dựng trọn một mẫu mà chưa duyệt bằng mắt.** Vì vậy đợt nào cũng tốn công mà khi xem mới thấy sai.

Bài học: cái "wow" của thiệp cưới cao cấp đến từ **tay nghề**, gồm chữ, ảnh, nhịp, chất liệu và sự tiết chế, cộng **một khoảnh khắc** làm thật tới. Nó không đến từ số lượng hiệu ứng hay độ lạ của ẩn dụ.

## 1. Luận điểm đề xuất: "Tấm thiệp là nhân vật chính, ảnh là linh hồn"

- Mọi trải nghiệm **mở ra từ một tấm thiệp có cảm giác vật lý** (giấy dày, ép kim, in nổi, phong bì, sáp niêm). Khép lại cũng bằng tấm thiệp đó.
- **3D dùng cho chất liệu, không dùng cho không gian.** Ánh sáng lướt trên lá vàng khi nghiêng máy, độ dày giấy, bóng của chữ in nổi, phong bì mở có vật lý. Camera **không bay** và không xoay quanh cảnh. Cách này giải quyết chuyện chóng mặt và "xa tấm thiệp", mà vẫn giữ được chất 3D chủ dự án thích.
- Sau tấm thiệp là **ảnh cặp đôi, trình bày như một cuốn lookbook thời trang**: ảnh lớn, sắc nét, nhịp cắt cảnh có chủ đích.
- Thông tin (ngày, giờ, nơi, trả lời) **tìm thấy trong 5 giây** ở mọi mẫu.

Vì sao khác biệt: thiệp online ở Việt Nam hiện phần lớn là trang phẳng dựng sẵn hoặc slideshow. Còn thiệp giấy cao cấp thì đẹp nhưng không động. Một "tấm thiệp giấy thật sống trên màn hình" là khoảng trống chưa ai chiếm.

### 1.1 Học gì từ higgsfield.ai

Higgsfield là nền tảng làm video bằng AI. Thế mạnh của họ là các **chuyển động máy quay điện ảnh** đặt sẵn: đẩy máy vào, lia, dolly, crash zoom. Bài học cho SayHello là **làm cho ảnh tĩnh của cặp đôi có cảm giác được quay phim**, chứ không phải bay camera trong một thế giới 3D. Có hai mức:

- **Mức miễn phí (mặc định):** lúc tải ảnh lên, tạo sẵn bản đồ độ sâu của ảnh. Trên thiệp, mỗi ảnh có một chuyển động máy quay nhẹ 2.5D (đẩy vào, thị sai giữa người và nền), chạy bằng một shader nhỏ và có bản `lite` là ảnh tĩnh. Ý này nối tiếp bản thử `chieu-sau` (lớp người tách sẵn).
- **Mức trả phí (để sau):** gói cao cấp dùng API video AI để tạo 1–2 đoạn phim ngắn từ ảnh cưới làm màn mở. Cần kiểm tra chi phí, bản quyền và độ giống thật của khuôn mặt trước khi nhận làm.

Giao diện của chính trang Higgsfield (nền tối, video tràn màn, chữ ít) cũng là tham khảo cho bố cục B2 Lookbook.

## 2. Ba trục tách bạch: Bố cục × Chủ đề × Khoảnh khắc

Một sản phẩm thiệp = **1 bố cục** + **1 chủ đề** + **1 khoảnh khắc ký tên**.

### 2.1 Bố cục (template): ít nhưng khác hẳn nhau về cấu trúc

Mỗi bố cục khác nhau ở **bộ khung, cách xếp ảnh, nhịp đọc và tương tác chính**, không chỉ ở màu sắc.

| Mã | Bố cục | Cách đi qua thiệp | Hợp với |
|---|---|---|---|
| B1 | **Thiệp Thật** | Phong bì, rút thiệp, thiệp mở ra thành trang ảnh dọc | Mặc định, người lớn tuổi đọc dễ |
| B2 | **Lookbook** | Ảnh toàn màn, cắt cảnh theo cuộn kiểu phim thời trang, chữ ít và to | Bộ ảnh đẹp, nhiều ảnh |
| B3 | **Tạp chí lớn** | Lưới bất đối xứng, ảnh đè chữ, giống bìa và trang trong của tạp chí cao cấp | Cặp đôi trẻ, ảnh studio |
| B4 | **Một màn** | Mọi thứ trên một màn, chạm để chuyển ảnh, tab thông tin | Ít ảnh (6–8), gửi Zalo nhanh |
| B5 | *(để mở)* | Sẽ thêm sau khi B1–B3 đạt chuẩn | |

### 2.2 Chủ đề (topic): bộ "không khí" gắn lên bố cục

Một chủ đề không chỉ là bảng màu. Nó gồm: **4–6 mã màu, cặp font (có bộ vietnamese), chất liệu giấy/ánh sáng, họa tiết, động từ chuyển động, nhạc, giọng văn.**

Ý tưởng chủ đề để bàn (tránh sến, tránh đồ vật quê mùa):
- **Lụa Ngà:** trắng ngà, lụa, ép kim nhạt, serif mảnh. Kiểu "quiet luxury".
- **Đông Dương:** gạch bông, gỗ, xanh rêu và son, chữ có chân thời 1930.
- **Nắng Đà Lạt:** sương sớm, hạt phim ấm, hoa dại ép khô.
- **Đêm Sài Gòn:** ảnh đêm, neon rất nhẹ, đen sâu, sans hiện đại.
- **Mực Tàu:** đen trắng, nét mực loang, nhiều khoảng trắng.
- **Biển Mùa Hạ:** xanh nước, giấy thô, ánh nắng di chuyển trên giấy.

Mỗi bố cục mở cho 2–4 chủ đề hợp với nó, không phải mọi tổ hợp đều được bán.

### 2.3 Khoảnh khắc ký tên (signature moment): một cái, làm thật tới

Mỗi bố cục có đúng **một** khoảnh khắc ký tên, gắn với tấm thiệp, ví dụ:
- Bẻ sáp niêm, phong bì mở có vật lý, thiệp trượt ra.
- Nghiêng điện thoại, ánh sáng chạy trên chữ ép kim tên cô dâu chú rể.
- Ảnh "rửa" dần từ giấy trắng như ảnh in.
- Tên khách (`?n=` / mã khách) được "viết tay" lên thiệp.

Các thứ còn lại chuyển động nhẹ, phục vụ việc đọc.

## 3. Thước đo "đặc biệt hay đại trà"

Chấm 1–5 cho mỗi tiêu chí. Mẫu **ĐẠT** khi mọi tiêu chí ≥ 4. Chấm bởi subagent độc lập, sau đó chủ dự án duyệt.

1. **3 giây đầu:** mở link lên có muốn xem tiếp không?
2. **Đẹp khi đứng yên:** chụp màn hình bất kỳ có đáng đăng Instagram không? (Đây là phép thử quan trọng nhất.)
3. **Đọc được:** ngày, giờ, nơi, nút trả lời tìm thấy trong 5 giây; chữ đủ lớn cho người 60 tuổi.
4. **Tôn ảnh:** ảnh lớn, sắc nét, chiếm phần lớn diện tích.
5. **Chịu ảnh xấu:** với 6 ảnh chụp bằng điện thoại, ánh sáng lệch, mẫu vẫn đẹp không?
6. **Khoảnh khắc ký tên:** khách có muốn kể cho người khác nghe không?
7. **Phép thử đại trà:** có tìm thấy thứ tương tự trên Canva, Cinelove hay các shop thiệp online không? Nếu có thì trượt.
8. **Không sến, không chóng mặt:** không tim bay, không pháo giấy, không lấp lánh, không camera xoay; script font chỉ dùng điểm xuyết.
9. **Máy yếu:** mượt trên Zalo WebView ở khung 390×844; có `lite` và dự phòng khi mất WebGL.

Bảng `KHONG-KHUON-MAU.md` (19 thói quen) giữ lại làm bảng kiểm phụ.

## 4. Quy trình mới: duyệt bằng mắt trước khi viết code

1. **Bảng hướng thị giác (moodboard):** mỗi hướng là một trang HTML tĩnh gồm màu, font thật, xử lý ảnh, và 3 khung hình chính (bìa, một trang ảnh, trang thông tin) trên mobile và desktop.
2. **Chủ dự án chọn** 1–2 hướng. Có thể kèm ảnh hoặc link tham khảo của chủ dự án.
3. **Dựng bản thử của một bố cục với một chủ đề**, chưa làm toàn bộ thiệp.
4. **Chấm theo mục 3** bằng subagent; agy góp ý.
5. Đạt rồi mới mở rộng ra các chủ đề khác và làm phần còn lại của thiệp.

Kỹ năng thiết kế dùng: `frontend-design` (định hướng thẩm mỹ), `design:design-critique` (chấm), `design:accessibility-review` (đọc được, tương phản), `design:ux-copy` (lời văn), `webapp-testing` (chụp màn hình tự động ở 390×844 và 1440×900).

## 5. Dọn code và tài liệu

### 5.1 Mẫu v2 hiện có (đề xuất, cần chủ dự án duyệt)

| Mẫu | Đề xuất | Lý do |
|---|---|---|
| `phong-trien-lam` | Giữ làm tham khảo kỹ thuật 3D | Được khen "OK ổn" |
| `to-hong`, `cuon-phim` | Giữ làm tham khảo | Có ý hay, chưa đạt |
| `ho-guong`, `bau-troi-anh` | Đã cất | "Khó nhìn" |
| `to-lich`, `xap-anh`, `to-anh-thu`, `lich-trinh`, `tap-chi-cuoi`, `chieu-sau` | Đã cất | "Xấu", "chỉ đổi layout" |

"Cất vào lưu trữ" nghĩa là gắn tag git `archive/v2-themes-2026-11`, rồi xoá khỏi cây thư mục. Khi cần vẫn lấy lại được.

Phần dùng lại được trong engine: `defineTheme`, `renderDocument`, `tier.js`, `lib.js`, `stage3d.js` (cho chất liệu và ánh sáng), nhóm khách `?n=`, nhạc, bảng màu. Engine cần tách rõ **bố cục** (khung, thứ tự cảnh) với **chủ đề** (token, font, chất liệu) để một bố cục nhận nhiều chủ đề.

### 5.2 `legacy/`

Đóng băng, chỉ sửa lỗi. Các mẫu cũ dùng làm nguồn ý tưởng chủ đề.

### 5.3 Tài liệu: từ 15 tệp xuống 6

| Tệp mới | Gộp từ |
|---|---|
| `PRODUCT.md`: tầm nhìn, mô hình SaaS, phễu tự phục vụ | REDESIGN, PRD, PROPOSAL |
| `DESIGN.md`: ba trục, thước đo, chống sến, quy trình duyệt | DESIGN, KHONG-KHUON-MAU, THAM-MUU-THIET-KE, BRIEF-3D |
| `ARCHITECTURE.md`: engine v2, Next.js, Supabase | ARCHITECTURE |
| `RULES.md` | giữ |
| `ROADMAP.md`: việc cần làm và tiến độ | TASKS, PROGRESS |
| `TAO-MAU-MOI.md`: hướng dẫn làm một bố cục hoặc chủ đề mới | TAO-MAU-MOI |

Tài liệu cũ chuyển vào `docs/archive/`, không xoá. `CLAUDE.md` cập nhật theo.

## 6. Lộ trình

| Pha | Việc | Xong khi |
|---|---|---|
| P0 Dọn | Xử lý thay đổi chưa commit, lưu trữ mẫu, gộp tài liệu | Cây thư mục gọn, test xanh |
| P1 Hướng nhìn | 3–4 bảng hướng thị giác cho B1 (Thiệp Thật) | Chủ dự án chọn được hướng |
| P2 Mẫu đầu tiên | B1 + 2 chủ đề + khoảnh khắc phong bì | Đạt thước đo mục 3 |
| P3 Mở rộng | B2 Lookbook, B3 Tạp chí lớn, thêm chủ đề | Mỗi bố cục có ≥ 2 chủ đề đạt |
| P4 Sản phẩm | Trang chủ trưng mẫu, Studio chọn bố cục × chủ đề, thanh toán | Cặp đôi tự làm được thiệp |

## 7. Câu hỏi cho chủ dự án

1. Luận điểm "tấm thiệp là nhân vật chính, 3D cho chất liệu chứ không cho không gian" có đúng ý không?
2. Link "highfield" chính xác là trang nào? Có thể gửi thêm 3–5 thiệp hoặc trang mà Ngài thấy "wow" không?
3. Khoảng 68 tệp đang sửa dở chưa commit (legacy themes, ảnh demo, 3D themes). Phần này của agy hay của Ngài? Giữ hay bỏ?
4. Đồng ý cất các mẫu v2 ở mục 5.1 vào lưu trữ không?

## Thảo luận

*(agy và chủ dự án ghi góp ý tại đây, kèm ngày.)*
