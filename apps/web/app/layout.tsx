import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trạm Tuyện — nơi mỗi câu chuyện dừng chân",
    template: "%s · Trạm Tuyện",
  },
  description: "MVP đọc truyện mobile-first, nhẹ, tập trung vào trải nghiệm đọc.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-paper text-ink antialiased dark:bg-paper-dark dark:text-ink-dark">
        {children}
      </body>
    </html>
  );
}
