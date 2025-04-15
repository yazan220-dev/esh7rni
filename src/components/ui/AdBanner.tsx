"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdBannerProps {
  position: "top" | "sidebar" | "footer" | "content";
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function AdBanner({ position, size = "medium", className = "" }: AdBannerProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Only render on client side to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  // Determine dimensions based on position and size
  let width = "w-full";
  let height = "h-24";
  
  if (position === "sidebar") {
    width = "w-full";
    height = size === "small" ? "h-60" : size === "medium" ? "h-80" : "h-96";
  } else if (position === "content") {
    width = "w-full";
    height = size === "small" ? "h-16" : size === "medium" ? "h-24" : "h-32";
  } else if (position === "footer") {
    width = "w-full";
    height = "h-20";
  } else if (position === "top") {
    width = "w-full";
    height = "h-16";
  }
  
  return (
    <div 
      className={`bg-muted/50 rounded-lg flex items-center justify-center border border-border ${width} ${height} ${className}`}
      data-ad-position={position}
      data-ad-size={size}
    >
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Advertisement</p>
        <p className="text-xs text-muted-foreground/70">Adsterra Banner</p>
      </div>
    </div>
  );
}
