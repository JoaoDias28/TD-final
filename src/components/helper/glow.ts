// glow.ts ------------------------------------------------------------------
export function addGlowPulse(tl: gsap.core.Timeline, targets: NodeListOf<SVGPathElement>) {
    tl.to(targets, {
      filter: 'drop-shadow(0 0 0.3px currentColor)',
      duration: 0.25,
      ease: 'power1.inOut',
      repeat: 1,
      yoyo: true,
    }, '>'); // after previous tween
  }
  