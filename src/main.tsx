import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import './global.css';

const lenis = new Lenis();

const raf = (time: number) => {
  lenis.raf(time);
  gsap.ticker.tick(); // keep GSAP in sync
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
