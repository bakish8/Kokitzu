import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

const SkeletonCryptoCard: React.FC = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cryptoInfo}>
          <Animated.View
            style={[styles.skeletonText, styles.cryptoName, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonText, styles.cryptoSymbol, { opacity }]}
          />
        </View>
        <View style={styles.priceContainer}>
          <Animated.View
            style={[styles.skeletonText, styles.price, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonText, styles.change, { opacity }]}
          />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Animated.View
          style={[styles.skeletonText, styles.lastUpdated, { opacity }]}
        />
      </View>
    </View>
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
    height: 20,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  cryptoSymbol: {
    height: 14,
    backgroundColor: "#333",
    borderRadius: 4,
    width: "40%",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    height: 24,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
    width: 100,
  },
  change: {
    height: 16,
    backgroundColor: "#333",
    borderRadius: 4,
    width: 60,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
  },
  lastUpdated: {
    height: 12,
    backgroundColor: "#333",
    borderRadius: 4,
    width: "60%",
  },
  skeletonText: {
    backgroundColor: "#333",
  },
});

export default SkeletonCryptoCard;
