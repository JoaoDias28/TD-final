// wave.ts ------------------------------------------------------------------

export function addWavePulse(
  tl: gsap.core.Timeline,
  el: SVGElement,
  riseDuration: number,
) {
  // subtle vertical wobble + soft depth‑shadow, keeps original fill untouched
  tl.to(
    el,
    {
      keyframes: [
        { clipPath: 'inset(1.5% 0% -1.5% 0%)', duration: riseDuration / 4 },
        { clipPath: 'inset(-0.75% 0% 0.75% 0%)', duration: riseDuration / 4 },
        { clipPath: 'inset(0.75% 0% -0.75% 0%)', duration: riseDuration / 4 },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: riseDuration / 4 },
      ],
      ease: 'sine.inOut',
    },
    '<', // start with the rise tween
  );

  // depth pulse (tiny drop‑shadow that breathes in/out)
  tl.to(
    el,
    {
      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))',
      duration: riseDuration / 6,
      repeat: 1,
      yoyo: true,
      ease: 'sine.inOut',
    },
    '<', // run concurrently with the first wobble frame
  );
}
