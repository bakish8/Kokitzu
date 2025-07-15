import { useEffect } from "react";

const usePerformanceMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "measure") {
            console.log(`${entry.name}: ${entry.duration}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ["measure"] });
      return () => observer.disconnect();
    }
  }, []);
};

export default usePerformanceMonitor;
