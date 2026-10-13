import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/Logo';

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      {/* Cinematic spotlight behind core */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(0,229,255,0.08) 0%, rgba(37,99,255,0.04) 30%, transparent 70%)',
        }}
      />

      {/* === Robotic core / energy reactor === */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[460px] w-[460px] sm:h-[580px] sm:w-[580px] md:h-[640px] md:w-[640px]">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 animate-spin-slow">
            <svg viewBox="0 0 600 600" className="h-full w-full">
              <defs>
                <linearGradient id="hero-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#2563FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {/* Dashed outer ring */}
              <circle cx="300" cy="300" r="280" fill="none" stroke="url(#hero-ring-grad)" strokeWidth="1" strokeDasharray="4 8" />
              {/* Notches */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 300 + 270 * Math.cos(angle);
                const y1 = 300 + 270 * Math.sin(angle);
                const x2 = 300 + 290 * Math.cos(angle);
                const y2 = 300 + 290 * Math.sin(angle);
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00E5FF" strokeWidth="1.5" opacity="0.6" />
                );
              })}
              {/* Tick marks at 90-degree positions */}
              {Array.from({ length: 4 }).map((_, i) => {
                const angle = (i * 90 * Math.PI) / 180;
                const x = 300 + 255 * Math.cos(angle);
                const y = 300 + 255 * Math.sin(angle);
                return (
                  <rect
                    key={`tick-${i}`}
                    x={x - 3}
                    y={y - 3}
                    width="6"
                    height="6"
                    fill="#00E5FF"
                    opacity="0.5"
                    transform={`rotate(${i * 90} ${x} ${y})`}
                  />
                );
              })}
            </svg>
          </div>

          {/* Mid ring with angular segments */}
          <div className="absolute inset-8 animate-spin-slow-rev md:inset-12">
            <svg viewBox="0 0 540 540" className="h-full w-full">
              {/* Angular hexagonal frame */}
              <path
                d="M270,50 L470,165 L470,395 L270,510 L70,395 L70,165 Z"
                fill="none"
                stroke="#252D39"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <path
                d="M270,70 L450,175 L450,385 L270,490 L90,385 L90,175 Z"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="0.5"
                strokeDasharray="2 6"
                opacity="0.4"
              />
              {/* Corner nodes */}
              {[
                { x: 270, y: 50 }, { x: 470, y: 165 }, { x: 470, y: 395 },
                { x: 270, y: 510 }, { x: 70, y: 395 }, { x: 70, y: 165 },
              ].map((node, i) => (
                <circle key={i} cx={node.x} cy={node.y} r="4" fill="#00E5FF" opacity="0.7">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </svg>
          </div>

          {/* Inner counter-rotating ring */}
          <div className="absolute inset-16 md:inset-20 animate-spin-slow">
            <svg viewBox="0 0 460 460" className="h-full w-full">
              <circle cx="230" cy="230" r="200" fill="none" stroke="#2563FF" strokeWidth="1" strokeDasharray="2 12" opacity="0.4" />
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180;
                const x = 230 + 180 * Math.cos(angle);
                const y = 230 + 180 * Math.sin(angle);
                return <circle key={i} cx={x} cy={y} r="3" fill="#2563FF" opacity="0.5" />;
              })}
            </svg>
          </div>

          {/* Core glow */}
          <div className="absolute inset-1/4 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full bg-laser-cyan/10 blur-2xl animate-glow-breath md:h-32 md:w-32" />
          </div>

          {/* Central logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Logo className="h-20 w-20 animate-float md:h-24 md:w-24" />
          </div>

          {/* Laser arrows converging on core */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 600">
            <defs>
              <marker id="hero-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#00E5FF" />
              </marker>
            </defs>
            {[
              { d: 'M50,50 L200,200', delay: '0s' },
              { d: 'M550,50 L400,200', delay: '1s' },
              { d: 'M50,550 L200,400', delay: '0.5s' },
              { d: 'M550,550 L400,400', delay: '1.5s' },
            ].map((arrow, i) => (
              <path
                key={i}
                d={arrow.d}
                fill="none"
                stroke="#00E5FF"
                strokeWidth="1.5"
                opacity="0.35"
                markerEnd="url(#hero-arrow)"
                strokeDasharray="4 4"
                style={{ animation: `arrow-travel 4s linear infinite ${arrow.delay}` }}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* === Content overlay === */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Eyebrow / brand tag */}
        <div className="mb-8 inline-flex items-center gap-2 border border-laser-cyan/30 bg-bg-secondary/70 px-4 py-1.5 backdrop-blur-sm clip-angular-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-laser-cyan animate-laser-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-laser-cyan/80">
            CodezY // Innovation Protocol
          </span>
        </div>

        {/* Main headline */}
        <h1 className="font-display text-5xl font-bold uppercase leading-[1.05] tracking-wider text-text-primary sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <span className="metallic-text">Engineer</span>
          <br />
          <span className="text-glow-cyan">The Future.</span>
        </h1>

        {/* Supporting headline */}
        <p className="mt-6 font-display text-base font-medium uppercase tracking-[0.18em] text-laser-cyan/80 sm:text-lg md:text-xl">
          Your Idea. Your Innovation. Your Next Big Move.
        </p>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          Bring your startup ideas to life. Explore emerging technologies, identify
          real-world problems, and showcase your vision through CodezY Startup Pitch.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="btn-laser btn-pressed focus-cyan group inline-flex items-center justify-center gap-2 border border-laser-cyan/50 bg-laser-cyan/10 px-8 py-4 font-display text-base font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.35)] clip-angular-sm"
          >
            Initialize Registration
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#domains"
            className="btn-laser btn-pressed focus-cyan inline-flex items-center justify-center gap-2 border border-metallic/30 bg-gunmetal/40 px-8 py-4 font-display text-base font-semibold uppercase tracking-wider text-text-primary transition-all hover:border-metallic/60 hover:bg-gunmetal/60 clip-angular-sm"
          >
            Explore Domains
            <ChevronDown className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-secondary">
            Scroll
          </span>
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-metallic/30 p-1">
            <div className="h-2 w-1 rounded-full bg-laser-cyan animate-float" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
