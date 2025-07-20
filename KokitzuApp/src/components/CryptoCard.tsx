import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CryptoPrice } from "../types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

interface CryptoCardProps {
  crypto: CryptoPrice;
  onPress?: () => void;
  onTradeUp?: (crypto: CryptoPrice) => void;
  onTradeDown?: (crypto: CryptoPrice) => void;
  index?: number;
}

const CryptoCard: React.FC<CryptoCardProps> = ({
  crypto,
  onPress,
  onTradeUp,
  onTradeDown,
  index = 0,
}) => {
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const shadowOpacity = useSharedValue(0.1);
  const hoverScale = useSharedValue(1);
  const hoverTranslateY = useSharedValue(0);

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
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cryptoInfo}>
            <Text style={styles.cryptoName}>{crypto.name}</Text>
            <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(crypto.price)}</Text>
            <View
              style={[
                styles.changeContainer,
                isPositive ? styles.positive : styles.negative,
              ]}
            >
              <MaterialCommunityIcons
                name={isPositive ? "trending-up" : "trending-down"}
                size={16}
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
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerRow}>
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(crypto.lastUpdated).toLocaleTimeString()}
            </Text>
            <View style={styles.tradeButtonsContainer}>
              <TouchableOpacity
                style={styles.tradeUpButton}
                onPress={() => onTradeUp?.(crypto)}
              >
                <MaterialCommunityIcons
                  name="trending-up"
                  size={16}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tradeDownButton}
                onPress={() => onTradeDown?.(crypto)}
              >
                <MaterialCommunityIcons
                  name="trending-down"
                  size={16}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  cryptoSymbol: {
    fontSize: 14,
    color: "#666666",
    textTransform: "uppercase",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  negative: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  positiveText: {
    color: "#10b981",
  },
  negativeText: {
    color: "#ef4444",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#666666",
  },
  tradeButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tradeUpButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeDownButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CryptoCard;
