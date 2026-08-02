import type { Metadata } from "next";
import { Baloo_2, Nunito_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import "./globals.scss";

const displayFont = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const bodyFont = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Mystery Box UK | Surprise Jewellery, Beauty & Wheel Spin Gifts",
    template: "%s | Mystery Box UK",
  },
  description:
    "UK mystery boxes, pink eggs and wheel spin prizes for jewellery, makeup & beauty and stationery lovers. Plus birthday packages and custom gift requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <SkipToContent />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
