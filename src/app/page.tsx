import type { Metadata } from "next";
import {
  Hero,
  ShopByCategory,
  HowItWorks,
  Testimonials,
  TrustSignals,
} from "@/components/home";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategories, getShopExtrasPricing } from "@/lib/catalogue";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  description:
    "UK mystery gift boxes for birthdays, weddings, Halloween, Christmas and Valentine's — plus mystery eggs, wheel spins, birthday packages and custom gift requests. Hand-packed by a family-run team.",
  path: "/",
});

export default async function HomePage() {
  const [categories, pricing] = await Promise.all([
    getCategories(),
    getShopExtrasPricing(),
  ]);

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <ShopByCategory categories={categories} pricing={pricing} />
      <HowItWorks />
      <Testimonials />
      <TrustSignals />
    </>
  );
}
