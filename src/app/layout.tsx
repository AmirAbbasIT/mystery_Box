import type { Metadata } from "next";
import { Baloo_2, Nunito_Sans } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { getActiveColorPaletteId } from "@/lib/site-settings";
import { CartProvider } from "@/lib/cart/CartContext";
import { getSiteUrl } from "@/lib/seo";
import "./globals.scss";

export const revalidate = 60;

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

// Site-wide defaults only. Canonical URLs are set per page via pageMetadata() (src/lib/seo.ts) —
// never here, or every page without its own would inherit the home page's canonical.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "Mystery Packed Gifts",
  openGraph: { type: "website", siteName: "Mystery Packed Gifts", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  title: {
    default: "Mystery Packed Gifts | Mystery Gift Boxes for Every Occasion",
    template: "%s | Mystery Packed Gifts",
  },
  description:
    "UK mystery gift boxes for birthdays, weddings, Halloween, Christmas and Valentine's — plus mystery eggs, wheel spins, birthday packages and custom gift requests.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const colorPaletteId = await getActiveColorPaletteId();

  return (
    <html
      lang="en-GB"
      data-color-theme={colorPaletteId}
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <body>
        <CartProvider>
          <SkipToContent />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
