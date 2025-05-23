import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface CameraViewProps {
  isActive: boolean;
  onAnimationComplete?: () => void;
  onZoomInComplete?: () => void;
  children: React.ReactNode;
}

const CameraView: React.FC<CameraViewProps> = ({
  isActive,
  onAnimationComplete,
  onZoomInComplete,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastStateRef = useRef<boolean>(false);
  
  // Handle camera zoom effect
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    // Detect state change direction
    const isZoomingIn = lastStateRef.current && !isActive;
    const isZoomingOut = !lastStateRef.current && isActive;
    lastStateRef.current = isActive;
    
    // Kill any ongoing animations
    gsap.killTweensOf(contentRef.current);
    
    // Set initial state
    gsap.set(containerRef.current, {
      perspective: 1000,
      overflow: 'hidden'
    });
    
    if (isZoomingOut) {
      // Prepare for zoom-out animation
      gsap.set(contentRef.current, {
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
      });
      
      // Animate zoom out effect
      const tl = gsap.timeline({
        onComplete: () => {
          if (onAnimationComplete) onAnimationComplete();
        }
      });
      
      // Camera pulls back
      tl.to(contentRef.current, {
        scale: 0.8,
        y: -40,
        z: -150,
        duration: 1.2,
        ease: 'power2.inOut'
      });
      
      // Add semi-transparent overlay
      const overlay = document.createElement('div');
      overlay.className = 'camera-overlay';
      containerRef.current.appendChild(overlay);
      
      gsap.set(overlay, {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        opacity: 0,
        zIndex: 5,
        pointerEvents: 'none'
      });
      
      gsap.to(overlay, {
        opacity: 1,
        duration: 1,
        ease: 'power2.inOut'
      });
      
    } else if (isZoomingIn) {
      // Find overlay if it exists
      const overlay = containerRef.current.querySelector('.camera-overlay');
      
      // Animate zoom back in
      const tl = gsap.timeline({
        onComplete: () => {
          // Remove overlay after animation
          if (overlay) {
            overlay.remove();
          }
          
          if (onZoomInComplete) onZoomInComplete();
        }
      });
      
      // Fade out overlay
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut'
        });
      }
      
      // Reset scale and position - camera zooms back in
      tl.to(contentRef.current, {
        scale: 1,
        y: 0,
        z: 0,
        duration: 1,
        ease: 'power2.out'
      });
    }
    
    // Cleanup
    return () => {
      gsap.killTweensOf(contentRef.current);
      const overlay = containerRef.current?.querySelector('.camera-overlay');
      if (overlay) {
        gsap.killTweensOf(overlay);
      }
    };
  }, [isActive, onAnimationComplete, onZoomInComplete]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div 
        ref={contentRef} 
        className="w-full h-full transform-gpu"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
};

export default CameraView;
