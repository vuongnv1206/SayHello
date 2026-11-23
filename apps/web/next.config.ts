import type { NextConfig } from "next";

// Site tĩnh bản 1 (thư mục legacy/) vẫn phục vụ thiệp đã bán trong lúc chuyển sang bản 2.
// Đường dẫn nào Next không có (kể cả trang chủ khi chưa làm lại) sẽ rơi về legacy qua rewrites.fallback,
// nên thêm route mới ở apps/web không làm hỏng link thiệp cũ khách đã gửi.
//   Production: đặt LEGACY_ORIGIN là địa chỉ deploy của legacy/.
//   Máy cá nhân: `npm run dev:legacy` (cổng 3001) rồi `npm run dev`.
const LEGACY_ORIGIN = (process.env.LEGACY_ORIGIN || "http://localhost:3001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Thiệp bản 1 dùng đường dẫn tương đối kiểu /ten-cap-doi/ + ../core/, phải giữ dấu / ở cuối
  trailingSlash: true,
  transpilePackages: ["@sayhello/engine", "@sayhello/theme-cuon-phim"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        { source: "/", destination: `${LEGACY_ORIGIN}/` },
        { source: "/:path*/", destination: `${LEGACY_ORIGIN}/:path*/` },
        { source: "/:path*", destination: `${LEGACY_ORIGIN}/:path*` },
      ],
    };
  },
};

export default nextConfig;
