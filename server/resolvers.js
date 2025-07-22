import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import contractService from "./contractService.js";

const JWT_SECRET = "kokitzu_secret_key";

// CoinGecko API configuration
//
// Rate Limiting Solutions:
// 1. FREE TIER: Limited to ~10-30 calls per minute
//    - Use longer intervals (90+ seconds)
//    - Implement exponential backoff
//    - Cache responses intelligently
//
// 2. PRO TIER: Set COINGECKO_API_KEY environment variable
//    - Higher rate limits (10,000+ calls per month)
//    - More stable API performance
//    - Get your API key from: https://www.coingecko.com/en/api/pricing
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY; // Optional Pro API key
const COINGECKO_BASE_URL = COINGECKO_API_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  walletAddress: { type: String, sparse: true }, // User's wallet address for blockchain bets
  balance: { type: Number, default: 10000 },
  totalBets: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);

// Enhanced bet schema to support both in-memory and blockchain bets
const betSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  cryptoSymbol: { type: String, required: true },
  betType: { type: String, enum: ["UP", "DOWN"], required: true },
  amount: { type: Number, required: true },
  timeframe: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  targetPrice: { type: Number },
  status: {
    type: String,
    enum: ["ACTIVE", "WON", "LOST", "EXPIRED"],
    default: "ACTIVE",
  },
  result: { type: String, enum: ["WIN", "LOSS", "DRAW", null], default: null },
  exitPrice: { type: Number, default: null },
  payout: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },

  // Blockchain-specific fields
  isBlockchainBet: { type: Boolean, default: false },
  optionId: { type: String }, // Blockchain option ID
  transactionHash: { type: String }, // Transaction hash
  blockNumber: { type: Number }, // Block number
  walletAddress: { type: String }, // User's wallet address
});

export const Bet = mongoose.models.Bet || mongoose.model("Bet", betSchema);

// List of supported coins (id, symbol, name)
const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon" },
  { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash" },
  { id: "stellar", symbol: "XLM", name: "Stellar" },
  { id: "filecoin", symbol: "FIL", name: "Filecoin" },
  { id: "aptos", symbol: "APT", name: "Aptos" },
  { id: "vechain", symbol: "VET", name: "VeChain" },
  { id: "monero", symbol: "XMR", name: "Monero" },
];

// In-memory storage for crypto prices
let cryptoPrices = {};
COINS.forEach((coin) => {
  cryptoPrices[coin.id] = {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    price: 0,
    lastUpdated: "",
  };
});

// In-memory storage for legacy bets and users (keeping for backward compatibility)
let bets = [];
let users = {
  "user-1": {
    id: "user-1",
    username: "CryptoTrader",
    balance: 10000,
    totalBets: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  },
};

// Timeframe multipliers (in milliseconds)
const TIMEFRAME_MULTIPLIERS = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  FOUR_HOURS: 4 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

// Payout multipliers based on timeframe
const PAYOUT_MULTIPLIERS = {
  ONE_MINUTE: 1.8,
  FIVE_MINUTES: 1.9,
  FIFTEEN_MINUTES: 2.0,
  THIRTY_MINUTES: 2.1,
  ONE_HOUR: 2.2,
  FOUR_HOURS: 2.5,
  ONE_DAY: 3.0,
};

// Rate limiting variables
let lastFetchTime = 0;
let consecutiveErrors = 0;
const MIN_FETCH_INTERVAL = 60000; // Minimum 1 minute between API calls
const BASE_RETRY_DELAY = 5000; // 5 seconds base delay
const MAX_RETRY_DELAY = 300000; // 5 minutes max delay

// Function to calculate exponential backoff delay
function getRetryDelay() {
  return Math.min(
    BASE_RETRY_DELAY * Math.pow(2, consecutiveErrors),
    MAX_RETRY_DELAY
  );
}

// Function to fetch crypto prices from CoinGecko API with rate limiting and backoff
async function fetchCryptoPrices() {
  const now = Date.now();

  // Check if we should skip this fetch due to rate limiting
  if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
    console.log("Skipping API call due to rate limiting");
    return cryptoPrices;
  }

  // If we have consecutive errors, implement exponential backoff
  if (consecutiveErrors > 0) {
    const delay = getRetryDelay();
    console.log(
      `Waiting ${
        delay / 1000
      }s before retry due to previous errors (${consecutiveErrors} consecutive errors)`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  try {
    const ids = COINS.map((c) => c.id).join(",");

    console.log("Fetching crypto prices from CoinGecko...");

    // Build URL and headers
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`;
    const headers = {
      Accept: "application/json",
      "User-Agent": "CryptoGraphQL/1.0",
    };

    // Add API key if available (for Pro tier)
    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
      console.log("Using CoinGecko Pro API");
    }

    const response = await fetch(url, { headers });

    // Handle rate limiting specifically
    if (response.status === 429) {
      consecutiveErrors++;
      console.error(
        `Rate limited by CoinGecko (429). Consecutive errors: ${consecutiveErrors}`
      );

      // Check if response has Retry-After header
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        const retrySeconds = parseInt(retryAfter);
        console.log(
          `CoinGecko suggests retrying after ${retrySeconds} seconds`
        );
      }

      throw new Error(`Rate limited. Try again later.`);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const timestamp = new Date().toISOString();

    // Update last fetch time and reset error counter on success
    lastFetchTime = now;
    consecutiveErrors = 0;

    COINS.forEach((coin) => {
      if (data[coin.id]) {
        cryptoPrices[coin.id] = {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          price: data[coin.id].usd,
          lastUpdated: timestamp,
        };
      }
    });

    console.log(`Crypto prices updated successfully at ${timestamp}`);

    // Check and update active bets (legacy in-memory bets)
    await checkActiveBets();

    // 🔥 NEW: Check and execute expired blockchain bets
    await checkExpiredBlockchainBets();

    return cryptoPrices;
  } catch (error) {
    consecutiveErrors++;
    console.error(
      `Error fetching crypto prices (attempt ${consecutiveErrors}):`,
      error.message
    );

    // If we have too many consecutive errors, increase the interval
    if (consecutiveErrors > 5) {
      console.error(
        "Too many consecutive errors. Consider checking your internet connection or CoinGecko service status."
      );
    }

    return cryptoPrices; // Return cached prices if API fails
  }
}

// Function to check and update active bets (legacy)
async function checkActiveBets() {
  const now = new Date();

  bets.forEach((bet) => {
    if (bet.status === "ACTIVE" && new Date(bet.expiresAt) <= now) {
      // Find coin by symbol
      const coin = COINS.find((c) => c.symbol === bet.cryptoSymbol);
      const currentPrice = coin ? cryptoPrices[coin.id]?.price || 0 : 0;
      const result = determineBetResult(bet, currentPrice);

      bet.status = result === "WIN" ? "WON" : "LOST";
      bet.result = result;
      bet.exitPrice = currentPrice; // Ensure exitPrice is always set
      bet.payout =
        result === "WIN" ? bet.amount * PAYOUT_MULTIPLIERS[bet.timeframe] : 0;

      // Update user stats
      updateUserStats(bet.userId, result, bet.amount, bet.payout);

      console.log(
        `Bet ${bet.id} ${result}: Entry: $${bet.entryPrice}, Final: $${currentPrice}, Payout: $${bet.payout}`
      );
    }
  });
}

// 🔥 NEW: Function to check and execute expired blockchain bets
async function checkExpiredBlockchainBets() {
  console.log("🔍 Checking for expired blockchain bets...");

  try {
    const now = new Date();

    // Find all active blockchain bets that have expired
    const expiredBets = await Bet.find({
      isBlockchainBet: true,
      status: "ACTIVE",
      expiresAt: { $lte: now },
    });

    console.log(`📋 Found ${expiredBets.length} expired blockchain bets`);

    if (expiredBets.length === 0) return;

    // Process each expired bet
    for (const bet of expiredBets) {
      console.log(`\n⚡ Processing expired bet: ${bet.id}`);
      console.log(`   └─ Option ID: ${bet.optionId}`);
      console.log(`   └─ Asset: ${bet.cryptoSymbol} ${bet.betType}`);
      console.log(`   └─ Amount: ${bet.amount} ETH`);
      console.log(`   └─ Expired at: ${bet.expiresAt.toISOString()}`);
      console.log(
        `   └─ Expired ${Math.round((now - bet.expiresAt) / 60000)} minutes ago`
      );

      try {
        // Execute the option on blockchain
        console.log(`📝 Executing option ${bet.optionId} on smart contract...`);
        const executionResult = await contractService.executeOption(
          bet.optionId
        );

        console.log(`✅ Option ${bet.optionId} executed successfully!`);
        console.log(
          `   └─ Transaction Hash: ${executionResult.transactionHash}`
        );
        console.log(`   └─ Gas Used: ${executionResult.gasUsed}`);

        // Get the updated option data from blockchain
        console.log(`📊 Fetching option results from blockchain...`);
        const option = await contractService.getOption(bet.optionId);

        const isWon = option.won;
        const isPush = option.strikePrice === option.exitPrice;
        const exitPrice = parseFloat(option.exitPrice) / 1e8; // Convert from price feed format

        // Calculate payout
        let payout = 0;
        let result = "";
        let status = "";

        if (isPush) {
          result = "DRAW";
          status = "EXPIRED";
          payout = bet.amount; // Refund original amount
          console.log(`🔄 RESULT: TIE/PUSH - Full refund`);
        } else if (isWon) {
          result = "WIN";
          status = "WON";
          payout = bet.amount * 0.8; // 80% payout (after fees)
          console.log(`🎉 RESULT: WIN - Payout ${payout} ETH`);
        } else {
          result = "LOSS";
          status = "LOST";
          payout = 0;
          console.log(`❌ RESULT: LOSS - No payout`);
        }

        // Update bet in database
        bet.status = status;
        bet.result = result;
        bet.exitPrice = exitPrice;
        bet.payout = payout;

        await bet.save();

        console.log(`💾 Bet ${bet.id} updated in database:`);
        console.log(`   └─ Status: ${status}`);
        console.log(`   └─ Result: ${result}`);
        console.log(`   └─ Entry Price: $${bet.entryPrice.toLocaleString()}`);
        console.log(`   └─ Exit Price: $${exitPrice.toLocaleString()}`);
        console.log(`   └─ Payout: ${payout} ETH`);

        // Log detailed results
        if (isPush) {
          console.log(
            `🎲 SAME PRICE TIE: Entry=$${bet.entryPrice} = Exit=$${exitPrice}`
          );
        } else {
          const priceChange = exitPrice - bet.entryPrice;
          const priceChangePercent = (
            (priceChange / bet.entryPrice) *
            100
          ).toFixed(4);
          console.log(
            `📈 PRICE MOVEMENT: $${priceChange.toFixed(
              2
            )} (${priceChangePercent}%)`
          );

          if (bet.betType === "UP") {
            console.log(
              `📊 BUY bet: ${
                priceChange > 0 ? "✅ CORRECT" : "❌ WRONG"
              } direction`
            );
          } else {
            console.log(
              `📊 SELL bet: ${
                priceChange < 0 ? "✅ CORRECT" : "❌ WRONG"
              } direction`
            );
          }
        }
      } catch (executionError) {
        console.error(
          `❌ Failed to execute option ${bet.optionId}:`,
          executionError.message
        );

        // Check if already executed
        if (
          executionError.message.includes("already executed") ||
          executionError.message.includes("not ready")
        ) {
          console.log(
            `⚠️ Option ${bet.optionId} may already be executed, checking status...`
          );

          try {
            const option = await contractService.getOption(bet.optionId);
            if (option.executed) {
              console.log(
                `✅ Option ${bet.optionId} was already executed, updating database...`
              );

              const isWon = option.won;
              const isPush = option.strikePrice === option.exitPrice;
              const exitPrice = parseFloat(option.exitPrice) / 1e8;

              let payout = 0;
              let result = "";
              let status = "";

              if (isPush) {
                result = "DRAW";
                status = "EXPIRED";
                payout = bet.amount;
              } else if (isWon) {
                result = "WIN";
                status = "WON";
                payout = bet.amount * 0.8;
              } else {
                result = "LOSS";
                status = "LOST";
                payout = 0;
              }

              bet.status = status;
              bet.result = result;
              bet.exitPrice = exitPrice;
              bet.payout = payout;
              await bet.save();

              console.log(
                `💾 Updated bet ${bet.id}: ${result} (${payout} ETH)`
              );
            }
          } catch (statusError) {
            console.error(
              `❌ Failed to check option status:`,
              statusError.message
            );
          }
        }
      }
    }

    console.log(
      `\n✅ Finished processing ${expiredBets.length} expired blockchain bets`
    );
  } catch (error) {
    console.error("❌ Error checking expired blockchain bets:", error.message);
  }
}

// Function to determine bet result
function determineBetResult(bet, finalPrice) {
  if (bet.betType === "UP") {
    return finalPrice > bet.entryPrice ? "WIN" : "LOSS";
  } else {
    return finalPrice < bet.entryPrice ? "WIN" : "LOSS";
  }
}

// Function to update user statistics
function updateUserStats(userId, result, wagered, won) {
  const user = users[userId];
  if (!user) return;

  user.totalBets += 1;
  if (result === "WIN") {
    user.wins += 1;
    user.balance += won + wagered; // Add back original bet + profit
  } else {
    user.losses += 1;
    // Do not deduct again on loss, already deducted on placement
  }

  user.winRate = (user.wins / user.totalBets) * 100;
}

// Function to calculate target price based on timeframe
function calculateTargetPrice(entryPrice, timeframe) {
  // For demo purposes, we'll use a simple calculation
  // In a real app, this would be more sophisticated
  const volatility = 0.02; // 2% volatility
  return entryPrice * (1 + volatility);
}

export const resolvers = {
  Query: {
    cryptoPrices: () => {
      return Object.values(cryptoPrices);
    },
    cryptoPrice: (_, { symbol }) => {
      const coin = COINS.find((c) => c.symbol === symbol.toUpperCase());
      return coin ? cryptoPrices[coin.id] : null;
    },
    coins: () => COINS,
    userBets: async (_, { userId }) => {
      // Get both legacy in-memory bets and database bets
      const legacyBets = bets.filter((bet) => bet.userId === userId);
      const dbBets = await Bet.find({ userId }).lean();
      return [...legacyBets, ...dbBets];
    },
    userStats: async (_, { userId }) => {
      const user = await User.findById(userId);
      if (!user) return null;

      // Get both legacy and database bets for stats
      const legacyBets = bets.filter(
        (bet) => bet.userId === userId && bet.status !== "ACTIVE"
      );
      const dbBets = await Bet.find({
        userId,
        status: { $ne: "ACTIVE" },
      }).lean();
      const allBets = [...legacyBets, ...dbBets];

      const totalWagered = allBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalWon = allBets
        .filter((bet) => bet.result === "WIN")
        .reduce((sum, bet) => sum + (bet.payout || 0), 0);

      return {
        totalBets: user.totalBets,
        wins: user.wins,
        losses: user.losses,
        winRate: user.winRate,
        totalWagered,
        totalWon,
        netProfit: totalWon - totalWagered,
      };
    },
    activeBets: async (_, { userId }) => {
      const legacyBets = bets.filter(
        (bet) => bet.userId === userId && bet.status === "ACTIVE"
      );
      const dbBets = await Bet.find({ userId, status: "ACTIVE" }).lean();
      return [...legacyBets, ...dbBets];
    },
    betHistory: async (_, { userId }) => {
      const legacyBets = bets.filter(
        (bet) => bet.userId === userId && bet.status !== "ACTIVE"
      );
      const dbBets = await Bet.find({
        userId,
        status: { $ne: "ACTIVE" },
      }).lean();
      return [...legacyBets, ...dbBets];
    },
    leaderboard: () => {
      return Object.values(users)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);
    },
    // New blockchain-specific queries
    contractStats: async () => {
      console.log("📊 Fetching contract stats...");
      try {
        const stats = await contractService.getContractStats();
        console.log("✅ Contract stats retrieved successfully:", {
          totalOptions: stats.totalOptions,
          contractBalance: stats.contractBalance,
        });
        return stats;
      } catch (error) {
        console.error("❌ Failed to get contract stats:", error.message);
        console.error("🔍 Contract may not be deployed or accessible");
        return { totalOptions: "0", contractBalance: "0" };
      }
    },
    blockchainBets: async (_, { walletAddress }) => {
      if (!walletAddress) {
        console.log("⚠️  No wallet address provided for blockchain bets query");
        return [];
      }

      console.log(
        `🔍 Fetching blockchain bets for wallet: ${walletAddress.slice(
          0,
          6
        )}...${walletAddress.slice(-4)}`
      );
      try {
        const userOptions = await contractService.getUserOptions(walletAddress);
        console.log(
          `✅ Retrieved ${userOptions.length} blockchain bets for user`
        );
        return userOptions;
      } catch (error) {
        console.error("❌ Failed to get blockchain bets:", error.message);
        console.error(
          "🔍 Wallet may not have any bets or contract is inaccessible"
        );
        return [];
      }
    },
  },

  Mutation: {
    placeBet: async (_, { input }) => {
      const {
        cryptoSymbol,
        betType,
        amount,
        timeframe,
        walletAddress,
        useBlockchain = false,
      } = input;
      const userId = "user-1"; // For demo, using fixed user

      // 🔍 DEBUG: Log all input parameters
      console.log("🔍 PlaceBet called with input:", {
        cryptoSymbol,
        betType,
        amount,
        timeframe,
        walletAddress: walletAddress
          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "null",
        useBlockchain,
      });

      // Check if this should be a blockchain bet
      console.log(
        `🤔 Blockchain condition check: useBlockchain=${useBlockchain}, walletAddress=${
          walletAddress ? "PROVIDED" : "NOT PROVIDED"
        }`
      );

      if (useBlockchain && walletAddress) {
        console.log(`🔗 BLOCKCHAIN PATH: Initiating blockchain bet...`);
        console.log(
          `   └─ Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(
            -4
          )}`
        );
        console.log(
          `   └─ Asset: ${cryptoSymbol} | Direction: ${betType} | Amount: ${amount} ETH`
        );
        console.log(`   └─ Timeframe: ${timeframe}`);

        try {
          // Place bet on blockchain
          console.log("📝 Calling smart contract placeBet function...");
          const blockchainResult = await contractService.placeBet(
            cryptoSymbol,
            betType,
            amount,
            timeframe
          );

          console.log("✅ Blockchain transaction successful!");
          console.log(`   └─ Option ID: ${blockchainResult.optionId}`);
          console.log(
            `   └─ Transaction Hash: ${blockchainResult.transactionHash}`
          );
          console.log(`   └─ Block Number: ${blockchainResult.blockNumber}`);
          console.log(`   └─ Gas Used: ${blockchainResult.gasUsed}`);

          // Get current price for entry price
          const coin = COINS.find((c) => c.symbol === cryptoSymbol);
          const currentPrice = coin ? cryptoPrices[coin.id]?.price : 0;

          // Create bet record in database
          const now = new Date();
          const expiresAt = new Date(
            now.getTime() + TIMEFRAME_MULTIPLIERS[timeframe]
          );

          const bet = new Bet({
            id: uuidv4(),
            userId,
            cryptoSymbol,
            betType,
            amount,
            timeframe,
            entryPrice: currentPrice,
            status: "ACTIVE",
            createdAt: now,
            expiresAt,
            isBlockchainBet: true,
            optionId: blockchainResult.optionId,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            walletAddress,
          });

          await bet.save();

          console.log(`💾 Blockchain bet saved to database: ${bet.id}`);
          console.log(`🎯 Entry price recorded: $${currentPrice}`);

          return {
            ...bet.toObject(),
            blockchain: {
              optionId: blockchainResult.optionId,
              transactionHash: blockchainResult.transactionHash,
              blockNumber: blockchainResult.blockNumber,
              gasUsed: blockchainResult.gasUsed,
            },
          };
        } catch (error) {
          console.error("❌ Blockchain bet failed:");
          console.error(`   └─ Error: ${error.message}`);
          console.error(`   └─ Stack: ${error.stack}`);

          // Log specific contract errors for debugging
          if (error.message.includes("insufficient funds")) {
            console.error("💰 Insufficient funds in wallet");
          } else if (error.message.includes("gas")) {
            console.error("⛽ Gas-related error - check gas limits");
          } else if (error.message.includes("revert")) {
            console.error("🔄 Transaction reverted - check contract logic");
          } else if (error.message.includes("network")) {
            console.error("🌐 Network connection issue");
          }

          throw new Error(`Blockchain bet failed: ${error.message}`);
        }
      }

      // Legacy in-memory bet logic (fallback)
      console.log(`💾 LEGACY PATH: Placing legacy (in-memory) bet...`);

      const user = users[userId];
      if (!user || user.balance < amount) {
        console.error(
          `❌ Legacy bet failed: Insufficient balance (${
            user?.balance || 0
          } < ${amount})`
        );
        throw new Error("Insufficient balance");
      }

      // Get current price - map symbol to coin
      const coin = COINS.find((c) => c.symbol === cryptoSymbol);
      if (!coin) {
        console.error(
          `❌ Legacy bet failed: Invalid cryptocurrency ${cryptoSymbol}`
        );
        throw new Error("Invalid cryptocurrency");
      }
      const currentPrice = cryptoPrices[coin.id]?.price;
      if (!currentPrice) {
        console.error(
          `❌ Legacy bet failed: No price data for ${cryptoSymbol}`
        );
        throw new Error("Invalid cryptocurrency");
      }

      // Create bet
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + TIMEFRAME_MULTIPLIERS[timeframe]
      );

      const bet = {
        id: uuidv4(),
        userId,
        cryptoSymbol,
        betType,
        amount,
        timeframe,
        entryPrice: currentPrice,
        targetPrice: calculateTargetPrice(currentPrice, timeframe),
        status: "ACTIVE",
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        result: null,
        payout: null,
        isBlockchainBet: false,
      };

      // Deduct amount from user balance
      user.balance -= amount;

      // Add bet to storage
      bets.push(bet);

      console.log(`✅ Legacy bet placed successfully:`);
      console.log(`   └─ Bet ID: ${bet.id}`);
      console.log(`   └─ Asset: ${cryptoSymbol} | Direction: ${betType}`);
      console.log(`   └─ Amount: $${amount} | Entry Price: $${currentPrice}`);
      console.log(
        `   └─ Timeframe: ${timeframe} | Expires: ${expiresAt.toISOString()}`
      );
      console.log(`   └─ User balance after bet: $${user.balance}`);

      return bet;
    },

    configureAsset: async (
      _,
      { symbol, priceFeed, minAmount, maxAmount, feePercentage }
    ) => {
      console.log(`🔧 Configuring asset ${symbol} via GraphQL...`);
      console.log(`   └─ Price Feed: ${priceFeed}`);
      console.log(`   └─ Min Amount: ${minAmount} ETH`);
      console.log(`   └─ Max Amount: ${maxAmount} ETH`);
      console.log(`   └─ Fee: ${feePercentage / 100}%`);

      try {
        await contractService.ensureInitialized();

        const tx = await contractService.contract.updateAssetConfig(
          symbol,
          priceFeed,
          ethers.parseEther(minAmount.toString()),
          ethers.parseEther(maxAmount.toString()),
          feePercentage
        );

        console.log(`📝 Asset configuration transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ Asset ${symbol} configured successfully!`);

        return true;
      } catch (error) {
        console.error(`❌ Failed to configure asset ${symbol}:`, error.message);
        throw new Error(`Failed to configure asset: ${error.message}`);
      }
    },

    executeBlockchainOption: async (_, { optionId }) => {
      console.log(`⚡ Executing blockchain option: ${optionId}`);

      try {
        console.log("📝 Calling smart contract executeOption function...");
        const result = await contractService.executeOption(optionId);

        console.log("✅ Option execution transaction successful!");
        console.log(`   └─ Transaction Hash: ${result.transactionHash}`);
        console.log(`   └─ Block Number: ${result.blockNumber}`);
        console.log(`   └─ Gas Used: ${result.gasUsed}`);

        // Update the bet in database
        console.log("🔍 Looking up bet in database...");
        const bet = await Bet.findOne({ optionId });

        if (bet) {
          console.log(`📖 Found bet: ${bet.id}`);

          // Get the updated option from blockchain
          console.log("📊 Fetching updated option data from blockchain...");
          const option = await contractService.getOption(optionId);

          const wasWon = option.won;
          const exitPrice = parseFloat(option.exitPrice) / 1e8; // Convert from price feed format
          const payout = wasWon ? parseFloat(option.amount) * 0.8 : 0; // 80% payout

          bet.status = option.executed ? (wasWon ? "WON" : "LOST") : "ACTIVE";
          bet.result = wasWon ? "WIN" : "LOSS";
          bet.exitPrice = exitPrice;
          bet.payout = payout;

          await bet.save();

          console.log(`💾 Bet updated in database:`);
          console.log(`   └─ Status: ${bet.status}`);
          console.log(`   └─ Result: ${bet.result}`);
          console.log(`   └─ Exit Price: $${exitPrice}`);
          console.log(`   └─ Payout: ${payout} ETH`);
        } else {
          console.warn(`⚠️  No bet found in database for option ${optionId}`);
        }

        console.log("🎯 Option execution completed successfully!");

        return {
          success: true,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
        };
      } catch (error) {
        console.error("❌ Failed to execute blockchain option:");
        console.error(`   └─ Option ID: ${optionId}`);
        console.error(`   └─ Error: ${error.message}`);
        console.error(`   └─ Stack: ${error.stack}`);

        // Log specific execution errors
        if (error.message.includes("not ready")) {
          console.error("⏰ Option not ready for execution yet");
        } else if (error.message.includes("already executed")) {
          console.error("🔄 Option already executed");
        } else if (error.message.includes("not found")) {
          console.error("🔍 Option not found on blockchain");
        }

        throw new Error(`Failed to execute option: ${error.message}`);
      }
    },

    cancelBet: (_, { betId }) => {
      const bet = bets.find((b) => b.id === betId);
      if (!bet || bet.status !== "ACTIVE") {
        throw new Error("Bet cannot be cancelled");
      }

      // Refund user
      const user = users[bet.userId];
      if (user) {
        user.balance += bet.amount;
      }

      bet.status = "EXPIRED";
      return true;
    },

    updateBetResult: (_, { betId, result, finalPrice }) => {
      const bet = bets.find((b) => b.id === betId);
      if (!bet) {
        throw new Error("Bet not found");
      }

      bet.result = result;
      bet.status = result === "WIN" ? "WON" : "LOST";
      bet.exitPrice = finalPrice; // Save the exit price
      bet.payout =
        result === "WIN" ? bet.amount * PAYOUT_MULTIPLIERS[bet.timeframe] : 0;

      // Update user stats
      updateUserStats(bet.userId, result, bet.amount, bet.payout);

      return bet;
    },

    register: async (_, { username, password, walletAddress }) => {
      const existing = await User.findOne({ username });
      if (existing) throw new Error("Username already exists");
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        password: hashed,
        walletAddress,
      });
      return user;
    },

    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) throw new Error("Invalid credentials");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "7d",
      });
      return { token, user };
    },
  },
};

// Configure fetch interval (default 90 seconds for free tier, can be reduced with Pro API)
const FETCH_INTERVAL = process.env.COINGECKO_FETCH_INTERVAL
  ? parseInt(process.env.COINGECKO_FETCH_INTERVAL)
  : COINGECKO_API_KEY
  ? 60000
  : 90000; // Pro: 60s, Free: 90s

console.log(`Starting price fetching with ${FETCH_INTERVAL / 1000}s interval`);
setInterval(fetchCryptoPrices, FETCH_INTERVAL);

// Initial fetch
fetchCryptoPrices();

// Contract initialization moved to index.js for proper execution
