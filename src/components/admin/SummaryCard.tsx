import type { LucideIcon } from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description: string;
}

function SummaryCard({ icon: Icon, label, value, description }: SummaryCardProps) {
  return (
    <article className="relative steel-panel min-w-0 p-5 clip-angular">
      <HudCorners className="absolute inset-0" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-text-primary">{value}</p>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-laser-cyan/25 bg-laser-cyan/5 text-laser-cyan">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export default SummaryCard;
