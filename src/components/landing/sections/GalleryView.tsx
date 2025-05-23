// components/GalleryView.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGalleryTimeline } from '../../../hooks/useGalleryTimeline';
import type { ThemePanel, FilterOptions, GalleryImage } from '../../../types/types';
import FullscreenViewer from '../../helper/FullscreenViewer';

interface GalleryViewProps {
  theme: ThemePanel;
  themeIndex: number;
  totalThemes: number;
  onClose: () => void;
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
}) => {
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  
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

  // Set up scroll-triggered animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { 
            y: -100, 
            opacity: 0 
          },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 90%',
              end: 'bottom 60%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Grid items staggered animation
      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.gallery-item');
        
        gsap.fromTo(
          gridItems,
          {
            y: 80,
            opacity: 0,
            scale: 0.8,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: {
              amount: 1.2,
              grid: 'auto',
              from: 'start'
            },
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Description animation
      if (descriptionRef.current) {
        gsap.fromTo(
          descriptionRef.current,
          {
            y: 60,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: descriptionRef.current,
              start: 'top 80%',
              end: 'bottom 60%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }

      // Parallax effect for grid items on scroll
      if (gridRef.current) {
        const gridItems = gridRef.current.querySelectorAll('.gallery-item');
        
        gridItems.forEach((item, index) => {
          const speed = 0.5 + (index % 3) * 0.2; // Varying speeds
          
          gsap.to(item, {
            y: () => -ScrollTrigger.maxScroll(window) * speed * 0.1,
            ease: 'none',
            scrollTrigger: {
              trigger: item,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            }
          });
        });
      }

    }, galleryContainerRef);

    return () => ctx.revert();
  }, [filteredImages]); // Re-run when filtered images change

  const openFullscreen = (imageUrl: string, imageAlt: string) => {
    setFullscreenImage({ isOpen: true, url: imageUrl, alt: imageAlt });
  };

  const closeFullscreen = () => {
    setFullscreenImage(prev => ({ ...prev, isOpen: false }));
  };

  const gridConfig = GRID_CONFIGS[filters.gridSize];

  return (
    <>
      <div
        ref={galleryContainerRef}
        className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black relative"
      >
        {/* Header */}
        <div
          ref={headerRef}
          className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10"
          style={{ opacity: 0 }}
        >
          <div className="max-w-7xl mx-auto p-6">
            {/* Top row with title and close */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
                  aria-label="Back to timeline"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <input
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
              {filteredImages.map((image, idx) => (
                <div
                  key={image.id}
                  data-source-key={image.sourceKey}
                  className={`gallery-item ${gridConfig.aspectRatio} group relative overflow-hidden rounded-xl bg-white/5 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20`}
                  onClick={() => openFullscreen(
                    image.src.startsWith('/') ? image.src : `/${image.src}`,
                    image.alt
                  )}
                  style={{ opacity: 0 }}
                >
                  <img
                    src={image.src.startsWith('/') ? image.src : `/${image.src}`}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm font-medium truncate mb-1">
                        {image.alt}
                      </p>
                      <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs text-white/80 capitalize">
                        {image.category}
                      </span>
                    </div>
                  </div>

                  {/* Zoom icon */}
                  <div className="absolute top-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

          {/* Theme Description */}
          {theme.description && filteredImages.length > 0 && (
            <div ref={descriptionRef} className="mt-24 text-center" style={{ opacity: 0 }}>
              <div className="max-w-3xl mx-auto p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
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
