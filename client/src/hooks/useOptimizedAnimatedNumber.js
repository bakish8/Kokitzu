import { useState, useEffect } from "react";

const useOptimizedAnimatedNumber = (value, duration = 600) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const initial = display;
    const delta = value - initial;

    if (delta === 0) return;

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setDisplay(initial + delta * easeOutCubic);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => raf && cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
};

export default useOptimizedAnimatedNumber;
