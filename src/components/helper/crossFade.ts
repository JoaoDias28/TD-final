// helper/xFade.ts -----------------------------------------------------------
import { gsap } from 'gsap';

/**
 * Fade out the given element while the caller brings the next
 * screen in.  Duration kept tiny so loader remains snappy.
 */
export function crossFadeOut(
  el: HTMLElement,
  duration = 0.35,
  ease = 'power1.out',
) {
  return gsap.to(el, { opacity: 0, duration, ease, pointerEvents: 'none' });
}
