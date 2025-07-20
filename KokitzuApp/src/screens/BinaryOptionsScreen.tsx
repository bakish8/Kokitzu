import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
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
import { useTrading } from "../contexts/TradingContext";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { getWalletBalance, getCurrentChainId } from "../services/walletconnect";
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

  // Get wallet balance for verification
  const { balance, isConnected, provider } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();

  // WalletConnect balance state (same as header)
  const [localBalance, setLocalBalance] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<string>(
    networkConfig.chainId
  );

  // Use the WalletConnect modal hook (same as header)
  const {
    isConnected: wcConnected,
    address: wcAddress,
    provider: wcProvider,
  } = useWalletConnectModal();

  // Update current chain when network changes
  useEffect(() => {
    setCurrentChain(networkConfig.chainId);
    console.log(
      "🌐 BinaryOptionsScreen: Network changed to",
      currentNetwork,
      "Chain ID:",
      networkConfig.chainId
    );
  }, [currentNetwork, networkConfig.chainId]);

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
  const activeBetsOpacity = useSharedValue(0);
  const activeBetsTranslateY = useSharedValue(30);

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

    activeBetsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    activeBetsTranslateY.value = withDelay(
      600,
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

  // Balance verification helpers (same logic as header)
  const currentBalance = useMemo(() => {
    const walletBalance = parseFloat(localBalance || "0");
    const contextBalance = parseFloat(balance || "0");
    return Math.max(walletBalance, contextBalance);
  }, [localBalance, balance]);

  // Debug connection status (same logic as header)
  const isWalletConnected = wcConnected || isConnected;
  console.log("🔗 BinaryOptionsScreen: Connection status:", {
    wcConnected,
    isConnected,
    isWalletConnected,
    currentChain,
    currentNetwork,
  });

  const betAmountValue = parseFloat(betAmount || "0");
  const maxSafeBet = currentBalance * 0.9; // 90% of balance for safety
  const hasInsufficientBalance = betAmountValue > currentBalance;

  const formatBalance = (amount: number) => {
    return amount.toFixed(4);
  };

  const getChainName = (chainId: string) => {
    switch (chainId) {
      case "1":
        return "ETH";
      case "11155111":
        return "Sepolia ETH";
      case "5":
        return "Goerli ETH";
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

  // Effect to detect chain changes (same as header)
  useEffect(() => {
    if (wcConnected && wcProvider) {
      const checkChain = async () => {
        try {
          const chainId = await wcProvider.request({ method: "eth_chainId" });
          const chainIdDecimal = parseInt(chainId as string, 16).toString();
          if (chainIdDecimal !== currentChain) {
            setCurrentChain(chainIdDecimal);
            console.log("🔗 Chain changed to:", chainIdDecimal);
          }
        } catch (error) {
          console.log(
            "🔗 Could not detect chain, using network context chain ID"
          );
          setCurrentChain(networkConfig.chainId);
        }
      };

      checkChain();
      const interval = setInterval(checkChain, 5000);
      return () => clearInterval(interval);
    }
  }, [wcConnected, wcProvider, currentChain, networkConfig.chainId]);

  // Effect to fetch balance when WalletConnect connects, chain changes, or network changes (same as header)
  useEffect(() => {
    const fetchBalance = async () => {
      if (wcConnected && wcAddress) {
        try {
          console.log(
            `💰 Fetching balance for WalletConnect address: ${wcAddress} on chain: ${currentChain} (${currentNetwork})`
          );
          const balance = await getWalletBalance(wcAddress, currentChain);
          setLocalBalance(balance);
          console.log("💰 Balance fetched:", balance, "for", currentNetwork);
        } catch (error) {
          console.error("❌ Error fetching balance:", error);
          setLocalBalance("0.0000");
        }
      }
    };

    fetchBalance();
  }, [wcConnected, wcAddress, currentChain, currentNetwork]);

  // Effect to clear balance when disconnecting (same as header)
  useEffect(() => {
    if (!wcConnected && !isConnected) {
      setLocalBalance(null);
      setCurrentChain(networkConfig.chainId);
    }
  }, [wcConnected, isConnected, networkConfig.chainId]);

  // Refresh balance function
  const refreshBalance = async () => {
    if (wcConnected && wcAddress) {
      try {
        console.log("🔄 Refreshing balance for", currentNetwork);
        const balance = await getWalletBalance(wcAddress, currentChain);
        setLocalBalance(balance);
        console.log("💰 Balance refreshed:", balance, "for", currentNetwork);
      } catch (error) {
        console.error("Error refreshing balance:", error);
      }
    } else if (isConnected && provider) {
      try {
        console.log("🔄 Refreshing wallet context balance...");
        // The wallet context will automatically update the balance
      } catch (error) {
        console.error("Error refreshing balance:", error);
      }
    }
  };

  // Timer update for Active Bets - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaceBet = async () => {
    // Check if wallet is connected (same logic as header)
    const isWalletConnected = wcConnected || isConnected;
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
          currentChain
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
          currentChain
        )} (including gas fees) on ${currentNetwork}. Current balance: ${formatBalance(
          currentBalance
        )} ${getChainName(currentChain)}`
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
        </Animated.View>
      )}

      {/* Timeframe Selection */}
      <Animated.View style={[styles.section, timeframeAnimatedStyle]}>
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
      </Animated.View>

      {/* Bet Amount */}
      <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
        <Text style={styles.sectionTitle}>
          Bet Amount ({networkConfig.nativeCurrency.symbol})
        </Text>

        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <MaterialCommunityIcons name="wallet" size={16} color="#666" />
          <Text style={styles.balanceText}>
            {isWalletConnected
              ? `Available: ${formatBalance(currentBalance)} ${getChainName(
                  currentChain
                )} (${currentNetwork})`
              : "Connect wallet to see balance"}
          </Text>
          {isWalletConnected && (
            <TouchableOpacity
              onPress={refreshBalance}
              style={styles.refreshButton}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={14}
                color="#3b82f6"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.betInputContainer}>
          <TextInput
            style={[
              styles.betInput,
              hasInsufficientBalance && styles.betInputError,
            ]}
            value={betAmount}
            onChangeText={setBetAmount}
            keyboardType="numeric"
            placeholder={`Enter amount in ${networkConfig.nativeCurrency.symbol}`}
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={styles.maxButton}
            onPress={() => setBetAmount(maxSafeBet.toFixed(4))}
            disabled={maxSafeBet <= 0}
          >
            <Text style={styles.maxButtonText}>Max</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Warning */}
        {isWalletConnected && hasInsufficientBalance && (
          <View style={styles.balanceWarning}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color="#ef4444"
            />
            <Text style={styles.balanceWarningText}>
              Insufficient balance. You only have{" "}
              {formatBalance(currentBalance)} {getChainName(currentChain)} on{" "}
              {currentNetwork}
            </Text>
          </View>
        )}

        {/* Gas Fee Info */}
        {isWalletConnected && (
          <View style={styles.gasInfo}>
            <MaterialCommunityIcons name="gas-station" size={14} color="#666" />
            <Text style={styles.gasInfoText}>
              Gas fees (~0.001 {getChainName(currentChain)}) will be added to
              your bet amount on {currentNetwork}
            </Text>
          </View>
        )}

        {/* Max Safe Bet Info */}
        {isWalletConnected && currentBalance > 0 && (
          <View style={styles.maxBetInfo}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={14}
              color="#10b981"
            />
            <Text style={styles.maxBetInfoText}>
              Max safe bet: {formatBalance(maxSafeBet)}{" "}
              {getChainName(currentChain)} (90% of balance) on {currentNetwork}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Bet Type */}
      <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
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
      </Animated.View>

      {/* Place Bet Button */}
      <TouchableOpacity
        style={[
          styles.placeBetButton,
          ((!wcConnected && !isConnected) || hasInsufficientBalance) &&
            styles.placeBetButtonDisabled,
        ]}
        onPress={handlePlaceBet}
        disabled={(!wcConnected && !isConnected) || hasInsufficientBalance}
      >
        <Text
          style={[
            styles.placeBetButtonText,
            ((!wcConnected && !isConnected) || hasInsufficientBalance) &&
              styles.placeBetButtonTextDisabled,
          ]}
        >
          {!wcConnected && !isConnected
            ? "Connect Wallet to Bet"
            : hasInsufficientBalance
            ? "Insufficient Balance"
            : "Place Bet"}
        </Text>
      </TouchableOpacity>

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
  section: {
    paddingHorizontal: 24,
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
  // Balance verification styles
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  balanceText: {
    color: "#666666",
    fontSize: 14,
  },
  betInputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  balanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  balanceWarningText: {
    color: "#ef4444",
    fontSize: 12,
  },
  gasInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  gasInfoText: {
    color: "#666666",
    fontSize: 12,
  },
  placeBetButtonDisabled: {
    backgroundColor: "#666666",
    opacity: 0.6,
  },
  placeBetButtonTextDisabled: {
    color: "#cccccc",
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
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  maxButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  maxBetInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  maxBetInfoText: {
    color: "#10b981",
    fontSize: 12,
  },
});

export default BinaryOptionsScreen;
