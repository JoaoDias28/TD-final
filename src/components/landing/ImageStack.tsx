import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Default configurations, can be overridden by props
const DEFAULT_MAX_VISIBLE_IMAGES = 4;
const DEFAULT_IMAGE_CYCLE_INTERVAL_MS = 7000;
const DEFAULT_IMAGE_POSITIONS = [
  { x: 0, y: -15, z: 0, rotation: -4 },
  { x: 45, y: 25, z: -70, rotation: 6 },
  { x: -50, y: -35, z: -140, rotation: -7 },
  { x: 25, y: 55, z: -210, rotation: 5 },
];

interface ImageStackProps {
  imageUrls: string[];
  introComplete: boolean;
  isReady: boolean; // Parent indicates when it's ready for animations
  parallaxMouseTargetRef: React.RefObject<HTMLElement | null>;
  maxVisibleImages?: number;
  cycleIntervalMs?: number;
  imagePositions?: Array<{ x: number; y: number; z: number; rotation: number }>;
}

const ImageStack: React.FC<ImageStackProps> = ({
  imageUrls,
  introComplete,
  isReady,
  parallaxMouseTargetRef,
  maxVisibleImages = DEFAULT_MAX_VISIBLE_IMAGES,
  cycleIntervalMs = DEFAULT_IMAGE_CYCLE_INTERVAL_MS,
  imagePositions = DEFAULT_IMAGE_POSITIONS,
}) => {
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const imageItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [imageCycleTrigger, setImageCycleTrigger] = useState(0);
  const cycleIntervalIdRef = useRef<number | null>(null);
  const nextImageToShowMasterIndexRef = useRef(0);
  const cycledImageCountRef = useRef(0);
  const hasCompletedFullCycleRef = useRef(false);
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const numImagesToDisplayInStack = useMemo(() => 
    Math.min(maxVisibleImages, imageUrls.length)
  , [imageUrls.length, maxVisibleImages]);

  const initialStackImageUrls = useMemo(() => 
    imageUrls.slice(0, numImagesToDisplayInStack)
  , [imageUrls, numImagesToDisplayInStack]);

  useEffect(() => {
    imageItemRefs.current = imageItemRefs.current.slice(0, numImagesToDisplayInStack);
  }, [numImagesToDisplayInStack]);

  // Start/Stop image cycling interval
  useEffect(() => {
    if (!introComplete || imageUrls.length === 0) {
      hasCompletedFullCycleRef.current = false;
      cycledImageCountRef.current = 0;
      if (cycleIntervalIdRef.current !== null) {
        clearInterval(cycleIntervalIdRef.current);
        cycleIntervalIdRef.current = null;
      }
    }
  }, [introComplete, imageUrls.length]);

  useEffect(() => {
    if (cycleIntervalIdRef.current !== null) {
      clearInterval(cycleIntervalIdRef.current);
      cycleIntervalIdRef.current = null;
    }

    if (!isReady || !introComplete || imageUrls.length <= numImagesToDisplayInStack || numImagesToDisplayInStack < 2 || hasCompletedFullCycleRef.current) {
      return;
    }

    cycleIntervalIdRef.current = window.setInterval(() => {
      if (hasCompletedFullCycleRef.current) {
        if (cycleIntervalIdRef.current !== null) clearInterval(cycleIntervalIdRef.current);
        cycleIntervalIdRef.current = null;
        return;
      }
      setImageCycleTrigger(prev => prev + 1);
    }, cycleIntervalMs);

    return () => {
      if (cycleIntervalIdRef.current !== null) clearInterval(cycleIntervalIdRef.current);
    };
  }, [isReady, introComplete, imageUrls.length, numImagesToDisplayInStack, cycleIntervalMs]);


  const applyFloatingAnimations = useCallback((elementsToAnimate: (HTMLDivElement | null)[]) => {
    const validElements = elementsToAnimate.filter(Boolean) as HTMLDivElement[];
    gsap.killTweensOf(validElements, "floating"); 

    validElements.forEach((el) => {
      if (!el || !el.dataset.stackIndex) return;
      const stackIndex = parseInt(el.dataset.stackIndex, 10);
      const basePos = imagePositions[stackIndex];
      if (!basePos) return;

      gsap.to(el, {
        y: basePos.y + (stackIndex % 2 === 0 ? (6 + Math.random() * 4) : (-6 - Math.random() * 4)),
        rotation: basePos.rotation + (Math.random() * 2 - 1),
        duration: 4 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        id: `floating-${stackIndex}`,
        overwrite: "auto",
      });
    });
  }, [imagePositions]);

  // GSAP for Initial Animation & Parallax
  useGSAP(() => {
    if (!introComplete || !isReady || !stackContainerRef.current || numImagesToDisplayInStack === 0) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });
    const stackElements = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];

    stackElements.forEach((el, index) => {
      el.dataset.stackIndex = String(index);
      const initialPos = imagePositions[index];
      gsap.set(el, {
        x: initialPos.x + (index % 2 === 0 ? 250 : -250),
        y: initialPos.y + (index % 2 === 0 ? -200 : 200),
        rotation: initialPos.rotation + (index % 2 === 0 ? 45 : -45),
        scale: 0.3,
        opacity: 0,
        zIndex: maxVisibleImages - index,
        transformOrigin: "center center",
      });
    });

    tl.to(stackElements, {
      opacity: 1,
      scale: 1,
      x: i => imagePositions[i]?.x || 0,
      y: i => imagePositions[i]?.y || 0,
      z: i => imagePositions[i]?.z || 0,
      rotation: i => imagePositions[i]?.rotation || 0,
      stagger: { amount: 0.7, from: "end", ease: "power2.out" },
      duration: 1.4,
    });

    tl.call(() => applyFloatingAnimations(stackElements), [], ">-0.5");
    
    nextImageToShowMasterIndexRef.current = numImagesToDisplayInStack % imageUrls.length;
    if (imageUrls.length === 0) nextImageToShowMasterIndexRef.current = 0;

    const parallaxTarget = parallaxMouseTargetRef.current;
    if (parallaxTarget) {
      mouseMoveHandlerRef.current = (e: MouseEvent) => {
        const rect = parallaxTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const dX = (mouseX - centerX) * 0.025;
        const dY = (mouseY - centerY) * 0.025;
        
        const currentElementsInStackOrder = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];
        gsap.to(currentElementsInStackOrder, {
          x: (_, targetEl) => {
            const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10);
            return (imagePositions[sIdx]?.x || 0) + dX * ((maxVisibleImages - sIdx) * 0.25 + 0.5);
          },
          y: (_, targetEl) => {
            const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10);
            return (imagePositions[sIdx]?.y || 0) + dY * ((maxVisibleImages - sIdx) * 0.25 + 0.5);
          },
          rotation: (_, targetEl) => {
            const sIdx = parseInt(targetEl.dataset.stackIndex || "0", 10);
            return (imagePositions[sIdx]?.rotation || 0) + dX * (sIdx % 2 === 0 ? -0.06 : 0.06) * ((maxVisibleImages - sIdx) * 0.15 + 0.4);
          },
          duration: 0.8,
          ease: "power2.out",
          overwrite: "auto",
          id: "parallaxAnimation"
        });
      };
      parallaxTarget.addEventListener("mousemove", mouseMoveHandlerRef.current);
    }

    return () => {
      if (parallaxTarget && mouseMoveHandlerRef.current) {
        parallaxTarget.removeEventListener("mousemove", mouseMoveHandlerRef.current);
      }
      gsap.killTweensOf(stackElements); // General cleanup for these elements
    };
  }, { scope: stackContainerRef, dependencies: [introComplete, isReady, numImagesToDisplayInStack, applyFloatingAnimations, imagePositions, maxVisibleImages, parallaxMouseTargetRef.current] });


  // GSAP for Image Cycling Animation
  useGSAP(() => {
    if (!introComplete || !isReady || imageCycleTrigger === 0 || numImagesToDisplayInStack < 2 || imageUrls.length <= numImagesToDisplayInStack || hasCompletedFullCycleRef.current) {
      return;
    }

    const currentElementsInStack = imageItemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (currentElementsInStack.length !== numImagesToDisplayInStack || !stackContainerRef.current) return;

    const frontElement = currentElementsInStack.find(el => parseInt(el.dataset.stackIndex || "-1", 10) === 0);
    if (!frontElement) return;

    const newImageURLForBack = imageUrls[nextImageToShowMasterIndexRef.current];
    const cycleTl = gsap.timeline();

    const parallaxTarget = parallaxMouseTargetRef.current;
    if (parallaxTarget && mouseMoveHandlerRef.current) {
        parallaxTarget.removeEventListener("mousemove", mouseMoveHandlerRef.current);
    }
    currentElementsInStack.forEach((el, index) => {
      gsap.killTweensOf(el, `floating-${el.dataset.stackIndex},parallaxAnimation`);
    });

    const backTargetPos = imagePositions[numImagesToDisplayInStack - 1];
    cycleTl.to(frontElement, {
      x: backTargetPos.x,
      y: backTargetPos.y,
      z: (backTargetPos.z || 0) - 60, // Ensure z is treated as a number
      rotation: backTargetPos.rotation,
      opacity: 0.5,
      scale: 0.75,
      duration: 0.8,
      ease: "power2.inOut",
    });

    currentElementsInStack.forEach(el => {
      if (el === frontElement) return;
      const currentStackIdx = parseInt(el.dataset.stackIndex || "0", 10);
      const newStackIdx = currentStackIdx - 1;
      if (newStackIdx >= 0 && imagePositions[newStackIdx]) {
        cycleTl.to(el, { ...imagePositions[newStackIdx], duration: 0.8, ease: "power2.inOut" }, "<");
      }
    });

    cycleTl.call(() => {
      const imgTag = frontElement.querySelector('img');
      if (imgTag && newImageURLForBack) {
        imgTag.src = newImageURLForBack;
        imgTag.alt = `Showcase content ${nextImageToShowMasterIndexRef.current + 1}`;
      }

      if (imageUrls.length > numImagesToDisplayInStack) cycledImageCountRef.current += 1;
      nextImageToShowMasterIndexRef.current = (nextImageToShowMasterIndexRef.current + 1) % imageUrls.length;

      const newOrderedElements: HTMLDivElement[] = new Array(numImagesToDisplayInStack);
      currentElementsInStack.forEach(el => {
        let newIndex = (el === frontElement) ? numImagesToDisplayInStack - 1 : parseInt(el.dataset.stackIndex || "0", 10) - 1;
        el.dataset.stackIndex = String(newIndex);
        el.style.zIndex = String(maxVisibleImages - newIndex);
        if (newIndex >= 0 && newIndex < numImagesToDisplayInStack) newOrderedElements[newIndex] = el;
      });
      imageItemRefs.current = newOrderedElements.filter(Boolean);
      
      applyFloatingAnimations(imageItemRefs.current);

      if (parallaxTarget && mouseMoveHandlerRef.current) {
        parallaxTarget.addEventListener("mousemove", mouseMoveHandlerRef.current);
      }
      
      const uniqueImagesToCycleThrough = imageUrls.length - numImagesToDisplayInStack;
      if (imageUrls.length > numImagesToDisplayInStack && cycledImageCountRef.current >= uniqueImagesToCycleThrough) {
          if (!hasCompletedFullCycleRef.current) { 
            hasCompletedFullCycleRef.current = true;
            if (cycleIntervalIdRef.current !== null) { clearInterval(cycleIntervalIdRef.current); cycleIntervalIdRef.current = null; }
          }
      }
    });

    cycleTl.to(frontElement, { ...backTargetPos, opacity: 1, scale: 1, duration: 0.7, ease: "power2.out" }, ">-0.2");

  }, { dependencies: [imageCycleTrigger, introComplete, isReady, imageUrls.length, numImagesToDisplayInStack, applyFloatingAnimations, imagePositions, maxVisibleImages, parallaxMouseTargetRef.current], scope: stackContainerRef });

  if (!isReady && !introComplete) { // Or some other condition to show a loader for the stack itself
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div
      ref={stackContainerRef}
      className="
        relative
        w-[300px] h-[200px]
        sm:w-[480px] sm:h-[360px]
        md:w-[560px] md:h-[420px]
        lg:w-[600px] lg:h-[480px]
      "
      style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
    >
      {initialStackImageUrls.map((imageUrl, index) => (
        <div
          key={`img-stack-item-${index}-${imageUrl}`}
          ref={el => { if (el) imageItemRefs.current[index] = el; }}
          className="image-stack-item absolute w-full h-full overflow-hidden rounded-xl shadow-2xl border-2 border-neutral-700/60"
          style={{ willChange: "transform, opacity", zIndex: maxVisibleImages - index }}
        >
          <img
            src={imageUrl}
            alt={`Showcase ${index + 1}`}
            className="w-full h-full object-cover"
            loading={index < 2 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
};

export default ImageStack; 