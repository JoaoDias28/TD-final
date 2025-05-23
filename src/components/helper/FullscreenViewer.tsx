import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface FullscreenViewerProps {
  isOpen: boolean;
  imageUrl: string;
  altText: string;
  onClose: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ 
  isOpen, 
  imageUrl, 
  altText, 
  onClose 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Handle image loading
  const handleImageLoaded = () => {
    setIsLoaded(true);
  };

  // Animation for opening and closing
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;
    
    if (isOpen) {
      // Reset visibility first
      gsap.set(container, { visibility: 'visible', opacity: 0 });
      gsap.set(image, { scale: 0.8, opacity: 0 });
      
      // Create opening animation
      const tl = gsap.timeline();
      tl.to(container, { opacity: 1, duration: 0.3, ease: 'power2.out' })
        .to(image, { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5, 
          ease: 'back.out(1.2)' 
        }, "-=0.1");
        
      return () => {
        tl.kill();
      };
    } else {
      // Create closing animation
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(container, { visibility: 'hidden' });
        }
      });
      
      tl.to(image, { 
        scale: 0.8, 
        opacity: 0, 
        duration: 0.3, 
        ease: 'power2.in' 
      })
      .to(container, { 
        opacity: 0, 
        duration: 0.2,
        ease: 'power1.in' 
      }, "-=0.1");
      
      return () => {
        tl.kill();
      };
    }
  }, [isOpen]);

  // Handle ESC key to close the viewer
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      style={{ visibility: 'hidden' }}
      onClick={onClose}
    >
      {/* Loading spinner */}
      {!isLoaded && isOpen && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
         aria-label="Close fullscreen viewer"
       >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Image container with click event stopping propagation */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[90vh] object-contain"
          onLoad={handleImageLoaded}
        />
      </div>
      
      {/* Image caption */}
      {altText && (
        <div className="absolute bottom-6 left-0 right-0 text-center text-white text-lg">
          {altText}
        </div>
      )}
    </div>
  );
};

export default FullscreenViewer;
