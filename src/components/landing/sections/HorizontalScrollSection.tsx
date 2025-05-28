import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ThemePanel, SpreadParallaxImage, ResponsiveParallaxConfig, BreakpointSpecificConfig, AnimationState } from '../../../types/types'; // Adjust path as needed
import FullscreenViewer from '../../helper/FullscreenViewer';

gsap.registerPlugin(ScrollTrigger);

// Debug flag - set to false in production
const DEBUG = true; 

// Define breakpoints
const BREAKPOINTS = {
  sm: 768,
  md: 1024,
};

const getBreakpoint = (width: number): 'sm' | 'md' | 'lg' => {
  if (width < BREAKPOINTS.sm) return 'sm';
  if (width < BREAKPOINTS.md) return 'md';
  return 'lg';
};

interface HorizontalScrollSectionProps {
  theme: ThemePanel;
  index: number;
  totalThemes: number;
  onReturnToTimeline?: () => void;
  onThemeSelect?: (sectionBounds?: DOMRect) => void;
  isGalleryActive?: boolean;
  panelProgress: number;
  containerAnimation?: gsap.core.Tween | null;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({ 
  theme,
  index,
  totalThemes,
  onReturnToTimeline,
  onThemeSelect,
  isGalleryActive = false,
  panelProgress,
  containerAnimation,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const fixedContentContainerRef = useRef<HTMLDivElement>(null);
  
  const [fullscreenImage, setFullscreenImage] = useState<{
    isOpen: boolean;
    url: string;
    alt: string;
  }>({
    isOpen: false,
    url: '',
    alt: '',
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'sm' | 'md' | 'lg'>(getBreakpoint(typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.md));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setCurrentBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate imagesToShow using useMemo to make it available in render scope
  const imagesToShow = useMemo(() => {
    const allImages = theme.spreadImages || [];
    if (allImages.length === 0) return [];

    let targetCount = 0;
    if (currentBreakpoint === 'sm') targetCount = 2;
    else if (currentBreakpoint === 'md') targetCount = 3;
    else targetCount = 5; // lg or wider

    const resultImages: SpreadParallaxImage[] = [];
    for (let i = 0; i < targetCount; i++) {
      resultImages.push(allImages[i % allImages.length]);
    }
    
    return resultImages.map((img, index) => ({
      ...img,
      src: img.src.startsWith('/') ? img.src : `/${img.src}`,
      uniqueId: `${img.src}-${index}` // Add a uniqueId for React keys with repeated images
    }));
  }, [theme.spreadImages, currentBreakpoint]);

  const openFullscreen = (imageUrl: string, imageAlt: string) => {
    setFullscreenImage({ isOpen: true, url: imageUrl, alt: imageAlt });
  };

  const closeFullscreen = () => {
    setFullscreenImage(prev => ({ ...prev, isOpen: false }));
  };

  const handleCTAClick = () => {
    if (DEBUG) console.log(`CTA clicked for panel ${index} (${theme.title}), preparing for gallery.`);
    
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    const contentBox = fixedContentContainerRef.current;
    const ctaButton = contentBox?.querySelector('.cta-button') as HTMLElement;
    
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    
    let sectionBounds: DOMRect | undefined;
    if (contentBox) {
      sectionBounds = contentBox.getBoundingClientRect();
      if (DEBUG) {
        console.log('Content container bounds (for gallery transition source):', {
          x: sectionBounds.left,
          y: sectionBounds.top,
          width: sectionBounds.width,
          height: sectionBounds.height,
          scrollPosition: { x: currentScrollX, y: currentScrollY }
        });
      }
    }
    
    const buttonTl = gsap.timeline({
      onComplete: () => {
        setIsTransitioning(false);
        
        const preserveScrollPosition = () => {
          if (window.scrollY !== currentScrollY || window.scrollX !== currentScrollX) {
            window.scrollTo(currentScrollX, currentScrollY);
          }
        };
        
        preserveScrollPosition();

        if (DEBUG) {
          const mainPinTrigger = ScrollTrigger.getAll().find(st => st.vars.trigger === sectionRef.current && st.vars.pin === true);
          console.log('%cBefore calling onThemeSelect:', 'color: orange; font-weight: bold;', {
            timestamp: new Date().toISOString(),
            originalScrollY: currentScrollY,
            currentScrollY: window.scrollY,
            isPinned: mainPinTrigger?.isActive,
            pinProgress: mainPinTrigger?.progress,
            pinScrollPosStart: mainPinTrigger?.start,
            pinScrollPosEnd: mainPinTrigger?.end,
            sectionBounds,
          });
        }

        if (onThemeSelect) {
          requestAnimationFrame(() => {
            preserveScrollPosition();
            onThemeSelect(sectionBounds);
            
            requestAnimationFrame(() => {
              preserveScrollPosition();
              if (DEBUG) console.log('%cAfter calling onThemeSelect', 'color: orange; font-weight: bold;', { 
                originalScrollY: currentScrollY,
                newScrollY: window.scrollY,
                scrollMaintained: window.scrollY === currentScrollY
              });
            });
          });
        }
      }
    });

    if (ctaButton) {
      buttonTl
        .to(ctaButton, { scale: 0.97, duration: 0.08, ease: 'power2.out' })
        .to(ctaButton, { scale: 1.01, duration: 0.12, ease: 'back.out(1.5)' })
        .to(ctaButton, { scale: 1, duration: 0.08, ease: 'power2.inOut' });
    } else {
      buttonTl.eventCallback("onComplete"); 
    }
  };

  useLayoutEffect(() => {
    theme.spreadImages?.forEach(img => {
      const imgTest = new Image();
      imgTest.onerror = () => DEBUG && console.warn(`Image not found or failed to load: ${img.src}`);
      imgTest.src = img.src.startsWith('/') ? img.src : `/${img.src}`;
    });

    if (typeof document !== 'undefined' && sectionRef.current) {
        const originalOverflow = document.body.style.overflow;
        if (originalOverflow !== 'hidden') {
          document.body.style.overflow = 'hidden';
          setTimeout(() => {
            if (document.body.style.overflow === 'hidden') {
              document.body.style.overflow = originalOverflow;
            }
          }, 200);
        }
    }
    
    if (!sectionRef.current || !fixedContentContainerRef.current) {
      DEBUG && console.log("HorizontalScrollSection: Missing sectionRef or fixedContentContainerRef, aborting GSAP setup.");
      return;
    }

    ScrollTrigger.getAll()
      .filter(st => st.vars.trigger === sectionRef.current || st.vars.trigger === fixedContentContainerRef.current)
      .forEach(st => {
        if (DEBUG) console.log('Killing old ScrollTrigger:', st.vars.id || st.vars.trigger);
        st.kill();
      });

    const ctx = gsap.context(() => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight; // Added for responsive positioning
      const scrollTriggerBase: Partial<ScrollTrigger.Vars> = containerAnimation ? { containerAnimation } : {};
      
      gsap.set(sectionRef.current, {
        width: '100vw',
        height: '100vh',
        force3D: true,
        willChange: "transform",
        overflow: 'hidden',
        position: 'relative',
      });
      
      if (DEBUG) {
        console.log('HorizontalScrollSection GSAP setup for:', theme.title, { screenWidth, sectionElement: sectionRef.current });
      }
      
      const panelIndex = index;
      const currentTheme = theme;
      const contentContainer = fixedContentContainerRef.current;
        
      imagesToShow.forEach(img => {
        const imgTest = new Image();
        imgTest.onerror = () => DEBUG && console.warn(`Image not found or failed to load: ${img.src}`);
        imgTest.src = img.src; // Already prefixed
      });
        
      if (sectionRef.current) {
        let initialXPercent = 0;
        if (panelIndex !== 0) {
          initialXPercent = 15;
        }

        gsap.fromTo(sectionRef.current, 
          { opacity: 0.1, scale: 0.92, xPercent: initialXPercent },
          {
            opacity: 1, 
            scale: 1,
            xPercent: 0,
            ease: "power2.out",
            scrollTrigger: {
              ...scrollTriggerBase,
              trigger: sectionRef.current,
              start: "left 90%",
              end: "right 10%",
              scrub: 1.2,
              invalidateOnRefresh: true,
            }
          }
        );
      }
      
      if (contentContainer) {
        const heading = contentContainer.querySelector('h2');
        const description = contentContainer.querySelector('p');
        const ctaButton = contentContainer.querySelector('.cta-button');
        const textElements = [heading, description, ctaButton].filter(Boolean) as HTMLElement[];

        gsap.set(contentContainer, {
          position: 'fixed', top: '50%', left: '50%', xPercent: -50, yPercent: -50,
          opacity: 0, zIndex: 30, width: 'auto', maxWidth: 'clamp(300px, 90vw, 700px)',
          pointerEvents: 'none', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))',
          visibility: 'hidden', force3D: true, willChange: 'opacity, transform, visibility',
        });
        
        if (textElements.length > 0) {
          gsap.set(textElements, { 
            opacity: 0, y: 30, rotationX: 2,
            transformPerspective: 1000, transformOrigin: "center center",
            force3D: true, willChange: 'opacity, transform',
          });
        }
        
        const textAnimationTimeline = gsap.timeline();

        textAnimationTimeline.to(contentContainer, { 
          opacity: 1, 
          duration: 0.6,
          ease: "power2.out"
        }, "fadeIn");
        
        if (textElements.length > 0) {
          textAnimationTimeline.to(textElements, { 
            opacity: 1, y: 0, rotationX: 0, 
            stagger: 0.12, 
            duration: 0.7,
            ease: "power2.out"
          }, "fadeIn+=0.15");
        }

        textAnimationTimeline.add("fadeOut", ">1.5");

        if (textElements.length > 0) {
          textAnimationTimeline.to(textElements, { 
            opacity: 0, y: -20, rotationX: -2,
            stagger: { each: 0.06, from: "end" }, 
            duration: 0.5,
            ease: "power2.in"
          }, "fadeOut");
        }
        
        textAnimationTimeline.to(contentContainer, { 
          opacity: 0, 
          duration: 0.4,
          ease: "power2.in"
        }, "fadeOut+=0.1");

        ScrollTrigger.create({
          animation: textAnimationTimeline,
          trigger: sectionRef.current,
          ...scrollTriggerBase,
          start: "left 85%",
          end: "right 15%",
          scrub: 1.5,
          invalidateOnRefresh: true,
          onToggle: self => {
            if (self.isActive) {
              gsap.set(contentContainer, { visibility: 'visible', pointerEvents: 'auto' });
            } else {
              if (textAnimationTimeline.progress() === 0 || textAnimationTimeline.progress() === 1) {
                gsap.set(contentContainer, { visibility: 'hidden', pointerEvents: 'none' });
              }
            }
          },
        });
      }
      
      // Helper function to get the correct config for the current breakpoint with fallback
      const getActiveConfig = (imgConfig: ResponsiveParallaxConfig): BreakpointSpecificConfig | null => {
        let activeBpConfig: BreakpointSpecificConfig | undefined;
        if (currentBreakpoint === 'sm') {
          activeBpConfig = imgConfig.sm || imgConfig.md || imgConfig.lg;
        } else if (currentBreakpoint === 'md') {
          activeBpConfig = imgConfig.md || imgConfig.lg || imgConfig.sm;
        } else { // lg
          activeBpConfig = imgConfig.lg || imgConfig.md || imgConfig.sm;
        }
        return activeBpConfig || null;
      };

      // Default animation state if a config is entirely missing (should ideally not happen with proper data)
      const getDefaultAnimState = (opacity = 0): AnimationState => ({
        x: 0, y: 0, scale: 0.5, rotation: 0, opacity,
      });

      if (imagesToShow.length > 0) {
        const spreadImagesContainer = sectionRef.current?.querySelector('.spread-images-container');
        if (spreadImagesContainer) {
          gsap.set(spreadImagesContainer, { force3D: true, willChange: "transform", perspective: 1000 });
          gsap.to(spreadImagesContainer, {
            x: () => `-=${screenWidth * 0.03 + screenHeight * 0.02 + (imagesToShow.length * 5)}`,
            ease: "none",
            scrollTrigger: {
              ...scrollTriggerBase,
              trigger: sectionRef.current,
              start: "left right",
              end: "right left",
              scrub: 0.8,
            }
          });
        }
        
        imagesToShow.forEach((imgData, imgIndex) => {
          const imgElement = sectionRef.current?.querySelector(`.panel-${panelIndex}-spread-img-${imgIndex}`) as HTMLImageElement;
          if (!imgElement) {
            if(DEBUG) console.warn(`Spread image element .panel-${panelIndex}-spread-img-${imgIndex} not found for ${currentTheme.title}`);
            return;
          }
          
          const activeConfig = getActiveConfig(imgData.config);

          if (!activeConfig) {
            if (DEBUG) console.warn(`No active config for image ${imgIndex} in ${currentTheme.title} at breakpoint ${currentBreakpoint}. Skipping animation.`);
            gsap.set(imgElement, { opacity: 0 }); // Hide if no config
            return;
          }
          
          const initialAnim = activeConfig.initial || getDefaultAnimState(0);
          const targetAnim = activeConfig.target || getDefaultAnimState(1);
          const exitAnim = activeConfig.exit || getDefaultAnimState(0);
          const currentDepth = activeConfig.depth || imgData.config.defaultDepth || 1;

          // Apply width/height from config directly if provided
          const styleUpdates: any = { ...initialAnim }; // any for gsap
          if (activeConfig.width) styleUpdates.width = activeConfig.width;
          if (activeConfig.height) styleUpdates.height = activeConfig.height;
          // Ensure zIndex is influenced by depth. Closer images (higher depth value in concept, e.g. 1.2) should have higher zIndex.
          // Or, if depth < 1 means further away, then Math.round(currentDepth * 10) might be inverse of what is needed.
          // Let's assume depth > 1 is closer, depth < 1 is further. Standard interpretation.
          styleUpdates.zIndex = Math.round(currentDepth * 10); 

          gsap.set(imgElement, {
            ...styleUpdates,
            force3D: true, willChange: "transform, opacity, width, height",
          });

          const imgTimeline = gsap.timeline({
            scrollTrigger: {
              ...scrollTriggerBase,
              trigger: sectionRef.current,
              start: "left 85%",
              end: "right 15%",
              scrub: 0.8,
            }
          });

          imgTimeline
            .to(imgElement, {
              ...targetAnim,
              // Overwrite scale if depth influences it and not explicitly set in targetAnim.scale by user
              // scale: targetAnim.scale / (currentDepth * 0.4 + 0.6), // Example of depth influencing scale
              ease: "power2.out",
              duration: 0.8 + Math.random() * 0.2
            }, 0)
            .to(imgElement, {
              ...exitAnim,
              ease: "power2.in", 
              duration: 0.5 + Math.random() * 0.2
            }, 0.8); 
        });
      }
    }, sectionRef);

    return () => {
      if (DEBUG) console.log('HorizontalScrollSection: Cleaning up GSAP context and ScrollTriggers for', theme.title, 'breakpoint:', currentBreakpoint);
      ctx.revert(); 
      // It's good practice to also kill ScrollTriggers not directly created by the context if they might persist
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.trigger === sectionRef.current || (fixedContentContainerRef.current && st.vars.trigger === fixedContentContainerRef.current)) {
          // console.log('Killing ST for section or content container:', st.vars.id);
          st.kill();
        }
      });
    };
  }, [theme, index, totalThemes, DEBUG, containerAnimation, currentBreakpoint]); // Added currentBreakpoint to dependencies

  useEffect(() => {
    const mainSectionEl = sectionRef.current;
    if (!mainSectionEl) return;

    if (isGalleryActive) {
      gsap.to(mainSectionEl, {
        scale: 0.94, filter: 'blur(4px)', opacity: 0.7,
        duration: 0.6, ease: 'power2.out'
      });
      mainSectionEl.classList.add('gallery-view-active-sibling');
    } else {
      gsap.to(mainSectionEl, {
        scale: 1, filter: 'blur(0px)', opacity: 1,
        duration: 0.6, ease: 'power2.out',
        onComplete: () => mainSectionEl.classList.remove('gallery-view-active-sibling')
      });
    }
  }, [isGalleryActive]);

  return (
    <section 
      ref={sectionRef}
      style={{ opacity: 0.2, scale: 0.9, willChange: 'transform, opacity' }}
      className={`h-scroll-section-panel panel-${index} `}
      data-panel-id={theme.id}
      data-panel-index={index}
    >
      <div className="w-full h-full relative panel-content-wrapper">
        {imagesToShow.length > 0 && ( 
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none spread-images-container z-0">
            {imagesToShow.map((imgData: SpreadParallaxImage & { uniqueId: string }, imgIdx: number) => (
              <img
                key={imgData.uniqueId}
                src={imgData.src}
                alt={imgData.alt || `Spread image ${imgIdx + 1} for ${theme.title}`}
                className={`absolute panel-${index}-spread-img-${imgIdx} object-contain cursor-pointer`}
                style={{
                  // Width and height are now primarily set by GSAP from config
                  // but can provide fallback defaults if needed, though GSAP set should override
                  // width: '200px', 
                  // height: 'auto',
                  willChange: 'transform, opacity, width, height',
                  // zIndex is set by GSAP
                }}
                onClick={() => openFullscreen(imgData.src, imgData.alt)}
                loading="lazy"
              />
            ))}
          </div>
        )}
              
        <div 
          ref={fixedContentContainerRef}
          className="content-container"
        >
          <div className="max-w-2xl mx-auto text-center px-6 sm:px-8 relative">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 text-white">
              {theme.title}
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto text-gray-200">
              {theme.description}
            </p>
            {theme.ctaText && (
              <div className="text-center">
                <button 
                  onClick={handleCTAClick}
                  className="cta-button group inline-flex items-center justify-center py-4 px-10 sm:py-5 sm:px-12 bg-white/10 border border-white/30 rounded-xl font-semibold text-white text-lg backdrop-blur-sm relative overflow-hidden transform transition-all duration-200 ease-out active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                    WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.03, boxShadow: '0 12px 40px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)', duration: 0.25, ease: 'power2.out' })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', duration: 0.25, ease: 'power2.out' })}
                  disabled={isTransitioning}
                >
                  <span className="relative z-10">{theme.ctaText || 'Explore Gallery'}</span>
                  <div className="absolute inset-0  -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div> 
      {fullscreenImage.isOpen && (
        <FullscreenViewer 
          isOpen={fullscreenImage.isOpen}
          imageUrl={fullscreenImage.url} 
          altText={fullscreenImage.alt} 
          onClose={closeFullscreen} 
        />
      )}
    </section>
  );
};

export default HorizontalScrollSection;