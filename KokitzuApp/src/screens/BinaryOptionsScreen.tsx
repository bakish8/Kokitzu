import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_COINS,
  GET_CRYPTO_PRICES,
  GET_ACTIVE_BETS,
  PLACE_BET,
} from "../graphql/queries";
import { TIMEFRAMES } from "../constants/timeframes";
import { Coin, CryptoPrice, Bet } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTrading } from "../contexts/TradingContext";
import WalletConnectButton from "../components/WalletConnectButton";
import SmartContractInfo from "../components/SmartContractInfo";

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
  } = useTrading();

  const { data: coinsData } = useQuery(GET_COINS);
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

  // Timer update for Active Bets - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceBet = async () => {
    if (!selectedCrypto) {
      Alert.alert("Error", "Please select a cryptocurrency");
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid bet amount");
      return;
    }

    try {
      await placeBet({
        variables: {
          input: {
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: parseFloat(betAmount),
            timeframe: selectedTimeframe,
          },
        },
      });
      Alert.alert("Success", "Bet placed successfully!");
      setBetAmount("100");
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Binary Options</Text>
        <WalletConnectButton />
      </View>

      {/* Crypto Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Select Cryptocurrency
          {selectedCrypto && (
            <Text style={styles.selectedIndicator}>
              {" "}
              • {selectedCrypto} selected
            </Text>
          )}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cryptoList}
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
                  selectedCrypto === coin.symbol && styles.selectedCryptoText,
                ]}
              >
                {coin.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Current Price */}
      {currentCrypto && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Price</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${currentCrypto.price.toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Timeframe Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Timeframe</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeframeList}
        >
          {TIMEFRAMES.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.value}
              style={[
                styles.timeframeOption,
                selectedTimeframe === timeframe.value &&
                  styles.selectedTimeframe,
              ]}
              onPress={() => setSelectedTimeframe(timeframe.value)}
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

      {/* Bet Amount */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bet Amount ($)</Text>
        <TextInput
          style={styles.betInput}
          value={betAmount}
          onChangeText={setBetAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor="#666"
        />
      </View>

      {/* Bet Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bet Direction</Text>
        <View style={styles.betTypeContainer}>
          <TouchableOpacity
            style={[styles.betTypeButton, betType === "UP" && styles.upButton]}
            onPress={() => setBetType("UP")}
          >
            <MaterialCommunityIcons
              name="trending-up"
              size={24}
              color={betType === "UP" ? "#fff" : "#10b981"}
            />
            <Text
              style={[
                styles.betTypeText,
                betType === "UP" && styles.upButtonText,
              ]}
            >
              UP
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
              color={betType === "DOWN" ? "#fff" : "#ef4444"}
            />
            <Text
              style={[
                styles.betTypeText,
                betType === "DOWN" && styles.downButtonText,
              ]}
            >
              DOWN
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Place Bet Button */}
      <TouchableOpacity style={styles.placeBetButton} onPress={handlePlaceBet}>
        <Text style={styles.placeBetButtonText}>Place Bet</Text>
      </TouchableOpacity>

      {/* Smart Contract Info */}
      <SmartContractInfo />

      {/* Active Bets */}
      <View style={styles.section}>
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  selectedIndicator: {
    color: "#3b82f6",
    fontSize: 14,
  },
  cryptoList: {
    flexDirection: "row",
  },
  cryptoOption: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedCrypto: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  cryptoOptionText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  selectedCryptoText: {
    color: "#ffffff",
  },
  priceContainer: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  timeframeList: {
    flexDirection: "row",
  },
  timeframeOption: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  selectedTimeframe: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  timeframeLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  timeframePayout: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  selectedTimeframeText: {
    color: "#ffffff",
  },
  betInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  betTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  betTypeButton: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  upButton: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  downButton: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  betTypeText: {
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 8,
  },
  upButtonText: {
    color: "#ffffff",
  },
  downButtonText: {
    color: "#ffffff",
  },
  placeBetButton: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  placeBetButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  activeBetCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  betHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  betSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  betType: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upText: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
  },
  downText: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
  },
  betDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  betAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  betTimeframe: {
    fontSize: 14,
    color: "#666666",
  },
  betTimeLeft: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  noBetsText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    fontStyle: "italic",
  },
});

export default BinaryOptionsScreen;
