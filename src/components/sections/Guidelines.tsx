import SectionHeading from '@/components/ui/SectionHeading';
import HudCorners from '@/components/ui/HudCorners';
import { GUIDELINES, IMPORTANT_DATES } from '@/data/content';
import { Check, Calendar, Info } from 'lucide-react';

function Guidelines() {
  return (
    <section id="guidelines" className="relative z-10 py-24">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-laser-cyan/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Operating Parameters"
          title="Guidelines & Important Dates"
          subtitle="Everything you need to know before registering your team."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Guidelines */}
          <div className="relative steel-panel p-8 clip-angular">
            <HudCorners className="absolute inset-0" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5">
                <Info className="h-5 w-5 text-laser-cyan" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
                Participation Guidelines
              </h3>
            </div>
            <ul className="space-y-4">
              {GUIDELINES.map((guideline, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/10">
                    <Check className="h-3 w-3 text-laser-cyan" />
                  </div>
                  <span className="text-sm leading-relaxed text-text-secondary">
                    {guideline}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important dates */}
          <div className="relative steel-panel p-8 clip-angular">
            <HudCorners className="absolute inset-0" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5">
                <Calendar className="h-5 w-5 text-laser-cyan" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
                Important Dates
              </h3>
            </div>
            <div className="space-y-4">
              {IMPORTANT_DATES.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border-b border-gunmetal pb-3 last:border-0"
                >
                  <span className="font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                    {item.label}
                  </span>
                  <span className="font-mono text-sm text-laser-cyan/80">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border border-laser-violet/20 bg-laser-violet/5 p-3">
              <Info className="h-4 w-4 shrink-0 text-laser-violet" />
              <p className="text-xs text-text-secondary">
                Dates will be updated here once officially confirmed. Check back regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Guidelines;
