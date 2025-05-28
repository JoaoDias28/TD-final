import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { Picture } from "vite-imagetools";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Navbar from "../navigation/Navbar";
import VerticalNavigation from "../navigation/VerticalNavigation";
import MarqueeSection from "./sections/MarqueeSection";
import HorizontalScroll from "./sections/HorizontalScroll";
import { scrollManager } from "../../utils/scrollManager";
import ImageStack from "./ImageStack";

// Register GSAP plugins safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText, ScrollToPlugin);
}

// Helper to get main pin trigger
const getMainHorizontalPinTrigger = (horizontalSectionElement: Element): ScrollTrigger | undefined => {
  return ScrollTrigger.getAll().find(st => 
    st.vars.trigger === horizontalSectionElement && st.vars.pin === true
  );
};

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

const Hero: React.FC<HeroProps> = ({ themes: propThemes, introComplete, onNavClick }) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const diagonalScrollRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const decorativeBlob1Ref = useRef<HTMLDivElement>(null);
  const decorativeBlob2Ref = useRef<HTMLDivElement>(null);

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  const [currentSection, setCurrentSection] = useState('home');
  const [horizontalProgress, setHorizontalProgress] = useState({ activePanel: 0, progress: 0 });
  const [isInHorizontalSection, setIsInHorizontalSection] = useState(false);
  const [overallPageScrollProgress, setOverallPageScrollProgress] = useState(0);
  
  const navigationConfig = useMemo(() => {
    const vhVal = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const horizontalSectionStartApprox = vhVal * 1.3;

    return [
      { id: 'home', title: 'Home', scrollPosition: 0, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'theme-1', title: 'Outdoors', scrollPosition: horizontalSectionStartApprox, icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
      { id: 'theme-2', title: 'Feiras & Eventos', scrollPosition: horizontalSectionStartApprox + vhVal * 0.05, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { id: 'theme-3', title: 'Decoração de Espaços', scrollPosition: horizontalSectionStartApprox + vhVal * 0.1, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { id: 'theme-4', title: 'Projetos Criativos', scrollPosition: horizontalSectionStartApprox + vhVal * 0.15, icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
    ];
  }, []);

  const navigationThemes = useMemo(() => [
    { id: 1, title: 'Outdoors' },
    { id: 2, title: 'Feiras & Eventos' },
    { id: 3, title: 'Decoração de Espaços' },
    { id: 4, title: 'Projetos Criativos' }
  ], []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const allThemeImages = useMemo(() => 
    Object.values(propThemes).flat().map(getImageUrl).filter(Boolean)
  , [propThemes]);
  
  useEffect(() => {
    if (allThemeImages.length === 0) {
      setImagesLoaded(true);
      return;
    }
    let isMounted = true;
    const imagePromises = allThemeImages.map((url) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); 
        img.src = url;
      });
    });
    Promise.all(imagePromises).then(() => { if(isMounted) setImagesLoaded(true); });
    const timeoutId = setTimeout(() => { if (!imagesLoaded && isMounted) setImagesLoaded(true); }, 5000); 
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [allThemeImages, imagesLoaded]);

  useGSAP(
    () => {
      if (!introComplete || !imagesLoaded || typeof window === "undefined" || !heroSectionRef.current || !mainContainerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 }});
      tl.to(heroSectionRef.current, { opacity: 1, visibility: "visible", duration: 0.5 });

      if (titleRef.current) {
        const splitTitle = new SplitText(titleRef.current, { type: "chars, words" });
        gsap.set(titleRef.current, { visibility: "visible" });
        tl.from(splitTitle.chars, { opacity: 0, y: 60, rotateX: -45, stagger: 0.03, duration: 0.8 }, "-=0.2");
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
    }, { scope: mainContainerRef, dependencies: [ introComplete, imagesLoaded, isDesktop ] }
  );

  const handleLegacyNavClick = (section: string) => { 
    onNavClick?.(section); 
  };
  
  const handleVerticalNavClick = (sectionId: string) => {
    const navItem = navigationConfig.find(item => item.id === sectionId);
    if (!navItem) {
      console.warn('Unknown section ID for vertical nav:', sectionId);
      return;
    }

    const horizontalSectionElement = document.querySelector<HTMLElement>('#horizontal-scroll-section');

    if (sectionId.startsWith('theme-') && horizontalSectionElement) {
      const themeIdToFind = parseInt(sectionId.replace('theme-', ''));
      const targetPanelIndex = navigationThemes.findIndex(t => t.id === themeIdToFind);

      if (targetPanelIndex !== -1) {
        const mainPinTrigger = getMainHorizontalPinTrigger(horizontalSectionElement);

        if (mainPinTrigger) {
          const panelsContainer = horizontalSectionElement.querySelector<HTMLDivElement>(':scope > div[class*="flex"]'); 
          if (!panelsContainer) {
            console.warn('Panels container within horizontal section not found.');
            scrollManager.scrollTo(mainPinTrigger.start); 
            return;
          }
          
          const totalPanels = navigationThemes.length;
          let targetProgressInPin = 0;
          if (totalPanels > 0) {
             targetProgressInPin = targetPanelIndex / totalPanels; 
          }
          targetProgressInPin = Math.max(0, Math.min(1, targetProgressInPin + (0.1 / totalPanels) )); 

          const scrollStart = mainPinTrigger.start;
          const scrollEnd = mainPinTrigger.end; 
          const targetScrollY = scrollStart + (scrollEnd - scrollStart) * targetProgressInPin;
          
          console.log(`🎯 Navigating to theme panel: ${sectionId} (index ${targetPanelIndex})`, { targetScrollY, targetProgressInPin });
          scrollManager.scrollTo(targetScrollY, {
            duration: 1.5, 
            easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            onComplete: () => {
              console.log(`✅ Scrolled near panel ${targetPanelIndex}. GSAP horizontal scroll should take over.`);
              ScrollTrigger.refresh(); 
            }
          });
        } else {
          console.warn('Main horizontal pin ScrollTrigger not found. Scrolling to H-section start.');
          const sectionTop = horizontalSectionElement.getBoundingClientRect().top + window.scrollY;
          scrollManager.scrollTo(sectionTop);
        }
      }
    } else {
      const targetScrollY = navItem.scrollPosition;
      console.log(`🎯 Navigating to vertical section: ${sectionId}`, { targetScrollY });
      scrollManager.scrollTo(targetScrollY, {
        duration: 1.8,
        easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        onComplete: () => console.log('✅ Navigated to:', navItem.title)
      });
    }
    handleLegacyNavClick(sectionId);
  };
  
  useEffect(() => {
    if (!introComplete) return;
    let rafId: number;

    const calculateScrollValues = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docScrollHeight = document.documentElement.scrollHeight;
      const maxScrollableHeight = docScrollHeight - windowHeight;
      const horizontalSectionEl = document.querySelector<HTMLElement>('#horizontal-scroll-section');

      // Calculate Overall Page Scroll Progress
      let currentOverallProgress = 0;
      if (maxScrollableHeight > 0) {
        currentOverallProgress = Math.min(1, Math.max(0, scrollY / maxScrollableHeight));
      }

      if (isInHorizontalSection && horizontalSectionEl) {
        const mainPinTrigger = getMainHorizontalPinTrigger(horizontalSectionEl);
        if (mainPinTrigger) {
            const pinStartScroll = mainPinTrigger.start;
            const pinEndScroll = mainPinTrigger.end;
            const pinDuration = pinEndScroll - pinStartScroll;
            if (maxScrollableHeight > 0 && pinDuration > 0) {
                const horizontalInternalProgress = mainPinTrigger.progress; 
                const pinContributionToTotalScroll = pinDuration / maxScrollableHeight;
                const progressBeforePin = pinStartScroll / maxScrollableHeight;
                currentOverallProgress = progressBeforePin + (horizontalInternalProgress * pinContributionToTotalScroll);
            }
        }
      }
      setOverallPageScrollProgress(Math.min(1, Math.max(0, currentOverallProgress)));

      // Determine Current Section
      if (isInHorizontalSection && horizontalSectionEl) {
        const activeThemeData = navigationThemes[horizontalProgress.activePanel];
        if (activeThemeData) {
          const newSectionId = `theme-${activeThemeData.id}`;
          if (currentSection !== newSectionId) {
            setCurrentSection(newSectionId);
          }
        }
      } else {
        let closestSectionId = navigationConfig[0].id;
        let minDistance = Infinity;

        for (const navItem of navigationConfig) {
          let isConsiderable = true;
          if (navItem.id.startsWith('theme-')) {
            if (horizontalSectionEl) {
              const rect = horizontalSectionEl.getBoundingClientRect();
              if (scrollY < (rect.top + scrollY - windowHeight * 0.3) || scrollY > (rect.bottom + scrollY + windowHeight * 0.3)) {
              } else {
                isConsiderable = false; 
              }
            } else {
              isConsiderable = false; 
            }
          }

          if (isConsiderable) {
            const distance = Math.abs(scrollY - navItem.scrollPosition);
            if (distance < minDistance) {
              minDistance = distance;
              closestSectionId = navItem.id;
            }
          }
        }
        
        const proximityThreshold = windowHeight * 0.45; 
        if (minDistance < proximityThreshold && currentSection !== closestSectionId) {
           setCurrentSection(closestSectionId);
        } else if (scrollY < navigationConfig[0].scrollPosition + proximityThreshold && currentSection !== navigationConfig[0].id) {
           setCurrentSection(navigationConfig[0].id); 
        }
      }
    };
    
    const throttledHandler = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateScrollValues);
    };
    
    window.addEventListener('scroll', throttledHandler, { passive: true });
    calculateScrollValues(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', throttledHandler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [introComplete, navigationConfig, navigationThemes, currentSection, isInHorizontalSection, horizontalProgress.activePanel]);

  useEffect(() => {
    if (!introComplete) return;
    let horizontalTrackerST: ScrollTrigger | null = null;

    const setupHorizontalTracking = () => {
      const horizontalSectionEl = document.querySelector('#horizontal-scroll-section');
      if (!horizontalSectionEl) {
        setTimeout(setupHorizontalTracking, 500); 
        return;
      }

      const checkForMainPinTrigger = () => {
        const mainHorizontalPinST = getMainHorizontalPinTrigger(horizontalSectionEl);

        if (mainHorizontalPinST) {
          horizontalTrackerST = ScrollTrigger.create({
            trigger: horizontalSectionEl,
            start: mainHorizontalPinST.vars.start, 
            end: mainHorizontalPinST.vars.end,     
            onUpdate: (self) => {
              const progress = self.progress; 
              const totalPanels = navigationThemes.length;
              
              let currentPanelIdx = Math.floor(progress * totalPanels);
              currentPanelIdx = Math.min(currentPanelIdx, totalPanels - 1); 
              currentPanelIdx = Math.max(0, currentPanelIdx); 
              
              const panelProgressVal = totalPanels > 0 ? ((progress * totalPanels) % 1) : 0;
              
              setHorizontalProgress({
                activePanel: currentPanelIdx,
                progress: panelProgressVal
              });
            },
            onEnter: () => setIsInHorizontalSection(true),
            onLeave: () => setIsInHorizontalSection(false),
            onEnterBack: () => setIsInHorizontalSection(true),
            onLeaveBack: () => setIsInHorizontalSection(false),
          });
        } else {
          setTimeout(checkForMainPinTrigger, 200); 
        }
      };
      checkForMainPinTrigger();
    };

    const timeoutId = setTimeout(setupHorizontalTracking, 100); 

    return () => {
      clearTimeout(timeoutId);
      if (horizontalTrackerST) horizontalTrackerST.kill();
    };
  }, [introComplete, navigationThemes.length]); 

  return (
    <>
      <Navbar introComplete={introComplete} onNavClick={handleLegacyNavClick} />
      <div ref={mainContainerRef} className="relative">
        <section
          ref={heroSectionRef}
          id="top"
          className="relative w-full min-h-screen flex flex-col md:flex-row items-center justify-center overflow-hidden opacity-0 invisible pt-0 md:pt-0 pb-48"
          style={{ willChange: "opacity, transform" }}
        >
          <div
            ref={textContentRef}
            className="w-full md:w-1/2 flex flex-col justify-center items-start p-8 md:pl-16 lg:pl-24 xl:pl-32 z-20 relative"
          >
            <h1
              ref={titleRef}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight invisible"
            >
              Construimos <br />
              <span className="text-red-500">oportunidades</span>
            </h1>
          </div>

          <div className="w-full md:w-1/2 h-[50vh] md:h-screen flex items-center justify-center md:justify-start z-10 p-4 md:p-0">
            {imagesLoaded && introComplete ? (
              <ImageStack 
                imageUrls={allThemeImages}
                introComplete={introComplete}
                isReady={imagesLoaded}
                parallaxMouseTargetRef={heroSectionRef}
              />
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
        <VerticalNavigation 
          currentSection={currentSection} 
          onNavigate={handleVerticalNavClick} 
          themes={navigationThemes} 
          horizontalProgress={horizontalProgress}
          isInHorizontalSection={isInHorizontalSection}
          navigationConfig={navigationConfig}
          overallPageScrollProgress={overallPageScrollProgress}
        />
    </>
  );
};

export default Hero;