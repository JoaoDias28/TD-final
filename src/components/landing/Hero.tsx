import React, { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { Picture } from "vite-imagetools";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Navbar from "../navigation/Navbar";
import MarqueeSection from "./sections/MarqueeSection";
import HorizontalScroll from "./sections/HorizontalScroll";

// Register GSAP plugins safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText, ScrollToPlugin);
}


// Percentage of the SVG path to reveal instantly on load.
const INITIAL_PATH_REVEAL_PERCENTAGE = 0.05;


const getImageUrl = (image: string | Picture): string => {
  if (typeof image === "string") return image;
  if (image && typeof image === "object") {
    if (
      image.sources &&
      Array.isArray(image.sources.jpeg) &&
      image.sources.jpeg.length > 0
    ) {
      return image.sources.jpeg[image.sources.jpeg.length - 1].src;
    }
    if (image.img?.src) return image.img.src;
    // @ts-ignore
    if (image.img && typeof image.img === "object" && image.img.src && typeof image.img.src === "string") {
        // @ts-ignore
      return image.img.src;
    }
  }
  return "";
};

interface HeroProps {
  themes: Record<string, (string | Picture)[]>;
  introComplete: boolean;
  onNavClick?: (section: string) => void;
}

const MAX_STACK_SIZE = 4;
const IMAGE_CYCLE_INTERVAL = 7000;

const targetImagePositions = [
  { x: 0, y: -15, z: 0, rotation: -4 },
  { x: 45, y: 25, z: -70, rotation: 6 },
  { x: -50, y: -35, z: -140, rotation: -7 },
  { x: 25, y: 55, z: -210, rotation: 5 },
];

const Hero: React.FC<HeroProps> = ({ themes, introComplete, onNavClick }) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const diagonalScrollRef = useRef<HTMLDivElement>(null);
  const rightImageStackRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const decorativeBlob1Ref = useRef<HTMLDivElement>(null);
  const decorativeBlob2Ref = useRef<HTMLDivElement>(null);

  const imageItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nextImageToShowMasterIndexRef = useRef(0);
  const [imageCycleTrigger, setImageCycleTrigger] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const cycleIntervalIdRef = useRef<number | null>(null);
  const cycledImageCountRef = useRef(0);
  const hasCompletedFullCycleRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const allImages = Object.values(themes)
    .flat()
    .map(getImageUrl)
    .filter(Boolean);

  const numImagesToDisplayInStack = Math.min(MAX_STACK_SIZE, allImages.length);
  const initialStackImageUrls = allImages.slice(0, numImagesToDisplayInStack);

  useEffect(() => {
    if (allImages.length === 0) {
      setIsLoaded(true);
      return;
    }
    let isMounted = true;
    const imagePromises = allImages.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    });
    Promise.all(imagePromises).then(() => { if(isMounted) setIsLoaded(true); });
    const timeoutId = setTimeout(() => { if (!isLoaded && isMounted) setIsLoaded(true); }, 5000);
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [allImages, isLoaded]);

  useEffect(() => {
    if (!introComplete || allImages.length === 0) {
      hasCompletedFullCycleRef.current = false;
      cycledImageCountRef.current = 0;
      if (cycleIntervalIdRef.current !== null) {
        clearInterval(cycleIntervalIdRef.current);
        cycleIntervalIdRef.current = null;
      }
    }
  }, [introComplete, allImages.length]);

  useEffect(() => {
    if (cycleIntervalIdRef.current !== null) {
      clearInterval(cycleIntervalIdRef.current);
      cycleIntervalIdRef.current = null;
    }
    if (!isLoaded || !introComplete || allImages.length <= numImagesToDisplayInStack || numImagesToDisplayInStack < 2 || hasCompletedFullCycleRef.current) {
      return;
    }
    cycleIntervalIdRef.current = window.setInterval(() => {
      if (hasCompletedFullCycleRef.current) {
        if (cycleIntervalIdRef.current !== null) clearInterval(cycleIntervalIdRef.current);
        cycleIntervalIdRef.current = null;
        return;
      }
      setImageCycleTrigger(prev => prev + 1);
    }, IMAGE_CYCLE_INTERVAL);
    return () => { if (cycleIntervalIdRef.current !== null) clearInterval(cycleIntervalIdRef.current); };
  }, [isLoaded, introComplete, allImages.length, numImagesToDisplayInStack]);

  const applyFloatingAnimations = useCallback((elementsToAnimate: (HTMLDivElement | null)[]) => {
    const validElements = elementsToAnimate.filter(Boolean) as HTMLDivElement[];
    gsap.killTweensOf(validElements, "floating");
    validElements.forEach((el) => {
      if (!el || !el.dataset.stackIndex) return;
      const stackIndex = parseInt(el.dataset.stackIndex, 10);
      const basePos = targetImagePositions[stackIndex];
      if (!basePos) return;
      gsap.to(el, {
        y: basePos.y + (stackIndex % 2 === 0 ? (6 + Math.random()*4) : (-6 - Math.random()*4)),
        rotation: basePos.rotation + (Math.random() * 2 - 1),
        duration: 4 + Math.random() * 2,
        repeat: -1, yoyo: true, ease: "sine.inOut", id: `floating-${stackIndex}`, overwrite: "auto", 
      });
    });
  }, []);

  useGSAP(
    () => {
      if (!introComplete || !isLoaded || typeof window === "undefined" || !heroSectionRef.current || !mainContainerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 }});
      tl.to(heroSectionRef.current, { opacity: 1, visibility: "visible", duration: 0.5 });

      if (titleRef.current) {
        const splitTitle = new SplitText(titleRef.current, { type: "chars, words" });
        gsap.set(titleRef.current, { visibility: "visible" });
        tl.from(splitTitle.chars, { opacity: 0, y: 60, rotateX: -45, stagger: 0.03, duration: 0.8 }, "-=0.2");
      }
      
      if (rightImageStackRef.current && heroSectionRef.current && numImagesToDisplayInStack > 0) {
        const stackElements = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];
        stackElements.forEach((el, index) => {
          el.dataset.stackIndex = String(index); 
          const initialPos = targetImagePositions[index];
          gsap.set(el, {
            x: initialPos.x + (index % 2 === 0 ? 250 : -250), y: initialPos.y + (index % 2 === 0 ? -200 : 200),
            rotation: initialPos.rotation + (index % 2 === 0 ? 45 : -45), scale: 0.3, opacity: 0,
            zIndex: MAX_STACK_SIZE - index, transformOrigin: "center center",
          });
        });
        tl.to(stackElements, {
          opacity: 1, scale: 1, x: i => targetImagePositions[i]?.x || 0, y: i => targetImagePositions[i]?.y || 0,
          z: i => targetImagePositions[i]?.z || 0, rotation: i => targetImagePositions[i]?.rotation || 0,
          stagger: { amount: 0.7, from: "end", ease: "power2.out" }, duration: 1.4,
        }, "-=0.7");
        tl.call(() => applyFloatingAnimations(stackElements), [], ">-0.5");
        nextImageToShowMasterIndexRef.current = numImagesToDisplayInStack % allImages.length;
        if (allImages.length === 0) nextImageToShowMasterIndexRef.current = 0;

        const heroElementForParallax = heroSectionRef.current;
        mouseMoveHandlerRef.current = (e: MouseEvent) => {
          if (!heroElementForParallax) return;
          const rect = heroElementForParallax.getBoundingClientRect();
          const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
          const centerX = rect.width / 2; const centerY = rect.height / 2;
          const dX = (mouseX - centerX) * 0.025; const dY = (mouseY - centerY) * 0.025;
          const currentElementsInStackOrder = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];
          gsap.to(currentElementsInStackOrder, {
            x: (_, targetEl) => { const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10); return (targetImagePositions[sIdx]?.x || 0) + dX * ((MAX_STACK_SIZE - sIdx) * 0.25 + 0.5); },
            y: (_, targetEl) => { const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10); return (targetImagePositions[sIdx]?.y || 0) + dY * ((MAX_STACK_SIZE - sIdx) * 0.25 + 0.5); },
            rotation: (_, targetEl) => { const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10); return (targetImagePositions[sIdx]?.rotation || 0) + dX * (sIdx % 2 === 0 ? -0.06 : 0.06) * ((MAX_STACK_SIZE - sIdx) * 0.15 + 0.4); },
            duration: 0.8, ease: "power2.out", overwrite: "auto", id: "parallaxAnimation"
          });
        };
        heroElementForParallax.addEventListener("mousemove", mouseMoveHandlerRef.current);
      }

       if (diagonalScrollRef.current) {
        const marqueeItems = gsap.utils.toArray<HTMLDivElement>(diagonalScrollRef.current.querySelectorAll(".diagonal-item"));
        tl.from(diagonalScrollRef.current, { opacity: 0, duration: 1.2, ease: "power3.inOut",}, "-=0.8");
        gsap.from(marqueeItems, { opacity: 0, y: 50, stagger: 0.1, delay: tl.duration() - 1.2, duration: 0.8, });
        const marqueeContent = diagonalScrollRef.current.querySelector(".marquee-inner") as HTMLDivElement;
        if (marqueeContent) {
           const contentWidth = marqueeContent.scrollWidth / 2;
           if (contentWidth > 0) { gsap.set(marqueeContent, { x: 0 }); gsap.to(marqueeContent, { x: `-${contentWidth}px`, duration: 30, repeat: -1, ease: "none",}); }
        }
      }
      if (decorativeBlob1Ref.current && decorativeBlob2Ref.current) {
        tl.from([decorativeBlob1Ref.current, decorativeBlob2Ref.current], { opacity: 0, scale: 0.5, duration: 1.5, stagger: 0.3,}, "-=1");
        gsap.to(decorativeBlob1Ref.current, { yPercent: -30, ease: "none", scrollTrigger: { trigger: heroSectionRef.current, start: "top top", end: "bottom top", scrub: 1.5,},});
        gsap.to(decorativeBlob2Ref.current, { yPercent: 20, ease: "none", scrollTrigger: { trigger: heroSectionRef.current, start: "top top", end: "bottom top", scrub: 1,},});
      }
      if (scrollIndicatorRef.current) {
        tl.fromTo(scrollIndicatorRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.75)" },"-=0.3");
        const bounceDot = scrollIndicatorRef.current.querySelector(".scroll-bounce-dot");
        if (bounceDot) gsap.to(bounceDot, { y: "0.75rem", repeat: -1, yoyo: true, ease: "sine.inOut", duration: 0.6,});
      }
      if (textContentRef.current && heroSectionRef.current) {
        ScrollTrigger.create({ trigger: heroSectionRef.current, start: "top top", end: "bottom top", pin: textContentRef.current, pinSpacing: false,});
      }

      
        // Initial position of the follower
      
      return () => {
        if (heroSectionRef.current && mouseMoveHandlerRef.current) {
          heroSectionRef.current.removeEventListener("mousemove", mouseMoveHandlerRef.current);
        }
        // ScrollTriggers are automatically killed by useGSAP's cleanup
      };
    }, { 
        scope: mainContainerRef, 
        dependencies: [ introComplete, isLoaded, numImagesToDisplayInStack, applyFloatingAnimations, isDesktop ] 
    }
  );

  useGSAP(() => {
    if (!introComplete || !isLoaded || imageCycleTrigger === 0 || numImagesToDisplayInStack < 2 || allImages.length <= numImagesToDisplayInStack || hasCompletedFullCycleRef.current) {
      return;
    }
    const currentElementsInStack = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (currentElementsInStack.length !== numImagesToDisplayInStack || !rightImageStackRef.current) return;
    const frontElement = currentElementsInStack.find(el => parseInt(el.dataset.stackIndex || "-1", 10) === 0);
    if (!frontElement) return;

    const newImageURLForBack = allImages[nextImageToShowMasterIndexRef.current];
    const cycleTl = gsap.timeline();

    if (heroSectionRef.current && mouseMoveHandlerRef.current) heroSectionRef.current.removeEventListener("mousemove", mouseMoveHandlerRef.current);
    // Kill specific animations by ID or all animations on the elements
    currentElementsInStack.forEach((el, index) => {
      gsap.killTweensOf(el, `floating-${index},parallaxAnimation`); // Kill by specific IDs
    });


    const backTargetPos = targetImagePositions[numImagesToDisplayInStack - 1];
    cycleTl.to(frontElement, {
      x: backTargetPos.x, y: backTargetPos.y, z: backTargetPos.z - 60, 
      rotation: backTargetPos.rotation, opacity: 0.5, scale: 0.75, duration: 0.8, ease: "power2.inOut",
    });
    currentElementsInStack.forEach(el => {
      if (el === frontElement) return;
      const currentStackIdx = parseInt(el.dataset.stackIndex || "0", 10);
      const newStackIdx = currentStackIdx - 1;
      if (newStackIdx >= 0 && targetImagePositions[newStackIdx]) {
        cycleTl.to(el, { ...targetImagePositions[newStackIdx], duration: 0.8, ease: "power2.inOut" }, "<");
      }
    });
    cycleTl.call(() => {
      const imgTag = frontElement.querySelector('img');
      if (imgTag && newImageURLForBack) { imgTag.src = newImageURLForBack; imgTag.alt = `Showcase content ${nextImageToShowMasterIndexRef.current + 1}`; }
      if (allImages.length > numImagesToDisplayInStack) cycledImageCountRef.current += 1;
      nextImageToShowMasterIndexRef.current = (nextImageToShowMasterIndexRef.current + 1) % allImages.length;
      const newOrderedElements: HTMLDivElement[] = new Array(numImagesToDisplayInStack);
      currentElementsInStack.forEach(el => {
        let newIndex = (el === frontElement) ? numImagesToDisplayInStack - 1 : parseInt(el.dataset.stackIndex || "0", 10) - 1;
        el.dataset.stackIndex = String(newIndex);
        el.style.zIndex = String(MAX_STACK_SIZE - newIndex);
        if (newIndex >= 0 && newIndex < numImagesToDisplayInStack) newOrderedElements[newIndex] = el;
      });
      imageItemRefs.current = newOrderedElements.filter(Boolean);
      applyFloatingAnimations(imageItemRefs.current);
      if (heroSectionRef.current && mouseMoveHandlerRef.current) heroSectionRef.current.addEventListener("mousemove", mouseMoveHandlerRef.current);
      const uniqueImagesToCycleThrough = allImages.length - numImagesToDisplayInStack;
      if (allImages.length > numImagesToDisplayInStack && cycledImageCountRef.current >= uniqueImagesToCycleThrough) {
          if (!hasCompletedFullCycleRef.current) { 
            hasCompletedFullCycleRef.current = true;
            if (cycleIntervalIdRef.current !== null) { clearInterval(cycleIntervalIdRef.current); cycleIntervalIdRef.current = null; }
          }
      }
    });
    cycleTl.to(frontElement, { ...backTargetPos, opacity: 1, scale: 1, duration: 0.7, ease: "power2.out", }, ">-0.2");
  }, { dependencies: [imageCycleTrigger, introComplete, isLoaded, allImages.length, numImagesToDisplayInStack, applyFloatingAnimations], scope: rightImageStackRef });

  const handleNavClick = (section: string) => { onNavClick?.(section); };
  useEffect(() => { imageItemRefs.current = imageItemRefs.current.slice(0, numImagesToDisplayInStack); }, [numImagesToDisplayInStack]);

  return (
    <>
      <Navbar introComplete={introComplete} onNavClick={handleNavClick} />
      <div ref={mainContainerRef} className="relative">
      

        <section
          ref={heroSectionRef}
          id="top"
          className="relative w-full min-h-screen flex flex-col md:flex-row items-center justify-center overflow-hidden opacity-0 invisible pt-0 md:pt-0 pb-48"
          style={{ willChange: "opacity, transform" }}
        >
          <div
            ref={textContentRef}
            className="w-full md:w-1/2 flex flex-col justify-center items-start p-8 md:pl-16 lg:pl-24 xl:pl-32 z-20 relative" // text content above SVG path by default z-index
          >
            <h1
              ref={titleRef}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight invisible"
            >
              Construimos <br />
              <span className="text-red-500">oportunidades</span>
            </h1>
          </div>

          <div className="w-full md:w-1/2 h-[50vh] md:h-screen flex items-center justify-center md:justify-start z-10 p-4 md:p-0"> {/* Image stack potentially below SVG (z-10 vs z-5) */}
            {isLoaded ? (
            <div
            ref={rightImageStackRef}
            className="
              relative
              w-[300px] h-[200px]
              sm:w-[480px] sm:h-[360px]
              md:w-[560px] md:h-[420px]
              lg:w-[600px] lg:h-[480px]
            "
            style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          >
                {initialStackImageUrls.map((imageUrl, index) => (
                  <div
                    key={`img-stack-item-${index}-${imageUrl}`}
                    ref={el => { if (el) imageItemRefs.current[index] = el; }}
                    className="image-stack-item absolute w-full h-full overflow-hidden rounded-xl shadow-2xl border-2 border-neutral-700/60"
                    style={{ willChange: "transform, opacity", zIndex: MAX_STACK_SIZE - index }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Showcase ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading={index < 2 ? "eager" : "lazy"} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
              </div>
            )}
          </div>
          
          <div ref={decorativeBlob1Ref} className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-red-700/30 rounded-full filter blur-[100px] md:blur-[150px] opacity-0 z-0"></div>
          <div ref={decorativeBlob2Ref} className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-gray-600/20 rounded-full filter blur-[100px] md:blur-[150px] opacity-0 z-0"></div>

        
        </section>

     
       <HorizontalScroll />
         <MarqueeSection />
      </div>
    </>
  );
};

export default Hero;