import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  // ScrollView, // replaced by Animated.ScrollView for main content
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  ImageBackground,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  interpolateColor,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { apiService } from "../services/apiService";
import { CryptoPrice, Coin } from "../types";
import CryptoCard from "../components/CryptoCard";
import SkeletonCryptoCard from "../components/SkeletonCryptoCard";
import { useTrading } from "../contexts/TradingContext";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";
import UnifiedHeader from "../components/UnifiedHeader";
import { useEthPrice } from "../utils/currencyUtils";
import { FONTS } from "../constants/fonts";
import { TIMEFRAMES } from "../constants/timeframes";
import COLORS from "../constants/colors";
import { getSupportedAssets } from "../services/priceDataService";
import { getCurrentNetworkName } from "../utils/networkUtils";

const LivePricesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("ONE_HOUR"); // Default to 1 hour

  // REST API state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<{ cryptoPrices: CryptoPrice[] } | null>(
    null
  );
  const [coinsData, setCoinsData] = useState<{ coins: Coin[] } | null>(null);
  const navigation = useNavigation();
  const {
    setDefaultBet,
    setBetType,
    setSelectedTimeframe: setTradingTimeframe,
  } = useTrading();

  // Add wallet context usage to ensure proper header updates
  const { isConnected, balance, provider } = useWallet();
  const { currentNetwork } = useNetwork();

  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  const chainId = provider?.network?.chainId || 1;
  const networkName = getCurrentNetworkName(chainId);
  const supportedAssets = getSupportedAssets(networkName);

  // Debug effect to monitor wallet state changes
  // useEffect(() => {
  //   console.log("🔗 LivePricesScreen: Wallet state changed:", {
  //     isConnected,
  //     balance,
  //     currentNetwork,
  //   });
  // }, [isConnected, balance, currentNetwork]);

  // Animation values for entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);

  // Add shared value for scroll position
  const scrollY = useSharedValue(0);

  // Animated background color for header
  const headerBgAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollY.value,
      [0, 60],
      ["rgba(5,25,35,0)", "#051923"]
    ),
  }));

  // Scroll handler
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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

  // Fetch crypto prices from REST API
  const fetchCryptoPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching crypto prices from REST API...");
      const prices = await apiService.getPrices();

      // Transform to match expected format
      const cryptoPrices = prices.map((price: any) => ({
        id: price.id,
        symbol: price.symbol,
        name: price.name || price.symbol,
        price: price.price,
        lastUpdated: price.lastUpdated,
        source: price.source,
      }));

      setData({ cryptoPrices });
      console.log(`✅ Loaded ${cryptoPrices.length} crypto prices`);

      // Create coins data from prices (simplified)
      const coins = cryptoPrices.map((crypto: any) => ({
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        image: null, // We don't have images from Chainlink
      }));

      setCoinsData({ coins });
      console.log(`✅ Created ${coins.length} coin entries`);
    } catch (err: any) {
      console.error("❌ Error loading crypto prices:", err.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = fetchCryptoPrices;

  // Initial load and polling
  useEffect(() => {
    const initAndFetch = async () => {
      try {
        console.log("🔧 Initializing API service...");
        await apiService.init();
        console.log("✅ API service initialized");
        await fetchCryptoPrices();
      } catch (error) {
        console.error("❌ Failed to initialize API service:", error);
        setError(error);
        setLoading(false);
      }
    };

    initAndFetch();

    // Poll every 30 seconds
    const interval = setInterval(fetchCryptoPrices, 120000);

    return () => clearInterval(interval);
  }, []);

  const filteredCryptoList =
    coinsData?.coins?.filter((coin: Coin) =>
      supportedAssets.includes(coin.symbol)
    ) || [];

  const filteredCryptoData = useMemo(() => {
    // console.log("🔄 Filtering crypto data:", {
    //   hasData: !!data?.cryptoPrices,
    //   dataLength: data?.cryptoPrices?.length || 0,
    //   searchQuery,
    // });

    if (!data?.cryptoPrices) return [];
    return data.cryptoPrices.filter(
      (crypto: CryptoPrice) =>
        searchQuery === "" ||
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.cryptoPrices, searchQuery]);

  const filteredSupportedCryptoData = filteredCryptoData.filter(
    (crypto: CryptoPrice) => supportedAssets.includes(crypto.symbol)
  );

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

  const handleTradeUp = (crypto: CryptoPrice, timeframe: string) => {
    setDefaultBet(crypto.symbol);
    setBetType("UP");
    setTradingTimeframe(timeframe);
    (navigation as any).navigate("BinaryOptions");
  };

  const handleTradeDown = (crypto: CryptoPrice, timeframe: string) => {
    setDefaultBet(crypto.symbol);
    setBetType("DOWN");
    setTradingTimeframe(timeframe);
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

  const backgroundImage = require("../../assets/geometric-neon-hexagonal-bipyramid-background-vector/v882-mind-04-e.jpg");

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: COLORS.overlay,
          zIndex: 0,
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[styles.header, headerAnimatedStyle, headerBgAnimatedStyle]}
        >
          <UnifiedHeader />
        </Animated.View>
        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search cryptocurrencies..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>
        {/* Content */}
        <Animated.View style={[styles.scrollView, contentAnimatedStyle]}>
          <Animated.ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onScroll={onScroll}
            scrollEventThrottle={16}
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
                {filteredSupportedCryptoData.map(
                  (crypto: CryptoPrice, index: number) => (
                    <CryptoCard
                      key={crypto.id}
                      crypto={crypto}
                      onPress={() => {
                        setDefaultBet(crypto.symbol);
                        setBetType("UP");
                        setTradingTimeframe(selectedTimeframe);
                        (navigation as any).navigate("BinaryOptions");
                      }}
                      index={index}
                    />
                  )
                )}
                {filteredSupportedCryptoData.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No supported assets available on this network.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.ScrollView>
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
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
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  refreshButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontFamily: FONTS.SEMI_BOLD,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeframeContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  timeframeLabel: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  timeframeScrollView: {
    flexGrow: 0,
  },
  timeframeOption: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  selectedTimeframeOption: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  timeframeOptionText: {
    fontSize: 12,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textMuted,
  },
  selectedTimeframeOptionText: {
    color: COLORS.neonCardText,
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
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontFamily: FONTS.SEMI_BOLD,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    color: COLORS.textMuted,
  },
  debugContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: "monospace",
  },
  debugError: {
    fontSize: 12,
    color: COLORS.error,
    fontFamily: "monospace",
    marginTop: 5,
  },
  buyButton: {
    backgroundColor: COLORS.neonCard,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    flex: 1,
    marginRight: 8,
  },
  buyButtonText: {
    color: COLORS.neonCardText,
    fontFamily: FONTS.BOLD,
    fontSize: 18,
  },
  sellButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    flex: 1,
    marginLeft: 8,
  },
  sellButtonText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.BOLD,
    fontSize: 18,
  },
});

export default LivePricesScreen;
