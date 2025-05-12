import React, { useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Picture } from "vite-imagetools";
import Logo from "../../assets/intro/logo.svg?react";

const MAX_DUPLICATES = 0; // No duplicates allowed

// Helper function to get image URL from Picture object or string
const getImageUrl = (image: string | Picture): string => {
  if (typeof image === "string") return image;
  return image.img?.src || "";
};

// Define types for props
interface IntroProps {
  introImages: (string | Picture)[];
  introComplete: boolean;
  setIntroComplete: (complete: boolean) => void;
  mainRef: React.RefObject<HTMLDivElement | null>;
  navLogoRef: React.RefObject<SVGSVGElement | null>;
}

const Intro: React.FC<IntroProps> = ({
  introImages,
  introComplete,
  setIntroComplete,
  mainRef,
  navLogoRef,
}) => {
  const [imageIndices, setImageIndices] = useState<number[]>([]);
  const [isCyclingActive, setIsCyclingActive] = useState<boolean>(true);
  const introRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cyclingInterval = useRef<number | null>(null);

  // Updated cycling function with useCallback
  const startImageCycling = useCallback(() => {
    const cycleSpeed = 200;
    cyclingInterval.current = window.setInterval(() => {
      if (!isCyclingActive) {
        if (cyclingInterval.current !== null) {
          window.clearInterval(cyclingInterval.current);
          cyclingInterval.current = null;
        }
        return;
      }
      setImageIndices(() => {
        const newIndices: number[] = [];
        const usedIndices = new Set<number>();
        for (let i = 0; i < 16; i++) {
          let newIndex;
          let attempts = 0;
          const maxAttempts = 20;
          do {
            newIndex = Math.floor(Math.random() * introImages.length);
            if (
              usedIndices.has(newIndex) &&
              MAX_DUPLICATES === 0 &&
              attempts < maxAttempts
            ) {
              attempts++;
              continue;
            }
            break;
          } while (attempts < maxAttempts);
          newIndices.push(newIndex);
          usedIndices.add(newIndex);
        }
        return newIndices;
      });
    }, cycleSpeed);
  }, [isCyclingActive, introImages]);

  // Initialize random image indices
  useEffect(() => {
    if (introImages.length > 0) {
      const indices = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * introImages.length),
      );
      setImageIndices(indices);

      if (isCyclingActive) {
        startImageCycling();
      }

      return () => {
        if (cyclingInterval.current !== null) {
          window.clearInterval(cyclingInterval.current);
          cyclingInterval.current = null;
        }
      };
    }
  }, [startImageCycling, introImages, isCyclingActive]);

  // Function to stop cycling
  const stopImageCycling = () => {
    setIsCyclingActive(false);
    if (cyclingInterval.current !== null) {
      window.clearInterval(cyclingInterval.current);
      cyclingInterval.current = null;
    }
  };

  // Intro animation
  useGSAP(
    () => {
      if (!introRef.current || introComplete) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIntroComplete(true);
        },
      });

      const imageElements = Array.from(
        introRef.current.querySelectorAll(".intro-image"),
      );

      // Set initial styles
      if (mainRef.current) {
        const navItems = mainRef.current.querySelectorAll(".nav-items");
        const mainContentSections = mainRef.current.querySelectorAll(
          ".main-content-section",
        );

        const mainHeader = mainRef.current.querySelector(".main-header");

        navItems.forEach((item) => gsap.set(item, { opacity: 0, y: -10 }));
        mainContentSections.forEach((section) =>
          gsap.set(section, { opacity: 0, y: 30 }),
        );

        if (mainHeader) gsap.set(mainHeader, { opacity: 0 });
      }

      tl.fromTo(
        imageElements,
        { opacity: 0, scale: 0.8, y: 15 },
        {
          opacity: 1,
          scale: 0.9,
          y: 0,
          stagger: { each: 0.06, grid: "auto", from: "center" },
          duration: 1,
          ease: "expo.out",
        },
      )
        .to({}, { duration: 1.0 })
        .call(() => {
          stopImageCycling();
        })
        .to({}, { duration: 0.2 })
        .call(() => {
          if (!introRef.current) return;
          const containers = introRef.current.querySelectorAll(
            ".intro-image-container",
          );
          const images = introRef.current.querySelectorAll(".intro-image");
          containers.forEach((container, index) => {
            if (index >= images.length) return;
            const image = images[index] as HTMLElement;
            const rect = container.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            if (rect.left + rect.width / 2 < centerX) {
              gsap.to(image, {
                x: -window.innerWidth * 0.65,
                opacity: 0.3,
                scale: 0.8,
                duration: 1.2,
                ease: "power3.inOut",
              });
            } else {
              gsap.to(image, {
                x: window.innerWidth * 0.65,
                opacity: 0.3,
                scale: 0.8,
                duration: 1.2,
                ease: "power3.inOut",
              });
            }
          });
        })
        .fromTo(
          logoRef.current,
          { opacity: 0, scale: 0.5, y: 10 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.0,
            ease: "expo.out",
            onComplete: () => {
              // Add red glow effect after pop in
              if (logoRef.current) {
                const svgElement = logoRef.current.querySelector("svg");
                if (svgElement) {
                  const paths = svgElement.querySelectorAll("path");
                  if (paths.length > 0) {
                    gsap.to(paths, {
                      filter:
                        "drop-shadow(0 0 0.6px rgba(255, 50, 50, 0.9)) drop-shadow(0 0 0.3px rgba(255, 50, 50, 0.6))",

                      duration: 0.5,
                      ease: "power3.out",
                    });
                  }
                }
              }
            },
          },
          "+=0.3",
        )
        .to({}, { duration: 1.0 })
        .add(() => {
          // Instead of moving to navbar, fade out the logo
          if (logoRef.current) {
            const svgElement = logoRef.current.querySelector("svg");
            if (svgElement) {
              // Set nav logo visible immediately instead of waiting for animation
              gsap.set(navLogoRef.current, { opacity: 1 });

              const paths = svgElement.querySelectorAll("path");
              if (paths.length > 0) {
                // Fade out paths and remove the glow effect
                tl.to(paths, {
                  filter:
                    "drop-shadow(0 0 0px rgba(255, 50, 50, 0)) drop-shadow(0 0 0px rgba(255, 50, 50, 0))",
                  stroke: "rgba(255, 50, 50, 0)",
                  strokeWidth: "0px",
                  opacity: 0,

                  duration: 0.6,
                  ease: "power2.out",
                });

                // Fade out the SVG element itself
                tl.to(
                  svgElement,
                  {
                    opacity: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    onComplete: () => {
                      const mainHeader =
                        mainRef.current?.querySelector(".main-header");
                      if (mainHeader) {
                        gsap.to(mainHeader, {
                          opacity: 1,
                          duration: 0.3,
                          ease: "power1.out",
                        });
                      }
                    },
                  },
                );
              }
            }
          }
        })
        .to(
          mainRef.current?.querySelectorAll(".nav-items") || [],
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
          },
          ">-0.4",
        )
        .to(
          imageElements,
          {
            opacity: 0,
            duration: 0.6,
            ease: "power1.in",
          },
          "<",
        )
        .to(
          mainRef.current?.querySelectorAll(".main-content-section") || [],
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 0.8,
            ease: "power2.out",
          },
          ">-0.5",
        );
    },
    { scope: introRef, dependencies: [introComplete] },
  );

  if (introComplete) return null;
  
  return (
    <div
      ref={introRef}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black"
    >
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-5xl mx-auto px-4 mt-12">
        {imageIndices.map((imageIndex, index) => (
          <div key={index} className="intro-image-container">
            <div className="intro-image aspect-square overflow-hidden rounded-lg">
              <img
                src={getImageUrl(introImages[imageIndex])}
                alt={`Project ${index}`}
                className="w-full h-full object-cover"
                style={{ transition: "opacity 0.2s ease-in-out" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        ref={logoRef}
        className="absolute inset-0 z-100 flex items-center justify-center pointer-events-none"
      >
        <Logo className="w-[50vw] h-[50vh] max-w-[1200px] text-white transform-origin-top-left" />
      </div>
    </div>
  );
};

export default Intro;