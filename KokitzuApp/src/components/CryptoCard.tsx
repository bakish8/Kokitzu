import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CryptoPrice } from "../types";

interface CryptoCardProps {
  crypto: CryptoPrice;
  onPress?: () => void;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ crypto, onPress }) => {
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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
          <TouchableOpacity style={styles.tradeButton} onPress={onPress}>
            <Text style={styles.tradeButtonText}>Trade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  tradeButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tradeButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CryptoCard;
