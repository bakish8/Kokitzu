import React, { useEffect, useState } from "react";

const PriceChart = ({
  data,
  color = "#3b82f6",
  height = 120,
  width,
  isMini = false,
}) => {
  const [pathData, setPathData] = useState("");
  const [chartWidth, setChartWidth] = useState(width || 400);

  useEffect(() => {
    // Set chart width based on container or default
    if (width) {
      setChartWidth(width);
    } else {
      // Default width for different chart types
      setChartWidth(isMini ? 120 : 400);
    }
  }, [width, isMini]);

  useEffect(() => {
    if (data && data.length > 0) {
      const minPrice = Math.min(...data);
      const maxPrice = Math.max(...data);
      const priceRange = maxPrice - minPrice || 1;

      const padding = isMini ? 5 : 20;

      const points = data.map((price, index) => {
        const x =
          padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
        const y =
          height -
          padding -
          ((price - minPrice) / priceRange) * (height - 2 * padding);
        return { x, y };
      });

      if (points.length > 1) {
        const path = points
          .map((point, index) => {
            if (index === 0) {
              return `M ${point.x} ${point.y}`;
            }
            return `L ${point.x} ${point.y}`;
          })
          .join(" ");
        setPathData(path);
      }
    }
  }, [data, chartWidth, height, isMini]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          width: chartWidth,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 4,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        width: chartWidth,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={chartWidth} height={height}>
        <path
          d={pathData}
          stroke={color}
          strokeWidth={isMini ? 1.5 : 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {!isMini && data.length > 0 && (
          <circle
            cx={
              (isMini ? 5 : 20) +
              ((data.length - 1) / (data.length - 1)) *
                (chartWidth - 2 * (isMini ? 5 : 20))
            }
            cy={
              height -
              (isMini ? 5 : 20) -
              ((data[data.length - 1] - Math.min(...data)) /
                (Math.max(...data) - Math.min(...data) || 1)) *
                (height - 2 * (isMini ? 5 : 20))
            }
            r={3}
            fill={color}
          />
        )}
      </svg>
    </div>
  );
};

export default PriceChart;
