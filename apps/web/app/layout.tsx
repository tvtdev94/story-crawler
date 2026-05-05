import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Lora } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trạm Truyện — nơi mỗi câu chuyện dừng chân",
    template: "%s · Trạm Truyện",
  },
  description: "Trạm dừng chân của những câu chuyện. Đọc trên mọi thiết bị, không quảng cáo, không chen ngang.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${sans.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased dark:bg-paper-dark dark:text-ink-dark">
        {children}
      </body>
    </html>
  );
}
