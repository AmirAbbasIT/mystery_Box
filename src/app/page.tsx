import { Hero, ShopByCategory, HowItWorks, Testimonials, TrustSignals } from "@/components/home";
import { getCategories, getShopExtrasPricing } from "@/lib/catalogue";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, pricing] = await Promise.all([getCategories(), getShopExtrasPricing()]);

  return (
    <>
      <Hero />
      <ShopByCategory categories={categories} pricing={pricing} />
      <HowItWorks />
      <Testimonials />
      <TrustSignals />
    </>
  );
}
