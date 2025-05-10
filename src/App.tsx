/* App.tsx ─ updated theme bucket using imagetools "picture" objects */
import { useRef } from 'react';
import { usePhase } from './store/intro-phase';
import Loader from './components/Loader';
import Intro from './components/Intro';
import Hero from './components/Hero';

import type { Picture } from 'vite-imagetools';

/* imagetools imports – single statement per asset */

// ──── Outdoors ────
import outdoor1Pic from './assets/intro/outdoors/outdoor1.png?format=webp;png&as=picture&sizes=auto';
import outdoor2Pic from './assets/intro/outdoors/outdoor2.png?format=webp;png&as=picture&sizes=auto';

// ──── Eventos ────
import seasidePalcoFrentePic from './assets/intro/eventos/seasidePalcoFrente.png?format=webp;png&as=picture&sizes=auto';
import seasidePalcoDireitoPic from './assets/intro/eventos/seasidePalcoLadoDireito.png?format=webp;png&as=picture&sizes=auto';
import seasidePalcoEsquerdoPic from './assets/intro/eventos/seasidePalcoLadoEsquerdo.png?format=webp;png&as=picture&sizes=auto';

import natalSabugal2021Pic1 from './assets/intro/eventos/natalSabugal2021_1.png?format=webp;png&as=picture&sizes=auto';
import natalSabugal2021Pic2 from './assets/intro/eventos/natalSabugal2021_2.png?format=webp;png&as=picture&sizes=auto';
import natalSabugal2021Pic3 from './assets/intro/eventos/natalSabugal2021_3.png?format=webp;png&as=picture&sizes=auto';
import natalSabugal2021Pic4 from './assets/intro/eventos/natalSabugal2021_4.png?format=webp;png&as=picture&sizes=auto';

// ──── Stands ────
import pampilhosaStand2019Pic from './assets/intro/stands/pampilhosaStand2019.png?format=webp;png&as=picture&sizes=auto';
import penamacorStand2019Pic from './assets/intro/stands/penamacor1.png?format=webp;png&as=picture&sizes=auto';

// ──── Decoração de espaços ────
import dockCabril1Pic from './assets/intro/decoracao_espacos/dockCabril1.png?format=webp;png&as=picture&sizes=auto';
import dockCabril2Pic from './assets/intro/decoracao_espacos/dockCabril2.png?format=webp;png&as=picture&sizes=auto';

// ──── Outros (Trabalhas não especificados) ────
import baloico_penaloboPic1 from './assets/intro/entre_outros/baloico_penalobo1.png?format=webp;png&as=picture&sizes=auto';
import baloico_penaloboPic2 from './assets/intro/entre_outros/baloico_penalobo2.png?format=webp;png&as=picture&sizes=auto';
/* 1 ️⃣ Theme buckets – add / reorder images freely */
const THEMES: Record<string, (string | Picture)[]> = {
  outdoor: [outdoor1Pic, outdoor2Pic],
  events: [seasidePalcoFrentePic,natalSabugal2021Pic1, seasidePalcoDireitoPic,natalSabugal2021Pic2, seasidePalcoEsquerdoPic,natalSabugal2021Pic3, natalSabugal2021Pic4],
  stands: [pampilhosaStand2019Pic, penamacorStand2019Pic],
  decoracao_espacos: [dockCabril1Pic, dockCabril2Pic],
  entre_outros: [baloico_penaloboPic1, baloico_penaloboPic2],
};

/* 2 ️⃣ Flat list for the Loader (union keeps TS happy) */
type PicOrURL = string | Picture;
const assetUrls: PicOrURL[] = Object.values(THEMES).flat();

export default function App() {
  const { phase } = usePhase();
  // Add ref to connect Loader and Intro components for the morphing transition
  const introContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#111] to-black app-bg" />

      {phase === 'loader' && (
        <Loader 
          assets={assetUrls} 
          introContainerRef={introContainerRef} 
        />
      )}
      
      {phase === 'intro' && (
        <Intro 
          themes={THEMES} 
          containerRef={introContainerRef}
          lifespan={3000} // 3 seconds
        />
      )}
      
      {phase === 'hero' && <Hero />}
    </>
  );
}