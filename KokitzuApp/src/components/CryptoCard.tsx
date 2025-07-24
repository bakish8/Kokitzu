import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CryptoPrice } from "../types";
import { TIMEFRAMES } from "../constants/timeframes";
import PriceChart from "./PriceChart";
import priceDataService from "../services/priceDataService";
import { FONTS } from "../constants/fonts";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import COLORS from "../constants/colors";

interface CryptoCardProps {
  crypto: CryptoPrice;
  onPress?: () => void;
  onTradeUp?: (crypto: CryptoPrice, timeframe: string) => void;
  onTradeDown?: (crypto: CryptoPrice, timeframe: string) => void;
  index?: number;
  selectedTimeframe?: string;
}

const CryptoCard: React.FC<CryptoCardProps> = ({
  crypto,
  onPress,
  index = 0,
  selectedTimeframe: propSelectedTimeframe = "ONE_HOUR",
}) => {
  const [selectedTimeframe] = useState(propSelectedTimeframe);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const shadowOpacity = useSharedValue(0.1);
  const hoverScale = useSharedValue(1);
  const hoverTranslateY = useSharedValue(0);
  // Add a pressed state for the Bet button
  const [betButtonPressed, setBetButtonPressed] = useState(false);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * hoverScale.value },
      { translateY: translateY.value + hoverTranslateY.value },
    ],
    opacity: opacity.value,
    shadowOpacity: shadowOpacity.value,
  }));

  // Entrance animation
  useEffect(() => {
    const delay = index * 100;
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 150 })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 150 })
    );
  }, []);

  // Fetch price history for chart
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (crypto.symbol) {
        setIsLoadingChart(true);
        try {
          // Use the selected timeframe for the chart
          const data = await priceDataService.getPriceHistory(
            crypto.symbol,
            selectedTimeframe
          );
          setPriceHistory(data);
        } catch (error) {
          console.error("Error fetching price history:", error);
        } finally {
          setIsLoadingChart(false);
        }
      }
    };

    fetchPriceHistory();
  }, [crypto.symbol, selectedTimeframe]);

  const handlePressIn = () => {
    hoverScale.value = withSpring(1.02, { damping: 15, stiffness: 150 });
    hoverTranslateY.value = withSpring(-2, { damping: 15, stiffness: 150 });
    shadowOpacity.value = withTiming(0.3, { duration: 200 });
  };

  const handlePressOut = () => {
    hoverScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    hoverTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    shadowOpacity.value = withTiming(0.1, { duration: 200 });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(2)}%`;
  };

  // Use real price change data if available, otherwise show 0%
  const priceChange = crypto.priceChange || 0;
  const isPositive = priceChange >= 0;

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <View
        style={styles.card}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
      >
        <View style={styles.cardHeaderCompact}>
          <Text style={styles.cryptoSymbolCompact}>{crypto.symbol}</Text>
        </View>
        <View style={styles.priceContainerCompact}>
          <Text style={styles.priceCompact}>{formatPrice(crypto.price)}</Text>
          <View
            style={[
              styles.changeContainer,
              isPositive ? styles.positive : styles.negative,
            ]}
          >
            <MaterialCommunityIcons
              name={isPositive ? "trending-up" : "trending-down"}
              size={14}
              color={isPositive ? "#10b981" : "#ef4444"}
            />
            <Text
              style={[
                styles.changeText,
                isPositive ? styles.positiveText : styles.negativeText,
              ]}
            >
              {formatPercentage(priceChange)}
            </Text>
          </View>
        </View>
        {/* Mini Price Chart */}
        <View style={styles.chartContainerCompact}>
          <PriceChart
            data={priceHistory}
            color={isPositive ? "#10b981" : "#ef4444"}
            height={28}
            isMini={true}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.betButton,
            betButtonPressed && styles.betButtonPressed,
          ]}
          onPress={onPress}
          activeOpacity={0.85}
          onPressIn={() => setBetButtonPressed(true)}
          onPressOut={() => setBetButtonPressed(false)}
        >
          <Text style={styles.betButtonText}>Bet</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card2,
    borderRadius: 14,
    padding: 12,
    marginBottom: 0,
    shadowColor: COLORS.cardGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 120,
    minHeight: 120,
    alignItems: "center",
  },
  cardHeaderCompact: {
    alignItems: "center",
    marginBottom: 4,
  },
  cryptoSymbolCompact: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceContainerCompact: {
    alignItems: "center",
    marginBottom: 2,
  },
  priceCompact: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    marginBottom: 2,
  },
  chartContainerCompact: {
    marginTop: 2,
    marginBottom: 8,
    alignItems: "center",
    width: "100%",
  },
  betButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  betButtonText: {
    color: COLORS.accent,
    fontSize: 22,
    fontFamily: FONTS.BOLD,
    letterSpacing: 1,
    textAlign: "center",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  positive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  negative: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  changeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: FONTS.SEMI_BOLD,
    marginLeft: 3,
  },
  positiveText: {
    color: "#10b981",
  },
  negativeText: {
    color: "#ef4444",
  },
  // Add a pressed state for the Bet button
  betButtonPressed: {
    transform: [{ scale: 1.06 }, { translateY: -2 }],
    shadowOpacity: 0.4,
    shadowRadius: 18,
  },
});

export default CryptoCard;
