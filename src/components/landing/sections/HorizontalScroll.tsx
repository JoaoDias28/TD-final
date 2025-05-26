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
        config: { initialX: '30%', initialY: '15%', depth: 0.7, scale: 1.1, rotate: -2 },
        url: undefined
      },
      {
        src: '/categoria/outdoors/outdoor2.png', 
        alt: 'Outdoor Creative', 
        config: { initialX: '70%', initialY: '25%', depth: 1, scale: 0.9, rotate: 3 },
        url: undefined
      },
    ],
    bottomStripImages: [
      {
        src: '/bottomImgs/outdoorSilhouette4x3.png', 
        alt: 'Outdoor Example 1', 
        depth: 0.9,
        url: undefined
      },
      {
        src: '/categoria/outdoors/outdoor1.png', 
        alt: 'Detalhe Outdoor Campanha', 
        depth: 1.05,
        url: undefined
      },
      {
        src: '/categoria/outdoors/outdoor2.png', 
        alt: 'Outdoor Noturno', 
        depth: 0.95,
        url: undefined
      },
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
        config: { initialX: '15%', initialY: '20%', depth: 0.85, scale: 2.2, rotate: 0 },
        url: undefined
      },
      {
        src: '/categoria/eventos/natalSabugal2021_1.png', 
        alt: 'Christmas Event', 
        config: { initialX: '65%', initialY: '30%', depth: 1.15, scale: 0.9, rotate: -3 },
        url: undefined
      },
    ],
    bottomStripImages: [
      {
        src: '/categoria/eventos/seasidePalcoFrente.png', 
        alt: 'Event Stage Front', 
        depth: 1.05,
        url: undefined
      },
      {
        src: '/categoria/eventos/seasidePalcoLadoDireito.png', 
        alt: 'Event Stage Right', 
        depth: 0.95,
        url: undefined
      },
      {
        src: '/categoria/eventos/seasidePalcoLadoEsquerdo.png', 
        alt: 'Event Stage Left', 
        depth: 1.0,
        url: undefined
      },
      {
        src: '/categoria/eventos/natalSabugal2021_1.png', 
        alt: 'Detalhe Evento Natal', 
        depth: 1.1,
        url: undefined
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
        config: { initialX: '20%', initialY: '60%', depth: 0.7, scale: 1.3, rotate: 0 },
        url: undefined
      },
      {
        src: '/categoria/decoracao_espacos/decEspacoBarragem.jpeg', 
        alt: 'Space Decoration', 
        config: { initialX: '70%', initialY: '25%', depth: 0.5, scale: 1.1, rotate: 0 },
        url: undefined
      }
    ],
    bottomStripImages: [
      {
        src: '/categoria/decoracao_espacos/dockCabril1.png', 
        alt: 'Dock Cabril Detalhe 1', 
        depth: 0.9,
        url: undefined
      },
      {
        src: '/categoria/decoracao_espacos/dockCabril2.png', 
        alt: 'Dock Cabril Detalhe 2', 
        depth: 1.1,
        url: undefined
      },
      {
        src: '/categoria/decoracao_espacos/decEspacoBarragem.jpeg', 
        alt: 'Decor Barragem Vista', 
        depth: 1.0,
        url: undefined
      },
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
         config: { initialX: '30%', initialY: '20%', depth: 0.9, scale: 1.0, rotate: 2 },
         url: undefined
       },
       {
         src: '/categoria/entre_outros/baloico_penalobo2.png', 
         alt: 'Baloico Penalobo Detail', 
         config: { initialX: '65%', initialY: '60%', depth: 1.2, scale: 0.8, rotate: -3 },
         url: undefined
       },
    ],
    bottomStripImages: [
      {
        src: '/categoria/entre_outros/baloico_penalobo1.png', 
        alt: 'Baloico Penalobo Vista 1', 
        depth: 1.15,
        url: undefined
      },
      {
        src: '/categoria/entre_outros/baloico_penalobo2.png', 
        alt: 'Baloico Penalobo Vista 2', 
        depth: 0.8,
        url: undefined
      },
      {
        src: '/bottomImgs/outdoorSilhouette4x3.png', 
        alt: 'Projeto Criativo Exemplo', 
        depth: 1.0,
        url: undefined
      }
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
      theme.bottomStripImages?.forEach(img => {
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

  return (
    <div ref={mainContainerRef} className="text-gray-100 bg-black">
      <div ref={horizontalSectionRef} id="horizontal-scroll-section" data-horizontal-section>
        <HorizontalScrollSection
          themes={horizontalScrollThemes}
          onReturnToTimeline={handleReturnToTimeline}
          onThemeSelect={handleThemeSelect}
          isGalleryActive={activeGallery !== null}
        />
      </div>
      
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
