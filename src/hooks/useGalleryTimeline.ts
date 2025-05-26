// hooks/useGalleryTimeline.ts
import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';



export function useGalleryTimeline() {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    timelineRef.current = gsap.timeline({ paused: true });
    
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  const addElement = useCallback((key: string, element: HTMLElement | null) => {
    if (element) {
      elementsRef.current.set(key, element);
    } else {
      elementsRef.current.delete(key);
    }
  }, []);

  const getElement = useCallback((key: string) => {
    return elementsRef.current.get(key) || null;
  }, []);

  const animateIn = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!timelineRef.current || isAnimating) {
        resolve();
        return;
      }

      setIsAnimating(true);
      timelineRef.current
        .clear()
        .set('.gallery-container', { display: 'block' })
        .call(() => setIsAnimating(false))
        .call(() => resolve());
    });
  }, [isAnimating]);

  const animateOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!timelineRef.current || isAnimating) {
        resolve();
        return;
      }

      setIsAnimating(true);
      timelineRef.current
        .clear()
        .call(() => setIsAnimating(false))
        .call(() => resolve());
    });
  }, [isAnimating]);

  return {
    timeline: timelineRef.current,
    addElement,
    getElement,
    controls: { animateIn, animateOut, isAnimating },
  };
}
