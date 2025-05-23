// src/components/MarqueeSection.tsx
import React, { useRef, useState, useEffect } from "react";
import Marquee from "../components/Marquee"; // Adjust path
import useMediaQuery from "../../../hooks/useMediaQuery"; // Adjust path
// ⬆️ MarqueeSection.tsx – add after the other imports
import type { MarqueeControls } from "../components/Marquee";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Flip);


// --- IMAGE PATHS ---
// Assuming these images are in your `public` folder or you'll import them
// If in public: public/intro/images/outdoor1.png -> /intro/images/outdoor1.png
// If in src: import outdoorImage1 from './intro/images/outdoor1.png';
const marquee1Images = ["./marquee/outdoor-entreOutros/outdoor1.png"]; // Example for public folder
const marquee2Images = ["./marquee/decoracao/decEspacoBarragem.jpeg"]; // Example for public folder
const marquee3Images = ["./marquee/stands-eventos/seasidePalcoFrente.png"]; // Example for public folder


type MarqueeItemType = {
  id: string | number;
  content: React.ReactNode;
};

type HandleImageClickType = (
  event: React.MouseEvent<HTMLImageElement>,
  flipId: string,
  imageSrc: string
) => void;

const generateImageItems = (
  imageUrls: string[],
  prefix: string,
  isVerticalLayout: boolean,
  onImageClick: HandleImageClickType
): MarqueeItemType[] => {
  return imageUrls.map((src, i) => {
    const flipId = `img-${prefix}-${i}`;
    return {
      id: `${prefix}-${i}`,
      content: (
        <div
          className={`relative overflow-hidden ${
            isVerticalLayout
              ? "w-full h-32 sm:h-40"
              : "w-48 sm:w-60 h-full"
          } bg-gray-800 rounded-lg group`}
        >
          <img
            src={src}
            alt={`${prefix} Item ${i + 1}`}
            className="object-cover w-full h-full cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={(e) => onImageClick(e, flipId, src)}
            data-flip-id={flipId}
            style={{ backfaceVisibility: "hidden" }}
          />
        </div>
      ),
    };
  });
};

const MarqueeSection: React.FC = () => {

    const marquee1Ref = useRef<MarqueeControls>(null);
const marquee2Ref = useRef<MarqueeControls>(null);
const marquee3Ref = useRef<MarqueeControls>(null);

// helper utilities
const pauseAllMarquees = () =>
    [marquee1Ref, marquee2Ref, marquee3Ref].forEach(r => r.current?.pauseAnimation());
  
  const playAllMarquees = () =>
    [marquee1Ref, marquee2Ref, marquee3Ref].forEach(r => r.current?.playAnimation());

  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [activeFlipId, setActiveFlipId] = useState<string | null>(null);
  const [fullscreenImageSrc, setFullscreenImageSrc] = useState<string | null>(
    null
  );

  const clickedImageOriginalRef = useRef<HTMLElement | null>(null);
  const originalImageState = useRef<Flip.FlipState | null>(null);
  const fullscreenImageRef = useRef<HTMLImageElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenCloseButtonRef = useRef<HTMLButtonElement>(null); // Specific ref for close button
  const isAnimating = useRef(false);

  const handleImageClick: HandleImageClickType = (
    event,
    flipId,
    imageSrc
  ) => {
    if (isAnimating.current || activeFlipId) return;

    pauseAllMarquees();
    isAnimating.current = true;
    const currentClickedImage = event.currentTarget;
    clickedImageOriginalRef.current = currentClickedImage;

    originalImageState.current = Flip.getState(currentClickedImage, {
      props: "borderRadius,aspectRatio,opacity",
      simple: true,
    });

    setFullscreenImageSrc(imageSrc);
    setActiveFlipId(flipId); // This triggers the useGSAP effect
  };

  // Open Animation
  useGSAP(
    () => {
      if (
        !activeFlipId ||
        !clickedImageOriginalRef.current ||
        !fullscreenImageRef.current ||
        !originalImageState.current ||
        !fullscreenContainerRef.current || // Ensure container is present
        !fullscreenCloseButtonRef.current // Ensure close button is present
      ) {
        return;
      }

      const fsImage = fullscreenImageRef.current;
      const originalImage = clickedImageOriginalRef.current;
      const fsContainer = fullscreenContainerRef.current;
      const closeButton = fullscreenCloseButtonRef.current;

      // Initial states for animation (already set by class/style, but good for clarity if needed)
      // gsap.set(fsContainer, { backgroundColor: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" });
      // gsap.set(closeButton, { opacity: 0 });
      gsap.set(originalImage, { autoAlpha: 0 }); // Hide original image

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      tl.to(
        fsContainer,
        {
          // Target class changes directly if Tailwind JIT can't pick up dynamic values well
          // Or animate direct style properties:
          backgroundColor: "rgba(0, 0, 0, 0.85)", // Darker for more Apple-like feel
          backdropFilter: "blur(12px)", // More blur
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );

      tl.add(() => {
        Flip.from(originalImageState.current!, { // Add non-null assertion if confident
          targets: fsImage,
          duration: 0.6,
          ease: "power3.out",
          scale: true,
          absolute: true,
          absoluteOnLeave: true,
          force3D: true,
          props: "borderRadius,aspectRatio,opacity",
          onStart: () => {
            gsap.set(fsImage, { willChange: "transform, opacity" });
          },
          onComplete: () => {
            gsap.set(fsImage, { clearProps: "willChange" });
          },
        });
      }, 0);

      tl.to(
        closeButton,
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.inOut",
        },
        0.4 // Delay slightly more for image to mostly settle
      );
    },
    { dependencies: [activeFlipId], scope: sectionRef }
  );

  // Close Animation
  const handleCloseFullscreen = () => {
    if (
      isAnimating.current ||
      !activeFlipId ||
      !clickedImageOriginalRef.current ||
      !fullscreenImageRef.current ||
      !originalImageState.current ||
      !fullscreenContainerRef.current || // Ensure container is present
      !fullscreenCloseButtonRef.current // Ensure close button is present
    ) {
      // If called unexpectedly, try to reset state cleanly
      if (!isAnimating.current && activeFlipId) {
        setActiveFlipId(null);
        setFullscreenImageSrc(null);
        if (clickedImageOriginalRef.current) {
          gsap.set(clickedImageOriginalRef.current, { autoAlpha: 1 });
        }
      }
      return;
    }

    isAnimating.current = true;
    const fsImage = fullscreenImageRef.current;
    const originalImage = clickedImageOriginalRef.current;
    const fsContainer = fullscreenContainerRef.current;
    const closeButton = fullscreenCloseButtonRef.current;

    if (fsContainer) {
      fsContainer.style.pointerEvents = "none";
    }

    const tl = gsap.timeline({
      onComplete: () => {
        playAllMarquees();   
        gsap.set(fsImage, { clearProps: "willChange" }); // Ensure willChange is cleared
        if (originalImage) gsap.set(originalImage, { autoAlpha: 1 });

        setActiveFlipId(null);
        setFullscreenImageSrc(null);
        isAnimating.current = false;
        clickedImageOriginalRef.current = null;
        originalImageState.current = null;
        if (fsContainer) {
          fsContainer.style.pointerEvents = "auto";
        }
      },
    });

    tl.to(
      closeButton,
      {
        opacity: 0,
        duration: 0.2,
        ease: "power2.inOut",
      },
      0
    );

    tl.to(
      fsContainer,
      {
        backgroundColor: "rgba(0, 0, 0, 0)",
        backdropFilter: "blur(0px)",
        duration: 0.5,
        ease: "power2.inOut",
      },
      0.1
    );

    tl.add(() => {
        Flip.to(originalImageState.current!, { // Add non-null assertion if confident
        targets: fsImage,
        duration: 0.5,
        ease: "power3.inOut",
        scale: true,
        absolute: true,
        force3D: true,
        props: "borderRadius,aspectRatio,opacity",
        onStart: () => {
          gsap.set(fsImage, { willChange: "transform, opacity" });
        },
        // onComplete for Flip.to happens before timeline onComplete
        // willChange is cleared in timeline onComplete
      });
    }, 0.1);
  };

  // Effect to handle layout changes (desktop/mobile) while fullscreen is active
  useEffect(() => {
    if (activeFlipId) {
      // If layout changes, instantly close the fullscreen view.
      gsap.killTweensOf(fullscreenImageRef.current);
      gsap.killTweensOf(fullscreenContainerRef.current);
      gsap.killTweensOf(fullscreenCloseButtonRef.current);

      if (clickedImageOriginalRef.current) {
        gsap.set(clickedImageOriginalRef.current, { autoAlpha: 1 });
      }
      setActiveFlipId(null);
      setFullscreenImageSrc(null);
      isAnimating.current = false;
      clickedImageOriginalRef.current = null;
      originalImageState.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  const items1 = generateImageItems(
    marquee1Images, "portfolio", isDesktop, handleImageClick
  );
  const items2 = generateImageItems(
    marquee2Images, "client", isDesktop, handleImageClick
  );
  const items3 = generateImageItems(
    marquee3Images, "project", isDesktop, handleImageClick
  );

  const commonMarqueeProps = {
    pauseOnHover: true,
    gap: 20,
    itemClassName: "flex-shrink-0",
  };

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16  text-white relative"
    >
      <div className="container mx-auto px-4">
       

        {isDesktop ? (
          // DESKTOP LAYOUT
          <div className="flex flex-col md:flex-row md:justify-around md:gap-6 lg:gap-8">
            <div className="flex-1 md:max-w-xs lg:max-w-sm mb-8 md:mb-0">
              
              <Marquee ref={marquee1Ref}   key="desktop-mq1" items={items1} direction="up" speed={50} {...commonMarqueeProps} className="h-[400px] sm:h-[500px] md:h-[600px] border border-gray-700 rounded-lg overflow-hidden"/>
            </div>
            <div className="flex-1 md:max-w-xs lg:max-w-sm mb-8 md:mb-0">

              <Marquee ref={marquee2Ref}   key="desktop-mq2" items={items2} direction="down" speed={65} {...commonMarqueeProps} className="h-[400px] sm:h-[500px] md:h-[600px] border border-gray-700 rounded-lg overflow-hidden" delay={0.2}/>
            </div>
            <div className="flex-1 md:max-w-xs lg:max-w-sm">
          
              <Marquee ref={marquee3Ref}   key="desktop-mq3" items={items3} direction="up" speed={40} {...commonMarqueeProps} className="h-[400px] sm:h-[500px] md:h-[600px] border border-gray-700 rounded-lg overflow-hidden" delay={0.4}/>
            </div>
          </div>
        ) : (
          // MOBILE LAYOUT
          <div>
            <div className="mb-10">
             
              <Marquee ref={marquee1Ref} key="mobile-mq1" items={items1} direction="left" speed={70} {...commonMarqueeProps} className="h-40 sm:h-48"/>
            </div>
            <div className="mb-10">
              
              <Marquee  ref={marquee2Ref} key="mobile-mq2" items={items2} direction="right" speed={90} {...commonMarqueeProps} className="h-40 sm:h-48" delay={0.2}/>
            </div>
            <div>
    
              <Marquee ref={marquee3Ref} key="mobile-mq3" items={items3} direction="left" speed={60} {...commonMarqueeProps} className="h-40 sm:h-48" delay={0.4}/>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Image Overlay */}
      {activeFlipId && fullscreenImageSrc && (
        <div
          ref={fullscreenContainerRef}
          // Initial classes for the closed state, GSAP will animate to the open state defined in JS
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/0 backdrop-blur-[0px]"
          onClick={handleCloseFullscreen}
          // style={{ backgroundColor: "rgba(0,0,0,0)", backdropFilter: "blur(0px)" }} // Handled by GSAP
        >
          <div
            className="relative flex items-center justify-center w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              ref={fullscreenImageRef}
              src={fullscreenImageSrc}
              alt="Fullscreen view"
              data-flip-id={activeFlipId}
              className="block object-contain max-w-[90vw] max-h-[85vh] rounded-md"
              style={{ backfaceVisibility: "hidden" }} // Good for transform perf
            />
            <button
              ref={fullscreenCloseButtonRef} // Assign ref here
              onClick={handleCloseFullscreen}
              // Initial classes for closed state
              className="absolute top-4 right-4 text-white bg-black/40 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 transition-colors duration-200 focus:outline-none opacity-0"
              aria-label="Close fullscreen image"
              // style={{ opacity: 0 }} // Handled by GSAP from class
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default MarqueeSection;