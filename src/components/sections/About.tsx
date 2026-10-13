import SectionHeading from '@/components/ui/SectionHeading';
import HudCorners from '@/components/ui/HudCorners';
import { BENEFITS } from '@/data/content';
import { Target, Search, Rocket, Lightbulb } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  presentation: Target,
  search: Search,
  rocket: Rocket,
  lightbulb: Lightbulb,
};

function About() {
  return (
    <section id="about" className="relative z-10 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="System Overview"
          title="About The Event"
          subtitle="CodezY Startup Pitch is a student initiative designed to spark innovation and entrepreneurial thinking."
        />

        {/* About text */}
        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="steel-panel clip-angular p-8 sm:p-10">
            <HudCorners className="absolute inset-0" />
            {/* Technical header bar */}
            <div className="mb-6 flex items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-laser-cyan/40 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-laser-cyan/50">
                Mission Briefing
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-laser-cyan/40 to-transparent" />
            </div>
            <p className="text-lg leading-relaxed text-text-secondary">
              The event encourages students to step beyond the classroom and engage with
              real-world challenges. Participants identify pressing problems, develop
              innovative startup ideas, and explore the fundamentals of entrepreneurship.
              Through CodezY Startup Pitch, you will sharpen your ability to think
              critically, communicate your vision, and build solutions that have genuine
              impact — all while competing in a futuristic arena of ideas.
            </p>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="mt-16">
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-laser-cyan/30" />
            <h3 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
              Key Benefits
            </h3>
            <span className="h-px w-12 bg-laser-cyan/30" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, idx) => {
              const Icon = ICONS[benefit.icon] || Target;
              return (
                <div
                  key={benefit.title}
                  className="steel-panel steel-panel-hover group relative p-6 clip-angular"
                >
                  <HudCorners className="opacity-0 transition-opacity group-hover:opacity-100" />
                  {/* Index */}
                  <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary/40">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5 transition-all duration-300 group-hover:border-laser-cyan/60 group-hover:shadow-[0_0_16px_rgba(0,229,255,0.15)] clip-angular-sm">
                    <Icon className="h-6 w-6 text-laser-cyan" />
                  </div>
                  <h4 className="mb-2 font-display text-base font-semibold uppercase tracking-wider text-text-primary">
                    {benefit.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
