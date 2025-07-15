import React, { useState } from "react";
// If using Tailwind's dark mode, you can use 'useTheme' from a context or just rely on the 'dark' class on <body>

const bgUrl = process.env.PUBLIC_URL + "/backgroundImage.png";

const KokitzuBackground = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Background image layer */}
      <div
        className={`fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat bg-fixed transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url('${bgUrl}')`,
          backgroundColor: "#0f0f1c", // fallback for dark
        }}
        aria-hidden="true"
      >
        {/* Preload image for fade-in */}
        <img
          src={bgUrl}
          alt="Kokitzu background"
          className="hidden"
          onLoad={() => setLoaded(true)}
        />
      </div>
      {/* Overlay for theme and mobile legibility */}
      <div
        className={
          `fixed inset-0 z-0 pointer-events-none transition-colors duration-700 ` +
          // Tailwind dark mode overlay
          "dark:bg-black/50 bg-white/50" +
          // Fallback for very small/low-perf devices
          " sm:bg-transparent sm:dark:bg-transparent" +
          // Mobile: blur and darken overlay
          " sm:backdrop-blur-none backdrop-blur-md" +
          " sm:backdrop-brightness-100 backdrop-brightness-75"
        }
        style={{
          backgroundColor: undefined,
        }}
        aria-hidden="true"
      />
      {/* Fallback solid color for very small screens or no image support */}
      <div
        className="fixed inset-0 z-[-2] bg-[#0f0f1c] dark:bg-[#0f0f1c] bg-[#f7f8fa] dark:bg-[#0f0f1c] sm:hidden"
        aria-hidden="true"
      />
    </>
  );
};

export default KokitzuBackground;
