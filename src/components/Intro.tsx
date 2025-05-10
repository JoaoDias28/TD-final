import { useMemo, useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { usePhase } from '../store/intro-phase';
import type { Picture } from 'vite-imagetools';

// ─── Types ────
export type FrameData = string | Picture | { source: string | Picture; alt?: string };
export type Themes = Record<string, ReadonlyArray<FrameData>>;

interface IntroProps {
  themes: Themes;
  /** seconds each frame is visible */
  swapEvery?: number;
  /** seconds before the whole intro fades out */
  lifespan?: number;
  /** Tailwind width class for each column. Should correspond to visibleColumns. e.g., w-1/3 for 3 columns. */
  columnWidthClass?: string;
  /** Duration in seconds for one full carousel loop of all visible columns */
  carouselLoopDuration?: number;
  /** How many columns to display on screen at once */
  visibleColumns?: number;
  /** Reference to the container for morphing transition */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

// ─── Type guards ────
const isPicture = (f: FrameData): f is Picture =>
  typeof f === 'object' && 'img' in f;

const isImageSource = (
  f: FrameData,
): f is { source: string | Picture; alt?: string } =>
  typeof f === 'object' && 'source' in f;

// ─── Helpers ────
const getSrc = (f: FrameData): string => {
  if (typeof f === 'string') return f;
  if (isPicture(f)) return f.img.src;
  if (isImageSource(f)) return typeof f.source === 'string' ? f.source : f.source.img.src;
  return '';
};

const getAlt = (f: FrameData, fallback = ''): string =>
  isImageSource(f) && f.alt ? f.alt : fallback;

// Helper to check if a URL is an SVG
const isSvgImage = (url: string): boolean => {
  return url.toLowerCase().endsWith('.svg');
};

// Format theme ID to a readable title
const formatThemeTitle = (id: string): string => {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ─── Component ────
export default function Intro({
  themes,
  swapEvery = 1.8,
  lifespan = 4.5,
  columnWidthClass = 'w-1/3',
  carouselLoopDuration = 12,
  visibleColumns = 3,
  containerRef,
}: IntroProps) {
  const wrapRef = useRef<HTMLElement | null>(null);
  const internalContainerRef = useRef<HTMLDivElement | null>(null);
  const actualContainerRef = containerRef || internalContainerRef;
  const { setPhase } = usePhase();
  const carouselTweenRef = useRef<gsap.core.Tween | null>(null);
  const startTimeRef = useRef<number>(0);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const preloadedImages = useRef<Record<string, boolean>>({});

  const allColumnsData = useMemo(() => {
    return Object.entries(themes).map(([id, frames]) => ({ 
      id, 
      frames,
      title: formatThemeTitle(id)
    }));
  }, [themes]);

  // Preload all images before starting the animation
  useEffect(() => {
    const allImageSrcs: string[] = [];
    
    // Collect all unique image sources
    Object.values(themes).forEach(frames => {
      frames.forEach(frame => {
        const src = getSrc(frame);
        if (src && !preloadedImages.current[src]) {
          allImageSrcs.push(src);
          preloadedImages.current[src] = false;
        }
      });
    });
    
    // Count loaded images
    let loadedCount = 0;
    
    // Load all images before starting animation
    allImageSrcs.forEach(src => {
      const img = new Image();
      img.onload = () => {
        preloadedImages.current[src] = true;
        loadedCount++;
        
        if (loadedCount === allImageSrcs.length) {
          setImagesPreloaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === allImageSrcs.length) {
          setImagesPreloaded(true);
        }
      };
      img.src = src;
    });
    
    // If no images to preload, mark as ready
    if (allImageSrcs.length === 0) {
      setImagesPreloaded(true);
    }
    
    return () => {
      // Clean up
      if (carouselTweenRef.current) {
        carouselTweenRef.current.kill();
      }
    };
  }, [themes]);

  useGSAP(
    () => {
      // Don't start animation until images are preloaded
      if (!wrapRef.current || !actualContainerRef.current || !imagesPreloaded || allColumnsData.length === 0) return;

      // Set start time for lifespan tracking
      startTimeRef.current = gsap.globalTimeline.time();

      const container = actualContainerRef.current;
      
      // Clear previous content if any
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Get dimensions
      const columnMargin = 10; // Small margin in pixels between columns
      const totalMarginSpace = columnMargin * (visibleColumns - 1);
      const containerWidth = container.offsetWidth;
      const columnWidth = containerWidth / visibleColumns;
      
      // Create columns
      const columnElements: HTMLDivElement[] = [];
      
      allColumnsData.forEach(({ id, frames, title }, idx) => {
        // Create column element
        const column = document.createElement('div');
        column.className = 'intro-column';
        column.style.cssText = `
  position: absolute;
  width: ${columnWidth}px;
  height: 100%;
  top: 100%;
  left: 0;
  transform: translateX(${idx * (columnWidth + columnMargin)}px) scale(0.5);
  transform-origin: center bottom;
  opacity: 0;
  will-change: transform, opacity;
`;
        
        // Create label
        const labelWrapper = document.createElement('div');
        labelWrapper.className = 'column-label';
        labelWrapper.style.cssText = `
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
          pointer-events: none;
          opacity: 0;
          transform: translateY(20px);
        `;
        
        const labelInner = document.createElement('div');
        labelInner.className = 'bg-black bg-opacity-30 backdrop-blur-sm px-3 py-1.5 rounded-md';
        
        const titleElement = document.createElement('h3');
        titleElement.className = 'text-white text-sm font-light tracking-wide uppercase';
        titleElement.textContent = title;
        
        labelInner.appendChild(titleElement);
        labelWrapper.appendChild(labelInner);
        column.appendChild(labelWrapper);
        
        // Create image container
        const imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        imgContainer.style.cssText = `
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        `;
        
        // Create double buffer for smooth image swapping (two divs with background-image)
        const buffer1 = document.createElement('div');
        buffer1.className = 'image-buffer buffer-1 active';
        buffer1.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          transition: opacity 0.4s ease;
          z-index: 2;
        `;
        
        const buffer2 = document.createElement('div');
        buffer2.className = 'image-buffer buffer-2';
        buffer2.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          transition: opacity 0.4s ease;
          opacity: 0;
          z-index: 1;
        `;
        
        // Set up SVG container if needed
        const svgContainer = document.createElement('div');
        svgContainer.className = 'svg-container';
        svgContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          opacity: 0;
        `;
        
        // Set initial image
        if (frames.length > 0) {
          const firstFrame = frames[0];
          const firstSrc = getSrc(firstFrame);
          
          if (isSvgImage(firstSrc)) {
            // For SVGs, use img element in center
            const svgImg = document.createElement('img');
            svgImg.src = firstSrc;
            svgImg.alt = getAlt(firstFrame, `Theme ${idx + 1} image 1`);
            svgImg.style.cssText = `
              width: 60%;
              height: auto;
              object-fit: contain;
            `;
            svgContainer.appendChild(svgImg);
            svgContainer.style.opacity = '1';
          } else {
            // For regular images, use background-image (better performance)
            buffer1.style.backgroundImage = `url(${firstSrc})`;
          }
        }
        
        // Add elements to container
        imgContainer.appendChild(buffer1);
        imgContainer.appendChild(buffer2);
        imgContainer.appendChild(svgContainer);
        column.appendChild(imgContainer);
        
        // Store data for animation
        column.dataset.themeIdx = String(idx % allColumnsData.length);
        column.dataset.currentFrameIdx = '0';
        
        // Add to container and track
        container.appendChild(column);
        columnElements.push(column);
      });
      
      // Simple fade masks - more performant with background gradients
      if (containerWidth > 600) { // Skip on very small screens
        const leftMask = document.createElement('div');
        leftMask.className = 'fade-mask left-mask';
        leftMask.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 80px;
          z-index: 10;
          pointer-events: none;
          background: linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0));
        `;
        
        const rightMask = document.createElement('div');
        rightMask.className = 'fade-mask right-mask';
        rightMask.style.cssText = `
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: 80px;
          z-index: 10;
          pointer-events: none;
          background: linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0));
        `;
        
        container.appendChild(leftMask);
        container.appendChild(rightMask);
      }
      
      // Make container visible
      gsap.set(container, { autoAlpha: 1 });
      
      // Animate columns in
      const timeline = gsap.timeline();
      
      // 1. Animate columns rising from bottom
      timeline.to(columnElements, {
        top: '0%',
        opacity: 1,
        scale: 1,
        duration: 1.0, 
        stagger: {
          each: 0.08,
          from: "center",
        },
        ease: "back.out(1.4)",
        force3D: true,
      });
      
      // 2. Animate in labels
      const labelElements = Array.from(container.querySelectorAll('.column-label'));
      timeline.to(labelElements, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
        force3D: true,
      }, ">-0.2");
      
      // 3. Set up carousel
      timeline.add(() => {
        setupCarousel();
      });
      
      // Set up image swapping using double-buffer technique
      const setupImageSwapping = () => {
        columnElements.forEach((column) => {
          const themeIdx = parseInt(column.dataset.themeIdx || '0', 10);
          const frames = allColumnsData[themeIdx].frames;
          
          if (frames.length < 2) return;
          
          // Set up interval for swapping
          const swapImages = () => {
            const elapsedTime = gsap.globalTimeline.time() - startTimeRef.current;
            if (elapsedTime > lifespan - 1) return; // Don't swap near end
            
            const currentFrameIdx = parseInt(column.dataset.currentFrameIdx || '0', 10);
            const nextFrameIdx = (currentFrameIdx + 1) % frames.length;
            const nextFrame = frames[nextFrameIdx];
            const nextSrc = getSrc(nextFrame);
            const isSvg = isSvgImage(nextSrc);
            
            // Get both buffers
            const imgContainer = column.querySelector('.img-container');
            if (!imgContainer) return;
            
            // Get elements
            const buffer1 = imgContainer.querySelector('.buffer-1') as HTMLDivElement;
            const buffer2 = imgContainer.querySelector('.buffer-2') as HTMLDivElement;
            const svgContainer = imgContainer.querySelector('.svg-container') as HTMLDivElement;
            
            if (isSvg) {
              // Handle SVG case - more efficient to use innerHTML for SVGs
              while (svgContainer.firstChild) {
                svgContainer.removeChild(svgContainer.firstChild);
              }
              
              const svgImg = document.createElement('img');
              svgImg.src = nextSrc;
              svgImg.alt = getAlt(nextFrame, `Theme ${themeIdx + 1} image ${nextFrameIdx + 1}`);
              svgImg.style.cssText = `
                width: 60%;
                height: auto;
                object-fit: contain;
                opacity: 0;
                transition: opacity 0.4s ease;
              `;
              
              svgContainer.appendChild(svgImg);
              svgContainer.style.opacity = '0';
              
              // Force reflow before animation
              void svgContainer.offsetWidth;
              
              // Fade in SVG
              svgContainer.style.opacity = '1';
              if (svgImg) svgImg.style.opacity = '1';
              
              // Hide regular image buffers
              buffer1.style.opacity = '0';
              buffer2.style.opacity = '0';
            } else {
              // Hide SVG container
              svgContainer.style.opacity = '0';
              
              // Handle regular image - double buffer technique
              // Find inactive buffer
              const activeBuffer = buffer1.classList.contains('active') ? buffer1 : buffer2;
              const inactiveBuffer = buffer1.classList.contains('active') ? buffer2 : buffer1;
              
              // Prepare inactive buffer with new image - must happen before changing opacity
              inactiveBuffer.style.backgroundImage = `url(${nextSrc})`;
              
              // Force reflow before animation
              void inactiveBuffer.offsetWidth;
              
              // Swap z-index
              activeBuffer.style.zIndex = '1';
              inactiveBuffer.style.zIndex = '2';
              
              // Show inactive buffer (now with new image) and hide active
              inactiveBuffer.style.opacity = '1';
              activeBuffer.style.opacity = '0';
              
              // Toggle active class
              activeBuffer.classList.remove('active');
              inactiveBuffer.classList.add('active');
            }
            
            // Update current frame index
            column.dataset.currentFrameIdx = String(nextFrameIdx);
            
            // Schedule next swap
            gsap.delayedCall(swapEvery, swapImages);
          };
          
          // Stagger initial swaps across columns
          gsap.delayedCall(swapEvery + (Math.random() * 0.5), swapImages);
        });
      };
      
      // Set up carousel
      const setupCarousel = () => {
        if (carouselTweenRef.current) {
          carouselTweenRef.current.kill();
        }
        
        // Start image swapping
        setupImageSwapping();
        
        // Set up carousel with fewer updates for performance
        carouselTweenRef.current = gsap.to(columnElements, {
          x: `-=${columnWidth * allColumnsData.length}`,
          duration: carouselLoopDuration,
          ease: 'none',
          repeat: -1,
          onUpdate: function() {
            // Limit update frequency
            if ((this.progress() * 100) % 2 !== 0) return;
            
            columnElements.forEach((column) => {
              const xPos = gsap.getProperty(column, 'x') as number;
              
              // Reposition columns that move too far left
              if (xPos < -columnWidth) {
                const newX = xPos + (columnWidth * allColumnsData.length);
                gsap.set(column, { x: newX, opacity: 0 });
                
                // Fade in as it enters from right
                gsap.to(column, {
                  opacity: 1,
                  duration: 0.5,
                  ease: "power1.out"
                });
              }
              
              // Update label opacity based on position
              const labelElement = column.querySelector('.column-label');
              if (labelElement && xPos >= 0 && xPos < containerWidth) {
                const relativePosInView = (xPos / containerWidth);
                const centeredness = 1 - 2 * Math.abs(relativePosInView - 0.5);
                const labelOpacity = Math.max(0, Math.min(1, centeredness * 1.3 + 0.3));
                gsap.set(labelElement, { opacity: labelOpacity });
              }
            });
          }
        });
      };
      
     // Now let's enhance the exit animation
gsap.delayedCall(lifespan, () => {
  // Stop the carousel
  if (carouselTweenRef.current) {
    carouselTweenRef.current.kill();
  }
  
  // Enhanced exit animation
  const exitTl = gsap.timeline({
    onComplete: () => setPhase('hero')
  });
     // Find visible columns
  const visibleColumns = columnElements.filter((col) => {
    const xPos = gsap.getProperty(col, 'x') as number;
    return xPos >= 0 && xPos < containerWidth;
  }).slice(0, 3);
  
  // Fade out other columns quickly
  const otherColumns = columnElements.filter(col => !visibleColumns.includes(col));
  exitTl.to(otherColumns, {
    opacity: 0,
    duration: 0.3
  }, 0);
  
  // First, gather all visible columns to the center
  exitTl.to(visibleColumns, {
    x: containerWidth / 2 - columnWidth / 2,
    duration: 0.8,
    ease: "power2.inOut",
    stagger: {
      each: 0.1,
      from: "center"
    }
  }, 0.1);
  
  // Add a slight scale-up before the final collapse
  exitTl.to(visibleColumns, {
    scale: 1.1,
    duration: 0.4,
    ease: "power1.out"
  }, 0.8);
  
  // Fade out labels with slight upward movement
  exitTl.to(visibleColumns.map(col => col.querySelector('.column-label')), {
    opacity: 0,
    y: -15,
    duration: 0.4,
    ease: "power1.in"
  }, 0.8);
  
  // Add a slight rotation for more dynamic feel
  exitTl.to(visibleColumns, {
    rotation: (i) => (i % 2 === 0 ? 5 : -5),
    duration: 0.5,
    ease: "power1.inOut"
  }, 0.9);
  
  // Final collapse animation
  exitTl.to(visibleColumns, {
    scale: 0,
    opacity: 0,
    rotation: (i) => (i % 2 === 0 ? 10 : -10),
    duration: 0.5,
    stagger: 0.08,
    ease: "back.in(1.5)"
  }, 1.2);
  
  // Fade out container
  exitTl.to(container, {
    autoAlpha: 0,
    duration: 0.4
  }, 1.6);
});
    },
    { scope: wrapRef, dependencies: [allColumnsData, carouselLoopDuration, swapEvery, lifespan, imagesPreloaded] }
  );

  return (
    <section
      ref={wrapRef}
      className="fixed inset-0 z-40 bg-black"
      aria-label="Introduction animation"
    >
      {/* Loading indicator when images aren't ready */}
      {!imagesPreloaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={actualContainerRef}
        className="w-full h-full relative overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Container will be populated by GSAP */}
      </div>
    </section>
  );
}