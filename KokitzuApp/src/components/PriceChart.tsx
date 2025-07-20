import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Line, Circle } from "react-native-svg";

interface PriceChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  isMini?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  color = "#3b82f6",
  height = 120,
  width,
  isMini = false,
}) => {
  const [pathData, setPathData] = useState<string>("");
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = width || (isMini ? screenWidth * 0.3 : screenWidth * 0.8);
  const chartHeight = height;
  const padding = isMini ? 5 : 20;

  useEffect(() => {
    if (data && data.length > 0) {
      const minPrice = Math.min(...data);
      const maxPrice = Math.max(...data);
      const priceRange = maxPrice - minPrice || 1;

      const points = data.map((price, index) => {
        const x =
          padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
        const y =
          chartHeight -
          padding -
          ((price - minPrice) / priceRange) * (chartHeight - 2 * padding);
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
  }, [data, chartWidth, chartHeight, padding]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height, width: chartWidth }]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, width: chartWidth }]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Path
          d={pathData}
          stroke={color}
          strokeWidth={isMini ? 1.5 : 2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {!isMini && data.length > 0 && (
          <Circle
            cx={
              padding +
              ((data.length - 1) / (data.length - 1)) *
                (chartWidth - 2 * padding)
            }
            cy={
              chartHeight -
              padding -
              ((data[data.length - 1] - Math.min(...data)) /
                (Math.max(...data) - Math.min(...data) || 1)) *
                (chartHeight - 2 * padding)
            }
            r={3}
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
  },
});

export default PriceChart;
