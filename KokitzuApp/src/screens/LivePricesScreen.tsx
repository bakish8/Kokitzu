import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

import { useQuery } from "@apollo/client";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { GET_CRYPTO_PRICES, GET_COINS } from "../graphql/queries";
import { CryptoPrice, Coin } from "../types";
import CryptoCard from "../components/CryptoCard";
import SkeletonCryptoCard from "../components/SkeletonCryptoCard";
import { useTrading } from "../contexts/TradingContext";
import WalletConnectButton from "../components/WalletConnectButton";

const LivePricesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { setDefaultBet } = useTrading();

  // Animation values for entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Animation function
  const startEntranceAnimations = () => {
    // Reset animation values
    headerOpacity.value = 0;
    headerTranslateY.value = -20;
    searchOpacity.value = 0;
    searchTranslateY.value = 30;
    contentOpacity.value = 0;
    contentTranslateY.value = 50;

    // Staggered entrance animations
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    searchOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    searchTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    contentOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    contentTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 15, stiffness: 150 })
    );
  };

  // Start entrance animations on mount
  useEffect(() => {
    startEntranceAnimations();
  }, []);

  // Trigger animations on screen focus
  useFocusEffect(
    React.useCallback(() => {
      startEntranceAnimations();
    }, [])
  );

  const { loading, error, data, refetch } = useQuery(GET_CRYPTO_PRICES, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
    errorPolicy: "all",
    onCompleted: (data) => {
      console.log(
        "✅ Crypto prices loaded:",
        data?.cryptoPrices?.length || 0,
        "coins"
      );
    },
    onError: (error) => {
      console.error("❌ Error loading crypto prices:", error.message);
    },
  });

  const { data: coinsData } = useQuery(GET_COINS, {
    errorPolicy: "all",
    onCompleted: (data) => {
      console.log("✅ Coins data loaded:", data?.coins?.length || 0, "coins");
    },
    onError: (error) => {
      console.error("❌ Error loading coins:", error.message);
    },
  });

  const filteredCryptoData = useMemo(() => {
    console.log("🔄 Filtering crypto data:", {
      hasData: !!data?.cryptoPrices,
      dataLength: data?.cryptoPrices?.length || 0,
      searchQuery,
    });

    if (!data?.cryptoPrices) return [];
    return data.cryptoPrices.filter(
      (crypto: CryptoPrice) =>
        searchQuery === "" ||
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.cryptoPrices, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const handleCryptoPress = (crypto: CryptoPrice) => {
    setDefaultBet(crypto.symbol);
    (navigation as any).navigate("BinaryOptions");
  };

  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/Koketsu.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.headerButtons}>
            <WalletConnectButton />
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cryptocurrencies..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.scrollView, contentAnimatedStyle]}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading && !data ? (
            // Loading skeleton
            <View style={styles.cardsContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonCryptoCard key={i} />
              ))}
            </View>
          ) : (
            // Crypto cards
            <View style={styles.cardsContainer}>
              {filteredCryptoData.map((crypto: CryptoPrice, index: number) => (
                <CryptoCard
                  key={crypto.id}
                  crypto={crypto}
                  onPress={() => handleCryptoPress(crypto)}
                  index={index}
                />
              ))}
              {filteredCryptoData.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No cryptocurrencies found
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
    marginLeft: -40,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 160,
    height: 50,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  refreshButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
  },
  debugContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  debugText: {
    fontSize: 12,
    color: "#00ff00",
    fontFamily: "monospace",
  },
  debugError: {
    fontSize: 12,
    color: "#ff0000",
    fontFamily: "monospace",
    marginTop: 5,
  },
});

export default LivePricesScreen;
