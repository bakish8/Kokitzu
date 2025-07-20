import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useQuery } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import { GET_USER_STATS, GET_BET_HISTORY } from "../graphql/queries";
import { UserStats, Bet } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WalletConnectButton from "../components/WalletConnectButton";
import {
  useEthPrice,
  formatEthWithUsd,
  formatUsd,
  ethToUsd,
} from "../utils/currencyUtils";

const PortfolioScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [timerTick, setTimerTick] = useState(0);

  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  // Animation values for entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const statsCardsOpacity = useSharedValue(0);
  const statsCardsTranslateY = useSharedValue(30);
  const performanceOpacity = useSharedValue(0);
  const performanceTranslateY = useSharedValue(30);
  const historyOpacity = useSharedValue(0);
  const historyTranslateY = useSharedValue(30);

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
    pollInterval: 10000,
  });

  const {
    data: betHistory,
    loading: betHistoryLoading,
    refetch: refetchHistory,
  } = useQuery(GET_BET_HISTORY, {
    variables: { userId: "user-1" },
    pollInterval: 10000,
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
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

      {/* Stats Cards */}
      <Animated.View style={[styles.statsContainer, statsCardsAnimatedStyle]}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="wallet" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>
            {formatCurrency(stats.netProfit)}
          </Text>
          <Text style={styles.statLabel}>Net Profit</Text>
          <Text style={styles.statSubtext}>
            (Ξ {ethToUsd(stats.netProfit, ethPrice).toFixed(4)})
          </Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="trophy" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {formatPercentage(stats.winRate)}
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#f59e0b" />
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
              Ξ {ethToUsd(stats.totalWagered, ethPrice).toFixed(4)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Total Won (ETH)</Text>
            <Text style={styles.statRowValue}>
              Ξ {ethToUsd(stats.totalWon, ethPrice).toFixed(4)}
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
                      bet.result === "WIN" ? styles.winBadge : styles.lossBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultText,
                        bet.result === "WIN" ? styles.winText : styles.lossText,
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
                        bet.betType === "UP" ? styles.upText : styles.downText,
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
                </View>
              </View>
            ))}
            {(!betHistory?.betHistory ||
              betHistory.betHistory.length === 0) && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="history" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No bet history yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start trading to see your bet history here
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </ScrollView>
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
    fontWeight: "bold",
    color: "#ffffff",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  statSubtext: {
    fontSize: 10,
    color: "#10b981",
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  detailedStats: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  statRowLabel: {
    fontSize: 14,
    color: "#cccccc",
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  winText: {
    color: "#10b981",
  },
  lossText: {
    color: "#ef4444",
  },
  upText: {
    color: "#10b981",
  },
  downText: {
    color: "#ef4444",
  },
  betHistoryContainer: {
    gap: 12,
  },
  betHistoryCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
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
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  betDate: {
    fontSize: 12,
    color: "#666666",
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
    color: "#666666",
  },
  betDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
});

export default PortfolioScreen;
