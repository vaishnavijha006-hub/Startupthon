import { useCursorLight } from '@/hooks/useCursorLight';

/**
 * Decorative overlay that renders the cursor-following light, metallic
 * reflection, and energy trail. Sits behind all interactive content
 * (z-1, pointer-events-none). The hook writes CSS custom properties
 * on :root; this component consumes them.
 */
function CursorLight() {
  useCursorLight();

  return (
    <div className="cursor-light-layer pointer-events-none fixed inset-0 z-[1]" aria-hidden="true">
      {/* Main cursor illumination — soft cyan core with blue/violet edges */}
      <div className="cursor-light-main" />

      {/* Metallic reflection — reveals brushed-steel texture under the light */}
      <div className="cursor-light-metallic" />

      {/* Energy trail — 3 fading positions behind cursor */}
      <div className="cursor-light-trail cursor-light-trail-1" />
      <div className="cursor-light-trail cursor-light-trail-2" />
      <div className="cursor-light-trail cursor-light-trail-3" />

      {/* Circuit reveal — subtle grid brightening near cursor */}
      <div className="cursor-light-circuit" />
    </div>
  );
}

export default CursorLight;
