import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Domains from '@/components/sections/Domains';
import Guidelines from '@/components/sections/Guidelines';
import Faqs from '@/components/sections/Faqs';
import SectionSeparator from '@/components/ui/SectionSeparator';

function LandingPage() {
  return (
    <>
      <Hero />
      <About />
      <SectionSeparator />
      <Domains />
      <SectionSeparator />
      <Guidelines />
      <SectionSeparator />
      <Faqs />
    </>
  );
}

export default LandingPage;
