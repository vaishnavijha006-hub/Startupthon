interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

function SectionHeading({ eyebrow, title, subtitle, center = true }: SectionHeadingProps) {
  return (
    <div className={`${center ? 'mx-auto text-center' : 'text-left'} max-w-3xl`}>
      {eyebrow && (
        <div className={`mb-3 flex items-center gap-2 ${center ? 'justify-center' : ''}`}>
          <span className="h-px w-8 bg-laser-cyan/50" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-laser-cyan/70">
            {eyebrow}
          </span>
          <span className="h-px w-8 bg-laser-cyan/50" />
        </div>
      )}
      <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-text-primary sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-text-secondary sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
