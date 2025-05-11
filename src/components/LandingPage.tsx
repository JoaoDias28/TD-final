import React, { useRef, useState} from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Picture } from 'vite-imagetools';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Define types for props
interface LandingPageProps {
  themes: Record<string, (string | Picture)[]>;
  assetUrls: (string | Picture)[];

}

// Helper function to get image URL from Picture object or string
const getImageUrl = (image: string | Picture): string => {
  if (typeof image === 'string') return image;
  // For Picture objects, get the src from the img property
  return image.img?.src || '';
};

const LandingPage: React.FC<LandingPageProps> = ({ themes, assetUrls }) => {

  const [introComplete, setIntroComplete] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<string>(Object.keys(themes)[0]);
  
  // Refs for animation targets
  const introRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
 
  const imageGridRef = useRef<HTMLDivElement>(null);
  const themeNavRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  
  // Theme names for display (convert snake_case to Title Case)
  const formatThemeName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Intro animation
  useGSAP(() => {
    if (!introRef.current || introComplete) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => setIntroComplete(true), 500);
      }
    });

    // Create a grid of images for the intro animation
    const images = introRef.current.querySelectorAll('.intro-image');
    const imageArray = Array.from(images);
    
    // Get all image containers to determine position
    const containers = introRef.current.querySelectorAll('.intro-image-container');
    
    // Separate left and right images based on position rather than array order
    const leftImages: Element[] = [];
    const rightImages: Element[] = [];
    
    containers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      
      // Left side of center goes left, right side of center goes right
      if (rect.left + rect.width / 2 < centerX) {
        leftImages.push(imageArray[index]);
      } else {
        rightImages.push(imageArray[index]);
      }
    });
    
    // Initial state - all images invisible and logo hidden
    gsap.set(images, { opacity: 0, scale: 0.8 });
    gsap.set(logoRef.current, { opacity: 0, scale: 0.5 });
    
    // Fade in the intro text
    tl.fromTo('.intro-text', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    )
    
    // Staggered appearance of images
    .fromTo(images, 
      { opacity: 0, scale: 0.8, y: 20 }, 
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        stagger: {
          each: 0.1,
          grid: 'auto',
          from: 'center'
        }, 
        duration: 0.8, 
        ease: 'back.out(1.7)'
      },
      '-=0.5'
    )
    
    // Hold for a moment
    .to({}, { duration: 0.8 })
    
    // Split the images - move left images further left
    .to(leftImages, {
      x: '-120%', 
      opacity: 0.7,
      scale: 0.9,
      duration: 1,
      ease: 'power2.inOut'
    })
    
    // Move right images further right
    .to(rightImages, {
      x: '120%',
      opacity: 0.7,
      scale: 0.9,
      duration: 1,
      ease: 'power2.inOut'
    }, '<') // Start at the same time as the left animation
    
    // Fade in the logo
    .to(logoRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power3.out'
    }, '<0.3')
    
    // Hold the logo state for a moment
    .to({}, { duration: 1 })
    
    // Fade out the logo
    .to(logoRef.current, {
      opacity: 0,
      scale: 1.2,
      duration: 0.5,
      ease: 'power2.in'
    })
    
    // Fade out all images
    .to(images, {
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        // Prepare for the main content
        if (mainRef.current) {
          gsap.set(mainRef.current, { opacity: 1 });
        }
      }
    }, '<0.2')
    
    // Fade out the intro text
    .to('.intro-text', { opacity: 0, y: -20, duration: 0.5 }, '<');
    
  }, { scope: introRef, dependencies: [introComplete] });

  // Main content animations
  useGSAP(() => {
    if (!introComplete || !mainRef.current) return;
    
    const tl = gsap.timeline();
    
    // Animate in the header
    tl.fromTo('.main-header',
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    )
    
    // Animate in the theme navigation
    .fromTo('.theme-nav-item',
      { opacity: 0, x: -20 },
      { 
        opacity: 1, 
        x: 0, 
        stagger: 0.1, 
        duration: 0.6, 
        ease: 'power2.out' 
      },
      '-=0.5'
    )
    
    // Animate in the theme title
    .fromTo('.theme-title',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.3'
    )
    
    // Animate in the image grid
    .fromTo('.grid-image',
      { opacity: 0, scale: 0.9, y: 30 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        stagger: {
          each: 0.1,
          grid: [3, 3],
          from: 'center'
        }, 
        duration: 0.8, 
        ease: 'back.out(1.7)' 
      },
      '-=0.5'
    );
    
    // Set up hover animations for grid images
    const gridImages = document.querySelectorAll('.grid-image-container');
    gridImages.forEach(container => {
      const image = container.querySelector('.grid-image');
      const overlay = container.querySelector('.image-overlay');
      
      container.addEventListener('mouseenter', () => {
        gsap.to(image, { scale: 1.05, duration: 0.4, ease: 'power2.out' });
        gsap.to(overlay, { opacity: 0.3, duration: 0.4 });
      });
      
      container.addEventListener('mouseleave', () => {
        gsap.to(image, { scale: 1, duration: 0.4, ease: 'power2.out' });
        gsap.to(overlay, { opacity: 0, duration: 0.4 });
      });
    });
    
  }, { scope: mainRef, dependencies: [introComplete] });
  
  // Theme switching animation
  useGSAP(() => {
    if (!introComplete || !imageGridRef.current) return;
    
    // Animate out current images and animate in new ones
    const tl = gsap.timeline();
    
    tl.to('.grid-image', {
      opacity: 0,
      scale: 0.9,
      stagger: {
        each: 0.05,
        from: 'random'
      },
      duration: 0.4,
      ease: 'power2.in'
    })
    .to('.theme-title', {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: 'power2.in'
    }, '-=0.2')
    .call(() => {
      // Update the theme title text
      const titleElement = document.querySelector('.theme-title');
      if (titleElement) {
        titleElement.textContent = formatThemeName(activeTheme);
      }
    })
    .fromTo('.theme-title', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    )
    .fromTo('.grid-image',
      { opacity: 0, scale: 0.9, y: 20 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        stagger: {
          each: 0.08,
          grid: [3, 3],
          from: 'center'
        }, 
        duration: 0.6, 
        ease: 'back.out(1.7)' 
      }
    );
    
  }, { scope: imageGridRef, dependencies: [activeTheme, introComplete] });
  
  // Handle theme navigation
  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Intro Animation */}
      {!introComplete && (
        <div 
          ref={introRef} 
          className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black"
        >
          <h1 className="intro-text text-4xl md:text-5xl font-bold mb-12 text-center">
            Discover Our Work
          </h1>
          
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-5xl mx-auto px-4">
            {assetUrls.slice(0, 16).map((image, index) => (
              <div 
                key={index} 
                className="intro-image-container"
              >
                <div className="intro-image aspect-square overflow-hidden rounded-lg">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`Project ${index}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Logo that will appear in the center */}
          <div 
            ref={logoRef} 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 z-10"
          >
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" />
              <path d="M30,50 L45,65 L70,35" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div 
        ref={mainRef} 
        className={`opacity-0 transition-opacity duration-500 ${introComplete ? 'block' : 'hidden'}`}
      >
        {/* Header */}
        <header className="main-header fixed top-0 left-0 right-0 z-40 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold">Company Name</div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="hover:text-indigo-400 transition-colors">Home</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">About</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Services</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
            </nav>
            <button className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="min-h-screen pt-24 pb-12 px-6">
          <div className="container mx-auto">
            {/* Theme Navigation */}
            <div 
              ref={themeNavRef} 
              className="mb-12 flex flex-wrap gap-4 justify-center"
            >
              {Object.keys(themes).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`theme-nav-item px-4 py-2 rounded-full transition-all duration-300 ${
                    activeTheme === theme 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {formatThemeName(theme)}
                </button>
              ))}
            </div>
            
            {/* Theme Title */}
            <h2 className="theme-title text-3xl md:text-4xl font-bold text-center mb-12">
              {formatThemeName(activeTheme)}
            </h2>
            
            {/* Image Grid */}
            <div 
              ref={imageGridRef} 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {themes[activeTheme].map((image, index) => (
                <div 
                  key={index} 
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
        
        {/* Call to Action */}
        <section className="py-16 px-6 bg-gradient-to-r from-indigo-900 to-purple-900">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Project?</h2>
            <p className="max-w-2xl mx-auto mb-8 text-lg">
              Let's create something amazing together. Our team is ready to bring your vision to life.
            </p>
            <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-full hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105">
              Contact Us
            </button>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 px-6 bg-black">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Company Name</h3>
                <p className="text-gray-400">
                  Creating exceptional experiences through innovative design and craftsmanship.
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
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
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
    </div>
  );
};

export default LandingPage;