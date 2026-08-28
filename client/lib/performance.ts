// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`${name}-start`);
    }
    this.metrics.set(`${name}-start`, Date.now());
  }

  // Mark the end of a performance measurement and calculate duration
  measure(name: string): number {
    const startTime = this.metrics.get(`${name}-start`);
    if (!startTime) {
      console.warn(`No start mark found for ${name}`);
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (
      typeof performance !== "undefined" &&
      performance.mark &&
      performance.measure
    ) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    this.metrics.set(name, duration);

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`);
    }

    return duration;
  }

  // Get all collected metrics
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.forEach((value, key) => {
      if (!key.endsWith("-start")) {
        result[key] = value;
      }
    });
    return result;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    if (typeof performance !== "undefined" && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  // Monitor component render time
  static withRenderTime<T extends (...args: any[]) => any>(
    componentName: string,
    component: T,
  ): T {
    return ((...args: any[]) => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.mark(`render-${componentName}`);

      try {
        const result = component(...args);
        monitor.measure(`render-${componentName}`);
        return result;
      } catch (error) {
        monitor.measure(`render-${componentName}`);
        throw error;
      }
    }) as T;
  }
}

// React performance hooks
export function usePerformanceMonitor(name: string) {
  const monitor = PerformanceMonitor.getInstance();

  return {
    start: () => monitor.mark(name),
    end: () => monitor.measure(name),
    getMetrics: () => monitor.getMetrics(),
  };
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy loading utility for images
export function lazyLoadImage(
  src: string,
  placeholder?: string,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    // Use placeholder while loading
    if (placeholder) {
      img.src = placeholder;
    }

    // Load actual image
    img.src = src;
  });
}

// Memory usage monitoring
export function getMemoryUsage(): MemoryInfo | null {
  if (typeof performance !== "undefined" && "memory" in performance) {
    return (performance as any).memory;
  }
  return null;
}

// Web Vitals monitoring
export function measureWebVitals(): void {
  if (typeof window === "undefined") return;

  // Measure First Contentful Paint
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          entry.entryType === "paint" &&
          entry.name === "first-contentful-paint"
        ) {
          console.log("FCP:", entry.startTime);
        }
        if (entry.entryType === "largest-contentful-paint") {
          console.log("LCP:", entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ["paint", "largest-contentful-paint"] });
  }

  // Measure Cumulative Layout Shift
  let clsValue = 0;
  let clsEntries: any[] = [];

  if ("PerformanceObserver" in window) {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
    });

    clsObserver.observe({ entryTypes: ["layout-shift"] });
  }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV !== "development") return;

  // Monitor bundle size in development
  if (typeof window !== "undefined" && "performance" in window) {
    window.addEventListener("load", () => {
      const resources = performance.getEntriesByType("resource");
      const jsResources = resources.filter(
        (resource) =>
          resource.name.includes(".js") &&
          !resource.name.includes("node_modules"),
      );

      console.group("Bundle Analysis");
      jsResources.forEach((resource) => {
        const size = (resource as any).transferSize;
        if (size) {
          console.log(`${resource.name}: ${(size / 1024).toFixed(2)} KB`);
        }
      });
      console.groupEnd();
    });
  }
}

export default PerformanceMonitor;
