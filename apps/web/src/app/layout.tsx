import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Chữ giao diện ứng dụng (trình sửa, bảng điều khiển). Bắt buộc có bộ ký tự tiếng Việt.
const sans = Be_Vietnam_Pro({
  variable: "--font-vn",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SayHello · Thiệp cưới online",
  description: "Tự làm thiệp cưới online mở ra như một món quà, gửi khách qua Zalo, nhận xác nhận và lời chúc ngay trên điện thoại.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
