import { useLayoutEffect, useRef, type JSX } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Logo from '../assets/intro/logo.svg?react';
import type { Themes } from './Intro'; // Import the Themes type from Intro

interface HeroProps {
  themes?: Themes; // Optional themes from Intro component
}

export default function Hero({ themes }: HeroProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const logoSvgRef = useRef<SVGSVGElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const imagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  // We'll use this to track our image elements
  const imageElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!heroRef.current || !navRef.current || !logoSvgRef.current || !headlineRef.current || !imagesContainerRef.current) {
      return;
    }
    
    const validImages = imageElementsRef.current.filter(el => el !== null) as HTMLDivElement[];
    if (validImages.length === 0) return;

    const tl = gsap.timeline();

    // Initial states
    gsap.set(navRef.current, { yPercent: -100, opacity: 0 });
    gsap.set(logoSvgRef.current, { scale: 0.5, opacity: 0, transformOrigin: 'center center' });
    gsap.set(headlineRef.current, { y: 60, opacity: 0 });
    
    // Set all images to start from center (as if they were stacked from Intro)
    gsap.set(validImages, { 
      x: '50vw', 
      y: '50vh', 
      xPercent: -50,
      yPercent: -50,
      scale: 0.8, 
      opacity: 0.8, 
      transformOrigin: 'center center',
      rotation: 0
    });

    // First animate the images spreading out
    tl.to(validImages, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      stagger: 0.1,
      ease: 'power3.out',
      x: (i) => {
        // Create a spread pattern based on index
        const positions = [
          '20vw', '80vw', '30vw', 
          '70vw', '25vw', '75vw'
        ];
        return positions[i % positions.length];
      },
      y: (i) => {
        // Vertical positions
        const positions = [
          '25vh', '30vh', '70vh', 
          '75vh', '45vh', '60vh'
        ];
        return positions[i % positions.length];
      },
      rotation: (i) => (i % 2 === 0 ? -8 : 8), // Alternate rotation
    })
    
    // Then animate in the UI elements
    .to(navRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, "-=0.5")
    .to(logoSvgRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)',
    }, "<0.2")
    .to(headlineRef.current, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
    }, "<0.3");

    return () => {
      tl.kill();
    };
  }, { scope: heroRef });

  // Prepare image elements based on themes or use placeholders
  const renderImages = () => {
    if (themes) {
      // If themes are provided, create images from theme data
      const allImages: JSX.Element[] = [];
      
      Object.entries(themes).forEach(([themeId, frames], themeIndex) => {
        // Take first image from each theme
        if (frames.length > 0) {
          const frame = frames[0];
          const src = typeof frame === 'string' 
            ? frame 
            : 'source' in frame 
              ? typeof frame.source === 'string' ? frame.source : frame.source.img.src
              : 'img' in frame ? frame.img.src : '';
          
          const alt = typeof frame === 'object' && 'alt' in frame ? frame.alt : `Theme ${themeId} image`;
          
          allImages.push(
            <div
              key={`theme-${themeId}`}
              ref={(el) => { imageElementsRef.current[themeIndex] = el; }}
              className="absolute w-40 h-60 md:w-48 md:h-72 rounded-lg shadow-xl overflow-hidden"
              style={{ opacity: 0 }}
            >
              <img 
                src={src} 
                alt={alt}
                className="w-full h-full object-cover"
              />
            </div>
          );
        }
      });
      
      return allImages;
    } else {
      // Use placeholders if no themes provided
      return [...Array(6)].map((_, i) => (
        <div
          key={i}
          ref={(el) => { imageElementsRef.current[i] = el; }}
          className="absolute w-40 h-60 md:w-48 md:h-72 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700"
          style={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-500 text-sm">Visual Element {i + 1}</span>
          </div>
        </div>
      ));
    }
  };

  return (
    <header
      ref={heroRef}
      className="relative min-h-screen bg-gradient-to-b from-[#111] to-black text-white overflow-hidden"
    >
      <nav 
        ref={navRef} 
        className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex items-center justify-between bg-black bg-opacity-25 backdrop-blur-md"
      >
        <div className="logo-container">
          <Logo ref={logoSvgRef} className="h-8 md:h-10 w-auto" />
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-24 md:pt-32 px-4 md:px-8">
        <h1 ref={headlineRef} className="text-5xl md:text-7xl lg:text-8xl font-bold text-center z-20">
          Your&nbsp;Company&nbsp;↗
        </h1>
        
        <div ref={imagesContainerRef} className="absolute inset-0 overflow-hidden">
          {renderImages()}
        </div>
      </div>
    </header>
  );
}