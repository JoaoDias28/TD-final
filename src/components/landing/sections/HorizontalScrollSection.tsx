import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ThemePanel, SpreadParallaxImage, BottomStripImage } from '../../../types/types'; // Adjust path as needed
import FullscreenViewer from '../../helper/FullscreenViewer';

gsap.registerPlugin(ScrollTrigger);

// Debug flag - set to false in production
const DEBUG = true; 

interface HorizontalScrollSectionProps {
  themes: ThemePanel[];
  onReturnToTimeline?: () => void; // Optional callback for returning to main timeline
  onThemeSelect?: (theme: ThemePanel, index: number, sectionBounds?: DOMRect) => void; // Callback for theme selection with section position
  isGalleryActive?: boolean; // To apply visual effects when gallery is active
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({ themes, onReturnToTimeline, onThemeSelect, isGalleryActive = false }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  
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
  const contentContainersRef = useRef<(HTMLDivElement | null)[]>([]);

  const openFullscreen = (imageUrl: string, imageAlt: string) => {
    setFullscreenImage({ isOpen: true, url: imageUrl, alt: imageAlt });
  };

  const closeFullscreen = () => {
    setFullscreenImage(prev => ({ ...prev, isOpen: false }));
  };

  const handleCTAClick = (theme: ThemePanel, index: number) => {
    if (DEBUG) console.log(`CTA clicked for panel ${index} (${theme.title}), preparing for gallery.`);
    
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    const contentContainer = contentContainersRef.current[index];
    const ctaButton = contentContainer?.querySelector('.cta-button') as HTMLElement;
    
    // Store current scroll position before any animations
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    
    let sectionBounds: DOMRect | undefined;
    if (contentContainer) {
      sectionBounds = contentContainer.getBoundingClientRect();
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
        
        // Preserve scroll position during gallery opening
        const preserveScrollPosition = () => {
          // Ensure we maintain the same scroll position
          if (window.scrollY !== currentScrollY || window.scrollX !== currentScrollX) {
            window.scrollTo(currentScrollX, currentScrollY);
          }
        };
        
        // Call immediately before opening gallery
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

        // Call the theme selection callback to open gallery
        if (onThemeSelect) {
          // Use requestAnimationFrame to ensure scroll position is preserved after DOM updates
          requestAnimationFrame(() => {
            preserveScrollPosition();
            onThemeSelect(theme, index, sectionBounds);
            
            // Double-check scroll position after gallery opens
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
        .to(ctaButton, { scale: 0.96, duration: 0.06, ease: 'power2.out' })
        .to(ctaButton, { scale: 1.02, duration: 0.08, ease: 'back.out(2)' })
        .to(ctaButton, { scale: 1, duration: 0.06, ease: 'power2.inOut' });
    } else {
      // If no button (should not happen with current JSX), complete immediately
      buttonTl.eventCallback("onComplete"); 
    }
  };

  // Reset refs on each render before they are populated in useLayoutEffect
  panelRefs.current = [];
  contentContainersRef.current = [];

  useLayoutEffect(() => {
    // Preload/check images (optional, but good for UX)
    themes.forEach(theme => {
      theme.spreadImages?.forEach(img => {
        const imgTest = new Image();
        imgTest.onerror = () => DEBUG && console.warn(`Image not found or failed to load: ${img.src}`);
        imgTest.src = img.src.startsWith('/') ? img.src : `/${img.src}`;
      });
      theme.bottomStripImages?.forEach(img => {
        const imgTest = new Image();
        imgTest.onerror = () => DEBUG && console.warn(`Image not found or failed to load: ${img.src}`);
        imgTest.src = img.src.startsWith('/') ? img.src : `/${img.src}`;
      });
    });

    // Brief overflow hidden to prevent scroll jumps during initial GSAP setup.
    // This should be very short and only if elements are present.
    if (typeof document !== 'undefined' && panelsContainerRef.current && panelsContainerRef.current.childNodes.length > 0) {
        const originalOverflow = document.body.style.overflow;
        if (originalOverflow !== 'hidden') { // Only if not already hidden by something else
          document.body.style.overflow = 'hidden';
          setTimeout(() => {
            // Restore only if we were the ones to change it and it hasn't been changed again
            if (document.body.style.overflow === 'hidden') {
              document.body.style.overflow = originalOverflow;
            }
          }, 300); // Duration should be enough for GSAP to initialize
        }
    }
    
    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    
    if (!sectionRef.current || !panelsContainerRef.current || panels.length === 0) {
      DEBUG && console.log("HorizontalScrollSection: Missing refs or panels, aborting GSAP setup.");
      return;
    }

    // Kill previous ScrollTriggers associated with this section to prevent duplicates or stale instances
    ScrollTrigger.getAll()
      .filter(st => st.vars.trigger === sectionRef.current || panels.some(p => st.vars.trigger === p))
      .forEach(st => {
        if (DEBUG) console.log('Killing old ScrollTrigger:', st.vars.id || st.vars.trigger);
        st.kill();
      });

    const ctx = gsap.context(() => {
      const screenWidth = window.innerWidth;
      const panelWidth = screenWidth; // Each panel takes full viewport width
      const totalPanelWidth = panelWidth * panels.length;
      
      gsap.set(panelsContainerRef.current, { 
        width: totalPanelWidth,
        force3D: true, // GPU acceleration
        willChange: "transform", // Hint to browser
      });
      
      panels.forEach(panel => {
        gsap.set(panel, { 
          width: panelWidth,
          force3D: true,
          willChange: "transform",
        });
      });
      
      const horizontalScrollTween = gsap.to(panelsContainerRef.current, {
        x: () => -(totalPanelWidth - window.innerWidth), // Scroll until the last panel aligns with the right edge of the viewport
        ease: "none", // Linear scroll for direct mapping to scrollbar
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          pinSpacing: true, 
          scrub: 0.1, 
          start: "top top",
          end: () => `+=${totalPanelWidth - screenWidth}`,
          invalidateOnRefresh: true, 
          // markers: DEBUG ? {startColor: "green", endColor: "red", fontSize: "10px"} : false,
          anticipatePin: 1, // Helps prevent jitter with fast scrolls by anticipating the pin
          onUpdate: self => {
            if (DEBUG && Math.random() < 0.01) { // Log occasionally to avoid spam
               // console.log('Horizontal scroll update, progress:', self.progress.toFixed(3));
            }
          },
          onEnter: () => DEBUG && console.log('HorizontalScrollSection: Pin Active'),
          onLeave: () => DEBUG && console.log('HorizontalScrollSection: Pin No Longer Active'),
          onLeaveBack: () => DEBUG && console.log('HorizontalScrollSection: Pin Active (scrolling up)'),
          onEnterBack: () => DEBUG && console.log('HorizontalScrollSection: Pin No Longer Active (scrolling up past start)'),
        }
      });

      if (DEBUG) {
        console.log('Horizontal scroll setup:', {
          totalPanelWidth,
          screenWidth,
          panels: panels.length,
          scrollDistance: totalPanelWidth - screenWidth,
          pinTrigger: sectionRef.current
        });
      }
      
      panels.forEach((panel, panelIndex) => {
        const currentTheme = themes[panelIndex];
        if (!currentTheme) return;
        
        const contentContainer = contentContainersRef.current[panelIndex];
        if (!contentContainer) {
            if (DEBUG) console.warn(`Content container for panel ${panelIndex} (${currentTheme.title}) not found.`);
            return;
        }
        
        const heading = contentContainer.querySelector('h2');
        const description = contentContainer.querySelector('p');
        const ctaButton = contentContainer.querySelector('.cta-button');
        const textElements = [heading, description, ctaButton].filter(Boolean) as HTMLElement[];

        const isFirstPanel = panelIndex === 0;

        // Content is fixed to viewport center and fades in/out
        gsap.set(contentContainer, {
          position: 'fixed', top: '50%', left: '50%', xPercent: -50, yPercent: -50,
          opacity: isFirstPanel ? 1 : 0, 
          zIndex: 30, width: 'auto', maxWidth: 'clamp(300px, 90vw, 700px)',
          pointerEvents: isFirstPanel ? 'auto' : 'none',
          filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))',
          visibility: isFirstPanel ? 'visible' : 'hidden',
          force3D: true, // For smoother animations
          willChange: 'opacity, transform, visibility',
        });
        
        if (textElements.length > 0) {
          gsap.set(textElements, { 
            opacity: isFirstPanel ? 1 : 0,
            y: isFirstPanel ? 0 : 30, // Start slightly down
            rotationX: isFirstPanel ? 0 : 5, // Slight 3D rotation
            transformPerspective: 1000, transformOrigin: "center center",
            force3D: true, willChange: 'opacity, transform',
          });
        }
        
        const animateTextIn = () => {
          if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text: animateTextIn`);
          gsap.to(contentContainer, {
            opacity: 1,
            duration: 0.4, 
            ease: "power2.out",
            onStart: () => {
              gsap.set(contentContainer, { visibility: 'visible', pointerEvents: 'auto' });
            }
          });
          if (textElements.length > 0) {
            gsap.to(textElements, {
              opacity: 1, y: 0, rotationX: 0,
              stagger: 0.1, 
              duration: 0.5,
              ease: "power2.out",
              delay: 0.1 // Slight delay after container fades in
            });
          }
        };

        const animateTextOut = (isLeavingForward = true) => {
          if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text: animateTextOut (leavingForward: ${isLeavingForward})`);
          gsap.to(contentContainer, {
            opacity: 0,
            duration: 0.4, 
            ease: "power2.in",
            onComplete: () => {
              // Only hide if not active (prevents hiding if quickly scrolled back in)
              const textActivationST = ScrollTrigger.getById(`text-activation-st-${panelIndex}`);
              if (!textActivationST || !textActivationST.isActive) {
                 gsap.set(contentContainer, { visibility: 'hidden', pointerEvents: 'none' });
              }
            }
          });
          if (textElements.length > 0) {
            gsap.to(textElements, {
              opacity: 0, 
              y: isLeavingForward ? -30 : 30, // Animate up if leaving forward, down if leaving backward
              rotationX: isLeavingForward ? -5 : 5,
              stagger: { each: 0.08, from: "end" }, 
              duration: 0.5, 
              ease: "power2.in",
            });
          }
        };
        
        // ScrollTrigger for activating/deactivating text content based on panel visibility
        ScrollTrigger.create({
          trigger: panel, // The panel itself
          containerAnimation: horizontalScrollTween, // Linked to the main horizontal scroll
          start: "left center", // When left edge of panel hits center of viewport
          end: "right center",  // When right edge of panel hits center of viewport
          // markers: DEBUG ? {startColor: "cyan", endColor: "magenta", indent: panelIndex * 20} : false, 
          id: `text-activation-st-${panelIndex}`,
          onEnter: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text ST: ON ENTER`);
            animateTextIn();
          },
          onLeave: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text ST: ON LEAVE (forward)`);
            animateTextOut(true); // Leaving forward
          },
          onEnterBack: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text ST: ON ENTER BACK`);
            animateTextIn();
          },
          onLeaveBack: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} (${currentTheme.title}) Text ST: ON LEAVE BACK`);
            // For the first panel, when scrolling back past its start, we want it to remain visible
            // as it's the initial state. For others, animate out.
            if (isFirstPanel) {
              // Ensure first panel content remains visible if scrolled back to start
              gsap.set(contentContainer, {
                opacity: 1,
                visibility: 'visible',
                pointerEvents: 'auto',
              });
              if (textElements.length > 0) {
                gsap.set(textElements, {
                  opacity: 1, y: 0, rotationX: 0,
                });
              }
            } else {
              animateTextOut(false); // Leaving backward
            }
          },
        });

        // Spread Images Parallax & Animation
        if (currentTheme.spreadImages && currentTheme.spreadImages.length > 0) {
          const spreadImagesContainer = panel.querySelector('.spread-images-container');
          if (spreadImagesContainer) {
            gsap.set(spreadImagesContainer, { 
              force3D: true, 
              willChange: "transform", 
              perspective: 1000 // For 3D transformations of children
            });
            
            // Slight parallax effect for the container itself
            gsap.to(spreadImagesContainer, {
              x: `-=${screenWidth * 0.05}`, // Moves slightly slower than the panel
              ease: "none",
              scrollTrigger: {
                trigger: panel, containerAnimation: horizontalScrollTween,
                start: "left right", // Start when panel enters from right
                end: "right left",   // End when panel exits to left
                scrub: 0.5,         // Smooth scrubbing
                // markers: DEBUG ? {startColor: "yellow", endColor: "orange", indent: panelIndex * 20 + 5} : false,
              }
            });
          }
          
          currentTheme.spreadImages.forEach((imgData, imgIndex) => {
            const imgElement = panel.querySelector(`.panel-${panelIndex}-spread-img-${imgIndex}`) as HTMLImageElement;
            if (!imgElement) {
              if(DEBUG) console.warn(`Spread image element .panel-${panelIndex}-spread-img-${imgIndex} not found for ${currentTheme.title}`);
              return;
            }
            if (imgData.src && imgData.src.indexOf('/') !== 0) imgElement.src = `/${imgData.src}`; // Ensure leading slash if not present
            
            const depth = imgData.config.depth || 1; // Depth factor (0-1, 1 is closer/moves less)
            const initialXOffset = ((imgIndex % 3) - 1) * screenWidth * 0.1; // Stagger initial X
            const initialYOffset = ((imgIndex % 2) ? -1 : 1) * 30; // Stagger initial Y

            gsap.set(imgElement, {
              opacity: 0, 
              x: initialXOffset + 50, // Start further off-screen
              y: initialYOffset,
              scale: 0.8,
              rotation: (Math.random() - 0.5) * 10, // Slight random initial rotation
              force3D: true, willChange: "transform, opacity",
            });

            const imgTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: panel, containerAnimation: horizontalScrollTween,
                start: "left 80%", // Image animation starts when panel is 20% visible
                end: "right 20%",  // Image animation ends when panel is 80% scrolled past
                scrub: 0.5,        // Smooth scrubbing
                // markers: DEBUG ? {startColor: `hsl(${imgIndex*60}, 100%, 50%)`, endColor: `hsl(${imgIndex*60}, 100%, 70%)`, indent: panelIndex * 20 + imgIndex * 2} : false,
              }
            });

            imgTimeline
              .to(imgElement, { // Fade in and move to "active" position
                opacity: 1, 
                x: initialXOffset, // Settle to its designed spread position
                y: initialYOffset,
                scale: 1,
                rotation: imgData.config.rotate || 0,
                // Parallax effect based on depth
                xPercent: (1 - depth) * 15 * ((imgIndex % 2) ? 1 : -1), // Horizontal parallax
                yPercent: ((imgIndex % 2) ? 1 : -1) * (1 - depth) * 8,    // Vertical parallax
                ease: "power1.out", 
                duration: 0.6 // Duration of the in-animation part of scrub
              }, 0) // At the beginning of the ScrollTrigger duration
              .to(imgElement, { // Fade out and move away
                opacity: 0, 
                x: initialXOffset - 50, // Move further off-screen in opposite direction
                y: initialYOffset + ((imgIndex % 2) ? 20 : -20),
                scale: 0.7,
                rotation: imgData.config.rotate ? imgData.config.rotate + (Math.random() - 0.5) * 15 : (Math.random() - 0.5) * 15,
                xPercent: (imgIndex % 2 ? 30 : -30) * (1 + (1-depth)), // Exaggerated exit parallax
                yPercent: ((imgIndex % 3 - 1) * 15) * (1 + (1-depth)),
                ease: "power1.in", 
                duration: 0.4 // Duration of the out-animation part of scrub
              }, 0.6); // Start fading out at 60% of the ScrollTrigger duration
          });
        }
        
        // Bottom Strip Images Animation
        const bottomStripContainer = panel.querySelector(`.panel-${panelIndex}-bottom-strip-container`);
        if (currentTheme.bottomStripImages && currentTheme.bottomStripImages.length > 0 && bottomStripContainer) {
          const bottomImages = currentTheme.bottomStripImages.map((imgData, imgIdx) => {
            const imgElement = panel.querySelector(`.panel-${panelIndex}-bottom-img-${imgIdx}`) as HTMLImageElement;
            if (imgElement) {
              if (imgData.src && imgData.src.indexOf('/') !== 0) imgElement.src = `/${imgData.src}`;
            } else {
              if(DEBUG) console.warn(`Bottom strip image element .panel-${panelIndex}-bottom-img-${imgIdx} not found for ${currentTheme.title}`);
            }
            return imgElement;
          }).filter(Boolean) as HTMLImageElement[];
          
          gsap.set(bottomStripContainer, { force3D: true, willChange: "transform", perspective: 1000 });
          
          bottomImages.forEach((img, imgIdx) => {
            const totalSpread = screenWidth * 0.6; // How much horizontal space they occupy
            const itemCount = bottomImages.length;
            const spreadStep = totalSpread / (itemCount > 1 ? itemCount - 1 : 1);
            const baseOffset = (screenWidth - totalSpread) / 2; // Center the group
            const horizontalPosition = baseOffset + (itemCount > 1 ? (spreadStep * imgIdx) : totalSpread / 2);
            
            gsap.set(img, {
              opacity: 0, y: 80, scale: 0.9, 
              rotation: ((imgIdx % 2) ? 3 : -3) + (Math.random() -0.5) * 5, // Slight random rotation
              left: `${horizontalPosition}px`, 
              bottom: `${10 + (imgIdx % 3) * 5 + Math.random()*5}%`, // Varied vertical position
              xPercent: -50, // Center image via transform
              force3D: true, willChange: "transform, opacity",
            });
          });
          
          const bottomImagesTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: panel, containerAnimation: horizontalScrollTween,
              start: "left 70%", // Start when panel is 30% in view
              end: "right 30%",  // End when panel is 70% scrolled past
              scrub: 0.5,
              // markers: DEBUG ? {startColor: "pink", endColor: "purple", indent: panelIndex * 20 + 10} : false, 
            }
          });
          
          bottomImages.forEach((img, imgIdx) => {
            const imgData = currentTheme.bottomStripImages?.[imgIdx]; 
            if (!imgData) return;
            
            const depth = imgData.depth ?? 1; // Depth factor (0-1)
            const staggerDelay = imgIdx * 0.05; // Stagger animation start
            
            // Entrance animation
            bottomImagesTimeline.to(img, { 
              opacity: 1, y: 0, scale: 1, 
              rotation: ((imgIdx % 2) ? 2 : -2), // Settle rotation
              ease: "back.out(1.4)", duration: 0.4 
            }, staggerDelay); // Apply stagger here for entrance

            // Parallax movement while visible
            bottomImagesTimeline.to(img, {
              // Subtle parallax based on depth, opposite for alternating images
              xPercent: -50 + ((imgIdx % 2 ? 1 : -1) * (1 - depth) * 25),
              y: ((imgIdx % 3) - 1) * (1 - depth) * 15, // Slight vertical parallax
              rotation: ((imgIdx % 2 ? 1 : -1) * (depth * 2) + ((imgIdx % 2) ? 2 : -2)), // Subtle rotation change
              ease: "power1.inOut", duration: 0.6 // Duration of this "active" parallax phase
            }, staggerDelay + 0.1); // Start slightly after entrance is complete

            // Exit animation
            bottomImagesTimeline.to(img, {
              opacity: 0, 
              y: 100 + (imgIdx % 3) * 20, // Move down and off
              xPercent: -50 + ((imgIdx % 2 ? 1 : -1) * 50), // Move sideways off
              scale: 0.75, 
              rotation: ((imgIdx % 2 ? 8 : -8) + (Math.random() -0.5) * 10), // Exaggerated exit rotation
              ease: "power1.in", duration: 0.4
            }, 0.6 + staggerDelay * 0.3); // Start exit at 60% of ST duration, with some stagger
          });
        }
      }); 
      
    }, sectionRef); // Scope GSAP animations to this sectionRef for easier cleanup

    // Cleanup function
    return () => {
      if (DEBUG) console.log('HorizontalScrollSection: Cleaning up GSAP context and ScrollTriggers.');
      // This will revert all GSAP animations and kill ScrollTriggers created within the context
      ctx.revert(); 
      // Explicitly kill any STs that might have been created outside the context but target elements within
      ScrollTrigger.getAll()
        .filter(st => st.vars.trigger === sectionRef.current || panelRefs.current.some(p => st.vars.trigger === p))
        .forEach(st => st.kill());
    };
  }, [themes, DEBUG]); // Rerun effect if themes array changes or DEBUG changes

  // Effect to apply/remove class for gallery active state for body scroll lock etc.
  useEffect(() => {
    if (isGalleryActive) {
      // This is where you might want to implement a robust scroll lock
      // if the gallery is a full-screen overlay.
      // For now, the blur/scale is handled by inline styles on the section.
      // Example scroll lock (more robust solutions exist, e.g., body-scroll-lock library):
      // const scrollY = window.scrollY;
      // document.body.style.position = 'fixed';
      // document.body.style.top = `-${scrollY}px`;
      // document.body.style.width = '100%';
      // document.body.style.overflowY = 'scroll'; // To prevent layout shift if scrollbar disappears
    } else {
      // Remove scroll lock if applied
      // const scrollY = document.body.style.top;
      // document.body.style.position = '';
      // document.body.style.top = '';
      // document.body.style.width = '';
      // document.body.style.overflowY = '';
      // window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isGalleryActive]);

  return (
    <section 
      ref={sectionRef} 
      className={`h-screen overflow-hidden relative transition-all duration-500 ease-in-out`}
      style={{ 
        // Applying visual effects directly via style prop for smoother transitions than classes sometimes
        // These styles are applied when the gallery becomes active, making this section recede.
        transform: isGalleryActive ? 'scale(0.95)' : 'scale(1)',
        filter: isGalleryActive ? 'blur(4px)' : 'blur(0px)', // Increased blur slightly
        opacity: isGalleryActive ? 0.65 : 1, // Dimmed further
        willChange: 'transform, filter, opacity', // Hint browser for performance
        // pointerEvents: isGalleryActive ? 'none' : 'auto', // Prevent interaction when gallery is up
      }}
    >
      <div
        ref={panelsContainerRef}
        className="h-full flex" // Removed will-change-transform, GSAP handles it
        style={{ width: "fit-content" }} // Will be overridden by GSAP to totalPanelWidth
      >
        {themes.map((theme: ThemePanel, panelIndex: number) => {
          return (
            <div
              key={theme.id || `theme-panel-${panelIndex}`} // Ensure key is always present
              id={`theme-panel-${theme.id || panelIndex}`}
              ref={(el) => { panelRefs.current[panelIndex] = el; }}
              className="h-full flex-shrink-0 flex flex-col justify-center items-center relative"
              style={{ 
                width: '100vw', // Each panel is full viewport width
                position: 'relative', // Needed for absolute positioning of children
                overflow: 'hidden' // Clip overflowing parallax images within their panel
              }}
            >
              {/* Spread Images Layer (typically behind content) */}
              {theme.spreadImages && theme.spreadImages.length > 0 && (
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none spread-images-container z-0">
                  {theme.spreadImages.map((imgData: SpreadParallaxImage, imgIndex: number) => (
                    <img
                      key={`spread-${panelIndex}-${imgIndex}`}
                      src={imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`}
                      alt={imgData.alt || `Spread image ${imgIndex + 1} for ${theme.title}`}
                      className={`absolute panel-${panelIndex}-spread-img-${imgIndex} object-contain cursor-pointer`}
                      style={{
                        // Initial styles set by GSAP, but can have defaults here
                        width: imgData.config.width || '200px',
                        height: imgData.config.height || 'auto', // 'auto' is often better for object-contain
                        top: imgData.config.initialY || '50%',
                        left: imgData.config.initialX || '50%',
                        zIndex: imgData.config.depth ? Math.round(imgData.config.depth * 10) : 1, // Lower z-index for background
                        // transform: `translate(-50%, -50%) scale(${imgData.config.scale || 1}) rotate(${imgData.config.rotate || 0}deg)` // GSAP will control this
                        // GSAP will set opacity, x, y, scale, rotation
                      }}
                      onClick={() => openFullscreen(imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`, imgData.alt)}
                      loading="lazy" // Good for performance with many images
                    />
                  ))}
                </div>
              )}
              
              {/* Main Content Layer (Text, CTA) */}
              <div 
                ref={(el) => { contentContainersRef.current[panelIndex] = el; }}
                className="content-container" // GSAP targets this for fixed positioning and animation
                // Styles for this container are set by GSAP (position: fixed, opacity, etc.)
              >
                <div className="max-w-2xl mx-auto text-center px-6 sm:px-8 relative"> {/* Added relative for stacking context if needed */}
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 text-white">
                    {theme.title}
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto text-gray-200">
                    {theme.description}
                  </p>
                  <button
                    onClick={() => { 
                      handleCTAClick(theme, panelIndex); 
                    }}
                    className="cta-button group inline-flex items-center justify-center py-4 px-10 sm:py-5 sm:px-12 bg-white/10 border border-white/30 rounded-xl font-semibold text-white text-lg backdrop-blur-sm relative overflow-hidden transform transition-all duration-200 ease-out active:scale-95" // Added active:scale-95 for click feedback
                    style={{
                      // Frosted glass effect
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      WebkitBackdropFilter: 'blur(10px)', // For Safari
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                      gsap.to(e.currentTarget, {
                        scale: 1.03, // Slightly more pronounced hover
                        boxShadow: '0 12px 40px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                        duration: 0.25,
                        ease: 'power2.out'
                      });
                    }}
                    onMouseLeave={(e) => {
                      gsap.to(e.currentTarget, {
                        scale: 1,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        duration: 0.25,
                        ease: 'power2.out'
                      });
                    }}
                    disabled={isTransitioning}
                  >
                    <span className="relative z-10">{theme.ctaText || 'Explore Gallery'}</span>
                    {/* Animated background shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100"></div>
                  </button>
                </div>
              </div>

              {/* Bottom Strip Images Layer (typically in front of spread, behind content if z-index allows) */}
              {theme.bottomStripImages && theme.bottomStripImages.length > 0 && (
                <div className={`absolute inset-x-0 bottom-0 h-1/3 sm:h-2/5 overflow-hidden pointer-events-none panel-${panelIndex}-bottom-strip-container z-10`}> {/* Constrained height */}
                  {theme.bottomStripImages.map((imgData: BottomStripImage, imgIndex: number) => (
                    <img
                      key={`bottom-${panelIndex}-${imgIndex}`}
                      src={imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`}
                      alt={imgData.alt || `Bottom strip image ${imgIndex + 1} for ${theme.title}`}
                      className={`absolute panel-${panelIndex}-bottom-img-${imgIndex} object-cover rounded-lg shadow-xl cursor-pointer hover:shadow-2xl transition-shadow duration-300 pointer-events-auto`} // pointer-events-auto for clicking
                      style={{
                        // GSAP will set opacity, y, scale, rotation, left, bottom, xPercent
                        width: imgData.width || '150px',
                        height: imgData.height || 'auto', // 'auto' for aspect ratio
                        // zIndex handled by GSAP or can be set here if static
                        zIndex: imgData.depth ? Math.round(imgData.depth * 10) + 5 : 15, // Higher z-index than spread images
                      }}
                      onClick={() => openFullscreen(imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`, imgData.alt)}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Viewer (portal or simple overlay) */}
      <FullscreenViewer 
        isOpen={fullscreenImage.isOpen}
        imageUrl={fullscreenImage.url}
        altText={fullscreenImage.alt}
        onClose={closeFullscreen}
      />
    </section>
  );
};

export default HorizontalScrollSection;