import React, { useRef, useImperativeHandle, forwardRef } from "react"; // Added useImperativeHandle, forwardRef
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Define the types for our marquee items
type MarqueeItem = {
  id: string | number;
  content: React.ReactNode;
};

// Define the direction options
type MarqueeDirection = "left" | "right" | "up" | "down" | "diagonal-up" | "diagonal-down";

// Define the props for our Marquee component
interface MarqueeProps {
  items: MarqueeItem[];
  direction?: MarqueeDirection;
  speed?: number; // Pixels per second
  gap?: number;
  pauseOnHover?: boolean;
  infinite?: boolean;
  className?: string;
  itemClassName?: string;
  autoplay?: boolean;
  delay?: number; // Initial delay for the animation to start
  reversed?: boolean;
}

// Define the type for the exposed controls
export interface MarqueeControls {
  pauseAnimation: () => void;
  playAnimation: () => void;
  isPaused: () => boolean;
}

const Marquee = forwardRef<MarqueeControls, MarqueeProps>(({ // Wrapped with forwardRef
  items,
  direction = "left",
  speed = 50,
  gap = 20,
  pauseOnHover = false,
  infinite = true,
  className = "",
  itemClassName = "",
  autoplay = true,
  delay = 0,
  reversed = false,
}, ref) => { // Added ref parameter
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Animation | null>(null);
  
  // Renamed pauseRef to userInteractionPauseRef for clarity
  const userInteractionPauseRef = useRef<{ paused: boolean }>({ paused: !autoplay });
  const programmaticPauseRef = useRef<boolean>(false); // New ref for programmatic control

  const isHorizontal = direction === "left" || direction === "right";
  const itemDimensionProp = isHorizontal ? 'offsetWidth' : 'offsetHeight';

  // Expose controls via useImperativeHandle
  useImperativeHandle(ref, () => ({
    pauseAnimation: () => {
        // 🔑 Always mark that this marquee is programmatically paused
        programmaticPauseRef.current = true;
      
        // Pause GSAP only if it’s currently playing
        if (animationRef.current && !animationRef.current.paused()) {
          animationRef.current.pause();
        }
      },
    playAnimation: () => {
      // Only play if it was programmatically paused AND user interaction (hover) isn't also pausing it
      // AND autoplay is true (or it wasn't playing because autoplay was false)
      if (animationRef.current && animationRef.current.paused() && programmaticPauseRef.current) {
        if (autoplay && !userInteractionPauseRef.current.paused) {
            programmaticPauseRef.current = false;
            animationRef.current.play();
        } else if (!autoplay) { // If autoplay is false, we still allow programmatic play to override it once
            programmaticPauseRef.current = false;
            animationRef.current.play();
        }
        // If autoplay is true but user is hovering (userInteractionPauseRef.current.paused is true),
        // it won't play here, which is correct. It will resume on mouseleave if still programmatically unpaused.
      }
    },
    isPaused: () => {
        // An animation is considered paused if the GSAP animation object says so,
        // OR if autoplay is false and it hasn't started yet.
        return animationRef.current ? animationRef.current.paused() : !autoplay;
    }
  }));

  const getAnimationPixelProps = (
    size: number,
    currentDirection: MarqueeDirection,
    currentReversed: boolean
  ) => {
    let xVal = 0;
    let yVal = 0;

    switch (currentDirection) {
      case "left": xVal = -size; break;
      case "right": xVal = size; break;
      case "up": yVal = -size; break;
      case "down": yVal = size; break;
      case "diagonal-up": xVal = -size; yVal = -size; break;
      case "diagonal-down": xVal = -size; yVal = size; break;
      default: xVal = -size; break;
    }

    if (currentReversed) {
      xVal *= -1;
      yVal *= -1;
    }
    return { x: xVal, y: yVal };
  };

  const handleMouseEnter = () => {
    if (pauseOnHover && animationRef.current) {
      userInteractionPauseRef.current.paused = true;
      // Only pause if not already programmatically paused, to avoid changing the programmatic state
      if (!programmaticPauseRef.current && !animationRef.current.paused()) {
          animationRef.current.pause();
      }
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover && animationRef.current && autoplay) {
      userInteractionPauseRef.current.paused = false;
      // Only play if it's not programmatically paused and GSAP animation is actually paused by this interaction
      if (!programmaticPauseRef.current && animationRef.current.paused()) {
          animationRef.current.play();
      }
    }
  };

  useGSAP(() => {
    if (!marqueeRef.current || !containerRef.current) return;
    if (items.length === 0 && infinite) { // Check if infinite and no items, then no animation.
        if (animationRef.current) {
            animationRef.current.kill(); // Kill any existing animation
            animationRef.current = null;
        }
        return;
    }


    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
    }

    const marqueeContent = marqueeRef.current;
    const marqueeWrapper = containerRef.current;
    
    const allMarqueeItemElements = gsap.utils.toArray<HTMLElement>(
      marqueeContent.querySelectorAll('.marquee-item')
    );

    allMarqueeItemElements.forEach((itemEl) => {
      gsap.set(itemEl, { opacity: 1 });
    });
    
    let singleSetBaseDimension = 0;
    const firstSetOfDOMItems = allMarqueeItemElements.slice(0, items.length);

    if (firstSetOfDOMItems.length > 0) {
        firstSetOfDOMItems.forEach((item) => {
            singleSetBaseDimension += item[itemDimensionProp];
        });
    }

    let calculatedAnimationDistance;
    if (items.length === 0) { // Should ideally not happen if infinite is true due to check above
        calculatedAnimationDistance = (itemDimensionProp === 'offsetWidth' ? marqueeWrapper.offsetWidth : marqueeWrapper.offsetHeight) || 1;
    } else {
        calculatedAnimationDistance = singleSetBaseDimension + (items.length * gap);
    }

    if (calculatedAnimationDistance <= 0) {
        console.warn("Marquee: Animation distance is zero or negative. Halting animation.", { calculatedAnimationDistance });
        return;
    }
    
    const animMovementProps = getAnimationPixelProps(calculatedAnimationDistance, direction, reversed);
    
    let startX = 0, startY = 0;
    let targetX = animMovementProps.x, targetY = animMovementProps.y;

    if (animMovementProps.x > 0) { startX = -calculatedAnimationDistance; targetX = 0; } 
    else if (animMovementProps.x < 0) { startX = 0; /* targetX already set */ }
    if (animMovementProps.y > 0) { startY = -calculatedAnimationDistance; targetY = 0; } 
    else if (animMovementProps.y < 0) { startY = 0; /* targetY already set */ }
    
    gsap.set(marqueeContent, { x: startX, y: startY });
    const duration = Math.abs(calculatedAnimationDistance / speed);

    // Determine initial paused state for the animation
    // Programmatic pause takes precedence.
    // Then, if not programmatically paused, consider if autoplay is false or if user is currently hovering (if pauseOnHover is true).
    const initialPausedState = 
        programmaticPauseRef.current || 
        !autoplay || 
        (pauseOnHover && userInteractionPauseRef.current.paused); // userInteractionPauseRef is initially !autoplay

    if (infinite) {
      const tl = gsap.timeline({
        repeat: -1,
        paused: initialPausedState,
        delay: delay,
        defaults: { ease: "none" }
      });
      
      tl.to(marqueeContent, {
        x: targetX,
        y: targetY,
        duration: duration,
        ease: "none",
      });
      tl.eventCallback("onRepeat", () => {
        gsap.set(marqueeContent, { x: startX, y: startY });
      });
      animationRef.current = tl;
    } else { 
      animationRef.current = gsap.to(marqueeContent, {
        x: targetX,
        y: targetY,
        duration: duration,
        ease: "none",
        paused: initialPausedState,
        delay: delay,
      });
    }

    if (pauseOnHover) {
      marqueeWrapper.addEventListener("mouseenter", handleMouseEnter);
      marqueeWrapper.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (pauseOnHover && marqueeWrapper) {
        marqueeWrapper.removeEventListener("mouseenter", handleMouseEnter);
        marqueeWrapper.removeEventListener("mouseleave",handleMouseLeave);
      }
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [
    items, 
    direction,
    speed,
    gap,
    pauseOnHover,
    infinite,
    autoplay,
    delay,
    reversed,
    itemDimensionProp,
  ]);

  const containerStyle: React.CSSProperties = {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    height: (direction === "up" || direction === "down") ? "100%" : "auto",
  };

  const currentIsPurelyHorizontal = direction === "left" || direction === "right";
  const marqueeFlexDirection = currentIsPurelyHorizontal ? "row" : "column";

  const marqueeStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: marqueeFlexDirection,
    gap: `${gap}px`,
    width: marqueeFlexDirection === "row" ? "fit-content" : "100%",
    height: marqueeFlexDirection === "column" ? "fit-content" : "100%",
    willChange: "transform",
  };
  
  const numCopiesToRender = infinite ? (items.length > 0 ? Math.max(2, Math.ceil(6 / items.length)) : 1) : 1;

  return (
    <div
      ref={containerRef}
      className={`marquee-container ${className}`}
      style={containerStyle}
    >
      <div
        ref={marqueeRef}
        className="marquee-content"
        style={marqueeStyle}
      >
        {items.length > 0 ? ( 
          Array.from({ length: numCopiesToRender }).flatMap((_, copyIndex) => 
            items.map((item) => (
              <div
                key={`${copyIndex}-${item.id}`}
                className={`marquee-item ${itemClassName}`}
                style={{ 
                  flexShrink: 0, 
                  opacity: 0,     
                }}
              >
                {item.content}
              </div>
            ))
          )
        ) : null}
      </div>
    </div>
  );
});

export default Marquee;