import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolateColor,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useQuery, useMutation } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import {
  GET_COINS,
  GET_CRYPTO_PRICES,
  GET_ACTIVE_BETS,
  PLACE_BET,
} from "../graphql/queries";
import { TIMEFRAMES } from "../constants/timeframes";
import { Coin, CryptoPrice, Bet } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTrading } from "../contexts/TradingContext";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

import UnifiedHeader from "../components/UnifiedHeader";
import SmartContractInfo from "../components/SmartContractInfo";
import {
  useEthPrice,
  formatEthWithUsd,
  formatUsd,
  ethToUsd,
  usdToEth,
} from "../utils/currencyUtils";
import PriceChart from "../components/PriceChart";
import priceDataService from "../services/priceDataService";
import { FONTS } from "../constants/fonts";
import COLORS from "../constants/colors";

const BinaryOptionsScreen: React.FC = () => {
  const [timerTick, setTimerTick] = useState(0);
  const {
    selectedCrypto,
    setSelectedCrypto,
    selectedTimeframe,
    setSelectedTimeframe,
    betAmount,
    setBetAmount,
    betType,
    setBetType,
    updateBetAmountToMaxSafe,
  } = useTrading();

  // Get wallet balance for verification
  const { balance, isConnected, provider } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();

  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  // USD-only betting - no currency toggle needed
  const inputInUsd = true;

  // Use the WalletConnect modal hook (same as header)
  const {
    isConnected: wcConnected,
    address: wcAddress,
    provider: wcProvider,
  } = useWalletConnectModal();

  // Debug connection status (same logic as header)
  const isWalletConnected = wcConnected || isConnected;

  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  console.log("🔗 BinaryOptionsScreen: Connection status:", {
    wcConnected,
    isConnected,
    isWalletConnected,
    currentNetwork,
  });

  // Animation values for entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const cryptoSelectionOpacity = useSharedValue(0);
  const cryptoSelectionTranslateY = useSharedValue(30);
  const priceSectionOpacity = useSharedValue(0);
  const priceSectionTranslateY = useSharedValue(30);
  const timeframeOpacity = useSharedValue(0);
  const timeframeTranslateY = useSharedValue(30);
  const betSectionOpacity = useSharedValue(0);
  const betSectionTranslateY = useSharedValue(30);
  const placeBetButtonOpacity = useSharedValue(0);
  const placeBetButtonTranslateY = useSharedValue(30);
  const activeBetsOpacity = useSharedValue(0);
  const activeBetsTranslateY = useSharedValue(30);

  // Add shared value for scroll position
  const scrollY = useSharedValue(0);

  // Add refs for horizontal carousels
  const cryptoScrollRef = useRef<ScrollView>(null);
  const timeframeScrollRef = useRef<ScrollView>(null);

  // State for scroll indicators
  const [cryptoScrollX, setCryptoScrollX] = useState(0);
  const [cryptoContentWidth, setCryptoContentWidth] = useState(0);
  const [cryptoLayoutWidth, setCryptoLayoutWidth] = useState(0);
  const [timeframeScrollX, setTimeframeScrollX] = useState(0);
  const [timeframeContentWidth, setTimeframeContentWidth] = useState(0);
  const [timeframeLayoutWidth, setTimeframeLayoutWidth] = useState(0);

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

  const cryptoSelectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cryptoSelectionOpacity.value,
    transform: [{ translateY: cryptoSelectionTranslateY.value }],
  }));

  const priceSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: priceSectionOpacity.value,
    transform: [{ translateY: priceSectionTranslateY.value }],
  }));

  const timeframeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: timeframeOpacity.value,
    transform: [{ translateY: timeframeTranslateY.value }],
  }));

  const betSectionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: betSectionOpacity.value,
    transform: [{ translateY: betSectionTranslateY.value }],
  }));

  const activeBetsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: activeBetsOpacity.value,
    transform: [{ translateY: activeBetsTranslateY.value }],
  }));

  const placeBetButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: placeBetButtonOpacity.value,
    transform: [{ translateY: placeBetButtonTranslateY.value }],
  }));

  // Animation function
  const startEntranceAnimations = () => {
    // Reset animation values
    headerOpacity.value = 0;
    headerTranslateY.value = -20;
    cryptoSelectionOpacity.value = 0;
    cryptoSelectionTranslateY.value = 30;
    priceSectionOpacity.value = 0;
    priceSectionTranslateY.value = 30;
    timeframeOpacity.value = 0;
    timeframeTranslateY.value = 30;
    betSectionOpacity.value = 0;
    betSectionTranslateY.value = 30;
    placeBetButtonOpacity.value = 0;
    placeBetButtonTranslateY.value = 30;
    activeBetsOpacity.value = 0;
    activeBetsTranslateY.value = 30;

    // Staggered entrance animations
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    cryptoSelectionOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600 })
    );
    cryptoSelectionTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    priceSectionOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600 })
    );
    priceSectionTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    timeframeOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    timeframeTranslateY.value = withDelay(
      400,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    betSectionOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    betSectionTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    placeBetButtonOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 600 })
    );
    placeBetButtonTranslateY.value = withDelay(
      700,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    activeBetsOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    activeBetsTranslateY.value = withDelay(
      800,
      withSpring(0, { damping: 15, stiffness: 150 })
    );
  };

  // Start entrance animations on mount
  useEffect(() => {
    startEntranceAnimations();
  }, []);

  // Fetch price history for selected crypto
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (selectedCrypto) {
        setIsLoadingChart(true);
        try {
          const data = await priceDataService.getPriceHistory(
            selectedCrypto,
            selectedTimeframe
          );
          setPriceHistory(data);
        } catch (error) {
          console.error("Error fetching price history:", error);
          setPriceHistory([]);
        } finally {
          setIsLoadingChart(false);
        }
      }
    };

    fetchPriceHistory();
  }, [selectedCrypto, selectedTimeframe]);

  // Trigger animations on screen focus
  useFocusEffect(
    React.useCallback(() => {
      startEntranceAnimations();
    }, [])
  );

  const { data: coinsData } = useQuery(GET_COINS);

  // Function to get payout multiplier for timeframe
  const getPayoutMultiplier = (timeframe: string): number => {
    const timeframeData = TIMEFRAMES.find((tf) => tf.value === timeframe);
    if (!timeframeData) return 1.8; // Default to 1.8x

    // Extract multiplier from payout string (e.g., "1.8x" -> 1.8)
    const multiplier = parseFloat(timeframeData.payout.replace("x", ""));
    return multiplier || 1.8;
  };
  const { data: cryptoData } = useQuery(GET_CRYPTO_PRICES);
  const { data: activeBetsData } = useQuery(GET_ACTIVE_BETS, {
    variables: { userId: "user-1" },
    pollInterval: 5000,
  });

  const [placeBet] = useMutation(PLACE_BET, {
    refetchQueries: [
      { query: GET_ACTIVE_BETS, variables: { userId: "user-1" } },
    ],
  });

  const currentCrypto = useMemo(() => {
    return cryptoData?.cryptoPrices?.find(
      (crypto: CryptoPrice) => crypto.symbol === selectedCrypto
    );
  }, [cryptoData, selectedCrypto]);

  const selectedTimeframeInfo = useMemo(() => {
    return TIMEFRAMES.find((tf) => tf.value === selectedTimeframe);
  }, [selectedTimeframe]);

  // Use balance from wallet context (unified with header)
  const currentBalance = useMemo(() => {
    const contextBalance = parseFloat(balance || "0");
    console.log(
      "💰 BinaryOptionsScreen: Using wallet context balance:",
      contextBalance,
      "for",
      currentNetwork
    );
    return contextBalance;
  }, [balance, currentNetwork]);

  const betAmountValue = parseFloat(betAmount || "0");

  // Calculate max safe bet in USD (90% of ETH balance converted to USD)
  const maxSafeBetEth = currentBalance * 0.9; // 90% of ETH balance for safety
  const maxSafeBetUsd = ethToUsd(maxSafeBetEth, ethPrice);

  // USD-only betting, so max safe bet is in USD
  const maxSafeBet = maxSafeBetUsd;

  // Check if bet amount exceeds available USD balance
  const availableUsdBalance = ethToUsd(currentBalance, ethPrice);
  const hasInsufficientBalance = betAmountValue > availableUsdBalance;

  // Determine if we should show loading state
  const shouldShowLoading = false; // Balance is now handled by unified header

  const formatBalance = (amount: number) => {
    return amount.toFixed(4);
  };

  const getChainName = (chainId: string) => {
    switch (chainId) {
      case "1":
        return "ETH";
      case "11155111":
        return "Sepolia ETH";

      case "137":
        return "MATIC";
      case "56":
        return "BNB";
      case "42161":
        return "ARB";
      case "10":
        return "OP";
      default:
        return networkConfig.nativeCurrency.symbol;
    }
  };

  // Effect to update bet amount when network changes
  useEffect(() => {
    if (isWalletConnected && currentBalance > 0 && !shouldShowLoading) {
      // Always update bet amount when network changes to reflect new balance
      const formattedMaxBet = maxSafeBetUsd.toFixed(2);
      setBetAmount(formattedMaxBet);
      console.log(
        "🌐 Updated bet amount after network change to",
        currentNetwork,
        "in USD:",
        formattedMaxBet
      );
    }
  }, [
    currentNetwork,
    currentBalance,
    maxSafeBetUsd,
    isWalletConnected,
    shouldShowLoading,
  ]);

  // Effect to update bet amount to max safe bet when balance or network changes
  useEffect(() => {
    if (isWalletConnected && currentBalance > 0 && !shouldShowLoading) {
      const currentBetAmount = parseFloat(betAmount || "0");

      // Update if the current bet amount is 100 (default), higher than max safe bet, or network changed
      if (currentBetAmount === 100 || currentBetAmount > maxSafeBetUsd) {
        const formattedMaxBet = maxSafeBetUsd.toFixed(2);
        setBetAmount(formattedMaxBet);
        console.log(
          "💰 Updated bet amount to max safe bet for",
          currentNetwork,
          "in USD:",
          formattedMaxBet
        );
      }
    }
  }, [
    currentBalance,
    isWalletConnected,
    shouldShowLoading,
    currentNetwork,
    betAmount,
    maxSafeBetUsd,
  ]);

  // Effect to set initial bet amount when wallet connects for the first time
  useEffect(() => {
    if (
      isWalletConnected &&
      currentBalance > 0 &&
      !shouldShowLoading &&
      betAmount === "100"
    ) {
      // Set to max safe bet in USD by default
      const formattedMaxBet = maxSafeBetUsd.toFixed(2);
      setBetAmount(formattedMaxBet);
      console.log(
        "💰 Set initial bet amount to max safe bet for",
        currentNetwork,
        "in USD"
      );
    }
  }, [
    isWalletConnected,
    currentBalance,
    shouldShowLoading,
    betAmount,
    maxSafeBetUsd,
    currentNetwork,
  ]);

  // Timer update for Active Bets - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to set bet amount to max safe bet in USD
  const setBetAmountToMaxSafe = () => {
    const formattedMaxBet = maxSafeBetUsd.toFixed(2);
    setBetAmount(formattedMaxBet);
  };

  const handlePlaceBet = async () => {
    // Check if wallet is connected (same logic as header)
    if (!isWalletConnected) {
      Alert.alert(
        "Wallet Not Connected",
        "Please connect your wallet to place bets"
      );
      return;
    }

    if (!selectedCrypto) {
      Alert.alert("Error", "Please select a cryptocurrency");
      return;
    }

    if (!betAmount || betAmountValue <= 0) {
      Alert.alert("Error", "Please enter a valid bet amount");
      return;
    }

    // Check if user has sufficient balance
    if (hasInsufficientBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ${formatBalance(currentBalance)} ${getChainName(
          networkConfig.chainId
        )} on ${currentNetwork}. Please reduce your bet amount.`
      );
      return;
    }

    // Add a small buffer for gas fees (0.001 ETH)
    const gasBuffer = 0.001;
    if (betAmountValue + gasBuffer > currentBalance) {
      Alert.alert(
        "Insufficient Balance for Gas",
        `You need at least ${formatBalance(
          betAmountValue + gasBuffer
        )} ${getChainName(
          networkConfig.chainId
        )} (including gas fees) on ${currentNetwork}. Current balance: ${formatBalance(
          currentBalance
        )} ${getChainName(networkConfig.chainId)}`
      );
      return;
    }

    try {
      await placeBet({
        variables: {
          input: {
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: betAmountValue,
            timeframe: selectedTimeframe,
          },
        },
      });
      Alert.alert("Success", "Bet placed successfully!");
      // Reset to max safe bet instead of hardcoded 100
      updateBetAmountToMaxSafe(currentBalance);
    } catch (error) {
      Alert.alert("Error", "Failed to place bet. Please try again.");
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    // Use timerTick to force recalculation every second
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const backgroundImage = require("../../assets/geometric-neon-hexagonal-bipyramid-background-vector/v882-mind-04-e.jpg");

  // Center selected crypto in carousel
  useEffect(() => {
    if (!coinsData?.coins || !selectedCrypto) return;
    const index = coinsData.coins.findIndex(
      (coin: Coin) => coin.symbol === selectedCrypto
    );
    if (index === -1) return;
    // Estimate item width + marginRight (from styles: 16+8=24, but paddingHorizontal is 16, marginRight is 8)
    const ITEM_WIDTH = 16 + 8 + 60; // padding + margin + text width estimate
    const scrollTo = Math.max(0, index * ITEM_WIDTH - 120); // 120 is half screen width estimate
    setTimeout(() => {
      cryptoScrollRef.current?.scrollTo({ x: scrollTo, animated: true });
    }, 300);
  }, [coinsData?.coins, selectedCrypto]);

  // Center selected timeframe in carousel
  useEffect(() => {
    const index = TIMEFRAMES.findIndex((tf) => tf.value === selectedTimeframe);
    if (index === -1) return;
    // Estimate item width + marginRight (from styles: 16+8=24, but paddingHorizontal is 16, marginRight is 8)
    const ITEM_WIDTH = 100; // estimate for timeframe option
    const scrollTo = Math.max(0, index * ITEM_WIDTH - 120); // 120 is half screen width estimate
    setTimeout(() => {
      timeframeScrollRef.current?.scrollTo({ x: scrollTo, animated: true });
    }, 300);
  }, [selectedTimeframe]);

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
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
        {/* Content */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Crypto Selection */}
          <Animated.View style={[styles.section, cryptoSelectionAnimatedStyle]}>
            <Text style={styles.sectionTitle}>
              Select Cryptocurrency
              {selectedCrypto && (
                <Text style={styles.selectedIndicator}>
                  {" "}
                  • {selectedCrypto} selected
                </Text>
              )}
            </Text>
            <View style={{ position: "relative" }}>
              {/* Left Fade + Arrow */}
              {cryptoScrollX > 5 && (
                <LinearGradient
                  colors={["rgba(20,20,30,0.7)", "rgba(20,20,30,0)"]}
                  style={styles.leftFade}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={28}
                    color={COLORS.textMuted}
                    style={{ opacity: 0.6 }}
                  />
                </LinearGradient>
              )}
              {/* Right Fade + Arrow */}
              {cryptoContentWidth - cryptoLayoutWidth - cryptoScrollX > 5 && (
                <LinearGradient
                  colors={["rgba(20,20,30,0)", "rgba(20,20,30,0.7)"]}
                  style={styles.rightFade}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={28}
                    color={COLORS.textMuted}
                    style={{ opacity: 0.6 }}
                  />
                </LinearGradient>
              )}
              <ScrollView
                ref={cryptoScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cryptoList}
                onScroll={(e) =>
                  setCryptoScrollX(e.nativeEvent.contentOffset.x)
                }
                onContentSizeChange={(w) => setCryptoContentWidth(w)}
                onLayout={(e) =>
                  setCryptoLayoutWidth(e.nativeEvent.layout.width)
                }
                scrollEventThrottle={16}
              >
                {coinsData?.coins?.map((coin: Coin) => (
                  <TouchableOpacity
                    key={coin.id}
                    style={[
                      styles.cryptoOption,
                      selectedCrypto === coin.symbol && styles.selectedCrypto,
                    ]}
                    onPress={() => setSelectedCrypto(coin.symbol)}
                  >
                    <Text
                      style={[
                        styles.cryptoOptionText,
                        selectedCrypto === coin.symbol &&
                          styles.selectedCryptoText,
                      ]}
                    >
                      {coin.symbol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Current Price */}
          {currentCrypto && (
            <Animated.View style={[styles.section, priceSectionAnimatedStyle]}>
              <Text style={styles.sectionTitle}>Current Price</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ${currentCrypto.price.toLocaleString()}
                </Text>
              </View>

              {/* Price Chart */}
              {priceHistory.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>
                    {(() => {
                      const label =
                        priceDataService.getTimeframeLabel(selectedTimeframe);
                      console.log(
                        "📊 Chart Title Update:",
                        selectedTimeframe,
                        "->",
                        label
                      );
                      return label;
                    })()}
                  </Text>
                  <PriceChart
                    data={priceHistory}
                    color={COLORS.accent}
                    height={120}
                    isMini={false}
                  />
                </View>
              )}
            </Animated.View>
          )}

          {/* Timeframe Selection */}
          <Animated.View style={[styles.section, timeframeAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Select Timeframe</Text>
            <View style={{ position: "relative" }}>
              {/* Left Fade + Arrow */}
              {timeframeScrollX > 5 && (
                <LinearGradient
                  colors={["rgba(20,20,30,0.7)", "rgba(20,20,30,0)"]}
                  style={styles.leftFade}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={28}
                    color={COLORS.textMuted}
                    style={{ opacity: 0.6 }}
                  />
                </LinearGradient>
              )}
              {/* Right Fade + Arrow */}
              {timeframeContentWidth - timeframeLayoutWidth - timeframeScrollX >
                5 && (
                <LinearGradient
                  colors={["rgba(20,20,30,0)", "rgba(20,20,30,0.7)"]}
                  style={styles.rightFade}
                  pointerEvents="none"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={28}
                    color={COLORS.textMuted}
                    style={{ opacity: 0.6 }}
                  />
                </LinearGradient>
              )}
              <ScrollView
                ref={timeframeScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeframeList}
                onScroll={(e) =>
                  setTimeframeScrollX(e.nativeEvent.contentOffset.x)
                }
                onContentSizeChange={(w) => setTimeframeContentWidth(w)}
                onLayout={(e) =>
                  setTimeframeLayoutWidth(e.nativeEvent.layout.width)
                }
                scrollEventThrottle={16}
              >
                {TIMEFRAMES.map((timeframe) => (
                  <TouchableOpacity
                    key={timeframe.value}
                    style={[
                      styles.timeframeOption,
                      selectedTimeframe === timeframe.value &&
                        styles.selectedTimeframe,
                    ]}
                    onPress={() => {
                      console.log("⏰ Timeframe Selected:", timeframe.value);
                      setSelectedTimeframe(timeframe.value);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeframeLabel,
                        selectedTimeframe === timeframe.value &&
                          styles.selectedTimeframeText,
                      ]}
                    >
                      {timeframe.label}
                    </Text>
                    <Text
                      style={[
                        styles.timeframePayout,
                        selectedTimeframe === timeframe.value &&
                          styles.selectedTimeframeText,
                      ]}
                    >
                      {timeframe.payout}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {/* Bet Amount */}
          <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
            <Text style={styles.sectionTitle}>
              Bet Amount ({networkConfig.nativeCurrency.symbol})
            </Text>

            <View style={styles.betInputContainer}>
              <View style={styles.betInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[
                    styles.betInput,
                    hasInsufficientBalance && styles.betInputError,
                    shouldShowLoading && styles.betInputLoading,
                  ]}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  keyboardType="numeric"
                  placeholder={
                    shouldShowLoading
                      ? "Loading balance..."
                      : "Enter amount in USD"
                  }
                  placeholderTextColor={COLORS.textMuted}
                  editable={!shouldShowLoading}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.maxButton,
                  (maxSafeBet <= 0 || shouldShowLoading) &&
                    styles.maxButtonDisabled,
                ]}
                onPress={setBetAmountToMaxSafe}
                disabled={maxSafeBet <= 0 || shouldShowLoading}
              >
                <Text
                  style={[
                    styles.maxButtonText,
                    (maxSafeBet <= 0 || shouldShowLoading) &&
                      styles.maxButtonTextDisabled,
                  ]}
                >
                  Max
                </Text>
              </TouchableOpacity>
            </View>

            {/* ETH Equivalent Display */}
            {isWalletConnected &&
              !shouldShowLoading &&
              betAmount &&
              parseFloat(betAmount) > 0 && (
                <View style={styles.usdEquivalentContainer}>
                  <MaterialCommunityIcons
                    name="ethereum"
                    size={14}
                    color={COLORS.accent}
                  />
                  <Text style={styles.usdEquivalentText}>
                    Ξ {usdToEth(parseFloat(betAmount), ethPrice).toFixed(4)} ETH
                  </Text>
                </View>
              )}

            {/* Balance Warning */}
            {isWalletConnected &&
              hasInsufficientBalance &&
              !shouldShowLoading && (
                <View style={styles.balanceWarning}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={16}
                    color={COLORS.error}
                  />
                  <Text style={styles.balanceWarningText}>
                    Insufficient balance. You only have{" "}
                    {formatUsd(ethToUsd(currentBalance, ethPrice))} (Ξ{" "}
                    {currentBalance.toFixed(4)}) on {currentNetwork}
                  </Text>
                </View>
              )}

            {/* Gas Fee Info */}
            {isWalletConnected && (
              <View style={styles.gasInfo}>
                <MaterialCommunityIcons
                  name="gas-station"
                  size={14}
                  color={COLORS.textMuted}
                />
                <Text style={styles.gasInfoText}>
                  Gas fees (~0.001 {getChainName(networkConfig.chainId)}) will
                  be added to your bet amount on {currentNetwork}
                </Text>
              </View>
            )}

            {/* Max Safe Bet Info */}
            {isWalletConnected && currentBalance > 0 && (
              <View style={styles.maxBetInfo}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={14}
                  color={COLORS.success}
                />
                <Text style={styles.maxBetInfoText}>
                  Max safe bet: {formatUsd(maxSafeBetUsd)} (Ξ{" "}
                  {maxSafeBetEth.toFixed(4)}) (90% of balance) on{" "}
                  {currentNetwork}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Bet Type */}
          <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Bet Direction</Text>
            <View style={styles.betTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.betTypeButton,
                  betType === "UP" && styles.upButton,
                ]}
                onPress={() => setBetType("UP")}
              >
                <MaterialCommunityIcons
                  name="trending-up"
                  size={24}
                  color={betType === "UP" ? COLORS.textPrimary : COLORS.success}
                />
                <Text
                  style={[
                    styles.betTypeText,
                    betType === "UP" && styles.upButtonText,
                  ]}
                >
                  BUY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.betTypeButton,
                  betType === "DOWN" && styles.downButton,
                ]}
                onPress={() => setBetType("DOWN")}
              >
                <MaterialCommunityIcons
                  name="trending-down"
                  size={24}
                  color={betType === "DOWN" ? COLORS.textPrimary : COLORS.error}
                />
                <Text
                  style={[
                    styles.betTypeText,
                    betType === "DOWN" && styles.downButtonText,
                  ]}
                >
                  SELL
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Profit Summary Card */}
          <Animated.View
            style={[styles.profitSummaryContainer, placeBetButtonAnimatedStyle]}
          >
            <View style={styles.profitSummaryCard}>
              <Text style={styles.profitSummaryTitle}>Trade Summary</Text>

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Investment:</Text>
                <View style={styles.profitSummaryValue}>
                  <Text style={styles.profitSummaryAmount}>
                    {formatUsd(betAmountValue)}
                  </Text>
                  <Text style={styles.profitSummaryEquivalent}>
                    Ξ {usdToEth(betAmountValue, ethPrice).toFixed(4)}
                  </Text>
                </View>
              </View>

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Direction:</Text>
                <View
                  style={[
                    styles.directionBadge,
                    betType === "UP"
                      ? styles.upDirectionBadge
                      : styles.downDirectionBadge,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={betType === "UP" ? "trending-up" : "trending-down"}
                    size={16}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.directionText}>{betType}</Text>
                </View>
              </View>

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Timeframe:</Text>
                <Text style={styles.profitSummaryValueText}>
                  {
                    TIMEFRAMES.find((tf) => tf.value === selectedTimeframe)
                      ?.label
                  }
                </Text>
              </View>

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Asset:</Text>
                <Text style={styles.profitSummaryValueText}>
                  {selectedCrypto}
                </Text>
              </View>

              <View style={styles.profitSummaryDivider} />

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Potential Profit:</Text>
                <View style={styles.profitSummaryValue}>
                  <Text style={styles.profitSummaryProfit}>
                    +
                    {formatUsd(
                      betAmountValue *
                        (getPayoutMultiplier(selectedTimeframe) - 1)
                    )}
                  </Text>
                  <Text style={styles.profitSummaryProfitEquivalent}>
                    +Ξ{" "}
                    {(
                      usdToEth(betAmountValue, ethPrice) *
                      (getPayoutMultiplier(selectedTimeframe) - 1)
                    ).toFixed(4)}
                  </Text>
                </View>
              </View>

              <View style={styles.profitSummaryRow}>
                <Text style={styles.profitSummaryLabel}>Potential Loss:</Text>
                <View style={styles.profitSummaryValue}>
                  <Text style={styles.profitSummaryLoss}>
                    -{formatUsd(betAmountValue)}
                  </Text>
                  <Text style={styles.profitSummaryLossEquivalent}>
                    -Ξ {usdToEth(betAmountValue, ethPrice).toFixed(4)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Place Bet Button */}
          <Animated.View
            style={[
              styles.placeBetButtonContainer,
              placeBetButtonAnimatedStyle,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.placeBetButton,
                ((!wcConnected && !isConnected) ||
                  hasInsufficientBalance ||
                  shouldShowLoading) &&
                  styles.placeBetButtonDisabled,
              ]}
              onPress={handlePlaceBet}
              disabled={
                (!wcConnected && !isConnected) ||
                hasInsufficientBalance ||
                shouldShowLoading
              }
            >
              <Text
                style={[
                  styles.placeBetButtonText,
                  ((!wcConnected && !isConnected) ||
                    hasInsufficientBalance ||
                    shouldShowLoading) &&
                    styles.placeBetButtonTextDisabled,
                ]}
              >
                {!wcConnected && !isConnected
                  ? "Connect Wallet to Bet"
                  : shouldShowLoading
                  ? "Loading Balance..."
                  : hasInsufficientBalance
                  ? "Insufficient Balance"
                  : "Place Bet"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Smart Contract Info */}
          {/* <SmartContractInfo /> */}

          {/* Active Bets */}
          <Animated.View style={[styles.section, activeBetsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Active Bets</Text>
            {activeBetsData?.activeBets?.map((bet: Bet) => (
              <View key={bet.id} style={styles.activeBetCard}>
                <View style={styles.betHeader}>
                  <Text style={styles.betSymbol}>{bet.cryptoSymbol}</Text>
                  <Text
                    style={[
                      styles.betType,
                      bet.betType === "UP" ? styles.upText : styles.downText,
                    ]}
                  >
                    {bet.betType}
                  </Text>
                </View>
                <View style={styles.betDetails}>
                  <Text style={styles.betAmount}>${bet.amount}</Text>
                  <Text style={styles.betTimeframe}>
                    {TIMEFRAMES.find((tf) => tf.value === bet.timeframe)?.label}
                  </Text>
                  <Text style={styles.betTimeLeft}>
                    {getTimeLeft(bet.expiresAt)}
                  </Text>
                </View>
              </View>
            ))}
            {(!activeBetsData?.activeBets ||
              activeBetsData.activeBets.length === 0) && (
              <Text style={styles.noBetsText}>No active bets</Text>
            )}
          </Animated.View>
        </Animated.ScrollView>
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  logo: {
    width: 160,
    height: 50,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  selectedIndicator: {
    color: COLORS.accent,
    fontSize: 14,
  },
  cryptoList: {
    flexDirection: "row",
  },
  cryptoOption: {
    backgroundColor: COLORS.card2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedCrypto: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  cryptoOptionText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.SEMI_BOLD,
  },
  selectedCryptoText: {
    color: COLORS.neonCardText,
    fontFamily: FONTS.SEMI_BOLD,
  },
  priceContainer: {
    backgroundColor: COLORS.card2,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  price: {
    fontSize: 24,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  timeframeList: {
    flexDirection: "row",
  },
  timeframeOption: {
    backgroundColor: COLORS.card2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  selectedTimeframe: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  timeframeLabel: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 14,
  },
  timeframePayout: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  selectedTimeframeText: {
    color: COLORS.neonCardText,
  },
  betInput: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  betTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  betTypeButton: {
    flex: 1,
    backgroundColor: COLORS.card2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upButton: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  downButton: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  betTypeText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.SEMI_BOLD,
    marginTop: 8,
  },
  upButtonText: {
    color: COLORS.textPrimary,
  },
  downButtonText: {
    color: COLORS.textPrimary,
  },
  placeBetButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  placeBetButtonText: {
    color: COLORS.neonCardText,
    fontSize: 18,
    fontFamily: FONTS.BOLD,
  },
  activeBetCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  betHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  betSymbol: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  betType: {
    fontSize: 14,
    fontFamily: FONTS.SEMI_BOLD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upText: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: COLORS.success,
  },
  downText: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: COLORS.error,
  },
  betDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  betAmount: {
    fontSize: 16,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
  },
  betTimeframe: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  betTimeLeft: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: FONTS.SEMI_BOLD,
  },
  noBetsText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 16,
    fontStyle: "italic",
  },
  // Balance verification styles
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  balanceText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  betInputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  balanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  balanceWarningText: {
    color: COLORS.error,
    fontSize: 12,
  },
  gasInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  gasInfoText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  placeBetButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  placeBetButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  refreshButton: {
    padding: 4,
  },
  betInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  maxButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  maxButtonText: {
    color: COLORS.neonCardText,
    fontSize: 16,
    fontFamily: FONTS.SEMI_BOLD,
    paddingTop: 14,
    paddingBottom: 14,
  },
  maxBetInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  maxBetInfoText: {
    color: COLORS.success,
    fontSize: 12,
  },
  betInputLoading: {
    opacity: 0.6,
  },
  maxButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  maxButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  usdEquivalentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  usdEquivalentText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
  },

  betInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  placeBetButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  // Profit Summary Card Styles
  profitSummaryContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  profitSummaryCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profitSummaryTitle: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  profitSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profitSummaryLabel: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textSecondary,
  },
  profitSummaryValue: {
    alignItems: "flex-end",
  },
  profitSummaryValueText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  profitSummaryAmount: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  profitSummaryEquivalent: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  upDirectionBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  downDirectionBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  directionText: {
    fontSize: 12,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
  },
  profitSummaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  profitSummaryProfit: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.success,
  },
  profitSummaryProfitEquivalent: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  profitSummaryLoss: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.error,
  },
  profitSummaryLossEquivalent: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 2,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  leftArrowContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    width: 28,
    alignItems: "center",
    pointerEvents: "none",
  },
  rightArrowContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
    width: 28,
    alignItems: "center",
    pointerEvents: "none",
  },
  leftFade: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 10,
    pointerEvents: "none",
  },
  rightFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 10,
    pointerEvents: "none",
  },
});

export default BinaryOptionsScreen;
