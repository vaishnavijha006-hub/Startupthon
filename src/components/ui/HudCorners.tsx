interface HudCornersProps {
  className?: string;
}

function HudCorners({ className = '' }: HudCornersProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <span className="hud-corner hud-corner-tl" />
      <span className="hud-corner hud-corner-tr" />
      <span className="hud-corner hud-corner-bl" />
      <span className="hud-corner hud-corner-br" />
    </div>
  );
}

export default HudCorners;
