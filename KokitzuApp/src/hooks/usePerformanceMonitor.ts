import { useEffect } from "react";

const usePerformanceMonitor = () => {
  useEffect(() => {
    if (__DEV__) {
      // In development, we can log performance metrics
      const startTime = Date.now();

      const logPerformance = () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`App startup time: ${duration}ms`);
      };

      // Log initial load time
      setTimeout(logPerformance, 100);

      // Monitor memory usage (if available)
      if (global.performance && (global.performance as any).memory) {
        setInterval(() => {
          const memory = (global.performance as any).memory;
          console.log(
            `Memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`
          );
        }, 30000);
      }
    }
  }, []);
};

export default usePerformanceMonitor;
