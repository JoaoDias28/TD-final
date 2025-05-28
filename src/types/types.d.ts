declare module '*.png' {
    const value: string;
    export default value;
  }
  
  declare module '*.jpg' {
    const value: string;
    export default value;
  }
  
  declare module '*.jpeg' {
    const value: string;
    export default value;
  }
    declare module '*.gif' {
        const value: string;
        export default value;
    }
    declare module '*.svg' {
        const value: string;
        export default value;
    }
    declare module '*.svg?react' {
        import * as React from 'react';
        const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
        export default ReactComponent;
      }
      

interface ParallaxConfig {
  initialX?: string | number; // e.g., '10%', '50px', 0 (for CSS positioning)
  initialY?: string | number; // e.g., '20%', '-30px', 0 (for CSS positioning)
  initialXOffsetPercent?: number; // For GSAP animation start, e.g. start off-screen
  initialYOffsetPercent?: number; // For GSAP animation start
  depth: number; // Parallax depth: 1 = scrolls with panel, >1 faster, <1 slower
  scale?: number; // Initial/target scale
  rotate?: number; // Initial/target rotation
  width?: string; // Optional width for the image
  height?: string; // Optional height for the image
}

// NEW TYPE DEFINITIONS START HERE

// Describes the animation properties for an image at a specific moment (e.g., initial, target, exit)
export interface AnimationState {
  x: number | string;      // CSS transform: translateX()
  y: number | string;      // CSS transform: translateY()
  scale: number;
  rotation: number;
  opacity: number;
  xPercent?: number;    // GSAP's xPercent for fine-tuned transform-origin independent positioning/parallax
  yPercent?: number;    // GSAP's yPercent
}

// Configuration specific to a single breakpoint for a spread image
export interface BreakpointSpecificConfig {
  initial: AnimationState; // State before animation starts
  target: AnimationState;  // State when fully animated in / main state
  exit: AnimationState;    // State when animating out
  width?: string;          // Rendered width of the image (e.g., '200px', '15vw')
  height?: string;         // Rendered height of the image
  depth?: number;          // For z-index calculations or to influence parallax if not directly in x/yPercent.
                           // 1 = neutral. <1 = further back, >1 = closer.
}

// The main configuration object for a spread image, containing settings for each breakpoint
export interface ResponsiveParallaxConfig {
  sm?: BreakpointSpecificConfig;
  md?: BreakpointSpecificConfig;
  lg?: BreakpointSpecificConfig;
  defaultDepth?: number;     // A general depth for the image, can be overridden by breakpoint specific depth.
}
// NEW TYPE DEFINITIONS END HERE

interface ImageAsset {
  src: string;
  alt: string;
}

interface SpreadParallaxImage extends ImageAsset {
  url: string | undefined;
  config: ResponsiveParallaxConfig; // UPDATED: Was ParallaxConfig
  // uniqueId will be added dynamically in HorizontalScrollSection if images are repeated for different counts
}

// BottomStripImage is no longer used in HorizontalScrollSection, but keeping type for now if used elsewhere
interface BottomStripImage extends ImageAsset {
  url: string | undefined;
  depth?: number; // For horizontal parallax of bottom strip images. 1 = normal.
  width?: string; // Optional width for the image
  height?: string; // Optional height for the image
}

export interface ThemePanel {
  id: number;
  title: string;
  description: string;
  ctaText: string;
  gradientClass: string;
  images?: string[]; // This was the original structure, we'll adapt data for bottomStripImages
  spreadImages?: SpreadParallaxImage[]; // Uses the updated SpreadParallaxImage
}

// types/gallery.ts
export interface FilterOptions {
  category: 'all' | 'spread' | 'bottom';
  sortBy: 'default' | 'name' | 'recent';
  gridSize: 'compact' | 'comfortable' | 'spacious';
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: 'spread' | 'bottom';
  sourceKey: string;
  originalIndex: number;
}
