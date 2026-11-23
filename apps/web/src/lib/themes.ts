// Danh sách mẫu thiệp bản 2 và dữ liệu thiệp mẫu của từng mẫu.
// Thêm mẫu mới: tạo packages/themes/<id>/ (theme.js, theme.css, demo.json) rồi đăng ký ở đây.
import cuonPhim from "@sayhello/theme-cuon-phim";
import cuonPhimDemo from "@sayhello/theme-cuon-phim/demo.json";

type Theme = { id: string; name: string; version: string };

export const THEMES: Record<string, { theme: Theme; demo: Record<string, unknown>; assetBase: string }> = {
  // Ảnh thiệp mẫu đang nằm ở thư mục demo của bản 1 (legacy/demo-cuon-phim/images), phục vụ qua rewrites.fallback
  "cuon-phim": { theme: cuonPhim as Theme, demo: cuonPhimDemo, assetBase: "/demo-cuon-phim/" },
};
