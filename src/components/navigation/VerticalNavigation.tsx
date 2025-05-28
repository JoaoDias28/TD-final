import React, { useRef, useState, useEffect, useMemo } from "react";
import { gsap } from "gsap";
// ScrollTrigger might not be directly needed here anymore if all progress is prop-driven
// import { ScrollTrigger } from "gsap/ScrollTrigger"; 

// getMainHorizontalPinTrigger removed as overall progress is now a prop

interface VerticalNavProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  themes: Array<{ id: number; title: string; }>;
  horizontalProgress: { activePanel: number; progress: number };
  isInHorizontalSection: boolean;
  navigationConfig: Array<{ 
    id: string; 
    title: string; 
    scrollPosition: number; 
    icon: string; 
  }>;
  overallPageScrollProgress: number; // New prop
}

// Helper functions for calculating section completion
const calculateThemeSectionCompletion = (
  currentNavItemId: string,
  themes: VerticalNavProps['themes'], 
  horizontalProgress: VerticalNavProps['horizontalProgress']
): number => {
  const themeIdFromNav = parseInt(currentNavItemId.replace('theme-', ''));
  const themeIndexInParentArray = themes.findIndex(t => t.id === themeIdFromNav);
  
  if (themeIndexInParentArray === horizontalProgress.activePanel) {
    return horizontalProgress.progress * 100;
  } else if (themeIndexInParentArray < horizontalProgress.activePanel) {
    return 100;
  }
  return 0;
};

const calculateHomeSectionCompletion = (
  currentScrollY: number, 
  navigationSections: VerticalNavProps['navigationConfig'], 
  windowHeight: number
): number => {
  const nextSection = navigationSections[1];
  const homeSectionScrollHeight = nextSection ? nextSection.scrollPosition : windowHeight;
  return homeSectionScrollHeight > 0 
    ? Math.min(100, Math.max(0, (currentScrollY / homeSectionScrollHeight) * 100)) 
    : (currentScrollY > 0 ? 100 : 0);
};

const calculateGeneralSectionCompletion = (
  currentScrollY: number, 
  currentNavItem: VerticalNavProps['navigationConfig'][0],
  activeNavIndex: number,
  navigationSections: VerticalNavProps['navigationConfig'], 
  maxScrollableHeight: number,
  windowHeight: number
): number => {
  const sectionStartPos = currentNavItem.scrollPosition;
  const nextSectionIndex = activeNavIndex + 1;
  let sectionEndPos = maxScrollableHeight + windowHeight; 

  if (nextSectionIndex < navigationSections.length) {
    sectionEndPos = navigationSections[nextSectionIndex].scrollPosition;
  }
  
  const sectionScrollRange = sectionEndPos - sectionStartPos;
  if (sectionScrollRange > 0) {
    return Math.min(100, Math.max(0, 
      ((currentScrollY - sectionStartPos) / sectionScrollRange) * 100
    ));
  } else if (currentScrollY >= sectionStartPos) {
    return 100;
  }
  return 0;
};

const VerticalNavigation: React.FC<VerticalNavProps> = ({ 
  currentSection, 
  onNavigate, 
  themes, 
  horizontalProgress, 
  isInHorizontalSection, 
  navigationConfig, 
  overallPageScrollProgress // Destructure new prop
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  // Removed internal scrollProgress state
  const [sectionProgress, setSectionProgress] = useState({ current: 0, percentage: 0 });

  const navigationSections = useMemo(() => 
    navigationConfig.map(item => ({
      id: item.id,
      title: item.title,
      icon: item.icon,
      scrollPosition: item.scrollPosition 
    }))
  , [navigationConfig]);

  useEffect(() => {
    if (!isVisible) return;

    const updateSectionProgressState = () => {
      const windowHeight = window.innerHeight;
      const docScrollHeight = document.documentElement.scrollHeight;
      const maxScrollableHeight = docScrollHeight - windowHeight;
      const currentScrollY = window.scrollY;
      
      const activeNavIndex = navigationSections.findIndex(navItem => navItem.id === currentSection);
      
      if (activeNavIndex >= 0) {
        let currentSectionCompletion = 0;
        const currentNavItem = navigationSections[activeNavIndex];

        if (isInHorizontalSection && currentNavItem.id.startsWith('theme-')) {
          currentSectionCompletion = calculateThemeSectionCompletion(currentNavItem.id, themes, horizontalProgress);
        } else if (currentNavItem.id === 'home') {
          currentSectionCompletion = calculateHomeSectionCompletion(currentScrollY, navigationSections, windowHeight);
        } else {
          currentSectionCompletion = calculateGeneralSectionCompletion(currentScrollY, currentNavItem, activeNavIndex, navigationSections, maxScrollableHeight, windowHeight);
        }
        
        setSectionProgress({
          current: activeNavIndex,
          percentage: Math.min(100, Math.max(0, currentSectionCompletion))
        });
      }
    };

    const handleScroll = () => requestAnimationFrame(updateSectionProgressState);
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateSectionProgressState(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  // overallPageScrollProgress is not a dependency here as this effect only calculates sectionProgress
  }, [isVisible, currentSection, navigationSections, themes, horizontalProgress, isInHorizontalSection]); 

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible || !navRef.current || !pathRef.current) return;
    const path = pathRef.current;
    const pathLength = path.getTotalLength();
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.out' });

    const navItems = navRef.current.querySelectorAll('.nav-item');
    gsap.fromTo(navItems, 
      { opacity: 0, x: -30, scale: 0.8 },
      { opacity: 1, x: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)', delay: 0.5 }
    );
  }, [isVisible]);

  // This effect now uses the overallPageScrollProgress prop
  useEffect(() => {
    if (!progressPathRef.current || !pathRef.current || !isVisible) return;
    const progressPath = progressPathRef.current;
    const mainPath = pathRef.current;
    // Ensure mainPath.getTotalLength() is called only when mainPath is available and valid
    const totalLength = mainPath && typeof mainPath.getTotalLength === 'function' ? mainPath.getTotalLength() : 1000;
    
    const progressLength = totalLength * overallPageScrollProgress; // Use prop here

    gsap.to(progressPath, {
      strokeDashoffset: totalLength - progressLength,
      duration: 0.3,
      ease: 'power2.out'
    });
  }, [overallPageScrollProgress, isVisible, pathRef.current]); // pathRef.current to re-run if path becomes available

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    const activeItem = navRef.current?.querySelector(`[data-section="${sectionId}"]`);
    if (activeItem) {
      gsap.timeline()
        .to(activeItem, { scale: 1.2, duration: 0.15, ease: 'power2.out' })
        .to(activeItem, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.3)' });
      const highlight = activeItem.querySelector('.nav-point') as HTMLElement;
      if (highlight) {
        gsap.fromTo(highlight, 
          { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.8)' },
          { boxShadow: '0 0 20px 8px rgba(239, 68, 68, 0.4)', duration: 0.6, yoyo: true, repeat: 1, ease: 'power2.inOut' }
        );
      }
    }
  };

  if (!isVisible) return null;

  const pathD = `M4 0 Q4 ${navigationSections.length * 60 / 4} 4 ${navigationSections.length * 60 / 2} Q4 ${navigationSections.length * 60 * 3 / 4} 4 ${navigationSections.length * 60}`;
  const pathTotalLength = (pathRef.current && typeof pathRef.current.getTotalLength === 'function') ? pathRef.current.getTotalLength() : 1000; 

  return (
    <div 
      ref={navRef}
      className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50"
      style={{ willChange: 'transform, opacity' }} 
    >
      <svg 
        className="absolute left-6 top-0 h-full w-8 pointer-events-none"
        style={{ transform: 'translateY(-50%)', top: '50%' }}
      >
        <path
          ref={pathRef}
          d={pathD}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          ref={progressPathRef}
          d={pathD}
          stroke="rgba(239, 68, 68, 0.8)" 
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${pathTotalLength}`}
          strokeDashoffset={pathTotalLength} 
          style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' }}
        />
      </svg>

      <div className="flex flex-col space-y-8">
        {navigationSections.map((section, index) => {
          const isActive = currentSection === section.id;
          const isCurrentSectionAndActive = sectionProgress.current === index; 
          
          const isThemeNavItem = section.id.startsWith('theme-');
          let isThisThemePanelActiveInHorizontalScroll = false;
          if (isThemeNavItem && isInHorizontalSection) {
            const themeIdFromNav = parseInt(section.id.replace('theme-', ''));
            const activePanelThemeId = themes[horizontalProgress.activePanel]?.id;
            isThisThemePanelActiveInHorizontalScroll = themeIdFromNav === activePanelThemeId;
          }

          return (
            <div
              key={section.id}
              data-section={section.id}
              className="nav-item relative group cursor-pointer"
              onClick={() => handleNavClick(section.id)}
            >
              <div className="relative">
                <div 
                  className={[
                    "nav-point w-4 h-4 rounded-full border-2 transition-all duration-300 relative z-10",
                    isActive 
                      ? "bg-red-500 border-red-500 shadow-lg shadow-red-500/50" 
                      : "bg-white/10 border-white/30 group-hover:bg-white/20 group-hover:border-white/50"
                  ].join(" ")}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50"></div>
                  )}
                </div>

                {(isCurrentSectionAndActive || (isActive && isThisThemePanelActiveInHorizontalScroll)) && sectionProgress.percentage > 0 && (
                  <svg 
                    className="absolute -inset-2 w-8 h-8 transform -rotate-90"
                    viewBox="0 0 32 32"
                  >
                    <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" />
                    <circle
                      cx="16" cy="16" r="14" fill="none" stroke="rgba(239, 68, 68, 0.9)" strokeWidth="2" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={`${2 * Math.PI * 14 * (1 - sectionProgress.percentage / 100)}`}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))', transition: 'stroke-dashoffset 0.3s ease-out' }}
                    />
                  </svg>
                )}
                {isThemeNavItem && isInHorizontalSection && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-md ${isThisThemePanelActiveInHorizontalScroll ? 'bg-blue-500 animate-pulse' : 'bg-blue-500/30'}`}>
                    {isThisThemePanelActiveInHorizontalScroll && <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>}
                  </div>
                )}
              </div>
              <div 
                className={`
                  absolute left-8 top-1/2 transform -translate-y-1/2 
                  bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3
                  opacity-0 translate-x-2 pointer-events-none transition-all duration-300
                  group-hover:opacity-100 group-hover:translate-x-0
                  whitespace-nowrap z-20 min-w-[220px]
                `}
                style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${isActive ? 'text-red-400' : 'text-white/70'}`} >
                    <path d={section.icon} />
                  </svg>
                  <span className="text-sm font-medium text-white">{section.title}</span>
                  {isThemeNavItem && isInHorizontalSection && (
                    <span className="text-xs text-blue-400 font-mono">H-SCROLL{isThisThemePanelActiveInHorizontalScroll ? ' (ACTIVE)' : ''}</span>
                  )}
                </div>
                <div className="text-xs text-white/60 space-y-1">
                  {/* Use overallPageScrollProgress prop for display */}
                  <div className="flex justify-between"><span>Overall:</span><span className="font-mono">{(overallPageScrollProgress * 100).toFixed(0)}%</span></div>
                  {(isCurrentSectionAndActive || (isActive && isThisThemePanelActiveInHorizontalScroll)) && (
                    <div className="flex justify-between">
                      <span>{isThemeNavItem && isInHorizontalSection ? 'Panel:' : 'Section:'}</span>
                      <span className="font-mono text-red-400">{sectionProgress.percentage.toFixed(0)}%</span>
                    </div>
                  )}
                  {isThemeNavItem && isInHorizontalSection && (
                    <>
                    <div className="flex justify-between">
                      <span>H-Panel:</span><span className="font-mono text-blue-400">{horizontalProgress.activePanel + 1}/{themes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>H-Progress:</span><span className="font-mono text-cyan-400">{(horizontalProgress.progress * 100).toFixed(0)}%</span>
                    </div>
                    </>
                  )}
                </div>
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-black/90"></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
        <div className="text-xs text-white/60 mb-1">{isInHorizontalSection ? 'H-Scroll' : 'Progress'}</div>
        {/* Use overallPageScrollProgress prop for display */}
        <div className="text-sm font-mono text-white">{(overallPageScrollProgress * 100).toFixed(0)}%</div>
        <div className="w-12 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ease-out ${isInHorizontalSection ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-red-500'}`}
            // Use overallPageScrollProgress prop for styling width
            style={{ width: `${overallPageScrollProgress * 100}%`, boxShadow: `0 0 4px ${isInHorizontalSection ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` }}
          />
        </div>
        {isInHorizontalSection && (
          <>
            <div className="text-xs text-blue-400 mt-1 font-mono">Panel {horizontalProgress.activePanel + 1}/{themes.length}</div>
            <div className="text-xs text-cyan-300 font-mono">{(horizontalProgress.progress * 100).toFixed(0)}% in panel</div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerticalNavigation; 