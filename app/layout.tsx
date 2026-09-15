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
      <body>{children}</body>
    </html>
  );
}
