import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBMUSIC 바이럴 관리",
  description: "더블비뮤직 바이럴 마케팅 관리 시스템",
  openGraph: {
    title: "DBMUSIC 바이럴 관리",
    description: "더블비뮤직 바이럴 마케팅 관리 시스템",
    url: "https://app.doubleb.kr",
    siteName: "DBMUSIC",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}