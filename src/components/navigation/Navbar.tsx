import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Logo from "../../assets/intro/logo.svg?react";
// Register GSAP plugins safely (only in browser environment)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

interface NavbarProps {
  introComplete?: boolean;
  onNavClick?: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  introComplete = true,
  onNavClick
}) => {
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!introComplete || !navRef.current || typeof window === 'undefined') return;
    
    // Navbar fade in
    gsap.fromTo(
      navRef.current,
      { y: -50, opacity: 0, visibility: "visible", pointerEvents: "auto" },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );

    // Set up navbar scroll interaction
    ScrollTrigger.create({
      trigger: 'body', // Use body selector instead of direct document reference
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!navRef.current) return;
        
        gsap.to(navRef.current, {
          backgroundColor: `rgba(20, 20, 20, ${Math.min(self.progress * 2, 0.9)})`,
          backdropFilter: `blur(${self.progress * 10}px)`,
          duration: 0.3
        });
      }
    });

    return () => {
      // Clean up ScrollTrigger
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [introComplete]);

  // Handle navigation click
  const handleNavClick = (section: string) => {
    if (onNavClick) {
      onNavClick(section);
    }
    
    // Smooth scroll to section if it exists
    if (typeof window !== 'undefined' && section) {
      const targetElement = document.getElementById(section);
      if (targetElement) {
        gsap.to(window, {
          duration: 1,
          scrollTo: `#${section}`,
          ease: "power2.inOut"
        });
      }
    }
  };

  return (
    <div 
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300 opacity-0 pointer-events-none backdrop-blur-sm"
      style={{ willChange: 'transform, opacity, background-color' }}
    >
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-white cursor-pointer" onClick={() => handleNavClick('top')}>
        <Logo  className="w-24 h-24"/>
        </div>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8">
          <button
            onClick={() => handleNavClick('services')}
            className="text-gray-300 hover:text-white transition-colors duration-300 hover:scale-105 cursor-pointer"
          >
            Services
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="text-gray-300 hover:text-white transition-colors duration-300 hover:scale-105 cursor-pointer"
          >
            Contact Us
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;