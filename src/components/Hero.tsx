import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.headline', {
        y: 60,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: heroRef.current!,
          start: 'top 80%',
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={heroRef}
      className="relative min-h-screen bg-gradient-to-b from-[#111] to-black"
    >
      <h1 className="headline text-white text-6xl md:text-8xl font-bold pt-48 px-8">
        Your&nbsp;Company ↗
      </h1>
      {/* …rest of the landing content… */}
    </header>
  );
}
