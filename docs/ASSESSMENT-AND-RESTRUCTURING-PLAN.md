# Đánh giá đa góc độ & Kế hoạch tái cấu trúc toàn diện (`SayHello`)

> **Trạng thái tài liệu:** Tài liệu chuẩn chính thức (Milestone M3), tổng hợp kiểm chứng mã nguồn trực tiếp tại `D:\MyCode\SayHello` cùng kết quả thực thi đã hoàn thành của **Milestone M1** (dọn dẹp, ổn định 3D chống chóng mặt, sửa lỗi `cuon-phim` & nối `to-hong`), **Milestone M2** (kiến trúc bộ máy `Layout × Topic × Moment`, auto-manifest, 4 mẫu mới lấy tấm thiệp làm trung tâm & `/v2/` showcase), và **E2E Testing Track**.

---

## 1. Bối cảnh & Tóm tắt điều hành

Trước đợt tái cấu trúc, dự án `SayHello` bị giằng xé qua **ba thế hệ chồng chéo** trong cùng một kho mã nguồn:

1. **Thế hệ 1 (`legacy/`):** 10 mẫu tĩnh thuần HTML/CSS/ESM nằm trong `legacy/themes/` với cột mặc định hẹp `520px` (`legacy/core/base.css`), phụ thuộc Google Sheets/Apps Script và quy trình bán thủ công.
2. **Thế hệ 2 — Thử nghiệm 3D không gian (`packages/themes/phong-trien-lam/`, `packages/themes/to-hong/`):** Biến tấm thiệp thành hành lang 3D hoặc đường spline bay lơ lửng trong không gian tối; gây chóng mặt, tách rời khách mời khỏi thông tin cưới và đẩy phiếu hồi âm (RSVP) xuống sau hàng chục màn hình cuộn.
3. **Thế hệ 2.5 — Pivoting về "Tấm thiệp là nhân vật chính" (Card-as-Centerpiece):** Chuyển 3D từ *di chuyển camera trong không gian* sang *chất liệu bề mặt thiệp và chiều sâu 2.5D bên trong khung ảnh* (tham chiếu `higgsfield.ai`, `motionsites.ai`, `mcpservers.org/agent-skills`), chuẩn hóa bộ máy `@sayhello/engine` theo ba trục trực giao `Layout × Topic × Moment`.

Tài liệu này trình bày đánh giá đa góc độ, đối chiếu đại trà với trải nghiệm "wow", phản biện thẳng thắn các giả định ban đầu chưa hợp lý, giải phẫu kỹ thuật nguyên nhân gây chóng mặt 3D cùng các bản vá đã kiểm chứng trong M1–M2, và lộ trình cho các pha tiếp theo (M4 kiểm chứng nghiêm ngặt, Template 5, Supabase SaaS).

---

## 2. Đánh giá đa góc độ

### 2.1 Góc độ 1: Trải nghiệm người dùng (UX) & Thẩm mỹ thiệp cưới

- **Thực tế môi trường sử dụng — Zalo WebView trên điện thoại (`390×844` và `320×568`):** Phần lớn khách mời tại Việt Nam mở link thiệp cưới trực tiếp trong Zalo WebView khi đang di chuyển hoặc làm việc, trên thiết bị Android tầm trung qua mạng 4G. Nếu màn bìa khóa cứng khách `2.3s–2.8s` (`cuon-phim` cũ `2300ms`, `thiep-gap` `2500ms`, `ca-phe-phin` `2800ms`) hoặc nạp nặng `three-post` + `UnrealBloomPass` ngay lúc mở, tỷ lệ thoát trang tăng vọt.
- **Quy tắc 5 giây (Ai / Ngày dương + âm / Địa điểm / RSVP):** Khách mời — bao gồm cả người lớn tuổi (50–70 tuổi) — phải nhìn thấy **Tên cặp đôi**, **Ngày dương lịch & âm lịch**, **Địa điểm** và đường dẫn **Xác nhận tham dự (RSVP)** trong vòng tối đa 5 giây sau khi vào thiệp, không phải vượt qua 10–34 điểm dừng 3D toàn màn hình (`100svh`) mới thấy thông tin lễ. Bên cạnh đó, nút nổi **Thông tin nhanh (`#sh-quick`)** ở `packages/engine/src/blocks.js` đóng vai trò lưới an toàn xuyên suốt.
- **Giọng văn hai thanh điệu (`trang-trong` vs `than-mat`):** Thiệp cưới Việt Nam phục vụ đồng thời hai tệp khách: họ hàng/đồng nghiệp lớn tuổi (*"Trân trọng kính mời Ông/Bà"*, nghi thức *Nhà Trai & Nhà Gái*, *Lễ Vu Quy & Lễ Thành Hôn*) và bạn bè thân thiết (*"Mời [Tên] tới chung vui"*). Hệ `createVoice` trong `packages/engine/src/voice.js` cho phép chuyển đổi chính xác hai sắc thái này mà không rơi vào văn mẫu sáo rỗng.
- **Ngưỡng chữ đọc được tiếng Việt có dấu chồng (`>= 13px` / `>= 16px`):** Tiếng Việt có dấu thanh nằm chồng trên mũ nguyên âm (`ệ`, `ồ`, `ữ`). Bất kỳ nhãn chữ in hoa giãn cách nào nhỏ hơn `13px` đều dính dấu trên màn hình Retina/mobile. Bộ máy mới khóa sàn `font-size: max(16px, 1rem)` cho thân văn bản và `>= 13px` cho mọi nhãn UI trong `packages/engine/src/base.css`.
- **Phép thử ảnh tĩnh Instagram ("Still-frame Test"):** Dừng cuộn ở bất kỳ vị trí nào trên thiệp và chụp ảnh màn hình: khung hình đó phải đứng vững như một ấn phẩm biên tập hoàn chỉnh, không có chữ `CSS3DRenderer` bị nghiêng méo hay vật trang trí lơ lửng cắt nửa khung.

### 2.2 Góc độ 2: Kiến trúc mã nguồn & Hiệu năng

- **Phân tách ba thế hệ & ranh giới không React:**
  - `legacy/` được đóng băng và cô lập sạch với bộ test riêng (`npm test -w @sayhello/legacy`), giữ nguyên toàn bộ link thiệp đã bán qua proxy fallback `LEGACY_ORIGIN` trong `apps/web/next.config.ts`.
  - Trang thiệp v2 trong `packages/engine/` và `packages/themes/*` chạy **JS thuần (ESM)** — **không React**, render SSR/SSG ra HTML tĩnh ngay từ máy chủ qua `renderDocument()` để màn bìa hiện tức thì trước khi nạp thư viện tương tác (`ctx.lib()`). `apps/web/` dùng Next.js 16 (React 19, Tailwind 4) riêng cho showcase `/v2/`, route động/SSG `/v2/demo/[theme]/` và `/v2/demo/[theme]/[topic]/`.
- **Xử lý nút thắt `defineTheme` nguyên khối:** Trước M2, mỗi mẫu v2 gom cứng HTML, hiệu ứng, bảng màu, font và câu chữ vào một khối không tái sử dụng được. Kiến trúc M2 tách rời **Layout** (`layoutSpec`), **Topic** (`topics[]` với biến CSS `--sh-*` + `swatch`), và **Signature Moment** (`moment`), hỗ trợ khai báo qua `composeInvitation()` / `composeTheme()` trong `packages/engine/src/define-theme.js`.
- **Loại bỏ nút thắt đăng ký thủ công 5 tệp:** Trước M2, thêm một mẫu mới đòi hỏi sửa tay 5 tệp (`packages/themes/<id>/package.json`, `package-lock.json`, `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/src/lib/themes.ts` và danh sách test). Tới M2, `apps/web/scripts/sync-engine.mjs` tự động quét `packages/themes/*`, đồng bộ tài nguyên sang `apps/web/public/_e/` và sinh `apps/web/src/lib/themes.generated.ts` + `apps/web/public/_e/manifest.json`.
- **Loại bỏ trùng lặp mã nguồn & cô lập tài nguyên runtime:**
  - Hợp nhất `plain()` (`packages/engine/src/html.js`) và `qrUrl()` (`packages/engine/src/model.js`) vào `@sayhello/engine`, xóa các bản sao chép lặp lại ở 3 mẫu v2 cũ.
  - Bổ sung `packages/themes/cuon-phim/images/` (`anh1.jpg`–`anh6.jpg`, `xem-truoc.jpg`) và `apps/web/public/assets/music/` (`binh-minh.mp3`, `dao-buoc.mp3`, `hop-nhac.mp3`), triệt tiêu hoàn toàn sự phụ thuộc runtime vào máy chủ legacy cổng `:3001` khi chạy route `/v2/demo/*`.
  - Dọn bỏ các gói chưa sử dụng trong `apps/web/package.json` (`@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `motion`) để thu gọn đồ thị phụ thuộc cho tới khi pha SaaS thực sự dùng tới; đồng thời xóa các tệp rác tồn đọng từ v1 (tệp README mặc định cũ trong `apps/web`, nguyên mẫu HTML `to-hong` cũ trong `legacy/proto/`, thư mục tạm `supabase/` cũ).

### 2.3 Góc độ 3: Khả năng mở rộng đa Template & Topic

- **Tính trực giao `Layout × Topic × Moment`:** Thay vì nhân bản N×M gói code rời rạc khi muốn thêm phong cách mới, một kiến trúc bố cục (`folio`, `lookbook`, `deck`, `split`) đứng độc lập về cấu trúc khung hình và động tác chữ ký (`unseal-gleam`, `optical-push`, `deal-flip`, `seam-converge`), trong khi **Topic** thay thế đồng thời bảng màu `--sh-*`, cặp font có bộ `vietnamese`, chất liệu bề mặt và thông điệp ngữ cảnh.
- **Định tuyến kép `?topic=` (SSR/Client) & `/v2/demo/[theme]/[topic]/` (SSG):** `packages/engine/src/render.js` và `packages/engine/src/client/runtime.js` hỗ trợ cả render tĩnh từng tổ hợp `(theme, topic)` ở build-time lẫn chuyển chủ đề tức thì qua query `?topic=<id>` với bảo vệ chống prototype pollution (`Object.prototype.hasOwnProperty.call` trong `buildEarlyScript`).
- **Khác biệt thực chất về cấu trúc, không phải "đổi màu trên một khuôn":**
  - `thiep-gap-doi` (`folio`): Hai cánh mở trên desktop (trái ghim cố định tấm thiệp chính, phải cuộn nội dung), gấp 3 nếp giấy trên mobile.
  - `chieu-sau` (`lookbook`): Bố cục lookbook bất đối xứng 62%/38% đảo chiều, đẩy tiêu cự 2.5D `ctx.imgPair` (`bg` + `fg` cutout).
  - `hop-ky-uc` (`deck`): Một khung nhìn duy nhất với thanh chuyển 4 ngăn, xấp thẻ chia đàn hồi và lật mặt sau khi chạm.
  - `song-gia` (`split`): Chia đôi 50/50 *Nhà Trai & Nhà Gái* trên desktop + bộ chuyển 3 nút trên mobile hội tụ về thiệp chung.

---

## 3. Đối chiếu: Mẫu đại trà / "Sến" vs. Trải nghiệm "Wow" tinh tế

| Trục đánh giá | Mẫu đại trà / Sến ("Cringe") | Trải nghiệm "Wow" tinh tế (`SayHello` v2) | Bằng chứng trong codebase |
|---|---|---|---|
| **Khung không gian (Spatial Framing)** | Một cột `520px` cuộn dọc lặp lại ở 10 lớp da; hoặc hầm 3D tối mịt khiến tấm thiệp biến mất hoàn toàn. | **Tấm thiệp là điểm neo thị giác.** Mỗi mẫu có kiến trúc bố cục riêng (folio 2 cánh, lookbook 62/38, hộp thẻ 4 ngăn, song gia 50/50). | `legacy/core/base.css` khóa `520px`; M2 tách 4 cấu trúc `folio`, `lookbook`, `deck`, `split`. |
| **Chất liệu & Ánh sáng (Materiality & Light)** | Nền trắng phẳng `#fff` đổ bóng CSS hộp; đồ họa minh họa vẽ bằng CSS gradient; hiệu ứng Bloom làm lóa trắng váy cưới. | Vật liệu hữu hình (giấy Dó, sơn mài, hộp nhung, men sứ) + **vệt sáng phản quang có hướng** lướt qua chữ ép kim khi nghiêng/di chuột. | `thiep-gap-doi` dùng `.fg-foil` specular sweep (`theme.js:265-275`); `chieu-sau` tách lớp 2.5D không lóa. |
| **Chuyển động & Nhịp (Motion & Pacing)** | Hàng trăm khối `data-rv` mờ trượt giống hệt nhau; khóa bìa ép chờ `2.3s–2.8s`; camera rung lắc nhàn rỗi; pháo giấy mặc định. | **1 động tác chữ ký duy nhất + phản hồi UI `<= 280ms` + tĩnh lặng có chủ đích.** Mở bìa `<= 450ms` (hạn mức cứng `<= 900ms`), tắt sạch rung lắc vô ích. | `cuon-phim` cũ khóa `2300ms` -> sửa còn `280ms` / `gateMs: 450`; M2 dùng `--sh-dur-ui: 240ms`, `--sh-ease-tactile`. |
| **Chữ & Phân cấp (Typography & Hierarchy)** | Tương phản cỡ chữ yếu (`4:1`); nhãn tiếng Việt in hoa `10–12px` dính dấu; chữ viết tay cho đoạn văn dài; nối chuỗi `A · B · C`. | Tương phản biên tập táo bạo (`>= 8:1`); cặp font hỗ trợ chuẩn `vietnamese`; sàn `>= 13px` nhãn & `>= 16px` thân chữ; tách thông tin bằng lưới. | `cuon-phim/theme.css` từng có 17 luật `<13px` -> đã sửa toàn bộ; `base.css:18-19` khóa sàn `16px`/`13px`. |
| **Lời văn & Giọng điệu (Copy & Emotional Tone)** | Sáo ngữ (*"hạnh phúc mãi mãi"*, *"hai đầu thương nhớ"*, *"Rạp Hạnh Phúc"*); bắt buộc hiện khối "Chuyện tình" ngay cả khi cặp đôi không viết. | **Ảnh là trung tâm + tôn trọng hai thanh điệu.** Ngắn gọn, trang nhã cho người lớn tuổi (`trang-trong`) hoặc gần gũi tự nhiên (`than-mat`); `story` là tùy chọn (`optional`). | `thiep-gap-doi`, `song-gia` dùng `trang-trong` + `story: 'optional'`; `chieu-sau`, `hop-ky-uc` dùng `than-mat`. |
| **Tiện ích khách mời (Guest Utility — 5s)** | RSVP bị chôn sau 10–34 màn cuộn; ẩn dụ rườm rà che mất giờ/địa chỉ; ép xem hết hiệu ứng mới cho trả lời. | **Ai / Ngày dương+âm / Địa điểm thấy trong `<= 5s`**; RSVP chỉ cách `<= 2` chạm từ mọi nơi; `#sh-quick` luôn sẵn sàng. | `blocks.js` (`quickInfo`, `rsvpForm`); `hop-ky-uc` giữ form hiển thị rõ không khóa sau tab ẩn. |

---

## 4. Phản biện thẳng thắn định hướng ban đầu

Để tái cấu trúc dứt điểm, cần thẳng thắn chỉ ra **5 giả định ban đầu chưa hợp lý** từng dẫn dự án đi vòng:

1. **Giả định 1: *"3D không gian (hành lang, bay theo spline, bầu trời 360°) mới là thiệp cao cấp."***
   - **Phản biện:** Trong Zalo WebView trên màn hình dọc, camera bay xuyên không gian gây chóng mặt tiền đình, biến chữ tiếng Việt sắc nét thành mặt phẳng `CSS3DRenderer` mờ nhòe theo khoảng cách và làm mất hoàn toàn cảm giác cầm một tấm thiệp cưới trang trọng.
   - **Điều chỉnh:** Đưa 3D về phục vụ **chất liệu bề mặt thiệp** (ánh nhũ, nếp gấp) và **chiều sâu 2.5D bên trong khung ảnh** (`chieu-sau`), khóa camera tĩnh tuyệt đối, không bay và không xoay tự do.
2. **Giả định 2: *"Mỗi mẫu phải gắn một đồ vật đời thường kỳ quặc (phin cà phê, cửa sổ chat, tờ lịch xé, web 1999)."***
   - **Phản biện:** Đám cưới Việt Nam mang tính trang nghiêm trước gia đình hai họ và quan khách lớn tuổi. Phin cà phê hay giao diện chat khiến bộ thiệp đại diện dễ bị cảm giác bình dân hoặc thiếu trọng lượng nghi lễ.
   - **Điều chỉnh:** Nâng tầm ẩn dụ lên **vật phẩm thủ công, kiến trúc và biên tập** (*Sơn mài khảm trai*, *Giấy Dó triện mộc*, *Hộp nhung monogram*, *Song Gia gốm sứ*, *Lookbook điện ảnh*). Các mẫu mang sắc thái trẻ trung như `cuon-phim` hoặc `tin-nhan` ở `legacy/` chỉ đóng vai trò phân khúc phụ, không làm bộ mặt chủ lực.
3. **Giả định 3: *"Khách mời sẵn sàng dành 2–4 phút để khám phá từng trạm tương tác trên thiệp."***
   - **Phản biện:** Thực tế khách nhận link thiệp qua Zalo trong giờ làm việc hoặc lúc đang đi đường. Màn chờ `2300ms` (`cuon-phim` cũ) hay `2800ms` (`ca-phe-phin`) cùng chuỗi 11–34 điểm dừng khiến khách mất kiên nhẫn và thoát trang trước khi kịp xem giờ tiệc.
   - **Điều chỉnh:** Thiết kế theo **hai tốc độ đọc**: *15 giây nắm trọn* (Bìa -> Tên/Ngày/Nơi/Ảnh chính -> RSVP) và *60–90 giây thưởng thức tùy chọn* (lật mặt sau ảnh, xem chi tiết hai nhà, gửi lời chúc).
4. **Giả định 4: *"Điện ảnh đồng nghĩa với Three.js nặng nề + `UnrealBloomPass` + nhạc tự phát."***
   - **Phản biện:** Nạp `three-post` từ CDN làm trễ hiển thị trên 4G, dễ văng `webglcontextlost` trên Android yếu, còn bloom toàn cục làm bệt màu trắng váy cưới và da người.
   - **Điều chỉnh:** Dùng CSS hiện đại kết hợp biến tiến trình `--p` nhẹ hoặc WebGL/SVG tối giản, ảnh được tối ưu sẵn với `sharp`, âm thanh tắt mặc định và chỉ phát khi khách chủ động chạm.
5. **Giả định 5: *"Trang trưng bày `legacy/index.html` nền tối điểm vàng đã đủ sang trọng."***
   - **Phản biện:** Nền `#14110f` phối vàng `#d9a86c` kèm chữ nghiêng xen kẽ kiểu `<em>` và mockup điện thoại nghiêng `±2deg` lặp lại đúng khuôn mẫu landing page phổ thông do AI sinh ra.
   - **Điều chỉnh:** Trang trưng bày mới `/v2` (`apps/web/src/app/v2/page.tsx`) chuyển sang nền giấy kiến trúc sáng `#FAF8F4` / mực `#1C1917`, phân tầng theo `Layout × Moment × Topic` minh bạch, cho xem thẳng ảnh đại diện, chủ đề màu và bản tĩnh `?tier=lite`.

---

## 5. Giải phẫu nguyên nhân gây chóng mặt 3D & Các bản vá đã kiểm chứng (M1 & M2)

### 5.1 Nguyên nhân gốc rễ (Root Causes) trong mã nguồn trước M1

1. **Quay camera 180° qua lại hai bên tường & bơm FOV (`packages/themes/phong-trien-lam/gallery3d.js`):** Các điểm dừng chẵn/lẻ đặt đối xứng trên hai bức tường đối diện (`±90°`), cộng góc tiếp cận `ANG.single = 22°` và công thức vừa kéo ngang `want.x` vừa tăng/giảm tiêu cự `fov` thêm `6–10°` mỗi nhịp cuộn.
2. **Rung lắc camera nhàn rỗi (`gallery3d.js`):** Ở mức `cinematic`, ngay cả khi khách đứng yên đọc chữ, vòng lặp vẫn cộng nhiễu hình sin (`Math.sin(now * 2.5) * .004`, `Math.cos(now * 1.9) * .003`) vào `camera.position`.
3. **Xoay trực tiếp camera theo chuột/con quay hồi chuyển (`gallery3d.js` & `packages/themes/to-hong/thread3d.js`):** `thread3d.js` từng gọi `camera.rotateY(-look.sx * 0.28)` (**±16° ngang**) và `camera.rotateX(-look.sy * 0.17)` (**±10° dọc**) sau `camera.lookAt()`, khiến toàn bộ chữ `CSS3DRenderer` nghiêng vẹo và trôi lệch theo độ trễ `baseGyro`.
4. **Đường bay spline hình sin & nút tơ dao động liên tục (`thread3d.js`):** Điểm dừng từng chạy dọc đường cong hình sin kép (`x = sin(...)`, `y = cos(...)`) giữa 160 cánh hoa bay, cộng vòng xoay liên tục `knotGroup.rotation.y = Math.sin(now * 0.45) * 0.14` và lỗi ngốn GPU khi đứng yên ở chế độ soi ảnh (`|| !!inspectItem`).
5. **Chôn vùi thông tin cưới & lỗi UX `cuon-phim`:** `runtime.js` ẩn bìa khi mở và biến `.ptl-track`/`.th-track` thành các khối rỗng `100svh` đẩy RSVP xuống cuối trang. Trong khi đó `cuon-phim` mắc 6 lỗi: khóa bìa `2300ms`, 17 luật CSS `<13px`, `.flicker` chớp vô hạn, tràn ngang màn `390×844` (BUG-2), thiếu thư mục `images/` riêng (BUG-1 phụ thuộc `:3001`), và VietQR mã hóa dấu cách thành `+` thay vì `%20`.

### 5.2 Các bản vá cụ thể đã triển khai & kiểm chứng trong M1–M2

- **`packages/themes/phong-trien-lam/gallery3d.js` & `theme.js` / `theme.css`:**
  - Khóa hướng khung ảnh thẳng mặt (`gallery3d.js:232`: `g.rotation.y = 0;`) và đặt toàn bộ góc tiếp cận về `0` (`gallery3d.js:492`: `const ANG = { single: 0, salon: 0, wire: 0, lightbox: 0, hero: 0 };`), bỏ hoàn toàn quay tường `±90°` và bơm FOV.
  - Bỏ rung lắc nhàn rỗi; chuyển sang render theo nhu cầu (`gallery3d.js:625-627`: `if (!busy) return;`).
  - Giữ camera thăng bằng (`gallery3d.js:688-691, 748-752`), chỉ cho phép nghiêng nhẹ **bản thân khung tranh** `<= ±5°` (`gallery3d.js:657-659`: `it.ig.rotation.y = lx * 0.05 * tiltAmt; it.ig.rotation.x = -ly * 0.035 * tiltAmt;`), không xoay chữ `CSS3DRenderer`.
  - Giữ các điểm thông tin `.ptl-stop > *` hiển thị sẵn tới khi 3D sẵn sàng (`gallery3d.js:812` + `theme.css:116`: `ptl-ready`), đồng bộ mở bìa `gateMs: 450` / `280ms` (`theme.js:123, 173`).
- **`packages/themes/to-hong/thread3d.js`, `motion2d.js`, `theme.js`, `theme.css`:**
  - Đặt toàn bộ điểm dừng ngay chính trục `(0, 1.35, -st.k * STEP)` với tiếp tuyến thẳng `(0, 0, -1)` (`thread3d.js:99-118`); sợi chỉ đỏ dệt phía sau thẻ chứ không bắt camera lượn sóng.
  - Khóa `knotMat` nội suy tĩnh theo `uTight` (`thread3d.js:496-498`), bỏ dao động xoay vô hạn.
  - Render theo nhu cầu (`thread3d.js:873-878`: `if (!moving) return;`), giữ camera phẳng (`thread3d.js:928-934`), chỉ nghiêng khung `<= ±5°` (`thread3d.js:936-946`, và `motion2d.js:67-75` ở mức `<= ±4.5°`).
  - Giữ DOM hiển thị trước khi có `th-ready` (`thread3d.js:1017`, `theme.css:779-781`), sửa `[hidden]` thắng ID selector (`packages/engine/src/base.css:27`: `.sh-gate[hidden] { display: none !important; }`), thống nhất `gateMs: 450` (`theme.js:202, 377`).
- **`packages/themes/cuon-phim/theme.js` & `theme.css`:**
  - Hạ thời gian mở bìa xuống `gateMs: 450` (`theme.js:49, 113, 132`: `280ms` thường / `80ms` `reduced`), bổ sung `pointer-events: none` cho `.theater .dust` (`theme.css:27`) để nút `[data-skip]` luôn bấm được.
  - Chặn tràn ngang ở `390×844` (`theme.css:17`: `.sh-scene { overflow-x: clip; }`), giới hạn `.flicker` còn 2 nhịp hữu hạn (`theme.css:88`), nâng toàn bộ nhãn lên `>= 13px`, bỏ `loading="lazy"` ở `.shot-btn` (`theme.js:322`), sửa VietQR dùng `encodeURIComponent` (`%20`, `theme.js:366-373`), và cấp 7 ảnh riêng trong `packages/themes/cuon-phim/images/` cùng nhạc dùng chung ở `apps/web/public/assets/music/`.
- **Kiểm soát tràn biên 2.5D & màn nhỏ (`packages/engine/src/base.css` & `packages/themes/chieu-sau/`):**
  - `base.css:66-73` thêm `flex-wrap: wrap` và kích thước gọn cho `.sh-cd` dưới `380px` (triệt tiêu cắt chữ ở `320×568`).
  - `chieu-sau` dùng hộp overscan đối xứng `--cs-bleed: 10px` (`theme.css:99-143`, `theme.js:27-45`) bảo đảm cả `.cs-bg` (`>= +4px`) và `.cs-fg` (`>= +10px`) luôn phủ kín 4 cạnh mọi khung hình `320px..1440px` suốt dải `--p ∈ [-1, 1]`.

---

## 6. Kế hoạch tái cấu trúc theo giai đoạn & Lộ trình tiếp theo

### 6.1 Các cột mốc đã hoàn thành (M1, M2, E2E Track) & M3 hiện tại

| Giai đoạn | Phạm vi đã thực hiện | Kết quả kiểm chứng |
|---|---|---|
| **Milestone M1 (DONE)** | Dọn mã/tệp rác, tách `plain()`/`qrUrl()` vào `@sayhello/engine`, ổn định `phong-trien-lam` & `to-hong` chống chóng mặt, nối `to-hong` vào `apps/web`, sửa 6 lỗi `cuon-phim`, tự chứa ảnh & nhạc. | Gate PASS (Iter 4): Auditor `CLEAN`, Challenger `CONFIRMED`, Reviewer `APPROVE`, `run.mjs` `88/4/0`, `thiep-v2.mjs` `3/3`. |
| **Milestone M2 (DONE)** | Mở rộng `@sayhello/engine` theo `Layout × Topic × Moment` (`composeInvitation`, `base.css` tokens, `?topic=` SSR/SSG), `sync-engine.mjs` auto-manifest (7 mẫu hoạt động), nâng cấp `/v2/`, xây 4 mẫu card-centered (`thiep-gap-doi`, `chieu-sau`, `hop-ky-uc`, `song-gia`). | Gate PASS (Iter 4): Auditor `CLEAN`, Challenger `CONFIRMED`, Reviewer `APPROVE` (4/4 Binary Rubric), `run.mjs` `150/7/0`, `thiep-v2.mjs` `8 mẫu / 1 pending`, `30/30` SSG. |
| **E2E Testing Track (DONE)** | Xây dựng hạ tầng kiểm thử Playwright đa tầng (`tests/e2e/run.mjs`: Tiers 1–4, R1 scan, giới hạn `320–1440px`, tương phản, anti-cringe, độ trễ bìa `<= 900ms`, quỹ đạo người dùng). | Hoàn thành & đồng bộ với manifest tự động của M2. |
| **Milestone M3 (DONE)** | Lưu trữ 12 tài liệu cũ vào `docs/archive/`, đồng bộ toàn bộ bộ tài liệu chuẩn (`docs/*.md`, `README.md`, `CLAUDE.md`) khớp 1:1 với mã nguồn và lệnh chạy thực tế, lập sổ bàn giao cho Claude ở panel bên cạnh. | Gate PASS (Iter 1): `checkM3Docs()` 6/6, 4/4 Đạt, 0 vi phạm R1, 0 đường dẫn chết. |

### 6.2 Các hạng mục lộ trình tiếp theo (M4 & Sau M3)

1. **Đã xử lý dứt điểm gói WIP `photobooth` (M4 Pha 1):**
   Gói thử nghiệm `photobooth` (trước đây tạm loại trừ do 5 lỗi tiền-M2: đếm chụp ~8 giây `>900ms`, lớp `.lap-lanh` chạy `infinite`, 7/7 ảnh trùng MD5 với `legacy/demo-tin-nhan/`, QR thiếu tên khách, thiếu `moment`/`topics`) cùng danh sách loại trừ trong `apps/web/scripts/sync-engine.mjs` đã được gỡ bỏ khỏi kho mã nguồn hoạt động để toàn bộ 7 mẫu v2 chạy xanh `0` pending không cần `--allow-pending`.
2. **Milestone M4 — Kiểm chứng toàn diện, Tier-5 Hardening & Forensic Audit:**
   - Chạy toàn bộ bộ test ở chế độ nghiêm ngặt (`0` pending): `npm test`, `npm run lint -w @sayhello/web`, typecheck, `npm run build`, `npm run test:v2`, `node tests/e2e/run.mjs --tier=all`.
   - Đã chặn tải font ngoài trên `tests/e2e/lib/browser.mjs` & `apps/web/tests/thiep-v2.mjs` để `legacy/` không treo khi mạng Google Fonts chập chờn; tiếp tục hoàn thiện kiểm thử đối kháng Tier-5 và đánh giá lại 4 tiêu chí Binary Rubric độc lập.
3. **Triển khai Template 5 — *Editorial Monograph* (Tạp chí & Thực vật ép khô):**
   - Kiến trúc chương lật bất đối xứng (`spread` biên tập) + phiếu RSVP dạng thẻ thư viện, động tác chữ ký *Develop & Register*, gồm 3 chủ đề (*Thực Vật Ép Khô*, *Lưu Bút Kiến Trúc*, *Ấn Bản Khổ Lớn*) — chi tiết bản thiết kế xem tại `docs/TEMPLATES-AND-TOPICS.md`.
4. **Đồng bộ tài liệu nội bộ gói engine (`packages/engine/README.md`) — Đã hoàn tất (M4 Pha 1):**
   - Đã cập nhật đầy đủ theo hợp đồng `Layout × Topic × Moment` (`composeInvitation`, `composeTheme`, 10 `LAYOUTS`, `topics`, `moment`, `imgPair`, `plain`, `qrUrl`, token `--sh-*`, `?topic=`, `stage3d.js`, và cơ chế tự động quét `sync-engine.mjs`).
5. **Pha SaaS Backend (Supabase PG17 + Studio v2 + Thanh toán):**
   - `supabase/config.toml` đã cấu hình sẵn PostgreSQL 17, Anonymous Sign-ins và cổng cục bộ (`54321–54324`), trong khi `supabase/migrations/` hiện mới có `.gitkeep`. Pha tiếp theo sẽ viết SQL schema cho thiệp/khách/lời chúc/đơn hàng, nối Studio tự phục vụ trên `apps/web/` và kích hoạt lại `@supabase/supabase-js` / `@supabase/ssr` khi bắt đầu triển khai thật.
