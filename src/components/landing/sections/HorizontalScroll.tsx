// src/HorizontalScroll.tsx
import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HorizontalScrollSection from './HorizontalScrollSection';
import type { ThemePanel } from '../../../types/types';
import GalleryView from './GalleryView';
import { scrollManager } from '../../../utils/scrollManager';

gsap.registerPlugin(ScrollTrigger);

const Spacer: React.FC<{ text: string; className?: string }> = ({ 
  text, 
  className = "bg-gray-800" 
}) => (
  <div className={`py-28 md:py-32 flex items-center justify-center ${className} relative overflow-hidden`}>
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 30%), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 20%)',
        backgroundSize: '100% 100%'
      }}
    />
    <div className="max-w-5xl mx-auto text-center px-6 relative">
      <h3 className="text-3xl md:text-5xl font-bold mb-8">{text}</h3>
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-16 opacity-50">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

const horizontalScrollThemes: ThemePanel[] = [
  {
    id: 1,
    title: 'Outdoors',
    description: 'Planeamento de meios e campanhas de grande impacto visual. Transformamos espaços públicos em telas dinâmicas para a sua marca.',
    ctaText: 'Ver Galeria Outdoors',
    gradientClass: '',
    spreadImages: [
      {
        src: '/categoria/outdoors/outdoor1.png',
        alt: 'Outdoor Display',
        url: undefined,
        config: {
          defaultDepth: 0.9,
          sm: {
            width: '60vw', height: 'auto',
            depth: 0.9,
            initial: { x: '-70vw', y: '5vh', scale: 0.7, rotation: -8, opacity: 0 },
            target:  { x: '25vw', y: '0vh', scale: 0.85, rotation: -2, opacity: 1, xPercent: -5, yPercent: 2 },
            exit:    { x: '70vw',  y: '-5vh', scale: 0.6, rotation: 8, opacity: 0 },
          },
          md: {
            width: '45vw', height: 'auto',
            depth: 0.9,
            initial: { x: '-70vw', y: '8vh', scale: 0.7, rotation: -10, opacity: 0 },
            target:  { x: '5vw', y: '10vh', scale: 0.9, rotation: -3, opacity: 1, xPercent: -6, yPercent: 3 },
            exit:    { x: '70vw',  y: '-8vh', scale: 0.6, rotation: 10, opacity: 0 },
          },
          lg: { 
            width: '35vw', height: 'auto',
            depth: 1.1, 
            initial: { x: '-10vw', y: '10vh', scale: 0.7, rotation: -12, opacity: 0 },
            target:  { x: '5vw',   y: '5vh',  scale: 0.8, rotation: -2,  opacity: 1, xPercent: 0, yPercent: 0 },
            exit:    { x: '-80vw',  y: '5vh',  scale: 0.6, rotation: 12, opacity: 0 },
          }
        }
      },
      {
        src: '/categoria/outdoors/outdoor2.png',
        alt: 'Outdoor Creative',
        url: undefined,
        config: {
          defaultDepth: 1,
          sm: { 
            width: '55vw', height: 'auto',
            depth: 1,
            initial: { x: '70vw', y: '-5vh', scale: 0.6, rotation: 8, opacity: 0 },
            target:  { x: '15vw', y: '2vh',  scale: 0.9, rotation: 3, opacity: 1, xPercent: 5, yPercent: -2 },
            exit:    { x: '-70vw', y: '5vh', scale: 0.5, rotation: -8, opacity: 0 },
          },
          md: { 
            width: '40vw', height: 'auto',
            depth: 1,
            initial: { x: '70vw', y: '-8vh', scale: 0.6, rotation: 10, opacity: 0 },
            target:  { x: '55vw', y: '60vh',  scale: 0.9, rotation: 4, opacity: 1, xPercent: 7, yPercent: -3 },
            exit:    { x: '-70vw', y: '8vh', scale: 0.5, rotation: -10, opacity: 0 },
          },
          lg: { 
            width: '30vw', height: 'auto',
            depth: 1, 
            initial: { x: '80vw', y: '5vh', scale: 0.6, rotation: 12, opacity: 0 },
            target:  { x: '58vw', y: '5vh',  scale: 0.95, rotation: 5,  opacity: 1, xPercent: 8, yPercent: -2 },
            exit:    { x: '30vw', y: '5vh',  scale: 0.5, rotation: -12, opacity: 0 },
          }
        }
      },
      {
        src: '',
        alt: 'Outdoor Creative',
        url: undefined,
        config: {
          defaultDepth: 1,
          sm: { 
            width: '55vw', height: 'auto',
            depth: 0.1,
            initial: { x: '70vw', y: '-5vh', scale: 0.6, rotation: 8, opacity: 0 },
            target:  { x: '15vw', y: '2vh',  scale: 0.8, rotation: 3, opacity: 1, xPercent: 5, yPercent: -2 },
            exit:    { x: '-70vw', y: '5vh', scale: 0.5, rotation: -8, opacity: 0 },
          },
          md: { 
            width: '40vw', height: 'auto',
            depth: 0.1,
            initial: { x: '70vw', y: '-8vh', scale: 0.6, rotation: 10, opacity: 0 },
            target:  { x: '22vw', y: '5vh',  scale: 0.85, rotation: 4, opacity: 1, xPercent: 7, yPercent: -3 },
            exit:    { x: '-70vw', y: '8vh', scale: 0.5, rotation: -10, opacity: 0 },
          },
          lg: { 
            width: '30vw', height: 'auto',
            depth: 0.1, 
            initial: { x: '80vw', y: '5vh', scale: 0.6, rotation: 12, opacity: 0 },
            target:  { x: '28vw', y: '5vh',  scale: 0.95, rotation: 5,  opacity: 1, xPercent: 8, yPercent: -2 },
            exit:    { x: '-80vw', y: '0vh',  scale: 0.5, rotation: -12, opacity: 0 },
          }
        }
      }
    ],
  },
  {
    id: 2,
    title: 'Feiras & Eventos',
    description: "Stands empresariais e institucionais que captam a atenção. Criamos experiências memoráveis em feiras e eventos.",
    ctaText: 'Explorar Eventos',
    gradientClass: '',
    spreadImages: [
      {
        src: '/categoria/eventos/seasidePalcoFrente.png',
        alt: 'Event Stage',
        url: undefined,
        config: {
          defaultDepth: 1,
          sm: { width: '70vw', height: 'auto', initial: { x:'-50vw', y:'0vh', scale:0.7, rotation:0, opacity:0}, target: {x:'-10vw', y:'0vh', scale:0.9, rotation:0, opacity:1}, exit: {x:'50vw', y:'0vh', scale:0.7, rotation:0, opacity:0}},
          md: { width: '50vw', height: 'auto', initial: { x:'-60vw', y:'0vh', scale:0.7, rotation:0, opacity:0}, target: {x:'0vw', y:'0vh', scale:1, rotation:0, opacity:1}, exit: {x:'60vw', y:'0vh', scale:0.7, rotation:0, opacity:0}},
          lg: { width: '40vw', height: 'auto', depth: 1.2, initial: { x:'-70vw', y:'0vh', scale:0.7, rotation:0, opacity:0}, target: {x:'0vw', y:'0vh', scale:1.2, rotation:0, opacity:1}, exit: {x:'70vw', y:'0vh', scale:0.7, rotation:0, opacity:0}}
        }
      },
      {
        src: '/categoria/eventos/natalSabugal2021_1.png',
        alt: 'Christmas Event',
        url: undefined,
        config: {
          defaultDepth: 0.8,
          sm: { width: '50vw', height: 'auto', initial: { x:'50vw', y:'5vh', scale:0.6, rotation:5, opacity:0}, target: {x:'20vw', y:'5vh', scale:0.75, rotation:2, opacity:1}, exit: {x:'-50vw', y:'5vh', scale:0.6, rotation:-5, opacity:0}},
          md: { width: '35vw', height: 'auto', initial: { x:'60vw', y:'8vh', scale:0.6, rotation:8, opacity:0}, target: {x:'25vw', y:'8vh', scale:0.8, rotation:3, opacity:1}, exit: {x:'-60vw', y:'8vh', scale:0.6, rotation:-8, opacity:0}},
          lg: { width: '30vw', height: 'auto', depth: 0.9, initial: { x:'70vw', y:'10vh', scale:0.6, rotation:10, opacity:0}, target: {x:'30vw', y:'10vh', scale:0.9, rotation:5, opacity:1}, exit: {x:'-70vw', y:'10vh', scale:0.6, rotation:-10, opacity:0}}
        }
      },
      {
        src: '/categoria/eventos/seasidePalcoLadoDireito.png',
        alt: 'Event Stage Right',
        url: undefined,
        config: { 
          defaultDepth: 0.9,
          sm: { width: '50vw', height: 'auto', initial: { x:'-50vw', y:'-5vh', scale:0.6, rotation:-5, opacity:0}, target: {x:'-20vw', y:'-5vh', scale:0.75, rotation:-2, opacity:1}, exit: {x:'50vw', y:'-5vh', scale:0.6, rotation:5, opacity:0}},
          md: { width: '33vw', height: 'auto', initial: { x:'-60vw', y:'-8vh', scale:0.6, rotation:-8, opacity:0}, target: {x:'-25vw', y:'-8vh', scale:0.8, rotation:-3, opacity:1}, exit: {x:'60vw', y:'-8vh', scale:0.6, rotation:8, opacity:0}},
          lg: { width: '28vw', height: 'auto', depth: 0.95, initial: { x:'-70vw', y:'-10vh', scale:0.6, rotation:-10, opacity:0}, target: {x:'-30vw', y:'-10vh', scale:0.85, rotation:-5, opacity:1}, exit: {x:'70vw', y:'-10vh', scale:0.6, rotation:10, opacity:0}}
        }
      },
      {
        src: '/categoria/eventos/seasidePalcoLadoEsquerdo.png',
        alt: 'Event Stage Left',
        url: undefined,
        config: {
          defaultDepth: 0.85,
          sm: { width: '50vw', height: 'auto', initial: { x:'50vw', y:'0vh', scale:0.6, rotation:5, opacity:0}, target: {x:'20vw', y:'0vh', scale:0.75, rotation:2, opacity:1}, exit: {x:'-50vw', y:'0vh', scale:0.6, rotation:-5, opacity:0}},
          md: { width: '33vw', height: 'auto', initial: { x:'60vw', y:'0vh', scale:0.6, rotation:8, opacity:0}, target: {x:'25vw', y:'0vh', scale:0.8, rotation:3, opacity:1}, exit: {x:'-60vw', y:'0vh', scale:0.6, rotation:-8, opacity:0}},
          lg: { 
              width: '25vw', height: 'auto', depth: 0.8, 
              initial: { x: '70vw', y: '-15vh', scale:0.5, rotation:15, opacity:0},
              target: {x:'40vw', y:'-12vh', scale:0.75, rotation:8, opacity:1, xPercent: 10, yPercent: -5},
              exit: {x:'-70vw', y:'-10vh', scale:0.5, rotation:-15, opacity:0}
          }
        }
      },
    ],
  },
  {
    id: 3,
    title: 'Decoração de Espaços',
    description: 'Transformamos ambientes com design e criatividade. Projetos de decoração para espaços comerciais e privados que contam uma história.',
    ctaText: 'Ver Projetos de Decoração',
    gradientClass: '',
    spreadImages: [
      {
        src: '/categoria/decoracao_espacos/dockCabril1.png',
        alt: 'Dock Cabril',
        url: undefined,
        config: { 
          defaultDepth: 0.7,
          sm: { width:'65vw', height:'auto', initial: {opacity:0, scale:0.5, x:'-50vw', y:'0vh', rotation:0}, target:{opacity:1, scale:0.8, x:'-10vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.5, x:'50vw', y:'0vh', rotation:0}},
          md: { width:'45vw', height:'auto', initial: {opacity:0, scale:0.6, x:'-60vw', y:'0vh', rotation:0}, target:{opacity:1, scale:0.9, x:'-15vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.6, x:'60vw', y:'0vh', rotation:0}},
          lg: { width:'35vw', height:'auto', initial: {opacity:0, scale:0.7, x:'-70vw', y:'0vh', rotation:0}, target:{opacity:1, scale:1, x:'-20vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.7, x:'70vw', y:'0vh', rotation:0}}
        }
      },
      {
        src: '/categoria/decoracao_espacos/decEspacoBarragem.jpeg',
        alt: 'Space Decoration',
        url: undefined,
        config: { 
          defaultDepth: 0.5,
          sm: { width:'60vw', height:'auto', initial: {opacity:0, scale:0.5, x:'50vw', y:'0vh', rotation:0}, target:{opacity:1, scale:0.8, x:'10vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.5, x:'-50vw', y:'0vh', rotation:0}},
          md: { width:'40vw', height:'auto', initial: {opacity:0, scale:0.6, x:'60vw', y:'0vh', rotation:0}, target:{opacity:1, scale:0.9, x:'15vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.6, x:'-60vw', y:'0vh', rotation:0}},
          lg: { width:'33vw', height:'auto', initial: {opacity:0, scale:0.7, x:'70vw', y:'0vh', rotation:0}, target:{opacity:1, scale:1, x:'20vw', y:'0vh', rotation:0}, exit:{opacity:0, scale:0.7, x:'-70vw', y:'0vh', rotation:0}}
        }
      }
    ],
  },
  {
    id: 4,
    title: 'Projetos Criativos',
    description: 'Explore o nosso portfólio diversificado de projetos especiais que demonstram a nossa versatilidade criativa e compromisso com a inovação.',
    ctaText: 'Descobrir Mais Trabalhos',
    gradientClass: '',
    spreadImages: [
       {
         src: '/categoria/entre_outros/baloico_penalobo1.png',
         alt: 'Baloico Penalobo',
         url: undefined,
         config: { 
           defaultDepth: 0.9,
           sm: { width:'60vw', height:'auto', initial: {opacity:0, x:'-50vw', y:'0vh', rotation:0, scale:0.7}, target:{opacity:1, x:'-10vw', y:'0vh', rotation:0, scale:0.9}, exit:{opacity:0, x:'50vw', y:'0vh', rotation:0, scale:0.7}},
           md: { width:'40vw', height:'auto', initial: {opacity:0, x:'-60vw', y:'0vh', rotation:0, scale:0.7}, target:{opacity:1, x:'-15vw', y:'0vh', rotation:0, scale:1}, exit:{opacity:0, x:'60vw', y:'0vh', rotation:0, scale:0.7}},
           lg: { width:'30vw', height:'auto', initial: {opacity:0, x:'-70vw', y:'0vh', rotation:0, scale:0.7}, target:{opacity:1, x:'-25vw', y:'0vh', rotation:0, scale:1.1}, exit:{opacity:0, x:'70vw', y:'0vh', rotation:0, scale:0.7}}
         }
       },
       {
         src: '/categoria/entre_outros/baloico_penalobo2.png',
         alt: 'Baloico Penalobo Detail',
         url: undefined,
         config: { 
           defaultDepth: 1.2,
           sm: { width:'55vw', height:'auto', initial: {opacity:0, x:'50vw', y:'0vh', rotation:0, scale:0.6}, target:{opacity:1, x:'10vw', y:'0vh', rotation:0, scale:0.8}, exit:{opacity:0, x:'-50vw', y:'0vh', rotation:0, scale:0.6}},
           md: { width:'35vw', height:'auto', initial: {opacity:0, x:'60vw', y:'0vh', rotation:0, scale:0.6}, target:{opacity:1, x:'15vw', y:'0vh', rotation:0, scale:0.9}, exit:{opacity:0, x:'-60vw', y:'0vh', rotation:0, scale:0.6}},
           lg: { width:'28vw', height:'auto', initial: {opacity:0, x:'70vw', y:'0vh', rotation:0, scale:0.6}, target:{opacity:1, x:'25vw', y:'0vh', rotation:0, scale:1}, exit:{opacity:0, x:'-70vw', y:'0vh', rotation:0, scale:0.6}}
         }
       },
    ],
  },
];

function HorizontalScroll() {
  const [activeGallery, setActiveGallery] = useState<{
    theme: ThemePanel;
    index: number;
    originSection?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const panelsWrapperRef = useRef<HTMLDivElement>(null);
  const [horizontalProgress, setHorizontalProgress] = useState({ activePanel: 0, progress: 0 });
  const mainHorizontalTweenRef = useRef<gsap.core.Tween | null>(null);
  const [containerAnimation, setContainerAnimation] = useState<gsap.core.Tween | null>(null);
  
  // Handle theme selection from HorizontalScrollSection
  const handleThemeSelect = (theme: ThemePanel, index: number, sectionBounds?: DOMRect) => {
    let originSection;
    
    if (sectionBounds) {
      originSection = {
        x: sectionBounds.left,
        y: sectionBounds.top,
        width: sectionBounds.width,
        height: sectionBounds.height,
      };
    }
    
    setActiveGallery({ theme, index, originSection });
  };

  // Handle return to timeline from expanded view
  const handleReturnToTimeline = () => {
    // Only scroll to top if user explicitly requests it, not automatically
    // This prevents unwanted scroll jumps when gallery opens/closes
    console.log('handleReturnToTimeline called - consider if scroll is needed');
  };

  const handleGalleryClose = () => {
    setActiveGallery(null);
  };

  useEffect(() => {
    // Initialize scroll manager with advanced configuration
    scrollManager.init({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      smoothWheel: true,
    });

    // Image Preloading for better performance
    const imagePaths: string[] = [];
    horizontalScrollThemes.forEach(theme => {
      theme.spreadImages?.forEach(img => {
        const src = img.src.startsWith('/') ? img.src : `/${img.src}`;
        imagePaths.push(src);
      });
    });

    const imagePromises = imagePaths.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); 
        img.src = src;
      });
    });

    Promise.all(imagePromises).then(() => {
      scrollManager.refreshScrollTriggers();
    });

    return () => {
      // Cleanup is handled by the scroll manager
      scrollManager.destroy();
    };
  }, []);

  useEffect(() => {
    if (!mainContainerRef.current || !horizontalSectionRef.current || !panelsWrapperRef.current) return;

    const panels = gsap.utils.toArray<HTMLElement>(
      horizontalSectionRef.current.querySelectorAll(":scope > .h-scroll-section-panel")
    );

    if (panels.length === 0) {
        console.warn("HorizontalScroll: No panels found with .h-scroll-section-panel class.");
        return;
    }

    // Set up individual panel initial states
    panels.forEach((panel, index) => {
      // Initial state: all panels except first are hidden
      gsap.set(panel, {
        opacity: index === 0 ? 1 : 0,
        scale: index === 0 ? 1 : 0.8,
      });

      // Set initial text states
      const contentContainer = panel.querySelector('.content-container');
      if (contentContainer) {
        const textElements = contentContainer.querySelectorAll('h2, p, .cta-button');
        if (index === 0) {
          gsap.set(textElements, { opacity: 1, y: 0 });
        } else {
          gsap.set(textElements, { opacity: 0, y: 30 });
        }
      }
    });

    // Create main horizontal pin ScrollTrigger (like in Hero.tsx)
    const mainHorizontalScrollTween: gsap.core.Tween = gsap.to(horizontalSectionRef.current, {
      xPercent: (-100 * (panels.length - 1)) / (panels.length || 1),
      ease: "none", 
      scrollTrigger: {
        trigger: panelsWrapperRef.current,
        pin: true,
        scrub: 1,
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: { min: 0.2, max: 0.5 },
          delay: 0,
          ease: "power1.inOut",
        },
        end: () => "+=" + (horizontalSectionRef.current ? horizontalSectionRef.current.offsetWidth / panels.length * (panels.length - 1) : 0),
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const totalPanels = panels.length;
          
          let currentPanelIdx = Math.floor(progress * totalPanels);
          currentPanelIdx = Math.min(currentPanelIdx, totalPanels - 1); 
          currentPanelIdx = Math.max(0, currentPanelIdx); 
          
          const panelProgressVal = totalPanels > 0 ? ((progress * totalPanels) % 1) : 0;
          
          setHorizontalProgress({
            activePanel: currentPanelIdx,
            progress: panelProgressVal
          });
        }
      }
    });

    // Store reference for child sections
    mainHorizontalTweenRef.current = mainHorizontalScrollTween;
    setContainerAnimation(mainHorizontalScrollTween);

    const refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      clearTimeout(refreshTimeout);
      mainHorizontalScrollTween.kill();
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars.trigger === panelsWrapperRef.current && st.animation === mainHorizontalScrollTween) st.kill();
      });
    };
  }, [horizontalScrollThemes.length]);

  // Optional: Log progress for debugging (remove in production)
  useEffect(() => {
    console.log('Horizontal Progress:', horizontalProgress);
  }, [horizontalProgress]);

  return (
    <div ref={mainContainerRef} className="text-gray-100 ">
      <section 
        id="horizontal-scroll-section"
        ref={panelsWrapperRef} 
        className="relative  overflow-hidden"
        data-horizontal-section
      >
        <div 
          ref={horizontalSectionRef} 
          id="horizontal-panels-container"
          className="relative flex h-screen"
          style={{ width: `${horizontalScrollThemes.length * 100}vw` }}
        >
          {horizontalScrollThemes.map((theme, index) => (
            <HorizontalScrollSection
              key={theme.id}
              theme={theme}
              index={index}
              totalThemes={horizontalScrollThemes.length}
              isGalleryActive={activeGallery !== null}
              panelProgress={
                index < horizontalProgress.activePanel
                  ? 1
                  : index === horizontalProgress.activePanel
                  ? horizontalProgress.progress
                  : 0
              }
              containerAnimation={containerAnimation}
              onThemeSelect={(sectionBounds) => handleThemeSelect(theme, index, sectionBounds)}
              onReturnToTimeline={handleReturnToTimeline}
            />
          ))}
        </div>
      </section>
      
      {/* Slide-up Gallery Overlay */}
      {activeGallery && (
        <GalleryView
          theme={activeGallery.theme}
          themeIndex={activeGallery.index}
          totalThemes={horizontalScrollThemes.length}
          onClose={handleGalleryClose}
          originSection={activeGallery.originSection}
        />
      )}
      
      <Spacer text="Bringing Imagination to Reality" className="text-white" />

      <footer className="py-20 bg-black text-center text-gray-300 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
            backgroundSize: '20px 20px'
          }}
        />
        <div className="container mx-auto px-6 relative z-10">
          <p className="mb-8 text-xl md:text-2xl font-light">© 2024 Your Creative Company</p>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-12">
            <a href="#" className="cursor-pointer hover:text-white transition-colors duration-300 text-lg relative group">
              Portfolio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="cursor-pointer hover:text-white transition-colors duration-300 text-lg relative group">
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="cursor-pointer hover:text-white transition-colors duration-300 text-lg relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HorizontalScroll;
