// Advanced Scroll Manager for Lenis + GSAP ScrollTrigger coordination
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

interface ScrollManagerConfig {
  duration?: number;
  easing?: (t: number) => number;
  touchMultiplier?: number;
  smoothWheel?: boolean;
}

class ScrollManager {
  private static instance: ScrollManager | null = null;
  private lenis: Lenis | null = null;
  private rafId: number | null = null;
  private isDestroyed = false;
  
  private constructor() {}

  static getInstance(): ScrollManager {
    if (!ScrollManager.instance) {
      ScrollManager.instance = new ScrollManager();
    }
    return ScrollManager.instance;
  }

  // Initialize the scroll manager with advanced configuration
  init(config: ScrollManagerConfig = {}) {
    if (typeof window === 'undefined' || this.lenis) return;

    const defaultConfig = {
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      touchMultiplier: 2,
      smoothWheel: true,
      ...config
    };

    // Initialize Lenis with advanced configuration
    this.lenis = new Lenis({
      duration: defaultConfig.duration,
      easing: defaultConfig.easing,
      touchMultiplier: defaultConfig.touchMultiplier,
      smoothWheel: defaultConfig.smoothWheel,
      infinite: false,
      autoResize: true,
    });

    // Setup advanced RAF loop with GSAP ticker integration
    this.setupRAF();
    
    // Configure ScrollTrigger to work with Lenis
    this.setupScrollTriggerIntegration();
    
    // Setup advanced scroll listeners
    this.setupScrollListeners();
    
    this.isDestroyed = false;
  }

  private setupRAF() {
    if (!this.lenis) return;

    // Use GSAP ticker for better performance and synchronization
    gsap.ticker.add((time) => {
      if (this.lenis && !this.isDestroyed) {
        this.lenis.raf(time * 1000); // Convert to milliseconds
      }
    });

    gsap.ticker.lagSmoothing(0);
  }

  private setupScrollTriggerIntegration() {
    if (!this.lenis) return;

    // Advanced ScrollTrigger configuration for Lenis
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: (value?: number) => {
        if (arguments.length && value !== undefined && this.lenis) {
          this.lenis.scrollTo(value, { immediate: true });
        }
        return this.lenis?.animatedScroll || this.lenis?.actualScroll || 0;
      },
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }),
      pinType: document.body.style.transform ? 'transform' : 'fixed'
    });

    // Set ScrollTrigger defaults for better performance
    ScrollTrigger.defaults({ 
      scroller: document.body,
      toggleActions: 'play pause resume reverse',
      anticipatePin: 1,
      fastScrollEnd: true,
      preventOverlaps: true
    });

    // Listen to Lenis scroll events and update ScrollTrigger
    this.lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Advanced refresh handling
    this.lenis.on('scroll', ScrollTrigger.update);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (!this.isDestroyed) {
        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 100);
      }
    });
  }

  private setupScrollListeners() {
    if (!this.lenis) return;

    // Advanced scroll progress tracking
    this.lenis.on('scroll', (e) => {
      // Emit custom events for components to listen to
      const scrollEvent = new CustomEvent('lenisScroll', {
        detail: {
          scroll: e.scroll,
          limit: e.limit,
          velocity: e.velocity,
          direction: e.direction,
          progress: e.progress
        }
      });
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(scrollEvent);
      }
    });
  }

  // Advanced smooth scroll methods
  scrollTo(target: string | number | HTMLElement, options: any = {}) {
    if (!this.lenis) return;

    const defaultOptions = {
      duration: 1.5,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
      offset: 0,
      immediate: false,
      ...options
    };

    this.lenis.scrollTo(target, defaultOptions);
  }

  scrollToTop(options: any = {}) {
    this.scrollTo(0, options);
  }

  scrollToElement(selector: string, options: any = {}) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      this.scrollTo(element, options);
    }
  }

  // Advanced animation methods
  createParallaxAnimation(
    element: HTMLElement | string, 
    speed: number = 0.5, 
    options: any = {}
  ) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return null;

    const defaultOptions = {
      ease: 'none',
      scrollTrigger: {
        trigger: target,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        fastScrollEnd: true,
        ...options.scrollTrigger
      },
      ...options
    };

    return gsap.to(target, {
      y: () => -ScrollTrigger.maxScroll(window) * speed * 0.1,
      ...defaultOptions
    });
  }

  createFadeInAnimation(
    elements: HTMLElement[] | string,
    options: any = {}
  ) {
    const targets = typeof elements === 'string' 
      ? document.querySelectorAll(elements) 
      : elements;

    if (!targets.length) return null;

    const defaultOptions = {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: targets[0],
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        ...options.scrollTrigger
      },
      ...options
    };

    // Set initial state
    gsap.set(targets, { opacity: 0, y: 50 });

    return gsap.to(targets, defaultOptions);
  }

  createPinAnimation(
    element: HTMLElement | string,
    options: any = {}
  ) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return null;

    return ScrollTrigger.create({
      trigger: target,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      ...options
    });
  }

  // Batch animations for performance
  createBatchAnimation(
    selector: string,
    animationConfig: any = {},
    scrollConfig: any = {}
  ) {
    return ScrollTrigger.batch(selector, {
      onEnter: (elements) => {
        gsap.fromTo(elements, 
          { opacity: 0, y: 100, scale: 0.9 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.1,
            ...animationConfig 
          }
        );
      },
      onLeave: (elements) => {
        gsap.to(elements, {
          opacity: 0,
          y: -50,
          duration: 0.5,
          ease: 'power2.in',
          stagger: 0.05
        });
      },
      onEnterBack: (elements) => {
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.1
        });
      },
      start: 'top bottom-=100',
      end: 'bottom top+=100',
      ...scrollConfig
    });
  }

  // Performance optimization methods
  pauseScrollTriggers() {
    ScrollTrigger.getAll().forEach(trigger => trigger.disable());
  }

  resumeScrollTriggers() {
    ScrollTrigger.getAll().forEach(trigger => trigger.enable());
  }

  refreshScrollTriggers() {
    if (!this.isDestroyed) {
      ScrollTrigger.refresh();
    }
  }

  // Utility methods
  getCurrentScroll() {
    return this.lenis?.animatedScroll || 0;
  }

  getScrollProgress() {
    if (!this.lenis) return 0;
    return this.lenis.progress || 0;
  }

  isScrolling() {
    return this.lenis?.isScrolling || false;
  }

  // Enhanced destroy method
  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;

    // Stop GSAP ticker
    gsap.ticker.lagSmoothing(false);

    // Clean up Lenis
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }

    // Clean up ScrollTrigger
    ScrollTrigger.clearScrollMemory();
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    // Remove event listeners
    window.removeEventListener('resize', this.refreshScrollTriggers);

    ScrollManager.instance = null;
  }

  // Get Lenis instance for advanced usage
  getLenis() {
    return this.lenis;
  }
}

// Export singleton instance
export const scrollManager = ScrollManager.getInstance();

// Export types for better TypeScript support
export type { ScrollManagerConfig };

// Export convenience functions
export const initializeScrollManager = (config?: ScrollManagerConfig) => {
  scrollManager.init(config);
};

export const destroyScrollManager = () => {
  scrollManager.destroy();
};

export default scrollManager; 