import { useRef, useState, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { useGSAP } from '@gsap/react';

import Logo from '../assets/intro/logo.svg?react';
import { usePhase } from '../store/intro-phase';
import { addWavePulse } from './helper/wave';
import { addGlowPulse } from './helper/glow';
import type { Picture } from 'vite-imagetools';

gsap.registerPlugin(DrawSVGPlugin, MorphSVGPlugin, useGSAP);

// ─── Timing knobs ────
const DRAW_DURATION = 1.2;    // stroke‑on
const RISE_DURATION = 1.8;    // liquid rise
const BAR_TWEEN_SNAP = 0.05;  // progress bar step (5 %)
const EXIT_DURATION = 1.5;    // morph transition
const RISE_EASE = 'circ.out'; // softer finish

const ABS_MIN_DISPLAY = 3.0;  // 👈 hard floor (sec) – tweak here
const POST_LOAD_DELAY = 0.5;  // grace after fully loaded
const BASE_MIN_DISPLAY = 1.5; // baseline before per‑image padding
const PER_IMG_PADDING = 0.06; // sec added per asset (60 ms)

const toURL = (item: string | Picture) =>
  typeof item === 'string' ? item : item.img.src;

interface LoaderProps { 
  assets: (string | Picture)[];
  // Reference to intro container for morphing
  introContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function Loader({ assets, introContainerRef }: LoaderProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);

  const [done, setDone] = useState(false);
  const { setPhase } = usePhase();
  const mountTime = useRef(performance.now());

  // ────
  // 0. Respect "prefers‑reduced‑motion"
  // ────
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  // ────
  // 1. Master timeline – draw → rise → wave → glow
  // ────
  useGSAP(() => {
    if (prefersReduced) {
      // Skip anims, show final state
      const paths = logoRef.current?.querySelectorAll('path');
      if (paths?.length) {
        gsap.set(paths, { drawSVG: '0% 100%', clipPath: 'none', filter: 'none' });
      }
      return;
    }

    const paths = logoRef.current!.querySelectorAll<SVGPathElement>('path');

    gsap.set(paths, { drawSVG: '0% 0%', clipPath: 'inset(100% 0% 0% 0%)' });

    const tl = gsap.timeline({ id: 'loader' });

    tl.addLabel('draw')
      .to(paths, {
        drawSVG: '0% 100%',
        duration: DRAW_DURATION,
        ease: 'power2.inOut',
        stagger: 0.25,
      })
      .addLabel('rise', '-=0.05')
      .to(paths, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: RISE_DURATION,
        ease: RISE_EASE,
        stagger: 0.05,
      }, 'rise');

    // wave motion & depth pulse
    paths.forEach(el => addWavePulse(tl, el, RISE_DURATION));

    // glow pulse once filled
    addGlowPulse(tl, paths);

    // clear filter after glow
    tl.set(paths, { filter: 'none' });
  }, { scope: logoRef });

  // ────
  // 2. Pre‑load every image *manually* and flag `done` when all finished
  // ────
  useLayoutEffect(() => {
    const total = assets.length;
    if (!total) { setDone(true); return; }

    const snap = gsap.utils.snap(BAR_TWEEN_SNAP);
    const line = barRef.current!.querySelector('line')!;
    let loaded = 0;
    let disposed = false;

    const updateBar = () => {
      const ratio = snap(loaded / total);
      gsap.to(line, {
        drawSVG: `${ratio * 100}% 100%`,
        duration: 0.15,
        overwrite: 'auto',
      });
    };

    const tmp = document.createElement('div');
    tmp.style.display = 'none';
    document.body.appendChild(tmp);

    assets.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        if (disposed) return;
        loaded += 1;
        updateBar();
        if (loaded === total) {
          // one extra tick so GSAP can finish last tween before we setDone
          requestAnimationFrame(() => setDone(true));
        }
      };
      img.src = toURL(src);
      tmp.appendChild(img);
    });

    return () => {
      disposed = true;
      if (tmp.isConnected) tmp.remove();
    };
  }, [assets]);

  /* ---- */
  // 3. Morph logo and transition to intro with column animations
  /* ---- */
  useGSAP(() => {
    if (!wrapperRef.current || !done || prefersReduced) return;

    const elapsed = (performance.now() - mountTime.current) / 1000;
    const paddedFloor = BASE_MIN_DISPLAY + assets.length * PER_IMG_PADDING;
    const minDisplay = Math.max(ABS_MIN_DISPLAY, paddedFloor);

    const wait = Math.max(POST_LOAD_DELAY, minDisplay - elapsed);

    gsap.delayedCall(wait, () => {
      // Create transition timeline
      const transitionTl = gsap.timeline({
        onComplete: () => {
          setPhase('intro');
        }
      });

      // 1. First prepare the logo for morphing
      transitionTl.to(logoRef.current, {
        scale: 0.8,
        y: -20,
        duration: 0.5,
        ease: 'power2.inOut'
      });

      // 2. Fade out the progress bar
      transitionTl.to(barRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in'
      }, '<');

      // 3. Morph and expand the logo into columns
      if (introContainerRef?.current) {
        // Create placeholder columns that will grow from the logo
        const columnCount = 3; // Match the visible columns in Intro
        const columnContainer = document.createElement('div');
        columnContainer.className = 'absolute inset-0 flex justify-center items-center';
        if (wrapperRef.current) {
          wrapperRef.current.appendChild(columnContainer);
        }

        // Create placeholder columns
        for (let i = 0; i < columnCount; i++) {
          const column = document.createElement('div');
          column.className = 'morph-column bg-black';
          column.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0;
            border-radius: 4px;
            transform-origin: center bottom;
          `;
          columnContainer.appendChild(column);
        }

        const morphColumns = columnContainer.querySelectorAll('.morph-column');

        // Animate logo paths to morph into dots
        const paths = logoRef.current!.querySelectorAll<SVGPathElement>('path');
        transitionTl.to(paths, {
          morphSVG: "circle(5px at center)",
          fill: "#ffffff",
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.inOut"
        }, '>-0.2');

        // Fade in and position the column placeholders
        transitionTl.to(morphColumns, {
          opacity: 1,
          duration: 0.3,
          stagger: 0.1,
          ease: "power2.out"
        }, '>-0.4');

        // Expand columns from bottom
        transitionTl.to(morphColumns, {
          width: `${100 / columnCount}%`,
          height: '100%',
          y: 0,
          borderRadius: 0,
          stagger: {
            each: 0.1,
            from: "center"
          },
          duration: 0.8,
          ease: "power2.inOut"
        }, '>-0.2');

        // Fade out the logo as columns grow
        transitionTl.to(logoRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in"
        }, '<');

        // Fade out the wrapper to reveal the intro
        transitionTl.to(wrapperRef.current, {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.inOut"
        }, '>-0.2');
      } else {
        // Fallback if intro container ref is not available
        transitionTl.to(wrapperRef.current, {
          yPercent: -102,
          duration: EXIT_DURATION,
          ease: 'back.in(0.9)'
        }, '>');
      }
    });
  }, { scope: wrapperRef, dependencies: [done, assets.length] });

  // ─── Render ────
  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-50 flex w-screen h-screen flex-col items-center justify-center text-white"
    >
      <div ref={logoContainerRef} className="relative">
        <Logo
          ref={logoRef}
          viewBox="0 0 120 77"
          className="w-full h-full max-h-none shrink-3 mt-6 mb-6"
        />
      </div>

      <svg ref={barRef} className="w-40 h-32" aria-hidden="true">
        <line
          x1="0" y1="1"
          x2="100" y2="1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}