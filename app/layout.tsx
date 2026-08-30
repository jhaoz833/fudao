import type { Metadata, Viewport } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import IntroGate from "@/components/IntroGate";

export const metadata: Metadata = {
  title: "浮岛 · Floating Island",
  description: "漂浮在星海里的个人小岛——收藏图片、文字与心情。",
};

export const viewport: Viewport = {
  themeColor: "#04050d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-screen text-star">
        <Starfield />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="nebula nebula-violet" />
          <div className="nebula nebula-blue" />
          <div className="nebula nebula-gold" />
        </div>
        <IntroGate />
        <NavBar />
        <main className="relative z-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
