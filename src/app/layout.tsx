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

  // 🔥 Mobile / Android support
  manifest: "/site.webmanifest",

  // 🔥 Explicit favicon (since NOT using favicon.ico)
  icons: {
    icon: [
      { url: "/myicon-final.ico" }, // main
    ],
    shortcut: ["/myicon-final.ico"],
    apple: ["/apple-touch-icon.png"],
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
        {/* 🔥 Force all browsers to use your icon */}
        <link rel="icon" href="/myicon-final.ico" />
        <link rel="shortcut icon" href="/myicon-final.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>

      <body
        className={`min-h-full flex flex-col ${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}