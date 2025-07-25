import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  interpolateColor,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useQuery } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import { GET_USER_STATS, GET_BET_HISTORY } from "../graphql/queries";
import { UserStats, Bet } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UnifiedHeader from "../components/UnifiedHeader";
import { formatEthWithUsd, formatUsd, ethToUsd } from "../utils/currencyUtils";
import { useEthPrice } from "../contexts/EthPriceContext";
import { FONTS } from "../constants/fonts";
import COLORS from "../constants/colors";

const backgroundImage = require("../../assets/geometric-neon-hexagonal-bipyramid-background-vector/v882-mind-04-e.jpg");

const PortfolioScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [timerTick, setTimerTick] = useState(0);

  // Get ETH price for USD conversion (Chainlink price, Sepolia ETH treated as regular ETH)
  const { ethPrice } = useEthPrice();

  // Animation values for entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const statsCardsOpacity = useSharedValue(0);
  const statsCardsTranslateY = useSharedValue(30);
  const performanceOpacity = useSharedValue(0);
  const performanceTranslateY = useSharedValue(30);
  const historyOpacity = useSharedValue(0);
  const historyTranslateY = useSharedValue(30);

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

  const statsCardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsCardsOpacity.value,
    transform: [{ translateY: statsCardsTranslateY.value }],
  }));

  const performanceAnimatedStyle = useAnimatedStyle(() => ({
    opacity: performanceOpacity.value,
    transform: [{ translateY: performanceTranslateY.value }],
  }));

  const historyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: historyOpacity.value,
    transform: [{ translateY: historyTranslateY.value }],
  }));

  // Animation function
  const startEntranceAnimations = () => {
    // Reset animation values
    headerOpacity.value = 0;
    headerTranslateY.value = -20;
    statsCardsOpacity.value = 0;
    statsCardsTranslateY.value = 30;
    performanceOpacity.value = 0;
    performanceTranslateY.value = 30;
    historyOpacity.value = 0;
    historyTranslateY.value = 30;

    // Staggered entrance animations
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    headerTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    statsCardsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    statsCardsTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    performanceOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    performanceTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 150 })
    );

    historyOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    historyTranslateY.value = withDelay(
      400,
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

  const { data: userStats, refetch: refetchStats } = useQuery(GET_USER_STATS, {
    variables: { userId: "user-1" },
    pollInterval: 120000, // 2 minutes
  });

  // Debug: Log portfolio USD conversions
  useEffect(() => {
    if (ethPrice > 0 && userStats?.userStats) {
      const stats = userStats.userStats;
      console.log("💰 PORTFOLIO USD CONVERSIONS:");
      console.log(`   └─ Chainlink ETH Price: $${ethPrice.toLocaleString()}`);
      console.log(
        `   └─ Net Profit: $${stats.netProfit} = Ξ ${(
          stats.netProfit / ethPrice
        ).toFixed(4)} ETH`
      );
      console.log(
        `   └─ Total Wagered: $${stats.totalWagered} = Ξ ${(
          stats.totalWagered / ethPrice
        ).toFixed(4)} ETH`
      );
      console.log(
        `   └─ Total Won: $${stats.totalWon} = Ξ ${(
          stats.totalWon / ethPrice
        ).toFixed(4)} ETH`
      );
    }
  }, [ethPrice, userStats]);

  const {
    data: betHistory,
    loading: betHistoryLoading,
    refetch: refetchHistory,
  } = useQuery(GET_BET_HISTORY, {
    variables: { userId: "user-1" },
    pollInterval: 120000, // 2 minutes
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchHistory()]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Timer update for Active Bets - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const stats: UserStats = userStats?.userStats || {
    totalBets: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
  };

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
        {/* Content */}
        <Animated.ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Stats Cards */}
          <Animated.View
            style={[styles.statsContainer, statsCardsAnimatedStyle]}
          >
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color={COLORS.accent}
              />
              <Text style={styles.statValue}>
                {formatCurrency(stats.netProfit)}
              </Text>
              <Text style={styles.statLabel}>Net Profit</Text>
              <Text style={styles.statSubtext}>
                (Ξ {(stats.netProfit / ethPrice).toFixed(4)})
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="trophy"
                size={24}
                color={COLORS.success}
              />
              <Text style={styles.statValue}>
                {formatPercentage(stats.winRate)}
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="chart-line"
                size={24}
                color={COLORS.warning}
              />
              <Text style={styles.statValue}>{stats.totalBets}</Text>
              <Text style={styles.statLabel}>Total Bets</Text>
            </View>
          </Animated.View>

          {/* Detailed Stats */}
          <Animated.View style={[styles.section, performanceAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <View style={styles.detailedStats}>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Wagered</Text>
                <Text style={styles.statRowValue}>
                  {formatCurrency(stats.totalWagered)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Won</Text>
                <Text style={styles.statRowValue}>
                  {formatCurrency(stats.totalWon)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Wagered (ETH)</Text>
                <Text style={styles.statRowValue}>
                  Ξ {(stats.totalWagered / ethPrice).toFixed(4)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Won (ETH)</Text>
                <Text style={styles.statRowValue}>
                  Ξ {(stats.totalWon / ethPrice).toFixed(4)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Wins</Text>
                <Text style={[styles.statRowValue, styles.winText]}>
                  {stats.wins}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Losses</Text>
                <Text style={[styles.statRowValue, styles.lossText]}>
                  {stats.losses}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Bet History */}
          <Animated.View style={[styles.section, historyAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Bet History</Text>
            {betHistoryLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading bet history...</Text>
              </View>
            ) : (
              <View style={styles.betHistoryContainer}>
                {betHistory?.betHistory?.map((bet: Bet) => (
                  <View key={bet.id} style={styles.betHistoryCard}>
                    <View style={styles.betHistoryHeader}>
                      <View style={styles.betInfo}>
                        <Text style={styles.betSymbol}>{bet.cryptoSymbol}</Text>
                        <Text style={styles.betDate}>
                          {new Date(bet.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.resultBadge,
                          bet.result === "WIN"
                            ? styles.winBadge
                            : styles.lossBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.resultText,
                            bet.result === "WIN"
                              ? styles.winText
                              : styles.lossText,
                          ]}
                        >
                          {bet.result || "PENDING"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.betHistoryDetails}>
                      <View style={styles.betDetailRow}>
                        <Text style={styles.betDetailLabel}>Amount:</Text>
                        <Text style={styles.betDetailValue}>
                          {formatCurrency(bet.amount)}
                        </Text>
                      </View>
                      <View style={styles.betDetailRow}>
                        <Text style={styles.betDetailLabel}>Type:</Text>
                        <Text
                          style={[
                            styles.betDetailValue,
                            bet.betType === "UP"
                              ? styles.upText
                              : styles.downText,
                          ]}
                        >
                          {bet.betType}
                        </Text>
                      </View>
                      <View style={styles.betDetailRow}>
                        <Text style={styles.betDetailLabel}>Entry Price:</Text>
                        <Text style={styles.betDetailValue}>
                          {formatCurrency(bet.entryPrice)}
                        </Text>
                      </View>
                      {bet.exitPrice && (
                        <View style={styles.betDetailRow}>
                          <Text style={styles.betDetailLabel}>Exit Price:</Text>
                          <Text style={styles.betDetailValue}>
                            {formatCurrency(bet.exitPrice)}
                          </Text>
                        </View>
                      )}
                      {bet.payout && (
                        <View style={styles.betDetailRow}>
                          <Text style={styles.betDetailLabel}>Payout:</Text>
                          <Text
                            style={[
                              styles.betDetailValue,
                              bet.result === "WIN"
                                ? styles.winText
                                : styles.lossText,
                            ]}
                          >
                            {formatCurrency(bet.payout)}
                          </Text>
                        </View>
                      )}
                      {/* 🔥 NEW: Blockchain bet information */}
                      {bet.isBlockchainBet && (
                        <>
                          <View style={styles.blockchainBadgeContainer}>
                            <View style={styles.blockchainBadge}>
                              <MaterialCommunityIcons
                                name="link-variant"
                                size={14}
                                color={COLORS.success}
                              />
                              <Text style={styles.blockchainBadgeText}>
                                BLOCKCHAIN BET
                              </Text>
                            </View>
                          </View>
                          {bet.optionId && (
                            <View style={styles.betDetailRow}>
                              <Text style={styles.betDetailLabel}>
                                Option ID:
                              </Text>
                              <Text style={styles.betDetailValue}>
                                #{bet.optionId}
                              </Text>
                            </View>
                          )}
                          {bet.transactionHash && (
                            <TouchableOpacity
                              style={styles.betDetailRow}
                              onPress={() => {
                                // TODO: Open Etherscan link
                                console.log(
                                  `https://sepolia.etherscan.io/tx/${bet.transactionHash}`
                                );
                              }}
                            >
                              <Text style={styles.betDetailLabel}>
                                Transaction:
                              </Text>
                              <Text
                                style={[styles.betDetailValue, styles.linkText]}
                              >
                                {bet.transactionHash.substring(0, 10)}...
                              </Text>
                            </TouchableOpacity>
                          )}
                          <View style={styles.betDetailRow}>
                            <Text style={styles.betDetailLabel}>Status:</Text>
                            <Text
                              style={[
                                styles.betDetailValue,
                                bet.status === "WON"
                                  ? styles.winText
                                  : bet.status === "LOST"
                                  ? styles.lossText
                                  : bet.status === "ACTIVE"
                                  ? styles.pendingText
                                  : styles.betDetailValue,
                              ]}
                            >
                              {bet.status === "ACTIVE"
                                ? "⏳ PENDING"
                                : bet.status === "WON"
                                ? "🎉 WON"
                                : bet.status === "LOST"
                                ? "❌ LOST"
                                : bet.status || "UNKNOWN"}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                ))}
                {(!betHistory?.betHistory ||
                  betHistory.betHistory.length === 0) && (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="history"
                      size={48}
                      color={COLORS.textMuted}
                    />
                    <Text style={styles.emptyStateText}>
                      No bet history yet
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Start trading to see your bet history here
                    </Text>
                  </View>
                )}
              </View>
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statSubtext: {
    fontSize: 10,
    color: COLORS.success,
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  detailedStats: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statRowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  winText: {
    color: COLORS.success,
  },
  lossText: {
    color: COLORS.error,
  },
  upText: {
    color: COLORS.success,
  },
  downText: {
    color: COLORS.error,
  },
  betHistoryContainer: {
    gap: 12,
  },
  betHistoryCard: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  betHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  betInfo: {
    flex: 1,
  },
  betSymbol: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  betDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  lossBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  resultText: {
    fontSize: 12,
    fontWeight: "600",
  },
  betHistoryDetails: {
    gap: 8,
  },
  betDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  betDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  betDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  // 🔥 NEW: Blockchain bet styles
  blockchainBadgeContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  blockchainBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  blockchainBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.BOLD,
    color: COLORS.success,
    marginLeft: 4,
  },
  linkText: {
    color: COLORS.accent,
    textDecorationLine: "underline",
  },
  pendingText: {
    color: COLORS.warning || "#FFA500",
  },
});

export default PortfolioScreen;
