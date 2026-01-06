import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { PricingSection } from "@/components/home/PricingSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategorySection />
      <PricingSection />
    </Layout>
  );
};

export default Index;
