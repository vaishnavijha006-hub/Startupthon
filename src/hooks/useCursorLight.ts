import { useEffect, useRef } from 'react';

interface CursorPos {
  x: number;
  y: number;
}

/**
 * Tracks the pointer position and writes it to CSS custom properties on
 * the document root (--cursor-x, --cursor-y, --cursor-active).
 *
 * Uses requestAnimationFrame + lerp for smooth trailing. No React
 * re-renders are triggered on pointer move — everything is done via
 * direct DOM style writes.
 *
 * Disabled on touch-only devices and when prefers-reduced-motion is set.
 */
export function useCursorLight() {
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef<CursorPos>({ x: 0, y: 0 });
  const currentRef = useRef<CursorPos>({ x: 0, y: 0 });
  const trailPositionsRef = useRef<CursorPos[]>([]);
  const hasPointerRef = useRef(false);

  useEffect(() => {
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 768px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || reduceMotion) {
      document.documentElement.style.setProperty('--cursor-active', '0');
      document.documentElement.style.setProperty('--cursor-x', '50vw');
      document.documentElement.style.setProperty('--cursor-y', '50vh');
      document.documentElement.style.setProperty('--cursor-trail-1-x', '50vw');
      document.documentElement.style.setProperty('--cursor-trail-1-y', '50vh');
      document.documentElement.style.setProperty('--cursor-trail-2-x', '50vw');
      document.documentElement.style.setProperty('--cursor-trail-2-y', '50vh');
      document.documentElement.style.setProperty('--cursor-trail-3-x', '50vw');
      document.documentElement.style.setProperty('--cursor-trail-3-y', '50vh');
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--cursor-active', '1');

    // Trail max length (3 trail points behind current)
    const TRAIL_LEN = 3;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      hasPointerRef.current = true;
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerLeave = () => {
      hasPointerRef.current = false;
      root.style.setProperty('--cursor-active', '0');
    };

    const onPointerEnter = () => {
      hasPointerRef.current = true;
      root.style.setProperty('--cursor-active', '1');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('pointerenter', onPointerEnter);

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;

      // Lerp factor — lower = more lag/trail feel
      const lerp = 0.18;
      current.x += (target.x - current.x) * lerp;
      current.y += (target.y - current.y) * lerp;

      // Write smoothed position
      root.style.setProperty('--cursor-x', `${current.x}px`);
      root.style.setProperty('--cursor-y', `${current.y}px`);

      // Manage trail history — push current, cap length
      trailPositionsRef.current.push({ x: current.x, y: current.y });
      if (trailPositionsRef.current.length > TRAIL_LEN + 1) {
        trailPositionsRef.current.shift();
      }

      const trail = trailPositionsRef.current;
      for (let i = 0; i < TRAIL_LEN; i++) {
        const idx = Math.max(0, trail.length - 1 - (i + 1));
        const pos = trail[idx] || current;
        root.style.setProperty(`--cursor-trail-${i + 1}-x`, `${pos.x}px`);
        root.style.setProperty(`--cursor-trail-${i + 1}-y`, `${pos.y}px`);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('pointerenter', onPointerEnter);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      root.style.setProperty('--cursor-active', '0');
    };
  }, []);
}
