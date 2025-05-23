
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ThemePanel, SpreadParallaxImage, BottomStripImage } from '../../../types/types'; // Adjust path as needed
import FullscreenViewer from '../../helper/FullscreenViewer';

gsap.registerPlugin(ScrollTrigger);

// Debug flag - set to false in production
const DEBUG = false; 

interface HorizontalScrollSectionProps {
  themes: ThemePanel[];
  onCTAClick: (theme: ThemePanel, index: number) => void;
}

const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({ themes, onCTAClick }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  // const overlayRef = useRef<HTMLDivElement>(null); // REMOVED

  const [fullscreenImage, setFullscreenImage] = useState<{
    isOpen: boolean;
    url: string;
    alt: string;
  }>({
    isOpen: false,
    url: '',
    alt: '',
  });
  
  const contentContainersRef = useRef<(HTMLDivElement | null)[]>([]);

  const openFullscreen = (imageUrl: string, imageAlt: string) => {
    setFullscreenImage({ isOpen: true, url: imageUrl, alt: imageAlt });
  };

  const closeFullscreen = () => {
    setFullscreenImage(prev => ({ ...prev, isOpen: false }));
  };

  panelRefs.current = [];
  contentContainersRef.current = [];

  useLayoutEffect(() => {
    themes.forEach(theme => {
      theme.spreadImages?.forEach(img => {
        const imgTest = new Image();
        imgTest.onerror = () => console.warn(`Image not found: ${img.src}`);
        imgTest.src = img.src.startsWith('/') ? img.src : `/${img.src}`;
      });
      theme.bottomStripImages?.forEach(img => {
        const imgTest = new Image();
        imgTest.onerror = () => console.warn(`Image not found: ${img.src}`);
        imgTest.src = img.src.startsWith('/') ? img.src : `/${img.src}`;
      });
    });

    if (typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.body.style.overflow = originalOverflow;
      }, 300);
    }
    
    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    
    if (!sectionRef.current || !panelsContainerRef.current || panels.length === 0) return;
    
    // let lastOverlayOpacity = -1; // REMOVED

    ScrollTrigger.getAll()
      .filter(st => st.vars.trigger === sectionRef.current || panels.some(p => st.vars.trigger === p))
      .forEach(st => st.kill());

    const ctx = gsap.context(() => {
      const screenWidth = window.innerWidth;
      const panelWidth = screenWidth;
      const totalPanelWidth = panelWidth * panels.length;
      
      gsap.set(panelsContainerRef.current, { 
        width: totalPanelWidth,
        force3D: true,
        willChange: "transform",
        backfaceVisibility: "hidden",
        perspective: 1000
      });
      
      panels.forEach(panel => {
        gsap.set(panel, { 
          width: panelWidth,
          force3D: true,
          willChange: "transform", 
          backfaceVisibility: "hidden"
        });
      });
      
      const horizontalScrollTween = gsap.to(panelsContainerRef.current, {
        x: () => -(totalPanelWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.1,
          start: "top top",
          end: () => `+=${totalPanelWidth - screenWidth}`,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          preventOverlaps: true,
          markers: false,
          onEnter: () => {
            gsap.set([sectionRef.current, panelsContainerRef.current], {
              willChange: "transform",
              force3D: true,
              backfaceVisibility: "hidden"
            });
            // if (overlayRef.current) { // REMOVED overlay logic
            //   gsap.set(overlayRef.current, { 
            //     visibility: "visible", 
            //     opacity: 0,
            //     force3D: true
            //   });
            // }
          },
          // onUpdate: (self) => { // REMOVED onUpdate for overlay
          //   if (overlayRef.current) {
          //     const progress = self.progress;
          //     const normalizedPos = progress * (panels.length - 1);
          //     const panelProgress = normalizedPos - Math.floor(normalizedPos);
          //     const fadePattern = Math.sin(panelProgress * Math.PI) * 0.15;
          //     const targetOpacity = fadePattern;
          //     if (Math.abs(targetOpacity - lastOverlayOpacity) > 0.01) {
          //       gsap.set(overlayRef.current, { opacity: targetOpacity });
          //       lastOverlayOpacity = targetOpacity;
          //     }
          //   }
          // }
        }
      });

      if (DEBUG) {
        console.log('Horizontal scroll setup:', {
          totalPanelWidth,
          screenWidth,
          panels: panels.length,
          scrollDistance: totalPanelWidth - screenWidth
        });
      }
      
      panels.forEach((panel, panelIndex) => {
        const currentTheme = themes[panelIndex];
        if (!currentTheme) return;
        
        const contentContainer = contentContainersRef.current[panelIndex];
        if (!contentContainer) {
            if (DEBUG) console.warn(`Content container for panel ${panelIndex} not found.`);
            return;
        }
        
        const heading = contentContainer.querySelector('h2');
        const description = contentContainer.querySelector('p');
        const ctaButton = contentContainer.querySelector('.cta-button');
        const textElements = [heading, description, ctaButton].filter(Boolean) as HTMLElement[];


        const isFirstPanel = panelIndex === 0;

        gsap.set(contentContainer, {
          position: 'fixed', top: '50%', left: '50%', xPercent: -50, yPercent: -50,
          opacity: isFirstPanel ? 1 : 0,
          zIndex: 30, width: 'auto', maxWidth: 'clamp(300px, 90vw, 700px)',
          pointerEvents: isFirstPanel ? 'auto' : 'none',
          filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2))',
          visibility: isFirstPanel ? 'visible' : 'hidden',
          backfaceVisibility: "hidden"
        });
        
        if (textElements.length > 0) {
          gsap.set(textElements, { 
            opacity: isFirstPanel ? 1 : 0,
            y: isFirstPanel ? 0 : 30,
            rotationX: isFirstPanel ? 0 : 5,
            transformPerspective: 1000, transformOrigin: "center center",
            force3D: true, willChange: 'opacity, transform',
            backfaceVisibility: "hidden"
          });
        }
        
        const animateTextIn = () => {
          if (DEBUG) console.log(`Panel ${panelIndex} Text: animateTextIn`);
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
              delay: 0.1
            });
          }
        };

        const animateTextOut = () => {
          if (DEBUG) console.log(`Panel ${panelIndex} Text: animateTextOut`);
          gsap.to(contentContainer, {
            opacity: 0,
            duration: 0.4, 
            ease: "power2.in",
            onComplete: () => {
              const textActivationST = ScrollTrigger.getById(`text-activation-st-${panelIndex}`);
              if (!textActivationST || !textActivationST.isActive) {
                gsap.set(contentContainer, { visibility: 'hidden', pointerEvents: 'none' });
              }
            }
          });
          if (textElements.length > 0) {
            gsap.to(textElements, {
              opacity: 0, y: -30, rotationX: -5,
              stagger: { each: 0.08, from: "end" }, 
              duration: 0.5, 
              ease: "power2.in",
            });
          }
        };
        
        ScrollTrigger.create({
          trigger: panel,
          containerAnimation: horizontalScrollTween,
          start: "left center", 
          end: "right center",  
          markers: false, 
          id: `text-activation-st-${panelIndex}`,
          onEnter: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} Text ST: ON ENTER`);
            animateTextIn();
          },
          onLeave: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} Text ST: ON LEAVE`);
            animateTextOut();
          },
          onEnterBack: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} Text ST: ON ENTER BACK`);
            animateTextIn();
          },
          onLeaveBack: () => {
            if (DEBUG) console.log(`Panel ${panelIndex} Text ST: ON LEAVE BACK`);
            if (isFirstPanel) {
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
              animateTextOut();
            }
          },
        });

        if (currentTheme.spreadImages && currentTheme.spreadImages.length > 0) {
          const spreadImagesContainer = panel.querySelector('.spread-images-container');
          if (spreadImagesContainer) {
            gsap.set(spreadImagesContainer, { force3D: true, willChange: "transform", backfaceVisibility: "hidden", perspective: 1000 });
            gsap.to(spreadImagesContainer, {
              x: `-=${screenWidth * 0.05}`, ease: "none",
              scrollTrigger: {
                trigger: panel, containerAnimation: horizontalScrollTween,
                start: "left right", end: "right left", scrub: 0.5, 
                markers: false, 
              }
            });
          }
          currentTheme.spreadImages.forEach((imgData, imgIndex) => {
            const imgElement = panel.querySelector(`.panel-${panelIndex}-spread-img-${imgIndex}`) as HTMLImageElement;
            if (!imgElement) return;
            if (imgData.src && imgData.src.indexOf('/') !== 0) imgElement.src = `/${imgData.src}`;
            
            const depth = imgData.config.depth || 1;
            gsap.set(imgElement, {
              opacity: 0, x: ((imgIndex % 3) - 1) * screenWidth * 0.2, scale: 0.8,
              force3D: true, willChange: "transform, opacity", backfaceVisibility: "hidden", perspective: 1000
            });
            const imgTimeline = gsap.timeline({
              scrollTrigger: {
                trigger: panel, containerAnimation: horizontalScrollTween,
                start: "left 80%", end: "right 20%", scrub: 0.5, fastScrollEnd: true,
                markers: false, 
              }
            });
            imgTimeline
              .to(imgElement, {
                opacity: 1, x: ((imgIndex % 3) - 1) * screenWidth * 0.15, scale: 1,
                rotation: imgData.config.rotate || 0,
                xPercent: (1 - depth) * 15, yPercent: ((imgIndex % 2) ? 1 : -1) * (1 - depth) * 8,
                ease: "power1.out", duration: 0.4
              }, 0)
              .to(imgElement, {
                opacity: 0, xPercent: (imgIndex % 2 ? 30 : -30), yPercent: (imgIndex % 3 - 1) * 15,
                ease: "power1.in", duration: 0.4
              }, 0.6);
          });
        }
        
        const bottomStripContainer = panel.querySelector(`.panel-${panelIndex}-bottom-strip-container`);
        if (currentTheme.bottomStripImages && currentTheme.bottomStripImages.length > 0 && bottomStripContainer) {
          const bottomImages = currentTheme.bottomStripImages.map((imgData, imgIdx) => {
            const imgElement = panel.querySelector(`.panel-${panelIndex}-bottom-img-${imgIdx}`) as HTMLImageElement;
            if (imgElement) {
              if (imgData.src && imgData.src.indexOf('/') !== 0) imgElement.src = `/${imgData.src}`;
            }
            return imgElement;
          }).filter(Boolean) as HTMLImageElement[];
          
          gsap.set(bottomStripContainer, { force3D: true, willChange: "transform", backfaceVisibility: "hidden", perspective: 1000 });
          
          bottomImages.forEach((img, imgIdx) => {
            const totalSpread = screenWidth * 0.6;
            const itemCount = bottomImages.length;
            const spreadStep = totalSpread / (itemCount > 1 ? itemCount - 1 : 1);
            const baseOffset = (screenWidth - totalSpread) / 2;
            const horizontalPosition = baseOffset + (itemCount > 1 ? (spreadStep * imgIdx) : totalSpread / 2);
            gsap.set(img, {
              opacity: 0, y: 80, scale: 0.9, rotation: ((imgIdx % 2) ? 2 : -2),
              left: `${horizontalPosition}px`, bottom: `${15 + (imgIdx % 3) * 3}%`, xPercent: -50,
              force3D: true, willChange: "transform, opacity", backfaceVisibility: "hidden"
            });
          });
          
          const bottomImagesTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: panel, containerAnimation: horizontalScrollTween,
              start: "left 70%", end: "right 30%", scrub: 0.5,
              markers: false, 
            }
          });
          
          bottomImages.forEach((img, imgIdx) => {
            const imgData = currentTheme.bottomStripImages?.[imgIdx]; 
            if (!imgData) return;
            const depth = imgData.depth ?? 1; 
            const staggerDelay = imgIdx * 0.04;
            
            bottomImagesTimeline.to(img, { 
              opacity: 1, y: 0, scale: 1, ease: "back.out(1.2)", duration: 0.3 
            }, staggerDelay);
            bottomImagesTimeline.to(img, {
              xPercent: -50 + ((imgIdx % 2 ? 1 : -1) * (1 - depth) * 20),
              y: ((imgIdx % 3) - 1) * (1 - depth) * 10,
              rotation: ((imgIdx % 2 ? 1 : -1) * (depth * 1.5) + ((imgIdx % 2) ? 2 : -2)),
              ease: "power1.inOut", duration: 0.5
            }, staggerDelay + 0.1);
            bottomImagesTimeline.to(img, {
              opacity: 0, y: 100 + (imgIdx % 3) * 15, xPercent: -50 + ((imgIdx % 2 ? 1 : -1) * 40),
              scale: 0.8, rotation: ((imgIdx % 2 ? 5 : -5)),
              ease: "power1.in", duration: 0.3
            }, 0.7 + staggerDelay * 0.2);
          });
        }
      }); 
      
    }, sectionRef); 

    return () => {
      ctx.revert(); 
    };
  }, [themes, onCTAClick, DEBUG]);

  return (
    <section 
      ref={sectionRef} 
      className="h-screen overflow-hidden relative"
    >
      <div
        ref={panelsContainerRef}
        className="h-full flex will-change-transform" 
        style={{ width: "fit-content" }}
      >
        {themes.map((theme: ThemePanel, panelIndex: number) => (
          <div
            key={theme.id}
            ref={(el) => { panelRefs.current[panelIndex] = el; }}
            className={`h-full flex-shrink-0 flex flex-col justify-center items-center relative ${theme.gradientClass || ''}`}
            style={{ 
              width: '100vw',
              position: 'relative',
              overflow: 'hidden' 
            }}
          >
            {theme.spreadImages && theme.spreadImages.length > 0 && (
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none spread-images-container z-0">
                {theme.spreadImages.map((imgData: SpreadParallaxImage, imgIndex: number) => (
                  <img
                    key={`spread-${panelIndex}-${imgIndex}`}
                    src={imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`}
                    alt={imgData.alt}
                    className={`absolute panel-${panelIndex}-spread-img-${imgIndex} object-contain will-change-transform cursor-pointer`}
                    style={{
                      width: imgData.config.width || '200px',
                      height: imgData.config.height || '200px',
                      top: imgData.config.initialY,
                      left: imgData.config.initialX,
                      zIndex: imgData.config.depth ? Math.round(imgData.config.depth * 10) : 1,
                      transform: `scale(${imgData.config.scale || 1}) rotate(${imgData.config.rotate || 0}deg)`
                    }}
                    onClick={() => openFullscreen(imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`, imgData.alt)}
                  />
                ))}
              </div>
            )}
            
            <div 
              ref={(el) => { contentContainersRef.current[panelIndex] = el; }}
              className="content-container" 
            >
              <div className="max-w-2xl mx-auto text-center px-6 sm:px-8 relative">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 text-white">
                  {theme.title}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl leading-relaxed mb-8 md:mb-10 max-w-xl mx-auto text-gray-200">
                  {theme.description}
                </p>
                <a
                  href="#" onClick={(e) => { e.preventDefault(); onCTAClick(theme, panelIndex); }}
                  className="cta-button inline-block py-3 px-8 sm:py-4 sm:px-10 bg-white/10 hover:bg-white/20 border border-white/50 rounded-lg font-semibold text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl text-md sm:text-lg backdrop-blur-sm"
                >
                  {theme.ctaText}
                </a>
              </div>
            </div>

            {theme.bottomStripImages && theme.bottomStripImages.length > 0 && (
              <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none panel-${panelIndex}-bottom-strip-container z-10`}>
                {theme.bottomStripImages.map((imgData: BottomStripImage, imgIndex: number) => (
                  <img
                    key={`bottom-${panelIndex}-${imgIndex}`}
                    src={imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`}
                    alt={imgData.alt}
                    className={`absolute panel-${panelIndex}-bottom-img-${imgIndex} object-cover rounded-lg shadow-xl will-change-transform cursor-pointer hover:shadow-2xl transition-shadow duration-300 pointer-events-auto`}
                    style={{
                      width: imgData.width || '150px',
                      height: imgData.height || 'auto',
                      zIndex: imgData.depth ? Math.round(imgData.depth * 10) + 5 : 5,
                    }}
                    onClick={() => openFullscreen(imgData.src.startsWith('/') ? imgData.src : `/${imgData.src}`, imgData.alt)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* REMOVED OVERLAY ELEMENT
      <div 
        ref={overlayRef} 
        className="fixed inset-0 pointer-events-none z-20 opacity-0 will-change-opacity"
        style={{
          background: "rgba(0, 0, 0, 0.9)",
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "translateZ(0)", WebkitTransform: "translateZ(0)",
          visibility: "hidden"
        }}
      ></div> 
      */}

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
