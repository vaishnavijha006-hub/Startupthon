import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Domains from '@/components/sections/Domains';
import Guidelines from '@/components/sections/Guidelines';
import Faqs from '@/components/sections/Faqs';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { Award } from 'lucide-react';

function LandingPage() {
  return (
    <>
      <Hero />
      <section className="relative z-10 px-4 pb-10 sm:px-6 lg:px-8" aria-label="Physical certificate benefit">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-4 border border-laser-cyan/40 bg-laser-cyan/5 px-6 py-6 text-center shadow-[0_0_24px_rgba(0,229,255,0.08)] clip-angular sm:flex-row sm:px-8 sm:py-7 sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-laser-cyan/40 bg-laser-cyan/10 text-laser-cyan clip-angular-sm">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-laser-cyan/70">
              Participant Benefit
            </p>
            <p className="mt-1 font-display text-lg font-bold uppercase leading-snug tracking-wider text-text-primary sm:text-xl">
              Physical certificate for every successfully registered participant
            </p>
          </div>
        </div>
      </section>
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
