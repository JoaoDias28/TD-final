/*eslint no-constant-condition: "error"*/
import React from "react";
import type { Picture } from "vite-imagetools";
import LandingPage from "./landing/LandingPage";

// Define types for props
interface LandingPageProps {
  themes: Record<string, (string | Picture)[]>;
  assetUrls: (string | Picture)[];
  allImages?: (string | Picture)[];
}

// Wrapper component that re-exports our modular LandingPage
const LandingPageWrapper: React.FC<LandingPageProps> = (props) => {
  return <LandingPage {...props} />;
};

export default LandingPageWrapper;