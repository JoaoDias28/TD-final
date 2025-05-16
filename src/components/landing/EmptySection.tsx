import React from "react";
import type { ReactNode } from "react";
interface EmptySectionProps {
  bgColor?: string;
  height?: string;
  id?: string;
  className?: string;
  children?: ReactNode;
  paddingTop?: string;
  paddingBottom?: string;
  withMarqueeSpace?: boolean;
  zIndex?: number;
}

const EmptySection: React.FC<EmptySectionProps> = ({
  bgColor = "bg-[#181818]",
  height = "h-screen",
  id = "next-section",
  className = "",
  children,
  paddingTop = "pt-24",
  paddingBottom = "pb-32",
  withMarqueeSpace = true,
  zIndex = 10,
}) => {
  // Determine if we need to use flex-col based on className
  const hasFlexCol = className.includes("flex-col");

  return (
    <section
      id={id}
      className={`${height} ${bgColor} w-full flex items-center justify-center ${className} ${withMarqueeSpace ? `${paddingTop} ${paddingBottom}` : ""}`}
      style={{ 
        display: "flex",
        position: "relative",
        zIndex: zIndex,
        transform: "translateZ(0)" // Hardware acceleration for smoother rendering
      }}
    >
      <div
        className={`${hasFlexCol ? "flex flex-col items-center" : ""} w-full max-w-7xl px-4`}
      >
        {children}
      </div>
    </section>
  );
};

export default EmptySection;
