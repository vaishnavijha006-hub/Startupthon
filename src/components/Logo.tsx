interface LogoProps {
  className?: string;
}

function Logo({ className = 'h-10 w-10' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <path
        d="M24 3 L42 13.5 L42 34.5 L24 45 L6 34.5 L6 13.5 Z"
        stroke="#00E5FF"
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Inner hexagon */}
      <path
        d="M24 10 L36 17 L36 31 L24 38 L12 31 L12 17 Z"
        stroke="#2563FF"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Circuit lines */}
      <line x1="24" y1="10" x2="24" y2="18" stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="30" x2="24" y2="38" stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
      <line x1="12" y1="24" x2="18" y2="24" stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
      <line x1="30" y1="24" x2="36" y2="24" stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
      {/* Core node */}
      <circle cx="24" cy="24" r="5" fill="#00E5FF" opacity="0.15" />
      <circle cx="24" cy="24" r="3" fill="#00E5FF" />
      <circle cx="24" cy="24" r="1.5" fill="#F3F7FC" />
      {/* Corner nodes */}
      <circle cx="12" cy="17" r="1.5" fill="#2563FF" opacity="0.7" />
      <circle cx="36" cy="17" r="1.5" fill="#2563FF" opacity="0.7" />
      <circle cx="12" cy="31" r="1.5" fill="#8B5CF6" opacity="0.7" />
      <circle cx="36" cy="31" r="1.5" fill="#8B5CF6" opacity="0.7" />
    </svg>
  );
}

export { Logo };
