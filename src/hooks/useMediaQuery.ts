// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

const useMediaQuery = (query: string): boolean => {
  const getMatches = (q: string): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(q).matches;
    }
    return false; // Default for SSR or if window is not available
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    
    const handleChange = () => {
      setMatches(getMatches(query));
    };

    // Call handler once at mount to ensure state is correct
    handleChange();

    try {
      // Preferred method
      mediaQueryList.addEventListener('change', handleChange);
    } catch (e) {
      // Fallback for older browsers (e.g., Safari < 14)
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      try {
        mediaQueryList.removeEventListener('change', handleChange);
      } catch (e) {
        // Fallback for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]); // Only re-run effect if query string changes

  return matches;
};

export default useMediaQuery;