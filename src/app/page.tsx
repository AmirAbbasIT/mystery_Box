import { Hero, ShopByCategory, HowItWorks, Testimonials, TrustSignals } from "@/components/home";
import { getCategories } from "@/lib/catalogue";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <>
      <Hero />
      <ShopByCategory categories={categories} />
      <HowItWorks />
      <Testimonials />
      <TrustSignals />
    </>
  );
}
