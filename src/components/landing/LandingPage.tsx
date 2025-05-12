import React, { useRef, useState } from "react";
import type { Picture } from "vite-imagetools";
import Intro from "./Intro";
import Hero from "./Hero";

// Define types for props
interface LandingPageProps {
  themes: Record<string, (string | Picture)[]>;
  assetUrls: (string | Picture)[];
  allImages?: (string | Picture)[];
}

const LandingPage: React.FC<LandingPageProps> = ({
  themes,
  assetUrls,
  allImages,
}) => {
  // Shared state
  const [introComplete, setIntroComplete] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<string>(
    Object.keys(themes)[0],
  );
  
  // Shared refs
  const mainRef = useRef<HTMLDivElement>(null);
  const navLogoRef = useRef<SVGSVGElement>(null);
  
  // Use allImages for intro if provided, otherwise fall back to assetUrls
  const introImages = allImages || assetUrls;

  return (
    <div className="min-h-screen text-white bg-black">
      {/* Intro Component */}
      <Intro
        introImages={introImages}
        introComplete={introComplete}
        setIntroComplete={setIntroComplete}
        mainRef={mainRef}
        navLogoRef={navLogoRef}
      />

      {/* Hero Component */}
      <Hero
        themes={themes}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        navLogoRef={navLogoRef}
        introComplete={introComplete}
      />
    </div>
  );
};

export default LandingPage;