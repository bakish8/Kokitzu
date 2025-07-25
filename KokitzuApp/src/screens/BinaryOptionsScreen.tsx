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
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import {
  GET_COINS,
  GET_CRYPTO_PRICES,
  GET_ACTIVE_BETS,
  GET_BET_HISTORY,
  PLACE_BET,
  PREPARE_BLOCKCHAIN_TRANSACTION,
  RECORD_BLOCKCHAIN_BET,
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
import SimpleCryptoModal from "../components/SimpleCryptoModal";
import {
  formatEthWithUsd,
  formatUsd,
  ethToUsd,
  usdToEth,
} from "../utils/currencyUtils";
import { useEthPrice } from "../contexts/EthPriceContext";
import PriceChart from "../components/PriceChart";
import priceDataService from "../services/priceDataService";
import { binaryOptionsContract } from "../services/binaryOptionsContract";
import { FONTS } from "../constants/fonts";
import COLORS from "../constants/colors";
import { getSupportedAssets } from "../services/priceDataService";
import { getCurrentNetworkName } from "../utils/networkUtils";
import { apiService } from "../services/apiService";
import { getApiUrl } from "../config/network";
import TradeSummaryModal from "../components/TradeSummaryModal";

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

  // Get wallet balance and address for verification
  const { balance, isConnected, provider, walletAddress } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();

  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // 🔥 NEW: Real-time bet tracking state
  const [activeBets, setActiveBets] = useState<
    Array<{
      betId: string;
      optionId: string;
      transactionHash: string;
      cryptoSymbol: string;
      betType: string;
      amount: number;
      expiresAt: string;
      countdownInterval?: NodeJS.Timeout;
      statusCheckInterval?: NodeJS.Timeout;
    }>
  >([]);

  // USD-only betting - no currency toggle needed
  const inputInUsd = true;

  // 🚀 NEW: Crypto selector modal state
  const [isCryptoSelectorVisible, setIsCryptoSelectorVisible] = useState(false);

  // Use the WalletConnect modal hook (same as header)
  const {
    isConnected: wcConnected,
    address: wcAddress,
    provider: wcProvider,
  } = useWalletConnectModal();

  // Debug connection status (same logic as header)
  const isWalletConnected = wcConnected || isConnected;

  // Debug wallet connection status and initialize contract
  useEffect(() => {
    console.log("🔍 WALLET CONNECTION DEBUG:");
    console.log(`   └─ wcConnected: ${wcConnected}`);
    console.log(`   └─ isConnected: ${isConnected}`);
    console.log(`   └─ wcAddress: ${wcAddress}`);
    console.log(`   └─ walletAddress: ${walletAddress}`);
    console.log(`   └─ isWalletConnected: ${isWalletConnected}`);
    console.log(`   └─ balance: ${balance}`);

    // Initialize contract when wallet connects
    if (wcConnected && wcProvider) {
      console.log("🔧 Initializing contract with connected wallet...");
      binaryOptionsContract.init(wcProvider).catch((error) => {
        console.error(
          "❌ Failed to initialize contract on wallet connect:",
          error
        );
      });
    } else if (!wcConnected) {
      // Reset contract when wallet disconnects
      binaryOptionsContract.reset();
    }
  }, [
    wcConnected,
    isConnected,
    wcAddress,
    walletAddress,
    isWalletConnected,
    balance,
    wcProvider,
  ]);

  // Get ETH price for USD conversion (CoinGecko price, Sepolia ETH treated as regular ETH)
  const { ethPrice } = useEthPrice();

  // Debug: Log the USD conversion values
  useEffect(() => {
    if (ethPrice > 0 && betAmount && parseFloat(betAmount) > 0) {
      const betAmountValue = parseFloat(betAmount);
      const ethEquivalent = usdToEth(betAmountValue, ethPrice);
      console.log("💰 USD CONVERSION DEBUG:");
      console.log(`   └─ Chainlink ETH Price: $${ethPrice.toLocaleString()}`);
      console.log(`   └─ Bet Amount: $${betAmountValue}`);
      console.log(`   └─ ETH Equivalent: Ξ ${ethEquivalent.toFixed(6)} ETH`);
      console.log(
        `   └─ Back to USD: $${ethToUsd(ethEquivalent, ethPrice).toFixed(2)}`
      );
    }
  }, [ethPrice, betAmount]);

  // Apollo client for manual queries
  const client = useApolloClient();

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
    pollInterval: 120000, // 2 minutes
  });

  const [placeBet] = useMutation(PLACE_BET, {
    refetchQueries: [
      { query: GET_ACTIVE_BETS, variables: { userId: "user-1" } },
    ],
  });

  // 🔥 REMOVED: GraphQL mutations replaced with REST API calls

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

  // Calculate max bet in USD (full ETH balance converted to USD)
  const maxBetEth = currentBalance; // Full ETH balance
  const maxBetUsd = ethToUsd(maxBetEth, ethPrice);

  // USD-only betting, so max bet is in USD
  const maxBet = maxBetUsd;

  // Check if bet amount exceeds available USD balance
  const availableUsdBalance = ethToUsd(currentBalance, ethPrice);
  const hasInsufficientBalance =
    betAmountValue > availableUsdBalance && betAmountValue > 0;

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

  // Effect to handle bet amount initialization (now handled by TradingContext)
  useEffect(() => {
    if (isWalletConnected && currentBalance > 0 && !shouldShowLoading) {
      console.log(
        "🌐 Network changed to",
        currentNetwork,
        "bet amount managed by TradingContext"
      );
    }
  }, [currentNetwork, currentBalance, isWalletConnected, shouldShowLoading]);

  // Timer update for Active Bets - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get countdown time for active bets
  const getActiveBetCountdown = (expiresAt: string) => {
    // Reference timerTick to ensure re-render every second
    const now = new Date(Date.now() + timerTick * 0);

    // 🔥 FIX: Handle both ISO strings and Unix timestamps
    let expiry: Date;
    try {
      // Check if it's a Unix timestamp (number as string)
      const timestamp = parseInt(expiresAt, 10);

      if (!isNaN(timestamp) && timestamp.toString() === expiresAt) {
        // It's a Unix timestamp in milliseconds
        console.log(`🕐 Parsing Unix timestamp: ${expiresAt}`);
        expiry = new Date(timestamp);
      } else {
        // It's an ISO string
        // console.log(`🕐 Parsing ISO string: ${expiresAt}`);
        expiry = new Date(expiresAt);
      }

      // Check if date is valid
      if (isNaN(expiry.getTime())) {
        console.warn(`⚠️ Invalid expiry date: ${expiresAt}`);
        return "⏰ INVALID";
      }

      // console.log(`✅ Successfully parsed expiry: ${expiry.toISOString()}`);
    } catch (error) {
      console.warn(`⚠️ Error parsing expiry date: ${expiresAt}`, error);
      return "⏰ ERROR";
    }

    const timeLeft = expiry.getTime() - now.getTime();
    console.log(
      `⏰ Time left: ${timeLeft}ms (${Math.floor(timeLeft / 1000)}s)`
    );

    if (timeLeft <= 0) return "⏰ EXPIRED";

    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Ensure no NaN values
    if (isNaN(minutes) || isNaN(seconds)) {
      console.warn(`⚠️ NaN in countdown calculation:`, {
        timeLeft,
        totalSeconds,
        minutes,
        seconds,
        expiresAt,
        now: now.toISOString(),
        expiry: expiry.toISOString(),
      });
      return "⏰ ERROR";
    }

    return `⏰ ${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Function to set bet amount to max bet in USD
  const setBetAmountToMax = () => {
    const formattedMaxBet = maxBetUsd.toFixed(2);
    setBetAmount(formattedMaxBet);
  };

  // 🔥 NEW: Real-time bet tracking functions
  const startBetTracking = (bet: {
    betId: string;
    optionId: string;
    transactionHash: string;
    cryptoSymbol: string;
    betType: string;
    amount: number;
    expiresAt: string;
  }) => {
    console.log("🎯 Starting real-time tracking for bet:", bet.betId);
    console.log("📊 Bet tracking details:", {
      betId: bet.betId,
      optionId: bet.optionId,
      transactionHash: bet.transactionHash,
      cryptoSymbol: bet.cryptoSymbol,
      betType: bet.betType,
      amount: bet.amount,
      expiresAt: bet.expiresAt,
    });

    // Create countdown timer
    const countdownInterval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(bet.expiresAt);
      const timeLeft = expiry.getTime() - now.getTime();

      if (timeLeft <= 0) {
        console.log(`⏰ Bet ${bet.betId} has expired! Checking for results...`);
        checkBetResults(bet.betId, bet.optionId);
        clearInterval(countdownInterval);
      } else {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        console.log(
          `⏰ Bet ${bet.betId} expires in ${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }
    }, 1000);

    // Create status check interval (every 30 seconds)
    const statusCheckInterval = setInterval(() => {
      checkBetResults(bet.betId, bet.optionId);
    }, 30000);

    // Add to active bets tracking
    console.log(`📝 Adding bet ${bet.betId} to activeBets array...`);
    setActiveBets((prev) => {
      const newActiveBets = [
        ...prev,
        {
          ...bet,
          countdownInterval,
          statusCheckInterval,
        },
      ];

      console.log(
        `📊 Active bets array updated - now has ${newActiveBets.length} bets`
      );
      console.log(
        `   └─ Bet IDs: ${newActiveBets.map((b) => b.betId).join(", ")}`
      );

      return newActiveBets;
    });

    // Schedule cleanup after expiry + 5 minutes (enough time for execution)
    setTimeout(() => {
      stopBetTracking(bet.betId);
    }, new Date(bet.expiresAt).getTime() - Date.now() + 300000); // +5 minutes
  };

  const stopBetTracking = (betId: string) => {
    console.log(`🛑 Stopping tracking for bet: ${betId}`);

    setActiveBets((prev) => {
      const bet = prev.find((b) => b.betId === betId);
      if (bet) {
        if (bet.countdownInterval) clearInterval(bet.countdownInterval);
        if (bet.statusCheckInterval) clearInterval(bet.statusCheckInterval);
      }
      return prev.filter((b) => b.betId !== betId);
    });
  };

  const checkBetResults = async (betId: string, optionId: string) => {
    try {
      console.log(
        `🔍 Checking results for bet ${betId} (option ${optionId})...`
      );

      // First try to execute the option directly from the client if it's expired
      if (optionId && wcConnected) {
        try {
          // Contract should already be initialized from wallet connection
          // Check if option is expired and needs execution
          const isExpired = await binaryOptionsContract.isOptionExpired(
            optionId
          );

          if (isExpired) {
            console.log(
              `⏰ Option ${optionId} is expired, executing from client...`
            );

            // Execute the option directly from client
            const executedOption = await binaryOptionsContract.executeOption(
              optionId
            );

            console.log(`✅ Client-side execution successful:`, executedOption);

            // Show result immediately
            Alert.alert(
              executedOption.won
                ? "🎉 You Won!"
                : executedOption.isPush
                ? "🤝 Push/Tie - Refunded"
                : "😔 You Lost",
              `${selectedCrypto} ${betType} bet result:\n\n` +
                `Status: ${
                  executedOption.won
                    ? "WON"
                    : executedOption.isPush
                    ? "PUSH"
                    : "LOST"
                }\n` +
                `Entry: $${executedOption.entryPrice}\n` +
                `Exit: $${executedOption.exitPrice}\n` +
                `Payout: ${executedOption.payout} ETH`,
              [{ text: "View in Portfolio" }]
            );

            // Stop tracking this bet
            stopBetTracking(betId);
            return;
          }
        } catch (contractError) {
          console.error(`❌ Client-side execution failed:`, contractError);
          // Fall back to server-side checking
        }
      }

      // Fallback: Use REST API to check server-side results
      const apiUrl = await getApiUrl();
      const response = await fetch(`${apiUrl}/api/bets/${betId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const bet = responseData.data;

      if (bet) {
        console.log(`🎯 Found bet ${betId}:`, {
          status: bet.status,
          result: bet.result,
          entryPrice: bet.entryPrice,
          exitPrice: bet.exitPrice,
          payout: bet.payout,
          optionId: bet.optionId,
        });

        if (bet.status !== "ACTIVE") {
          console.log(`🎉 Bet ${betId} is complete! Status: ${bet.status}`);

          // Show notification
          Alert.alert(
            bet.status === "WON"
              ? "🎉 You Won!"
              : bet.status === "LOST"
              ? "😔 You Lost"
              : bet.status === "PUSH"
              ? "🤝 Push/Tie - Refunded"
              : bet.status === "INVALID_TRANSACTION"
              ? "❌ Transaction Failed"
              : "🔄 Bet Complete",
            `${bet.cryptoSymbol} ${bet.betType} bet result:\n\n` +
              `Status: ${bet.status}\n` +
              `Entry: $${bet.entryPrice}\n` +
              `Exit: $${bet.exitPrice || "N/A"}\n` +
              `Payout: ${bet.payout || 0} ETH`,
            [{ text: "View in Portfolio" }]
          );

          // Stop tracking this bet
          stopBetTracking(betId);
        } else {
          console.log(`⏳ Bet ${betId} still active, continuing to track...`);
        }
      } else {
        console.log(`❓ Bet ${betId} not found in server response`);
      }
    } catch (error) {
      console.error(`❌ Error checking bet results for ${betId}:`, error);
    }
  };

  const handlePlaceBetOLD_DISABLED = async () => {
    // Check if wallet is connected and address is available for blockchain betting
    if (!isWalletConnected || !walletAddress) {
      Alert.alert(
        "Wallet Not Connected",
        "Please connect your wallet to place blockchain bets. Address is required for smart contract interaction."
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

    // 🚨 Check if ETH price is loaded
    if (!ethPrice || ethPrice <= 0) {
      Alert.alert(
        "Price Loading Error",
        `ETH price not available: $${ethPrice}\n\nPlease wait for prices to load before betting.`
      );
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
    const betAmountEth = usdToEth(betAmountValue, ethPrice);

    // 🚨 SAFETY CHECK: Prevent ridiculous bet amounts
    if (betAmountEth > 0.1) {
      // More than 0.1 ETH (~$300) seems wrong
      Alert.alert(
        "⚠️ Conversion Error",
        `Bet amount seems wrong: ${betAmountEth.toFixed(4)} ETH (~$${(
          betAmountEth * ethPrice
        ).toFixed(
          0
        )})\n\nExpected ~0.01 ETH for $40 bet.\n\nETH Price: $${ethPrice}\nInput: $${betAmountValue}\n\nPlease check the conversion.`
      );
      return;
    }

    const gasBuffer = 0.001;
    if (betAmountEth + gasBuffer > currentBalance) {
      Alert.alert(
        "Insufficient Balance for Gas",
        `You need at least ${formatBalance(
          betAmountEth + gasBuffer
        )} ${getChainName(
          networkConfig.chainId
        )} (including gas fees) on ${currentNetwork}. Current balance: ${formatBalance(
          currentBalance
        )} ${getChainName(networkConfig.chainId)}`
      );
      return;
    }

    try {
      console.log("🔗 KokitzuApp: Placing BLOCKCHAIN bet...");
      console.log(
        `   └─ Wallet: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(
          -4
        )}`
      );
      console.log(`   └─ Asset: ${selectedCrypto} ${betType}`);

      // 🚨 DEBUG: Show all values to identify conversion bug
      console.log("🐛 DEBUG CURRENCY CONVERSION:");
      console.log(`   └─ betAmount (input): ${betAmount}`);
      console.log(`   └─ betAmountValue (parsed): ${betAmountValue}`);
      console.log(`   └─ ethPrice: $${ethPrice}`);
      console.log(
        `   └─ Conversion: ${betAmountValue} USD ÷ ${ethPrice} = ${usdToEth(
          betAmountValue,
          ethPrice
        )} ETH`
      );
      console.log(`   └─ Expected ~0.01 ETH for $40 bet`);

      console.log(
        `   └─ Amount: ${usdToEth(betAmountValue, ethPrice).toFixed(6)} ETH`
      );
      console.log(`   └─ Timeframe: ${selectedTimeframe}`);

      const betResult = await placeBet({
        variables: {
          input: {
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: usdToEth(betAmountValue, ethPrice), // Convert USD to ETH for blockchain
            timeframe: selectedTimeframe,
            useBlockchain: true, // Always use blockchain
            walletAddress: walletAddress || "", // Send connected wallet address
          },
        },
      });

      console.log(
        "✅ KokitzuApp: Blockchain bet placed successfully!",
        betResult.data
      );

      // Show detailed success alert
      const bet = betResult.data?.placeBet;
      const successMessage = bet?.blockchain
        ? `Blockchain bet placed!\nTransaction: ${bet.blockchain.transactionHash}\nOption ID: ${bet.blockchain.optionId}`
        : "Bet placed successfully!";

      Alert.alert("🔗 Blockchain Success", successMessage);

      // Reset to max safe bet instead of hardcoded 100
      updateBetAmountToMaxSafe(currentBalance);
    } catch (error) {
      console.error("❌ KokitzuApp: Blockchain bet failed:", error);

      // Enhanced error handling
      let errorMessage = "Failed to place blockchain bet. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds for gas fees. Please add more ETH to your wallet.";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        }
      }

      Alert.alert("❌ Blockchain Error", errorMessage);
    }
  };

  // 🔥 MAIN BET FUNCTION: User Always Pays Model
  // User signs and pays transaction directly - Server pays NOTHING!
  const handlePlaceBetUserPays = async () => {
    console.log("🚀 STARTING handlePlaceBetUserPays function");
    console.log("   └─ Time:", new Date().toISOString());

    // Same validation as regular handlePlaceBet
    // Only check WalletConnect connection
    console.log("🔍 WALLET VALIDATION DEBUG:");
    console.log(`   └─ wcConnected: ${wcConnected}`);
    console.log(`   └─ wcAddress: ${wcAddress}`);
    console.log(`   └─ wcProvider: ${!!wcProvider}`);

    if (!wcConnected || !wcAddress) {
      Alert.alert(
        "WalletConnect Not Connected",
        "Please connect your wallet via WalletConnect to place blockchain bets.\n\n" +
          `Debug Info:\n` +
          `WalletConnect: ${wcConnected ? "Connected" : "Not Connected"}\n` +
          `Address: ${wcAddress || "None"}`
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

    if (!ethPrice || ethPrice <= 0) {
      Alert.alert(
        "Price Loading Error",
        `ETH price not available: $${ethPrice}\n\nPlease wait for prices to load before betting.`
      );
      return;
    }

    const betAmountEth = usdToEth(betAmountValue, ethPrice);

    // Safety check for conversion
    if (betAmountEth > 0.1) {
      Alert.alert(
        "⚠️ Conversion Error",
        `Bet amount seems wrong: ${betAmountEth.toFixed(4)} ETH (~$${(
          betAmountEth * ethPrice
        ).toFixed(
          0
        )})\n\nExpected ~0.01 ETH for $40 bet.\n\nETH Price: $${ethPrice}\nInput: $${betAmountValue}\n\nPlease check the conversion.`
      );
      return;
    }

    try {
      console.log("🔥 USER PAYS MODEL: Preparing transaction for user...");
      console.log(`   └─ User wallet will pay gas + bet amount`);
      console.log(`   └─ Server wallet needs ZERO ETH! 🎉`);

      // Step 1: Get transaction data from server using REST API
      console.log("🔥 USER PAYS: Preparing transaction via REST API...");
      await apiService.init();

      let prepResult;
      try {
        prepResult = await apiService.prepareTransaction({
          cryptoSymbol: selectedCrypto,
          betType: betType,
          amount: betAmountEth,
          timeframe: selectedTimeframe,
          walletAddress: wcAddress || "",
        });
      } catch (prepError: any) {
        console.error("❌ Error preparing transaction:", prepError);

        // Check if it's a rate limiting error
        if (
          prepError?.message?.includes("Too Many Requests") ||
          prepError?.message?.includes("-32005")
        ) {
          Alert.alert(
            "⚠️ Rate Limit Exceeded",
            "Too many requests to the blockchain network. Please wait a few minutes and try again.\n\n" +
              "This is a temporary issue with the network provider."
          );
          return;
        }

        throw prepError;
      }

      const txData = prepResult.transactionData;
      if (!txData) {
        throw new Error("Failed to prepare transaction");
      }

      console.log("📝 Transaction prepared. User will sign...");
      console.log(`   └─ To: ${txData.to}`);
      console.log(
        `   └─ Value: ${(parseFloat(txData.value) / 1e18).toFixed(6)} ETH`
      );
      console.log(`   └─ Gas Limit: ${txData.gasLimit}`);

      // Step 2: USER SIGNS AND PAYS TRANSACTION DIRECTLY
      console.log("🔥 USER PAYS: Sending transaction to user's wallet...");

      let txHash;

      // 🔥 MOBILE APP: All wallets (including MetaMask mobile) use WalletConnect
      console.log("🔍 PROVIDER DEBUG:");
      console.log(`   └─ wcProvider exists: ${!!wcProvider}`);
      console.log(
        `   └─ wcProvider type: ${wcProvider ? typeof wcProvider : "undefined"}`
      );
      console.log(
        `   └─ wcProvider.request: ${
          wcProvider ? typeof wcProvider.request : "undefined"
        }`
      );
      console.log(`   └─ wcConnected: ${wcConnected}`);
      console.log(`   └─ isConnected: ${isConnected}`);
      console.log(`   └─ provider exists: ${!!provider}`);
      console.log(
        `   └─ provider type: ${provider ? typeof provider : "undefined"}`
      );
      console.log(
        `   └─ provider.sendTransaction: ${
          provider ? typeof provider.sendTransaction : "undefined"
        }`
      );
      console.log(
        `   └─ provider.getSigner: ${
          provider ? typeof provider.getSigner : "undefined"
        }`
      );

      if (wcProvider && wcConnected) {
        console.log("📱 Using Mobile Wallet (WalletConnect protocol)");
        console.log(
          `   └─ MetaMask Mobile, Trust Wallet, etc. all use WalletConnect`
        );
        console.log("🔥 USER PAYS EVERYTHING - Server pays NOTHING!");

        // 🔍 WALLET CONNECTION DEBUGGING
        console.log("🔍 WALLET CONNECTION STATUS:");
        console.log(`   └─ wcConnected: ${wcConnected}`);
        console.log(`   └─ isConnected: ${isConnected}`);
        console.log(`   └─ wcAddress: ${wcAddress}`);
        console.log(`   └─ walletAddress: ${walletAddress}`);
        console.log(`   └─ balance: ${balance} ETH`);

        // 🔍 CALCULATE AMOUNTS FOR LOGGING
        const ethAmount = parseFloat(txData.value) / 1e18;
        const usdAmount = ethAmount * ethPrice;
        const totalCostEth = ethAmount + 0.0006; // Estimated gas cost
        const totalCostUsd = totalCostEth * ethPrice;

        // 🔍 DEBUG TRANSACTION VALUES BEFORE METAMASK
        console.log("🔍 TRANSACTION VALUE DEBUG:");
        console.log(`   └─ txData.value (from server): ${txData.value}`);
        console.log(`   └─ txData.value type: ${typeof txData.value}`);
        console.log(`   └─ Converting to ETH: ${ethAmount.toFixed(8)} ETH`);
        console.log(`   └─ Expected ~0.01 ETH for $40 bet`);

        // 🚨 FIX: Convert decimal wei string to hex for wallet compatibility
        // Use BigInt to avoid precision loss with large numbers
        const valueInWei = txData.value;
        const valueInHex = `0x${BigInt(valueInWei).toString(16)}`;

        console.log("🔧 VALUE FORMAT CONVERSION (BigInt):");
        console.log(`   └─ Original (decimal): ${valueInWei}`);
        console.log(`   └─ Original as BigInt: ${BigInt(valueInWei)}`);
        console.log(`   └─ Converted (hex): ${valueInHex}`);
        console.log(`   └─ Back to decimal: ${BigInt(valueInHex)}`);
        console.log(
          `   └─ Back to ETH: ${(Number(BigInt(valueInHex)) / 1e18).toFixed(
            8
          )} ETH`
        );

        // Verify the conversion is exact
        if (BigInt(valueInWei).toString() === BigInt(valueInHex).toString()) {
          console.log("✅ Conversion is exact - no precision loss");
        } else {
          console.warn("⚠️ Conversion has precision loss!");
          console.warn(`   └─ Original: ${BigInt(valueInWei)}`);
          console.warn(`   └─ After hex conversion: ${BigInt(valueInHex)}`);
        }

        // 🔧 INCREASE GAS LIMIT: createOption needs more gas
        const increasedGasLimit = 500000; // Increased from 300k to 500k
        const gasLimitHex = `0x${increasedGasLimit.toString(16)}`;

        console.log("🔧 GAS LIMIT ADJUSTMENT:");
        console.log(`   └─ Original gas limit: ${txData.gasLimit}`);
        console.log(`   └─ Increased gas limit: ${increasedGasLimit}`);
        console.log(`   └─ Gas limit (hex): ${gasLimitHex}`);
        console.log(`   └─ Reason: Previous tx failed with 'out of gas'`);

        const transaction = {
          from: wcAddress || "",
          to: txData.to,
          data: txData.data,
          value: valueInHex, // 🔧 FIX: Use hex format for wallet
          gasLimit: gasLimitHex, // 🔧 FIX: Use increased gas limit
        };

        console.log("📝 Transaction details:", transaction);

        console.log("🔍 FINAL VALUE BEING SENT TO WALLET:");
        console.log(`   └─ transaction.value (hex): ${transaction.value}`);
        console.log(
          `   └─ transaction.value (decimal): ${BigInt(transaction.value)}`
        );
        console.log(
          `   └─ transaction.value (ETH): ${(
            Number(BigInt(transaction.value)) / 1e18
          ).toFixed(8)} ETH`
        );
        console.log(
          `   └─ transaction.value (USD): $${(
            (Number(BigInt(transaction.value)) / 1e18) *
            ethPrice
          ).toFixed(2)}`
        );
        console.log("");
        console.log("💰 WALLET APPROVAL BREAKDOWN:");
        const finalEthAmountForDisplay = Number(BigInt(valueInHex)) / 1e18;
        const finalUsdAmountForDisplay = finalEthAmountForDisplay * ethPrice;
        const estimatedGasCostEth = 0.0015; // Increased from 0.0006 to 0.0015 for 500k gas
        const totalCostWithGas = finalEthAmountForDisplay + estimatedGasCostEth;
        const totalCostUsdWithGas = totalCostWithGas * ethPrice;

        console.log(
          `   └─ 📊 BET AMOUNT: ${finalEthAmountForDisplay.toFixed(
            6
          )} ETH (~$${finalUsdAmountForDisplay.toFixed(2)})`
        );
        console.log(
          `   └─ ⛽ EST. GAS COST: ~${estimatedGasCostEth} ETH (~$${(
            estimatedGasCostEth * ethPrice
          ).toFixed(2)})`
        );
        console.log(
          `   └─ 💸 TOTAL YOU PAY: ~${totalCostWithGas.toFixed(
            6
          )} ETH (~$${totalCostUsdWithGas.toFixed(2)})`
        );
        console.log("");
        console.log("✅ EXPECTED IN METAMASK:");
        console.log(`   └─ Transaction Value: ${ethAmount.toFixed(6)} ETH`);
        console.log(`   └─ Should show: ~$${usdAmount.toFixed(0)} bet + gas`);
        console.log(`   └─ ETH Price Used: $${ethPrice.toFixed(0)}`);

        // Additional verification
        if (Math.abs(usdAmount - betAmountValue) > 2) {
          console.warn("⚠️ WARNING: USD amounts don't match!");
          console.warn(`   └─ Expected bet: $${betAmountValue}`);
          console.warn(`   └─ Sending to MetaMask: $${usdAmount.toFixed(2)}`);
          console.warn(
            `   └─ Difference: $${Math.abs(usdAmount - betAmountValue).toFixed(
              2
            )}`
          );
        } else {
          console.log("✅ USD amounts match perfectly!");
        }
        console.log("🔍 About to call wcProvider.request...");
        console.log("🔍 wcProvider exists:", !!wcProvider);
        console.log("🔍 wcConnected:", wcConnected);
        console.log("🔍 isConnected:", isConnected);

        try {
          console.log("🚀 SENDING TRANSACTION REQUEST TO METAMASK MOBILE...");
          console.log("⏳ Waiting for user approval in MetaMask Mobile app...");
          console.log(
            "📱 Check your MetaMask Mobile app for transaction approval prompt"
          );

          // 🔍 FINAL SUMMARY BEFORE METAMASK
          console.log("");
          console.log("📋 FINAL TRANSACTION SUMMARY FOR WALLET:");
          console.log(
            `   └─ 🎯 BET: $${betAmountValue} ${selectedCrypto} ${betType}`
          );
          const finalEthAmount = Number(BigInt(transaction.value)) / 1e18;
          const finalUsdAmount = finalEthAmount * ethPrice;
          console.log(
            `   └─ 💰 AMOUNT: ${finalEthAmount.toFixed(
              6
            )} ETH ($${finalUsdAmount.toFixed(2)})`
          );
          console.log(`   └─ 🌐 NETWORK: Sepolia Testnet`);
          console.log(`   └─ 📍 CONTRACT: ${txData.to}`);
          console.log(`   └─ 👤 FROM: ${walletAddress}`);
          console.log(
            `   └─ ⛽ GAS LIMIT: ${increasedGasLimit} (increased from ${txData.gasLimit})`
          );
          console.log("");
          console.log("🔔 WALLET SHOULD NOW SHOW APPROVAL MODAL!");
          console.log("   └─ Look for notification in your wallet app");
          console.log("   └─ Expected amount: ~$40 worth of ETH (0.01079 ETH)");
          console.log("   └─ Network: Sepolia Testnet");
          console.log(
            "   └─ FIXED: Using hex format to prevent 18+ ETH display bug"
          );
          console.log("");

          // Show user exactly what to expect in wallet with corrected hex values and gas
          const alertEthAmount = Number(BigInt(valueInHex)) / 1e18;
          const alertUsdAmount = alertEthAmount * ethPrice;
          const alertGasCostUsd = 0.0015 * ethPrice; // Updated gas estimate
          const alertTotalCost = alertUsdAmount + alertGasCostUsd;

          Alert.alert(
            "📱 Wallet Approval Expected",
            `VERIFY THESE AMOUNTS IN YOUR WALLET:\n\n` +
              `💰 Transaction Value: ${alertEthAmount.toFixed(6)} ETH\n` +
              `💵 USD Value: $${alertUsdAmount.toFixed(2)}\n` +
              `⛽ + Gas: ~$${alertGasCostUsd.toFixed(
                2
              )} (increased gas limit)\n` +
              `💸 Total Cost: ~$${alertTotalCost.toFixed(2)}\n\n` +
              `🔧 FIXED: Hex format + increased gas limit\n` +
              `✅ If amounts match (~$40 + gas), APPROVE\n` +
              `❌ If still wrong, REJECT and report bug`,
            [
              { text: "Continue to Wallet", style: "default" },
              { text: "Cancel", style: "cancel" },
            ]
          );

          // Only use WalletConnect - ensure it's connected
          if (!wcProvider || typeof wcProvider.request !== "function") {
            throw new Error(
              "WalletConnect provider not available. Please connect via WalletConnect."
            );
          }

          if (!wcConnected) {
            throw new Error(
              "WalletConnect not connected. Please connect your wallet first."
            );
          }

          console.log("🔧 Using WalletConnect provider.request()");
          txHash = await wcProvider.request({
            method: "eth_sendTransaction",
            params: [transaction],
          });

          console.log("🔍 Transaction request completed successfully");

          console.log(
            "✅ SUCCESS: MetaMask returned transaction hash:",
            txHash
          );
          console.log("🔍 Transaction hash type:", typeof txHash);
          console.log(
            "🔍 Transaction hash length:",
            typeof txHash === "string" ? txHash.length : "N/A"
          );

          // 🔍 TRANSACTION VERIFICATION
          if (
            typeof txHash === "string" &&
            txHash.length === 66 &&
            txHash.startsWith("0x")
          ) {
            console.log("✅ Transaction hash format looks valid");
            console.log(
              `🔗 Etherscan link: https://sepolia.etherscan.io/tx/${txHash}`
            );
          } else {
            console.warn("⚠️ Transaction hash format looks invalid:");
            console.warn(`   └─ Expected: 0x followed by 64 hex characters`);
            console.warn(`   └─ Received: ${txHash}`);
          }
        } catch (txError: any) {
          console.error("❌ TRANSACTION REQUEST FAILED:");
          console.error(
            "   └─ Error type:",
            txError?.constructor?.name || "Unknown"
          );
          console.error(
            "   └─ Error message:",
            txError?.message || "No message"
          );
          console.error("   └─ Error code:", txError?.code || "No code");
          console.error("   └─ Full error:", txError);

          // Check for specific error types
          if (txError?.message?.includes("User rejected")) {
            throw new Error(
              "❌ You rejected the transaction in MetaMask Mobile"
            );
          } else if (txError?.message?.includes("insufficient funds")) {
            throw new Error("❌ Insufficient funds for gas + bet amount");
          } else if (txError?.code === 4001) {
            throw new Error("❌ Transaction rejected by user in MetaMask");
          } else {
            throw new Error(
              `❌ Transaction failed: ${txError?.message || "Unknown error"}`
            );
          }
        }
      } else {
        throw new Error(
          "WalletConnect not connected. Please connect your wallet via WalletConnect."
        );
      }

      console.log("📝 Recording bet in database...");

      // Get entry price from transaction preparation result
      const entryPrice = prepResult.entryPrice || 0;

      if (!entryPrice) {
        throw new Error(`❌ Cannot get entry price for ${selectedCrypto}`);
      }

      console.log(`📊 Entry price: $${entryPrice.toLocaleString()}`);

      // Step 3: Record the bet in database with RETRY LOGIC
      let recordingAttempts = 0;
      let recordingSuccess = false;
      let betData: any = null;

      while (!recordingSuccess && recordingAttempts < 3) {
        recordingAttempts++;
        console.log(`🔄 Recording attempt ${recordingAttempts}/3...`);

        try {
          console.log("🔄 Sending recordBlockchainBet mutation with:", {
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: betAmountEth,
            timeframe: selectedTimeframe,
            transactionHash: txHash,
            walletAddress: walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "null",
            entryPrice: entryPrice,
          });

          const recordResult = await apiService.recordBet({
            cryptoSymbol: selectedCrypto,
            betType: betType,
            amount: betAmountEth,
            timeframe: selectedTimeframe,
            transactionHash: String(txHash),
            walletAddress: wcAddress || "",
            entryPrice: entryPrice, // ✅ FIX: Include entry price
          });

          console.log("📨 REST API response received:", recordResult);

          betData = recordResult as any;

          if (!betData) {
            throw new Error(
              "No data returned from recordBlockchainBet mutation"
            );
          }

          recordingSuccess = true;
          console.log("✅ Bet recorded successfully!");
          console.log(`   └─ Bet ID: ${betData?.id}`);
          console.log(`   └─ Option ID: ${betData?.optionId}`);
          console.log(`   └─ Full bet data:`, betData);
        } catch (recordError: any) {
          console.error("❌ Recording attempt failed:");
          console.error(`   └─ Attempt: ${recordingAttempts}/3`);
          console.error(
            `   └─ Error type: ${recordError?.constructor?.name || "Unknown"}`
          );
          console.error(
            `   └─ Error message: ${recordError?.message || "No message"}`
          );

          // Log GraphQL-specific errors
          if (recordError?.graphQLErrors?.length > 0) {
            console.error(`   └─ GraphQL errors:`, recordError.graphQLErrors);
          }

          if (recordError?.networkError) {
            console.error(`   └─ Network error:`, recordError.networkError);
          }

          console.error(`   └─ Full error object:`, recordError);

          if (recordingAttempts < 3) {
            console.log("⏳ Waiting 2 seconds before retry...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            // Final attempt failed - show warning but don't crash
            console.error(
              "🚨 CRITICAL: Failed to record bet after 3 attempts!"
            );
            console.error(
              "   └─ Transaction was successful but not recorded in database"
            );
            console.error(`   └─ Transaction Hash: ${txHash}`);
            console.error(
              "   └─ User should contact support with this transaction hash"
            );

            Alert.alert(
              "⚠️ Recording Warning",
              `Your bet transaction was successful but we had trouble recording it in our database.\n\n` +
                `Transaction: ${txHash}\n\n` +
                `Please save this transaction hash and contact support if you don't see your bet results.`,
              [{ text: "OK, I'll Save This" }]
            );
          }
        }
      }

      // 🔥 NEW: START REAL-TIME BET TRACKING
      if (recordingSuccess && betData) {
        console.log("🎯 STARTING REAL-TIME BET TRACKING:");
        console.log(`   └─ Bet ID: ${betData.id}`);
        console.log(`   └─ Option ID: ${betData.optionId}`);
        console.log(`   └─ Expires at: ${betData.expiresAt}`);

        // Start tracking this bet with countdown and auto-updates
        startBetTracking({
          betId: String(betData.id),
          optionId: String(betData.optionId),
          transactionHash: String(txHash),
          cryptoSymbol: String(selectedCrypto),
          betType: String(betType),
          amount: betAmountEth,
          expiresAt: String(betData.expiresAt),
        });
      }

      console.log("✅ EVERYTHING SUCCESSFUL!");
      console.log("   └─ User paid transaction");
      console.log("   └─ Bet recorded in database");
      console.log("   └─ Transaction hash:", txHash);
      console.log("   └─ Real-time tracking started");

      // Success - User successfully paid!
      Alert.alert(
        "🎉 BET PLACED SUCCESSFULLY!",
        `Bet placed & tracking started!\n\n• YOUR wallet paid: ${betAmountEth.toFixed(
          4
        )} ETH + gas\n• Bet ID: ${betData?.id || "Unknown"}\n• Option ID: ${
          betData?.optionId || "Unknown"
        }\n• Transaction: ${txHash}\n\n⏰ Real-time tracking active!\n📱 You'll get notifications when bet expires and results are ready!`,
        [
          {
            text: "OK",
            onPress: () => {
              console.log("🎯 BET PLACEMENT COMPLETE:");
              console.log(`   └─ Transaction Hash: ${txHash}`);
              console.log(`   └─ Amount: ${betAmountEth.toFixed(6)} ETH`);
              console.log(`   └─ Direction: ${selectedCrypto} ${betType}`);
              console.log(`   └─ Timeframe: ${selectedTimeframe}`);
              console.log(`   └─ User wallet: ${walletAddress}`);
              console.log("");
              console.log("📱 TO SEE RESULTS:");
              console.log("   1. Switch to Portfolio tab");
              console.log("   2. Wait for bet to expire (1 minute)");
              console.log("   3. Server will auto-execute and show WIN/LOSS");
              console.log("   4. Results will appear in bet history");
            },
          },
        ]
      );

      // Reset bet amount to 0
      setBetAmount("0");
    } catch (error) {
      console.error("❌ COMPLETE FAILURE in handlePlaceBetUserPays:");
      console.error("   └─ Error:", error);
      console.error(
        "   └─ Error type:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        "   └─ Error message:",
        error instanceof Error ? error.message : String(error)
      );

      Alert.alert(
        "❌ Transaction Failed",
        error instanceof Error
          ? error.message
          : "Unknown error occurred. Please try again."
      );
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    // Use timerTick to force recalculation every second
    const now = new Date(Date.now() + timerTick * 0); // Reference timerTick to ensure re-render
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const totalSeconds = Math.floor(diff / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    // For timeframes longer than 1 hour, show hours too
    if (min >= 60) {
      const hours = Math.floor(min / 60);
      const remainingMin = min % 60;
      return `${hours}:${remainingMin.toString().padStart(2, "0")}:${sec
        .toString()
        .padStart(2, "0")}`;
    }

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

  const chainId = provider?.network?.chainId || 1;
  const networkName = getCurrentNetworkName(chainId);
  const supportedAssets = getSupportedAssets(networkName);

  // After coinsData is loaded:
  const filteredCryptoList =
    coinsData?.coins?.filter((coin: Coin) =>
      supportedAssets.includes(coin.symbol)
    ) || [];

  const [isTradeSummaryModalVisible, setTradeSummaryModalVisible] =
    useState(false);

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
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Bet Type - MOVE THIS SECTION TO THE TOP */}
          <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Bet Direction</Text>
            <View style={styles.betTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.betTypeButton,
                  styles.betTypeButtonSmall,
                  betType === "UP" && styles.upButton,
                ]}
                onPress={() => setBetType("UP")}
              >
                <View style={styles.betTypeRow}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={18}
                    color={
                      betType === "UP" ? COLORS.textPrimary : COLORS.success
                    }
                  />
                  <Text
                    style={[
                      styles.betTypeText,
                      styles.betTypeTextSmall,
                      betType === "UP" && styles.upButtonText,
                    ]}
                  >
                    UP
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.betTypeButton,
                  styles.betTypeButtonSmall,
                  betType === "DOWN" && styles.downButton,
                ]}
                onPress={() => setBetType("DOWN")}
              >
                <View style={styles.betTypeRow}>
                  <MaterialCommunityIcons
                    name="trending-down"
                    size={18}
                    color={
                      betType === "DOWN" ? COLORS.textPrimary : COLORS.error
                    }
                  />
                  <Text
                    style={[
                      styles.betTypeText,
                      styles.betTypeTextSmall,
                      betType === "DOWN" && styles.downButtonText,
                    ]}
                  >
                    DOWN
                  </Text>
                </View>
              </TouchableOpacity>
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
              {/* 🚀 NEW: Crypto Selector Button */}
              <TouchableOpacity
                style={styles.cryptoSelectorButton}
                onPress={() => setIsCryptoSelectorVisible(true)}
              >
                <View style={styles.cryptoSelectorContent}>
                  <MaterialCommunityIcons
                    name={
                      selectedCrypto === "BTC"
                        ? "bitcoin"
                        : selectedCrypto === "ETH"
                        ? "ethereum"
                        : selectedCrypto === "LINK"
                        ? "link"
                        : selectedCrypto
                        ? "currency-usd"
                        : "plus-circle"
                    }
                    size={24}
                    color={COLORS.accent}
                  />
                  <Text style={styles.cryptoSelectorText}>
                    {selectedCrypto || "Tap to Select Cryptocurrency"}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={COLORS.textMuted}
                  />
                </View>
              </TouchableOpacity>
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

          {/* Blockchain Status */}
          {/* {isWalletConnected && (
            <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
              <View style={styles.blockchainStatusContainer}>
                <View style={styles.blockchainBadge}>
                  <MaterialCommunityIcons
                    name="ethereum"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={styles.blockchainBadgeText}>
                    Blockchain Mode
                  </Text>
                </View>
                <Text style={styles.blockchainInfoText}>
                  Bets placed on smart contract • Wallet:{" "}
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </Text>
              </View>
            </Animated.View>
          )} */}

          {/* 🔥 NEW: Active Bet Tracking Section */}
          {(() => {
            // console.log(
            //   `🔍 Active bets check: ${activeBets.length} active bets`
            // );
            // console.log(
            //   `   └─ Active bet IDs: ${activeBets
            //     .map((b) => b.betId)
            //     .join(", ")}`
            // );
            return activeBets.length > 0;
          })() && (
            <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                ⏰ Active Bets ({activeBets.length})
              </Text>
              {activeBets.map((bet) => {
                // console.log(`🎯 Rendering active bet card: ${bet.betId}`);
                return (
                  <View key={bet.betId} style={styles.activeBetCard}>
                    <View style={styles.activeBetHeader}>
                      <Text style={styles.activeBetSymbol}>
                        {bet.cryptoSymbol} {bet.betType}
                      </Text>
                      <Text style={styles.activeBetAmount}>
                        {bet.amount.toFixed(4)} ETH
                      </Text>
                    </View>
                    <View style={styles.activeBetFooter}>
                      <Text style={styles.activeBetTimer}>
                        {getActiveBetCountdown(bet.expiresAt)}
                      </Text>
                      <Text style={styles.activeBetId}>#{bet.optionId}</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* Bet Amount */}
          <Animated.View style={[styles.section, betSectionAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Bet Amount (USD)</Text>

            <View style={styles.betInputContainer}>
              <View
                style={[
                  styles.betInputWrapper,
                  hasInsufficientBalance && styles.betInputWrapperError,
                  shouldShowLoading && styles.betInputWrapperLoading,
                ]}
              >
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.betInput]}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  keyboardType="numeric"
                  placeholder={
                    shouldShowLoading
                      ? "Loading balance..."
                      : "Enter bet amount in USD"
                  }
                  placeholderTextColor={COLORS.textMuted}
                  editable={!shouldShowLoading}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.maxButton,
                  (maxBet <= 0 || shouldShowLoading) &&
                    styles.maxButtonDisabled,
                ]}
                onPress={setBetAmountToMax}
                disabled={maxBet <= 0 || shouldShowLoading}
              >
                <Text
                  style={[
                    styles.maxButtonText,
                    (maxBet <= 0 || shouldShowLoading) &&
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

            {/* Max Bet Info */}
            {/* {isWalletConnected && currentBalance > 0 && (
              <View style={styles.maxBetInfo}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={14}
                  color={COLORS.success}
                />
                <Text style={styles.maxBetInfoText}>
                  Max bet: {formatUsd(maxBetUsd)} (Ξ {maxBetEth.toFixed(4)})
                  (full balance) on {currentNetwork}
                </Text>
              </View>
            )} */}
          </Animated.View>

          {/* Place Bet Button - open modal instead of placing bet */}
          {!isTradeSummaryModalVisible && (
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
                onPress={() => setTradeSummaryModalVisible(true)}
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
                  Place Bet
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Smart Contract Info */}

          {/* Active Bets */}
          <Animated.View style={[styles.section, activeBetsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Active Bets</Text>
            {activeBetsData?.activeBets?.map((bet: Bet) => {
              const timeLeft = getTimeLeft(bet.expiresAt);
              const betAmountUsd = ethToUsd(bet.amount, ethPrice);

              return (
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
                    <View style={styles.betAmountContainer}>
                      <Text style={styles.betAmount}>
                        {formatUsd(betAmountUsd)}
                      </Text>
                      <Text style={styles.betAmountEth}>
                        Ξ {bet.amount.toFixed(4)} ETH
                      </Text>
                    </View>
                    <Text style={styles.betTimeframe}>
                      {
                        TIMEFRAMES.find((tf) => tf.value === bet.timeframe)
                          ?.label
                      }
                    </Text>
                    <View style={styles.countdownContainer}>
                      <MaterialCommunityIcons
                        name="timer-outline"
                        size={16}
                        color={
                          timeLeft === "Expired" ? COLORS.error : COLORS.accent
                        }
                      />
                      <Text
                        style={[
                          styles.betTimeLeft,
                          timeLeft === "Expired" && styles.expiredText,
                        ]}
                      >
                        {timeLeft}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {(!activeBetsData?.activeBets ||
              activeBetsData.activeBets.length === 0) && (
              <Text style={styles.noBetsText}>No active bets</Text>
            )}
          </Animated.View>
        </Animated.ScrollView>

        {/* 🚀 NEW: Crypto Selector Modal */}
        <SimpleCryptoModal
          visible={isCryptoSelectorVisible}
          selectedCrypto={selectedCrypto}
          onCryptoSelect={setSelectedCrypto}
          onClose={() => setIsCryptoSelectorVisible(false)}
        />

        {/* Trade Summary Modal */}
        <TradeSummaryModal
          visible={isTradeSummaryModalVisible}
          onClose={() => setTradeSummaryModalVisible(false)}
          onPlaceBet={async () => {
            setTradeSummaryModalVisible(false);
            await handlePlaceBetUserPays();
          }}
          betAmount={betAmount}
          betAmountValue={betAmountValue}
          betType={betType}
          selectedTimeframe={selectedTimeframe}
          selectedCrypto={selectedCrypto}
          ethPrice={ethPrice}
          getPayoutMultiplier={getPayoutMultiplier}
          usdToEth={usdToEth}
          formatUsd={formatUsd}
          TIMEFRAMES={TIMEFRAMES}
        />
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
    paddingHorizontal: 8,
    paddingVertical: 0,
    color: COLORS.textPrimary,
    fontSize: 16,
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1,
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
  betInputWrapperError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  betInputWrapperLoading: {
    opacity: 0.6,
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
    alignItems: "flex-start",
    marginTop: 4,
  },
  betAmountContainer: {
    alignItems: "flex-start",
  },
  betAmount: {
    fontSize: 16,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
  },
  betAmountEth: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  betTimeframe: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  betTimeLeft: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: FONTS.SEMI_BOLD,
  },
  expiredText: {
    color: COLORS.error,
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
  // Blockchain status styles
  blockchainStatusContainer: {
    alignItems: "center",
    gap: 8,
  },
  blockchainBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    gap: 6,
  },
  blockchainBadgeText: {
    color: COLORS.success,
    fontSize: 14,
    fontFamily: FONTS.SEMI_BOLD,
  },
  blockchainInfoText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    fontFamily: FONTS.REGULAR,
  },
  // 🔥 NEW: Active bet tracking styles (using existing activeBetCard)
  activeBetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeBetSymbol: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  activeBetAmount: {
    fontSize: 16,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.accent,
  },
  activeBetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeBetTimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: FONTS.REGULAR,
  },
  activeBetId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.REGULAR,
  },
  // 🚀 NEW: Crypto Selector Button Styles
  cryptoSelectorButton: {
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: "center",
  },
  cryptoSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cryptoSelectorText: {
    fontSize: 16,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  betTypeButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 36,
  },
  betTypeTextSmall: {
    fontSize: 14,
    marginTop: 0,
    marginLeft: 6,
  },
  betTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BinaryOptionsScreen;
