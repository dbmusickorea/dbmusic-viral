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
  title: "더블비뮤직 바이럴",
  description: "더블비뮤직 바이럴 마케팅 관리 시스템",
  openGraph: {
    title: "더블비뮤직 바이럴",
    description: "더블비뮤직 바이럴 마케팅 관리 시스템",
    url: "https://app.doubleb.kr",
    siteName: "더블비뮤직",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://app.doubleb.kr/og-image.png",
        width: 1200,
        height: 630,
        alt: "더블비뮤직 바이럴",
      }
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

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