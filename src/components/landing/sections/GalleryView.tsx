// components/GalleryView.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { ThemePanel, FilterOptions, GalleryImage } from '../../../types/types';
import FullscreenViewer from '../../helper/FullscreenViewer';
import { scrollManager } from '../../../utils/scrollManager';

interface GalleryViewProps {
  theme: ThemePanel;
  themeIndex: number;
  totalThemes: number;
  onClose: () => void;
  originSection?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const GRID_CONFIGS = {
  compact: {
    columns: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    gap: 'gap-2',
    aspectRatio: 'aspect-square',
  },
  comfortable: {
    columns: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    gap: 'gap-4',
    aspectRatio: 'aspect-[4/3]',
  },
  spacious: {
    columns: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    gap: 'gap-6',
    aspectRatio: 'aspect-[3/2]',
  },
};

const GalleryView: React.FC<GalleryViewProps> = ({
  theme,
  themeIndex,
  totalThemes,
  onClose,
  originSection,
}) => {
  const gallerySheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    sortBy: 'default',
    gridSize: 'comfortable',
  });

  const [fullscreenImage, setFullscreenImage] = useState<{
    isOpen: boolean;
    url: string;
    alt: string;
  }>({
    isOpen: false,
    url: '',
    alt: '',
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Process and filter images
  const galleryImages = useMemo((): GalleryImage[] => {
    const images: GalleryImage[] = [];

    // Add spread images
    theme.spreadImages?.forEach((img, idx) => {
      images.push({
        id: `spread-${idx}`,
        src: img.src,
        alt: img.alt,
        category: 'spread',
        sourceKey: `spread-${idx}`,
        originalIndex: idx,
      });
    });

    // Add bottom strip images
    theme.bottomStripImages?.forEach((img, idx) => {
      images.push({
        id: `bottom-${idx}`,
        src: img.src,
        alt: img.alt,
        category: 'bottom',
        sourceKey: `bottom-${idx}`,
        originalIndex: idx,
      });
    });

    return images;
  }, [theme]);

  const filteredImages = useMemo(() => {
    let filtered = [...galleryImages];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(img =>
        img.alt.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(img => img.category === filters.category);
    }

    // Sort images
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.alt.localeCompare(b.alt));
        break;
      case 'recent':
        filtered.sort((a, b) => b.originalIndex - a.originalIndex);
        break;
      default:
        break;
    }

    return filtered;
  }, [galleryImages, searchTerm, filters]);

  // Scroll management: Prevent background scrolling without affecting scroll position
  useEffect(() => {
    // Store the current scroll position
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    
    // Temporarily disable Lenis to prevent interference using scroll manager
    const lenisInstance = scrollManager.getLenis();
    if (lenisInstance && typeof lenisInstance.stop === 'function') {
      lenisInstance.stop();
    }
    
    // Instead of overflow hidden, use position fixed to prevent scroll jumps
    const mainBody = document.body;
    const originalBodyPosition = mainBody.style.position;
    const originalBodyTop = mainBody.style.top;
    const originalBodyLeft = mainBody.style.left;
    const originalBodyWidth = mainBody.style.width;
    
    // Prevent background scrolling while preserving scroll position
    mainBody.style.position = 'fixed';
    mainBody.style.top = `-${currentScrollY}px`;
    mainBody.style.left = `-${currentScrollX}px`;
    mainBody.style.width = '100%';
    
    return () => {
      // Re-enable Lenis
      if (lenisInstance && typeof lenisInstance.start === 'function') {
        lenisInstance.start();
      }
      
      // Restore scroll position when gallery closes
      mainBody.style.position = originalBodyPosition;
      mainBody.style.top = originalBodyTop;
      mainBody.style.left = originalBodyLeft;
      mainBody.style.width = originalBodyWidth;
      
      // Restore scroll position
      window.scrollTo(currentScrollX, currentScrollY);
    };
  }, []);

  // Enhanced slide-up sheet animation from origin section
  useEffect(() => {
    if (!gallerySheetRef.current || isInitialized) return;

    const sheet = gallerySheetRef.current;
    const header = headerRef.current;
    const searchInput = searchInputRef.current;
    const filters = filtersRef.current;
    const grid = gridRef.current;
    const contentArea = contentAreaRef.current;

    // Calculate initial position based on origin section for smooth transition
    let initialY = '100vh'; // Default: start from bottom
    let initialScale = 0.95;
    let initialBorderRadius = '0px';
    let initialOpacity = 0;

    if (originSection) {
      // Start from the clicked section's position for seamless transition
      const viewportHeight = window.innerHeight;
      const sectionCenterY = originSection.y + (originSection.height / 2);
      
      // Start the gallery sheet from slightly below the clicked section
      // This creates a smooth upward slide effect
      initialY = `${Math.max(0, sectionCenterY + 100)}px`;
      initialScale = 0.1; // Start very small to create expansion effect
      initialBorderRadius = '20px'; // Start with rounding for modern feel
      initialOpacity = 0.8; // Start semi-transparent
    }

    // Set initial state for slide-up sheet
    gsap.set(sheet, { 
      y: initialY,
      scale: initialScale,
      opacity: initialOpacity || 1,
      borderRadius: initialBorderRadius,
      transformOrigin: originSection ? 'center center' : 'center center',
      willChange: 'transform, opacity',
    });
    
    gsap.set(header, { y: -40, opacity: 0, scale: 0.95 });
    gsap.set([searchInput, filters], { y: 30, opacity: 0, scale: 0.9 });
    
    if (grid) {
      const gridItems = grid.querySelectorAll('.gallery-item');
      gsap.set(gridItems, { 
        y: 60, 
        opacity: 0, 
        scale: 0.85, 
        rotation: 2,
        transformOrigin: 'center center'
      });
    }

    // Create master slide-up sheet entrance timeline (faster)
    const masterTl = gsap.timeline({
      delay: 0.05, // Faster start
      onComplete: () => {
        setIsInitialized(true);
        // Enable scroll only within the gallery content area
        if (contentArea) {
          contentArea.style.overflowY = 'auto';
        }
      }
    });

    if (originSection) {
      // Smooth animation from clicked section with natural physics
      masterTl
        // Phase 1: Quick fade in and initial scale up
        .to(sheet, {
          opacity: 1,
          scale: 0.4,
          y: window.innerHeight * 0.3,
          borderRadius: '16px',
          duration: 0.2,
          ease: 'power2.out'
        })
        // Phase 2: Continue scaling and sliding to final position  
        .to(sheet, {
          y: 0,
          scale: 1,
          borderRadius: '24px 24px 0 0',
          duration: 0.6,
          ease: 'elastic.out(0.8, 0.6)' // Natural spring feel
        })
        // Phase 3: Header animation
        .to(header, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.3)'
        }, "-=0.4")
        // Phase 4: Search and filters
        .to([searchInput, filters], {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.08
        }, "-=0.3");
    } else {
      // Default animation from bottom
      masterTl
        .to(sheet, {
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out'
        })
        .to(sheet, {
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          duration: 0.5,
          ease: 'power2.out'
        }, "-=0.5")
        .to(header, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.3)'
        }, "-=0.3")
        .to([searchInput, filters], {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.08
        }, "-=0.2");
    }

    // Phase: Animate grid items with faster entrance
    if (grid) {
      const gridItems = grid.querySelectorAll('.gallery-item');
      
      masterTl.to(gridItems, {
        y: 0,
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.5,
        ease: 'back.out(1.2)',
        stagger: {
          amount: 0.8,
          from: 'start',
          ease: 'power2.inOut'
        }
      }, "-=0.1");

      // Subtle floating animation after entry (shorter)
      masterTl.to(gridItems, {
        y: (i) => Math.sin(i * 0.3) * 2,
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: {
          amount: 0.6,
          from: 'random'
        }
      }, "+=0.2");
    }

    return () => {
      masterTl.kill();
    };
  }, [isInitialized, originSection]);

  // Gallery-specific scroll animations (only after initialization)
  useEffect(() => {
    if (!isInitialized || !contentAreaRef.current) return;

    const ctx = gsap.context(() => {
      // Enhanced parallax effect for grid items within gallery scroll
      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.gallery-item');
        
        gridItems.forEach((item, index) => {
          const speed = 0.2 + (index % 4) * 0.05; // Subtle varying speeds
          const rotation = (index % 2 ? 1 : -1) * 1; // Slight rotation variance
          
          gsap.to(item, {
            y: () => -(contentAreaRef.current?.scrollTop || 0) * speed,
            rotation: rotation,
            scrollTrigger: {
              trigger: item,
              scroller: contentAreaRef.current, // Use gallery content area as scroller
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
              fastScrollEnd: true,
            }
          });

          // Enhanced hover animations
          const hoverTl = gsap.timeline({ paused: true });
          hoverTl.to(item, {
            scale: 1.05,
            rotationY: 10,
            z: 50,
            duration: 0.3,
            ease: 'power2.out'
          });

          item.addEventListener('mouseenter', () => hoverTl.play());
          item.addEventListener('mouseleave', () => hoverTl.reverse());
        });
      }

      // Description animation with gallery scroll
      if (descriptionRef.current) {
        gsap.fromTo(descriptionRef.current, 
          { opacity: 0, y: 60, scale: 0.95, rotationX: 10 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: descriptionRef.current,
              scroller: contentAreaRef.current, // Use gallery content area as scroller
              start: 'top 85%',
              end: 'bottom 60%',
              toggleActions: 'play none none reverse',
              fastScrollEnd: true,
            }
          }
        );
      }

    }, gallerySheetRef);

    return () => ctx.revert();
  }, [isInitialized, filteredImages]);

  // Enhanced slide-down exit animation (faster)
  const handleClose = () => {
    const sheet = gallerySheetRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;
    const searchInput = searchInputRef.current;
    const filters = filtersRef.current;

    if (!sheet) {
      onClose();
      return;
    }

    // Disable gallery scroll during exit
    if (contentAreaRef.current) {
      contentAreaRef.current.style.overflowY = 'hidden';
    }

    // Create coordinated slide-down exit animation (faster)
    const exitTl = gsap.timeline({
      onComplete: () => {
        onClose();
      }
    });

    // Phase 1: Animate grid items out with reverse stagger (faster)
    if (grid) {
      const gridItems = grid.querySelectorAll('.gallery-item');
      exitTl.to(gridItems, {
        y: 40,
        opacity: 0,
        scale: 0.9,
        rotation: -2,
        duration: 0.25,
        ease: 'power2.in',
        stagger: {
          amount: 0.2,
          from: 'end',
          ease: 'power1.in'
        }
      });
    }

    // Phase 2: Animate search and filters out (faster)
    exitTl.to([searchInput, filters], {
      y: 30,
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in',
      stagger: 0.05
    }, "-=0.15");

    // Phase 3: Animate header out (faster)
    exitTl.to(header, {
      y: -40,
      opacity: 0,
      scale: 0.95,
      duration: 0.25,
      ease: 'power2.in'
    }, "-=0.1");

    // Phase 4: Smooth exit animation back towards origin or off-screen
    if (originSection) {
      // Exit back towards the origin section with natural physics
      exitTl
        .to(sheet, {
          borderRadius: '20px',
          scale: 0.6,
          duration: 0.3,
          ease: 'power2.in'
        }, "-=0.2")
        .to(sheet, {
          y: `${Math.min(window.innerHeight, originSection.y + 200)}px`,
          scale: 0.1,
          opacity: 0.5,
          duration: 0.4,
          ease: 'power3.in'
        })
        .to(sheet, {
          opacity: 0,
          duration: 0.1,
          ease: 'power2.in'
        }, "-=0.1");
    } else {
      // Default smooth exit to bottom
      exitTl
        .to(sheet, {
          borderRadius: '0px',
          scale: 0.95,
          duration: 0.25,
          ease: 'power2.in'
        }, "-=0.2")
        .to(sheet, {
          y: '100vh',
          opacity: 0.8,
          duration: 0.4,
          ease: 'power3.in'
        })
        .to(sheet, {
          opacity: 0,
          duration: 0.1,
          ease: 'power2.in'
        }, "-=0.1");
    }
  };

  const openFullscreen = (imageUrl: string, imageAlt: string) => {
    setFullscreenImage({ isOpen: true, url: imageUrl, alt: imageAlt });
  };

  const closeFullscreen = () => {
    setFullscreenImage(prev => ({ ...prev, isOpen: false }));
  };

  const gridConfig = GRID_CONFIGS[filters.gridSize];

  return (
    <>
      {/* Slide-up Sheet Container */}
      <div
        ref={gallerySheetRef}
        className="fixed inset-0 z-50 bg-black"
        style={{ 
          transform: 'translateY(100vh)',
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Gallery Content Area with Independent Scroll */}
        <div
          ref={contentAreaRef}
          className="h-full overflow-hidden"
          style={{ overflowY: 'hidden' }} // Initially hidden, enabled after animation
        >
          {/* Header */}
          <div
            ref={headerRef}
            className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10"
          >
            <div className="max-w-7xl mx-auto p-6">
              {/* Top row with title and close */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleClose}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                    aria-label="Close gallery"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:-translate-x-1 transition-transform duration-200">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white">
                      {theme.title}
                    </h1>
                    <p className="text-white/60 text-sm">
                      {themeIndex + 1} of {totalThemes} • {filteredImages.length} images
                    </p>
                  </div>
                </div>

                {/* Navigation breadcrumb */}
                <div className="hidden md:flex items-center gap-2 text-white/60 text-sm">
                  <span>Timeline</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                  <span className="text-white">{theme.title}</span>
                </div>
              </div>

              {/* Search and filters */}
              <div ref={filtersRef} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 pl-12 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
                  />
                  <svg 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" 
                    xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>

                {/* Category filter */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as FilterOptions['category'] }))}
                  className="bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                >
                  <option value="all" className="bg-gray-800">All Images</option>
                  <option value="spread" className="bg-gray-800">Spread Images</option>
                  <option value="bottom" className="bg-gray-800">Gallery Images</option>
                </select>

                {/* Sort and grid controls */}
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  >
                    <option value="default" className="bg-gray-800">Default</option>
                    <option value="name" className="bg-gray-800">A-Z</option>
                    <option value="recent" className="bg-gray-800">Recent</option>
                  </select>

                  <div className="flex bg-white/10 rounded-xl border border-white/20 p-1">
                    {(['compact', 'comfortable', 'spacious'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFilters(prev => ({ ...prev, gridSize: size }))}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          filters.gridSize === size
                            ? 'bg-white/20 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                        title={`${size} grid`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          {size === 'compact' && (
                            <>
                              <rect x="3" y="3" width="7" height="7" rx="1"/>
                              <rect x="14" y="3" width="7" height="7" rx="1"/>
                              <rect x="3" y="14" width="7" height="7" rx="1"/>
                              <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </>
                          )}
                          {size === 'comfortable' && (
                            <>
                              <rect x="3" y="3" width="8" height="8" rx="1"/>
                              <rect x="13" y="3" width="8" height="8" rx="1"/>
                              <rect x="3" y="13" width="8" height="8" rx="1"/>
                              <rect x="13" y="13" width="8" height="8" rx="1"/>
                            </>
                          )}
                          {size === 'spacious' && (
                            <>
                              <rect x="3" y="3" width="18" height="8" rx="1"/>
                              <rect x="3" y="13" width="18" height="8" rx="1"/>
                            </>
                          )}
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Content */}
          <div className="max-w-7xl mx-auto p-6 pt-12">
            {filteredImages.length > 0 ? (
              <div
                ref={gridRef}
                className={`grid ${gridConfig.columns} ${gridConfig.gap} auto-rows-max`}
              >
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    data-source-key={image.sourceKey}
                    className={`gallery-item ${gridConfig.aspectRatio} group relative overflow-hidden rounded-xl bg-white/5 cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20`}
                    onClick={() => openFullscreen(
                      image.src.startsWith('/') ? image.src : `/${image.src}`,
                      image.alt
                    )}
                    style={{ 
                      opacity: 0,
                      transformStyle: 'preserve-3d',
                      perspective: 1000 
                    }}
                  >
                    <img
                      src={image.src.startsWith('/') ? image.src : `/${image.src}`}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Enhanced overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-sm font-medium truncate mb-1">
                          {image.alt}
                        </p>
                        <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs text-white/80 capitalize">
                          {image.category}
                        </span>
                      </div>
                    </div>

                    {/* Enhanced zoom icon */}
                    <div className="absolute top-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No images found</h3>
                <p className="text-white/60 mb-6 max-w-md">
                  {searchTerm 
                    ? `No images match "${searchTerm}" in the ${filters.category === 'all' ? 'gallery' : filters.category + ' category'}`
                    : `No images available in the ${filters.category} category`
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters(prev => ({ ...prev, category: 'all' }));
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200 text-white font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Enhanced theme description */}
            {theme.description && filteredImages.length > 0 && (
              <div ref={descriptionRef} className="mt-24 text-center" style={{ opacity: 0 }}>
                <div className="max-w-3xl mx-auto p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 transform transition-all duration-300 hover:scale-105 hover:bg-white/8">
                  <h3 className="text-2xl font-bold text-white mb-4">About {theme.title}</h3>
                  <p className="text-lg text-white/80 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom spacer */}
            <div className="h-32"></div>
          </div>
        </div>
      </div>

      <FullscreenViewer
        isOpen={fullscreenImage.isOpen}
        imageUrl={fullscreenImage.url}
        altText={fullscreenImage.alt}
        onClose={closeFullscreen}
      />
    </>
  );
};

export default GalleryView;
