import usePageTitle from '@/hooks/usePageTitle';
import HeroSection from '@/pages/home/sections/HeroSection';
import BusinessStats from '@/pages/home/sections/BusinessStats';
import FeaturedCategories from '@/pages/home/sections/FeaturedCategories';
import ManufacturingLines from '@/pages/home/sections/ManufacturingLines';
import WhyChooseUs from '@/pages/home/sections/WhyChooseUs';
import WholesaleSolutions from '@/pages/home/sections/WholesaleSolutions';
import Testimonials from '@/pages/home/sections/Testimonials';
import FaqSection from '@/pages/home/sections/FaqSection';
import NewsletterSection from '@/pages/home/sections/NewsletterSection';

export default function HomePage() {
  usePageTitle();
  return (
    <>
      <HeroSection />
      <BusinessStats />
      <ManufacturingLines />
      <FeaturedCategories />
      <WhyChooseUs />
      <WholesaleSolutions />
      <Testimonials />
      <FaqSection />
      <NewsletterSection />
    </>
  );
}
