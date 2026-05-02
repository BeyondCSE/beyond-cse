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
  title: "Beyond CSE",
  description: "Beyond CSE - Learn, Build, Grow",
  manifest: "/site.webmanifest",

  icons: {
    icon: "/myicon-final.ico",   // 👈 your custom icon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* 👇 browser fallback system */}
        <link rel="icon" href="/myicon-final.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>

      <body className={`min-h-full flex flex-col ${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}