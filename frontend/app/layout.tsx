import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coin-Sangjang",
  description:
    "Realtime Korean listing monitor with automated global derivatives execution and multilingual UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-50">
        {children}
      </body>
    </html>
  );
}
