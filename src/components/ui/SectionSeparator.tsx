interface SectionSeparatorProps {
  label?: string;
}

function SectionSeparator({ label }: SectionSeparatorProps) {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="section-separator">
        {label && (
          <span className="section-separator-arrow font-mono uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default SectionSeparator;
