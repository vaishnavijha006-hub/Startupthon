import SectionHeading from '@/components/ui/SectionHeading';
import HudCorners from '@/components/ui/HudCorners';
import { DOMAINS } from '@/data/content';
import { Cpu, Activity, Leaf, TrendingUp, Lightbulb } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  activity: Activity,
  leaf: Leaf,
  'trending-up': TrendingUp,
  lightbulb: Lightbulb,
};

function Domains() {
  return (
    <section id="domains" className="relative z-10 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Target Sectors"
          title="Innovation Domains"
          subtitle="Choose your battlefield. Five domains where your ideas can reshape the future."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain, idx) => {
            const Icon = ICONS[domain.icon] || Lightbulb;
            const techId = `DOMAIN_${String(idx + 1).padStart(2, '0')}`;
            return (
              <div
                key={domain.id}
                className="steel-panel steel-panel-hover group relative overflow-hidden p-8 clip-angular"
              >
                <HudCorners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Technical grid background */}
                <div className="pointer-events-none absolute inset-0 tech-grid opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Technical identifier */}
                <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary/50 transition-colors group-hover:text-laser-cyan/60">
                  {techId}
                </span>

                {/* Large faded number */}
                <span className="pointer-events-none absolute -right-2 top-8 font-display text-6xl font-bold text-gunmetal/30 transition-colors duration-300 group-hover:text-laser-cyan/10">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center border border-gunmetal bg-bg-primary/50 transition-all duration-300 group-hover:border-laser-cyan/60 group-hover:bg-laser-cyan/5 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] clip-angular-sm">
                  <Icon className="h-8 w-8 text-metallic transition-colors duration-300 group-hover:text-laser-cyan" />
                </div>

                {/* Title */}
                <h3 className="relative mb-3 font-display text-xl font-bold uppercase tracking-wider text-text-primary">
                  {domain.name}
                </h3>

                {/* Description */}
                <p className="relative text-sm leading-relaxed text-text-secondary">
                  {domain.description}
                </p>

                {/* Bottom laser accent */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-laser-cyan to-electric-blue transition-all duration-500 group-hover:w-full" />

                {/* Directional light reflection on hover */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      'linear-gradient(135deg, transparent 60%, rgba(0, 229, 255, 0.04) 100%)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Domains;
