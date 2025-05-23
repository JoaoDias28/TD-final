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

interface ImageAsset {
  src: string;
  alt: string;
}

interface SpreadParallaxImage extends ImageAsset {
  url: string | undefined;
  config: ParallaxConfig;
}

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
  spreadImages?: SpreadParallaxImage[];
  bottomStripImages?: BottomStripImage[]; // New, more descriptive name for the bottom strip
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
