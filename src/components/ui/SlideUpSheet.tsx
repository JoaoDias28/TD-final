import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';

interface SlideUpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  borderRadius?: number;
  animationDuration?: number;
  backgroundColor?: string;
  enableScroll?: boolean;
  onAnimationComplete?: () => void;
  originSection?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const SlideUpSheet: React.FC<SlideUpSheetProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  borderRadius = 32,
  animationDuration = 0.8, // Faster animation
  backgroundColor = 'bg-gradient-to-b from-black via-gray-900 to-black',
  enableScroll = true,
  onAnimationComplete,
  originSection,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const originalBodyStylesRef = useRef<{
    overflow: string;
    height: string;
    htmlOverflow: string;
  } | undefined>(undefined);

  // Scroll management: Lock main timeline when sheet is open
  useEffect(() => {
    if (!isOpen) return;

    const mainBody = document.body;
    const mainContainer = document.documentElement;
    
    // Store original styles
    originalBodyStylesRef.current = {
      overflow: mainBody.style.overflow,
      height: mainBody.style.height,
      htmlOverflow: mainContainer.style.overflow,
    };
    
    // Lock main scroll
    mainBody.style.overflow = 'hidden';
    mainBody.style.height = '100vh';
    mainContainer.style.overflow = 'hidden';
    
    return () => {
      // Restore main scroll when sheet closes
      if (originalBodyStylesRef.current) {
        mainBody.style.overflow = originalBodyStylesRef.current.overflow;
        mainBody.style.height = originalBodyStylesRef.current.height;
        mainContainer.style.overflow = originalBodyStylesRef.current.htmlOverflow;
      }
    };
  }, [isOpen]);

  // Enhanced slide-up sheet animation from origin section
  useEffect(() => {
    if (!isOpen || !sheetRef.current || isInitializedRef.current) return;

    const sheet = sheetRef.current;
    const content = contentRef.current;

    // Calculate initial position based on origin section
    let initialY = '100vh'; // Default: start from bottom
    let initialScale = 0.95;
    let initialBorderRadius = '0px';

    if (originSection) {
      // Start from the clicked section's center position
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate the center of the content area
      const sectionCenterY = originSection.y + (originSection.height / 2);
      const sectionCenterX = originSection.x + (originSection.width / 2);
      
      // Position relative to the center of the screen
      const screenCenterY = viewportHeight / 2;
      const offsetFromCenter = sectionCenterY - screenCenterY;
      
      // Start the sheet from slightly below the content center
      initialY = `${viewportHeight - sectionCenterY + 100}px`; // Start 100px below content center
      initialScale = 0.2; // Start very small when coming from a specific section
      initialBorderRadius = `${borderRadius}px`; // Start with rounding
      
      console.log('Origin animation setup:', {
        sectionCenter: { x: sectionCenterX, y: sectionCenterY },
        viewportCenter: { x: viewportWidth / 2, y: screenCenterY },
        initialY,
        initialScale
      });
    }

    // Set initial state for slide-up sheet
    gsap.set(sheet, { 
      y: initialY,
      scale: initialScale,
      borderTopLeftRadius: initialBorderRadius,
      borderTopRightRadius: initialBorderRadius,
      transformOrigin: originSection ? 'center bottom' : 'center center',
    });

    // Create master slide-up sheet entrance timeline
    const masterTl = gsap.timeline({
      delay: 0.05, // Faster start
      onComplete: () => {
        isInitializedRef.current = true;
        // Enable scroll only within the sheet content area
        if (enableScroll && content) {
          content.style.overflowY = 'auto';
        }
        if (onAnimationComplete) onAnimationComplete();
      }
    });

    if (originSection) {
      // Animation from specific section
      masterTl
        // Phase 1: Quick scale and position adjustment
        .to(sheet, {
          scale: 0.8,
          y: window.innerHeight * 0.3,
          duration: animationDuration * 0.3,
          ease: 'power2.out'
        })
        // Phase 2: Expand and slide to final position
        .to(sheet, {
          y: 0,
          scale: 1,
          duration: animationDuration * 0.7,
          ease: 'power3.out'
        })
        // Phase 3: Final corner adjustment
        .to(sheet, {
          borderTopLeftRadius: `${borderRadius}px`,
          borderTopRightRadius: `${borderRadius}px`,
          duration: animationDuration * 0.4,
          ease: 'power2.out'
        }, `-=${animationDuration * 0.4}`);
    } else {
      // Default animation from bottom
      masterTl
        .to(sheet, {
          y: 0,
          scale: 1,
          duration: animationDuration,
          ease: 'power3.out'
        })
        .to(sheet, {
          borderTopLeftRadius: `${borderRadius}px`,
          borderTopRightRadius: `${borderRadius}px`,
          duration: animationDuration * 0.6,
          ease: 'power2.out'
        }, `-=${animationDuration * 0.6}`);
    }

    return () => {
      masterTl.kill();
    };
  }, [isOpen, borderRadius, animationDuration, enableScroll, onAnimationComplete, originSection]);

  // Enhanced slide-down exit animation (with origin support)
  const handleClose = () => {
    const sheet = sheetRef.current;
    const content = contentRef.current;

    if (!sheet) {
      onClose();
      return;
    }

    // Disable sheet scroll during exit
    if (content) {
      content.style.overflowY = 'hidden';
    }

    // Create coordinated slide-down exit animation
    const exitTl = gsap.timeline({
      onComplete: () => {
        isInitializedRef.current = false;
        onClose();
      }
    });

    if (originSection) {
      // Exit back to origin section center
      const viewportHeight = window.innerHeight;
      const sectionCenterY = originSection.y + (originSection.height / 2);
      const exitY = `${viewportHeight - sectionCenterY + 100}px`; // Same calculation as entry
      
      console.log('Exit animation to origin:', { 
        sectionCenterY, 
        exitY,
        viewportHeight,
        originSection 
      });
      
      exitTl
        .to(sheet, {
          borderTopLeftRadius: `${borderRadius}px`,
          borderTopRightRadius: `${borderRadius}px`,
          scale: 0.6,
          duration: animationDuration * 0.25,
          ease: 'power2.in'
        })
        .to(sheet, {
          y: exitY,
          scale: 0.2,
          duration: animationDuration * 0.6,
          ease: 'power3.in'
        }, `-=${animationDuration * 0.15}`);
    } else {
      // Default exit to bottom
      exitTl
        .to(sheet, {
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          duration: animationDuration * 0.4,
          ease: 'power2.in'
        })
        .to(sheet, {
          y: '100vh',
          duration: animationDuration * 0.8,
          ease: 'power3.in'
        }, `-=${animationDuration * 0.2}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={sheetRef}
      className={`fixed inset-0 z-50 ${backgroundColor} ${className}`}
      style={{ 
        transform: 'translateY(100vh)',
        borderTopLeftRadius: '0px',
        borderTopRightRadius: '0px',
        boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Sheet Content Area with Independent Scroll */}
      <div
        ref={contentRef}
        className="h-full overflow-hidden"
        style={{ overflowY: 'hidden' }} // Initially hidden, enabled after animation
      >
        {/* Close button overlay */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-50 p-3 rounded-full  transition-all duration-300 hover:scale-105 group"
          aria-label="Close sheet"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
};

export default SlideUpSheet; 