// Danh sách mẫu thiệp bản 2 và dữ liệu thiệp mẫu của từng mẫu.
// Thêm mẫu mới: tạo packages/themes/<id>/ (theme.js, theme.css, demo.json) rồi đăng ký ở đây.
import cuonPhim from "@sayhello/theme-cuon-phim";
import cuonPhimDemo from "@sayhello/theme-cuon-phim/demo.json";
import phongTrienLam from "@sayhello/theme-phong-trien-lam";
import phongTrienLamDemo from "@sayhello/theme-phong-trien-lam/demo.json";
import bauTroiAnh from "@sayhello/theme-bau-troi-anh";
import bauTroiAnhDemo from "@sayhello/theme-bau-troi-anh/demo.json";
import hoGuong from "@sayhello/theme-ho-guong";
import hoGuongDemo from "@sayhello/theme-ho-guong/demo.json";
import tapChiCuoi from "@sayhello/theme-tap-chi-cuoi";
import tapChiCuoiDemo from "@sayhello/theme-tap-chi-cuoi/demo.json";

type Theme = { id: string; name: string; version: string };

export const THEMES: Record<string, { theme: Theme; demo: Record<string, unknown>; assetBase: string }> = {
  // Ảnh thiệp mẫu đang nằm ở thư mục demo của bản 1 (legacy/demo-cuon-phim/images), phục vụ qua rewrites.fallback
  "cuon-phim": { theme: cuonPhim as Theme, demo: cuonPhimDemo, assetBase: "/demo-cuon-phim/" },
  // Ảnh mẫu lấy từ nhiều thư mục demo của bản 1 (đường dẫn trong demo.json tính từ gốc site)
  "phong-trien-lam": { theme: phongTrienLam as Theme, demo: phongTrienLamDemo, assetBase: "/" },
  // Ảnh mẫu nằm trong thư mục của mẫu, được chép sang public/_e/themes/<id>/ lúc sync
  "ho-guong": { theme: hoGuong as Theme, demo: hoGuongDemo, assetBase: "/_e/themes/ho-guong/" },
  "bau-troi-anh": { theme: bauTroiAnh as Theme, demo: bauTroiAnhDemo, assetBase: "/_e/themes/bau-troi-anh/" },
  // Ảnh mẫu tạm mượn của Hồ Gương và Bầu Trời Ảnh (đường dẫn tuyệt đối trong demo.json)
  "tap-chi-cuoi": { theme: tapChiCuoi as Theme, demo: tapChiCuoiDemo, assetBase: "/" },
};
