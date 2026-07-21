import type { Metadata } from "next";
import Providers from "./providers";
import FireworksCanvas from "@/components/FireworksCanvas";
import SiteFooter from "@/components/SiteFooter";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAY 개발팀",
  description: "BAY 개발팀 과제 제출"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="sky" aria-hidden="true">
          <div className="stars starsFar" />
          <div className="stars starsNear" />
          <span className="shootingStar star1" />
          <span className="shootingStar star2" />
          <span className="shootingStar star3" />
        </div>
        <FireworksCanvas />
        <Providers>{children}</Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
