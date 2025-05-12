import React, { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { Picture } from "vite-imagetools";
import Logo from "../../assets/intro/logo.svg?react";

// Helper function to get image URL from Picture object or string
const getImageUrl = (image: string | Picture): string => {
  if (typeof image === "string") return image;
  return image.img?.src || "";
};

// Define types for props
interface HeroProps {
  themes: Record<string, (string | Picture)[]>;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  navLogoRef: React.RefObject<SVGSVGElement | null>;
  introComplete: boolean;
}

const Hero: React.FC<HeroProps> = ({
  themes,
  activeTheme,
  setActiveTheme,
  navLogoRef,
  introComplete,
}) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const imageGridRef = useRef<HTMLDivElement>(null);

  const formatThemeName = (name: string): string => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Main content animations (Hover effects)
  useGSAP(
    () => {
      if (!introComplete || !mainRef.current) return;

      // Add hover effects to grid images
      const gridImageContainers = document.querySelectorAll(
        ".grid-image-container"
      );

      gridImageContainers.forEach((container) => {
        const image = container.querySelector(".grid-image") as HTMLElement;
        const overlay = container.querySelector(
          ".image-overlay"
        ) as HTMLElement;

        if (!image || !overlay) return;

        container.addEventListener("mouseenter", () => {
          gsap.to(image, { scale: 1.1, duration: 0.5 });
          gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
        });

        container.addEventListener("mouseleave", () => {
          gsap.to(image, { scale: 1, duration: 0.5 });
          gsap.to(overlay, { opacity: 0, duration: 0.3 });
        });
      });
    },
    { scope: mainRef, dependencies: [introComplete] }
  );

  // Theme switching animation
  useGSAP(
    () => {
      if (!introComplete || !imageGridRef.current) return;

      const titleElement = document.querySelector(".theme-title");
      
      // Clear existing grid images
      const tl = gsap.timeline();
      tl.to(
        imageGridRef.current.querySelectorAll(".grid-image"),
        {
          opacity: 0,
          y: 20,
          scale: 0.9,
          stagger: { each: 0.05, grid: [3, 3], from: "center" },
          duration: 0.4,
          ease: "power2.in",
        }
      )
        .to(
          titleElement,
          {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: "power2.in",
          },
          "-=0.2"
        )
        .call(() => {
          if (titleElement) {
            titleElement.textContent = formatThemeName(activeTheme);
          }
        })
        .fromTo(
          titleElement,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        )
        .fromTo(
          imageGridRef.current.querySelectorAll(".grid-image"),
          { opacity: 0, scale: 0.9, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: { each: 0.08, grid: [3, 3], from: "center" },
            duration: 0.6,
            ease: "back.out(1.7)",
          },
          "-=0.3"
        );
    },
    { scope: mainRef, dependencies: [activeTheme, introComplete] }
  );

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
  };

  return (
    <div ref={mainRef} className="min-h-screen">
      {/* Header */}
      <header className="main-header fixed top-0 left-0 right-0 z-40 bg-black bg-opacity-80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold flex items-center">
            <Logo ref={navLogoRef} className="h-16 w-16 mr-2" />
          </div>
          <nav className="hidden md:flex space-x-8">
            <a
              href="#"
              className="nav-items hover:text-indigo-400 transition-colors"
            >
              Home
            </a>
            <a
              href="#"
              className="nav-items hover:text-indigo-400 transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="nav-items hover:text-indigo-400 transition-colors"
            >
              Services
            </a>
            <a
              href="#"
              className="nav-items hover:text-indigo-400 transition-colors"
            >
              Contact
            </a>
          </nav>
          <button className="md:hidden">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Section */}
      <section className="main-content-section min-h-screen pt-24 pb-12 px-6">
        <div className="container mx-auto">
          <div className="mb-12 flex flex-wrap gap-4 justify-center">
            {Object.keys(themes).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`theme-nav-item px-4 py-2 rounded-full transition-all duration-300 ${
                  activeTheme === theme
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {formatThemeName(theme)}
              </button>
            ))}
          </div>

          <h2 className="theme-title text-3xl md:text-4xl font-bold text-center mb-12">
            {formatThemeName(activeTheme)}
          </h2>

          <div
            ref={imageGridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {themes[activeTheme].map((image, index) => (
              <div
                key={`${activeTheme}-${index}`}
                className="grid-image-container relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer"
              >
                <div className="image-overlay absolute inset-0 bg-indigo-900 opacity-0 transition-opacity duration-300 z-10"></div>
                <img
                  src={getImageUrl(image)}
                  alt={`${formatThemeName(activeTheme)} ${index + 1}`}
                  className="grid-image w-full h-full object-cover transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="main-content-section py-16 px-6 bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-lg">
            Let's create something amazing together. Our team is ready to bring
            your vision to life.
          </p>
          <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105">
            Contact Us
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-content-section py-12 px-6 bg-black">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Company Name</h3>
              <p className="text-gray-400">
                Creating exceptional experiences through innovative design and
                craftsmanship.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">Email: info@company.com</p>
              <p className="text-gray-400">Phone: +1 (123) 456-7890</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {/* Replace with actual icons */}
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  [FB Icon]
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  [IG Icon]
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  [TW Icon]
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 Company Name. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hero;