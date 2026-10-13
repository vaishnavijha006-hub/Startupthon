import { useEffect, useRef } from 'react';

// Key intersection/vertex points in SVG coordinates (viewBox 0 0 1440 900)
const LASER_NODES: { cx: number; cy: number; r: number }[] = [
  { cx: 400, cy: 150, r: 4 },
  { cx: 550, cy: 300, r: 4 },
  { cx: 900, cy: 300, r: 4 },
  { cx: 1050, cy: 450, r: 4 },
  { cx: 200, cy: 250, r: 3.5 },
  { cx: 350, cy: 400, r: 3.5 },
  { cx: 350, cy: 650, r: 3.5 },
  { cx: 500, cy: 800, r: 3.5 },
  { cx: 1200, cy: 200, r: 4 },
  { cx: 1050, cy: 350, r: 4 },
  { cx: 1050, cy: 550, r: 4 },
  { cx: 900, cy: 700, r: 4 },
  { cx: 250, cy: 750, r: 3.5 },
  { cx: 700, cy: 600, r: 3.5 },
  { cx: 1100, cy: 450, r: 3.5 },
  { cx: 1250, cy: 300, r: 3.5 },
  { cx: 450, cy: 230, r: 3.5 },
  { cx: 750, cy: 230, r: 3.5 },
  { cx: 950, cy: 670, r: 3.5 },
  { cx: 650, cy: 670, r: 3.5 },
  { cx: 100, cy: 150, r: 3 },
  { cx: 300, cy: 350, r: 3 },
  { cx: 300, cy: 500, r: 3 },
  { cx: 500, cy: 700, r: 3 },
  { cx: 1340, cy: 700, r: 3 },
  { cx: 1140, cy: 500, r: 3 },
  { cx: 1140, cy: 350, r: 3 },
  { cx: 940, cy: 150, r: 3 },
];

function LaserBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reactivePathsRef = useRef<SVGPathElement[]>([]);
  const reactiveNodesRef = useRef<SVGCircleElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const cursorRef = useRef({ x: -9999, y: -9999 });

  // Existing mobile/reduced-motion handling
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');

    const update = () => {
      if (!containerRef.current) return;
      const layers = containerRef.current.querySelectorAll<HTMLElement>('[data-mobile-reduce]');
      layers.forEach((el) => {
        if (mq.matches) {
          el.style.animationDuration = '0s';
          el.style.opacity = '0.3';
        } else {
          el.style.animationDuration = '';
          el.style.opacity = '';
        }
      });
    };

    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Cursor proximity reactivity for laser paths and nodes
  useEffect(() => {
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 768px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || reduceMotion || !svgRef.current) return;

    const svg = svgRef.current;

    // Collect reactive paths (the animated gradient strokes)
    reactivePathsRef.current = Array.from(
      svg.querySelectorAll<SVGPathElement>('[data-reactive]'),
    );
    reactiveNodesRef.current = Array.from(
      svg.querySelectorAll<SVGCircleElement>('[data-node-reactive]'),
    );

    const PROXIMITY_RADIUS = 220; // SVG units

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const animate = () => {
      // Convert cursor screen position to SVG coordinates
      const rect = svg.getBoundingClientRect();
      const scaleX = 1440 / rect.width;
      const scaleY = 900 / rect.height;
      const cursorSvgX = (cursorRef.current.x - rect.left) * scaleX;
      const cursorSvgY = (cursorRef.current.y - rect.top) * scaleY;

      // Update reactive paths
      for (const path of reactivePathsRef.current) {
        const mid = path.dataset.midX && path.dataset.midY
          ? { x: parseFloat(path.dataset.midX), y: parseFloat(path.dataset.midY) }
          : null;
        if (!mid) continue;

        const dist = Math.hypot(cursorSvgX - mid.x, cursorSvgY - mid.y);
        const proximity = Math.max(0, 1 - dist / PROXIMITY_RADIUS);
        const baseOpacity = parseFloat(path.dataset.baseOpacity || '0.5');
        const boostedOpacity = baseOpacity + proximity * 0.4;
        path.style.opacity = String(boostedOpacity);

        // Add temporary glow filter intensity via CSS filter
        if (proximity > 0.05) {
          path.style.filter = `drop-shadow(0 0 ${4 + proximity * 8}px rgba(0, 229, 255, ${proximity * 0.6}))`;
        } else {
          path.style.filter = '';
        }
      }

      // Update reactive nodes
      for (const node of reactiveNodesRef.current) {
        const cx = parseFloat(node.dataset.cx || '0');
        const cy = parseFloat(node.dataset.cy || '0');
        const dist = Math.hypot(cursorSvgX - cx, cursorSvgY - cy);
        const proximity = Math.max(0, 1 - dist / PROXIMITY_RADIUS);
        const baseR = parseFloat(node.dataset.baseR || '3');
        node.setAttribute('r', String(baseR + proximity * 3));
        node.style.opacity = String(0.4 + proximity * 0.6);
        node.style.filter = proximity > 0.1
          ? `drop-shadow(0 0 ${3 + proximity * 6}px rgba(0, 229, 255, ${proximity * 0.7}))`
          : '';
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary" />

      {/* Circuit grid */}
      <div className="absolute inset-0 circuit-bg opacity-50" />

      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(8,11,18,0.8) 100%)' }} />

      {/* Laser SVG layers */}
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrow-cyan" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#00E5FF" />
          </marker>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#2563FF" />
          </marker>
          <marker id="arrow-violet" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill="#8B5CF6" />
          </marker>

          {/* Glow filters */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient strokes */}
          <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#2563FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#2563FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-violet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* === LAYER 1: Background laser roads (faint, slow) === */}
        <g data-mobile-reduce opacity="0.4">
          {/* Horizontal-ish roads turning at 45 and 90 degrees */}
          <path d="M0,150 L400,150 L550,300 L900,300 L1050,450 L1440,450"
            fill="none" stroke="#252D39" strokeWidth="1.5" opacity="0.6" />

          <path d="M0,150 L400,150 L550,300 L900,300 L1050,450 L1440,450"
            fill="none" stroke="url(#grad-cyan)" strokeWidth="2"
            strokeDasharray="8 4 20 4"
            filter="url(#glow-cyan)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.4"
            data-mid-x="720" data-mid-y="300"
            style={{ animation: 'arrow-travel 8s linear infinite' }} />

          {/* Downward road */}
          <path d="M200,0 L200,250 L350,400 L350,650 L500,800 L500,900"
            fill="none" stroke="#252D39" strokeWidth="1.5" opacity="0.5" />

          <path d="M200,0 L200,250 L350,400 L350,650 L500,800 L500,900"
            fill="none" stroke="url(#grad-blue)" strokeWidth="2"
            strokeDasharray="6 4 16 4"
            filter="url(#glow-blue)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.4"
            data-mid-x="350" data-mid-y="450"
            style={{ animation: 'arrow-travel 10s linear infinite reverse' }} />
        </g>

        {/* === LAYER 2: Mid-depth laser roads with arrows === */}
        <g data-mobile-reduce opacity="0.55">
          {/* Right-side downward road */}
          <path d="M1200,0 L1200,200 L1050,350 L1050,550 L900,700 L900,900"
            fill="none" stroke="#252D39" strokeWidth="2" opacity="0.5" />

          <path d="M1200,0 L1200,200 L1050,350 L1050,550 L900,700 L900,900"
            fill="none" stroke="url(#grad-cyan)" strokeWidth="2.5"
            markerMid="url(#arrow-cyan)"
            strokeDasharray="10 6 24 6"
            filter="url(#glow-cyan)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.55"
            data-mid-x="1050" data-mid-y="450"
            style={{ animation: 'arrow-travel 6s linear infinite' }} />

          {/* Left-side upward road */}
          <path d="M0,750 L250,750 L400,600 L700,600 L850,450 L1100,450 L1250,300 L1440,300"
            fill="none" stroke="#252D39" strokeWidth="2" opacity="0.4" />

          <path d="M0,750 L250,750 L400,600 L700,600 L850,450 L1100,450 L1250,300 L1440,300"
            fill="none" stroke="url(#grad-blue)" strokeWidth="2.5"
            markerMid="url(#arrow-blue)"
            strokeDasharray="10 6 24 6"
            filter="url(#glow-blue)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.5"
            data-mid-x="720" data-mid-y="525"
            style={{ animation: 'arrow-travel 7s linear infinite reverse' }} />
        </g>

        {/* === LAYER 3: Foreground laser arrows (bright, fast) === */}
        <g data-mobile-reduce opacity="0.7">
          {/* Top arrow sweeping right */}
          <path d="M0,80 L300,80 L450,230 L750,230 L900,80 L1440,80"
            fill="none" stroke="url(#grad-cyan)" strokeWidth="2.5"
            markerMid="url(#arrow-cyan)"
            strokeDasharray="12 8 28 8"
            filter="url(#glow-cyan)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.7"
            data-mid-x="720" data-mid-y="155"
            style={{ animation: 'arrow-travel 5s linear infinite' }} />

          {/* Bottom arrow sweeping left */}
          <path d="M1440,820 L1100,820 L950,670 L650,670 L500,820 L0,820"
            fill="none" stroke="url(#grad-cyan)" strokeWidth="2.5"
            markerMid="url(#arrow-cyan)"
            strokeDasharray="12 8 28 8"
            filter="url(#glow-cyan)"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.7"
            data-mid-x="720" data-mid-y="745"
            style={{ animation: 'arrow-travel 5.5s linear infinite reverse' }} />
        </g>

        {/* === LAYER 4: Violet accent trails === */}
        <g data-mobile-reduce opacity="0.5">
          <path d="M100,0 L100,150 L300,350 L300,500 L500,700 L500,900"
            fill="none" stroke="url(#grad-violet)" strokeWidth="2"
            markerMid="url(#arrow-violet)"
            strokeDasharray="8 6 20 6"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.4"
            data-mid-x="300" data-mid-y="450"
            style={{ animation: 'arrow-travel 9s linear infinite' }} />

          <path d="M1340,900 L1340,700 L1140,500 L1140,350 L940,150 L940,0"
            fill="none" stroke="url(#grad-violet)" strokeWidth="2"
            markerMid="url(#arrow-violet)"
            strokeDasharray="8 6 20 6"
            className="laser-reactive"
            data-reactive
            data-base-opacity="0.4"
            data-mid-x="1140" data-mid-y="450"
            style={{ animation: 'arrow-travel 11s linear infinite reverse' }} />
        </g>

        {/* === Static arrow shapes at key intersections === */}
        <g opacity="0.6">
          {/* Top-right corner arrows */}
          <g transform="translate(1380, 50) rotate(135)">
            <path d="M0,0 L20,10 L0,20 L5,10 Z" fill="#00E5FF" opacity="0.5" />
          </g>
          {/* Bottom-left corner arrows */}
          <g transform="translate(60, 850) rotate(-45)">
            <path d="M0,0 L20,10 L0,20 L5,10 Z" fill="#00E5FF" opacity="0.5" />
          </g>
          {/* Mid intersection */}
          <g transform="translate(900, 300) rotate(45)">
            <path d="M0,0 L16,8 L0,16 L4,8 Z" fill="#2563FF" opacity="0.4" />
          </g>
          <g transform="translate(350, 600) rotate(-135)">
            <path d="M0,0 L16,8 L0,16 L4,8 Z" fill="#8B5CF6" opacity="0.4" />
          </g>
        </g>

        {/* === Cursor-reactive circuit nodes === */}
        <g>
          {LASER_NODES.map((node, i) => (
            <circle
              key={i}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={i % 3 === 0 ? '#00E5FF' : i % 3 === 1 ? '#2563FF' : '#8B5CF6'}
              className="laser-reactive-glow"
              data-node-reactive
              data-cx={node.cx}
              data-cy={node.cy}
              data-base-r={node.r}
              style={{ opacity: 0.4, transition: 'r 0.3s ease, opacity 0.3s ease' }}
            />
          ))}
        </g>
      </svg>

      {/* Floating glow orbs for depth */}
      <div
        className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-laser-cyan/5 blur-3xl animate-glow-breath"
        data-mobile-reduce
      />
      <div
        className="absolute right-[15%] bottom-[15%] h-80 w-80 rounded-full bg-electric-blue/5 blur-3xl animate-glow-breath"
        style={{ animationDelay: '2s' }}
        data-mobile-reduce
      />
      <div
        className="absolute right-[40%] top-[40%] h-48 w-48 rounded-full bg-laser-violet/5 blur-3xl animate-glow-breath"
        style={{ animationDelay: '1s' }}
        data-mobile-reduce
      />
    </div>
  );
}

export default LaserBackground;
