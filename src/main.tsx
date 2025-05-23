import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import './global.css';

// Create Lenis with optimized settings for smoother scrolling
const lenis = new Lenis({
  duration: 1.2, // Slightly increased for smoother scroll
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1.0, // Default value for consistent speed
  touchMultiplier: 2.0, // Increased for touch devices
  infinite: false
});

// Optimize the render loop to prevent frame drops
const raf = (time: number) => {
  lenis.raf(time);
  gsap.ticker.tick(); // Keep GSAP in sync with Lenis
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
