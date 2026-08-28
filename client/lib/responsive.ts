import React, { useState, useEffect } from "react";

// Responsive design utilities and helpers
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Media query hooks
export function useMediaQuery(query: string): boolean {
  if (typeof window === "undefined") return false;

  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

// Breakpoint hooks
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}

export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints.md}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

// Screen size detection
export function getScreenSize(): Breakpoint {
  if (typeof window === "undefined") return "lg";

  const width = window.innerWidth;

  if (width >= breakpoints["2xl"]) return "2xl";
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "xs";
}

// Responsive value utility
export function responsive<T>(
  values: Partial<Record<Breakpoint, T>>,
): T | undefined {
  const currentSize = getScreenSize();
  const orderedBreakpoints: Breakpoint[] = [
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
  ];

  // Find the appropriate value for current screen size
  for (let i = orderedBreakpoints.indexOf(currentSize); i >= 0; i--) {
    const bp = orderedBreakpoints[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
}

// Viewport utilities
export function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function isLandscape(): boolean {
  if (typeof window === "undefined") return true;
  return window.innerWidth > window.innerHeight;
}

export function isPortrait(): boolean {
  return !isLandscape();
}

// Touch device detection
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

// Device type detection
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;

  if (width < breakpoints.md) return "mobile";
  if (width < breakpoints.lg) return "tablet";
  return "desktop";
}

// Safe area utilities for mobile devices
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue("env(safe-area-inset-top)") || "0"),
    right: parseInt(
      style.getPropertyValue("env(safe-area-inset-right)") || "0",
    ),
    bottom: parseInt(
      style.getPropertyValue("env(safe-area-inset-bottom)") || "0",
    ),
    left: parseInt(style.getPropertyValue("env(safe-area-inset-left)") || "0"),
  };
}

// Responsive image utility
export function getResponsiveImageSrc(
  baseSrc: string,
  currentBreakpoint: Breakpoint,
): string {
  const sizeMap = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  const width = sizeMap[currentBreakpoint];

  // If baseSrc contains size parameters, replace them
  if (baseSrc.includes("w=") || baseSrc.includes("width=")) {
    return baseSrc.replace(/w=\d+|width=\d+/, `w=${width}`);
  }

  // Otherwise append size parameter
  const separator = baseSrc.includes("?") ? "&" : "?";
  return `${baseSrc}${separator}w=${width}`;
}

// Grid system utilities
export function getGridCols(breakpoint: Breakpoint): number {
  const colMap = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    "2xl": 6,
  };

  return colMap[breakpoint];
}

// Typography scale for responsive design
export function getFontSize(
  level: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
  breakpoint: Breakpoint,
): string {
  const scales = {
    xs: {
      xs: "0.75rem", // 12px
      sm: "0.75rem", // 12px
      base: "0.75rem", // 12px
      lg: "0.875rem", // 14px
      xl: "0.875rem", // 14px
      "2xl": "0.875rem", // 14px
      "3xl": "1rem", // 16px
      "4xl": "1.125rem", // 18px
    },
    sm: {
      xs: "0.875rem", // 14px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    md: {
      xs: "0.875rem", // 14px
      sm: "1rem", // 16px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    lg: {
      xs: "0.875rem", // 14px
      sm: "1rem", // 16px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "2rem", // 32px
      "4xl": "2.5rem", // 40px
    },
    xl: {
      xs: "0.875rem", // 14px
      sm: "1rem", // 16px
      base: "1.125rem", // 18px
      lg: "1.25rem", // 20px
      xl: "1.5rem", // 24px
      "2xl": "1.875rem", // 30px
      "3xl": "2.25rem", // 36px
      "4xl": "3rem", // 48px
    },
    "2xl": {
      xs: "1rem", // 16px
      sm: "1.125rem", // 18px
      base: "1.125rem", // 18px
      lg: "1.25rem", // 20px
      xl: "1.5rem", // 24px
      "2xl": "1.875rem", // 30px
      "3xl": "2.25rem", // 36px
      "4xl": "3rem", // 48px
    },
  };

  return scales[breakpoint][level];
}

// Responsive spacing utility
export function getSpacing(
  size: "xs" | "sm" | "md" | "lg" | "xl",
  breakpoint: Breakpoint,
): string {
  const spacingMap = {
    xs: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
    sm: {
      xs: "0.5rem",
      sm: "0.75rem",
      md: "1rem",
      lg: "1.25rem",
      xl: "1.5rem",
    },
    md: { xs: "0.75rem", sm: "1rem", md: "1.5rem", lg: "2rem", xl: "2.5rem" },
    lg: { xs: "1rem", sm: "1.5rem", md: "2rem", lg: "3rem", xl: "4rem" },
    xl: { xs: "1.5rem", sm: "2rem", md: "3rem", lg: "4rem", xl: "6rem" },
  };

  return spacingMap[size][breakpoint];
}

// Performance optimization for responsive components
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
): T | undefined {
  const [currentValue, setCurrentValue] = useState<T | undefined>(() =>
    responsive(values),
  );

  useEffect(() => {
    const handleResize = () => {
      setCurrentValue(responsive(values));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [values]);

  return currentValue;
}

// CSS-in-JS responsive utility
export function createResponsiveStyles(
  styles: Partial<Record<Breakpoint, React.CSSProperties>>,
): React.CSSProperties {
  const currentBreakpoint = getScreenSize();
  const orderedBreakpoints: Breakpoint[] = [
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
  ];

  let mergedStyles: React.CSSProperties = {};

  // Apply styles from smallest to current breakpoint
  for (const bp of orderedBreakpoints) {
    if (styles[bp]) {
      mergedStyles = { ...mergedStyles, ...styles[bp] };
    }
    if (bp === currentBreakpoint) break;
  }

  return mergedStyles;
}

export default {
  breakpoints,
  useMediaQuery,
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  getScreenSize,
  responsive,
  getViewportSize,
  isLandscape,
  isPortrait,
  isTouchDevice,
  getDeviceType,
  getSafeAreaInsets,
  getResponsiveImageSrc,
  getGridCols,
  getFontSize,
  getSpacing,
  useResponsiveValue,
  createResponsiveStyles,
};
