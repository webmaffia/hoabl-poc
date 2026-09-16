import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HoABL AI Land Advisor — Aira",
  description:
    "An AI-guided land decision experience by HoABL. Prototype/demo build — no real payments or KYC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          HoABL's own site is set in Inria Serif (headings) + Inria Sans
          (body). next/font/google's bundled catalog (this Next 14.2.x)
          doesn't include Inria, so it's loaded the plain way instead.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inria+Sans:wght@300;400;700&family=Inria+Serif:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
