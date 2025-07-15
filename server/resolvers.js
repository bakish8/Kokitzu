import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "kokitzu_secret_key";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  totalBets: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);

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

// In-memory storage for bets and users
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

// Function to fetch crypto prices from CoinGecko API
async function fetchCryptoPrices() {
  try {
    const ids = COINS.map((c) => c.id).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_last_updated_at=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const now = new Date().toISOString();

    COINS.forEach((coin) => {
      if (data[coin.id]) {
        cryptoPrices[coin.id] = {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          price: data[coin.id].usd,
          lastUpdated: now,
        };
      }
    });

    console.log("Crypto prices updated:", cryptoPrices);

    // Check and update active bets
    await checkActiveBets();

    return cryptoPrices;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return cryptoPrices; // Return cached prices if API fails
  }
}

// Function to check and update active bets
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
    userBets: (_, { userId }) => {
      return bets.filter((bet) => bet.userId === userId);
    },
    userStats: async (_, { userId }) => {
      const user = await User.findById(userId);
      if (!user) return null;
      // Only include settled bets for stats
      const userBets = bets.filter(
        (bet) => bet.userId === userId && bet.status !== "ACTIVE"
      );
      const totalWagered = userBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalWon = userBets
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
    activeBets: (_, { userId }) => {
      return bets.filter(
        (bet) => bet.userId === userId && bet.status === "ACTIVE"
      );
    },
    betHistory: (_, { userId }) => {
      return bets.filter(
        (bet) => bet.userId === userId && bet.status !== "ACTIVE"
      );
    },
    leaderboard: () => {
      return Object.values(users)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);
    },
  },

  Mutation: {
    placeBet: (_, { input }) => {
      const { cryptoSymbol, betType, amount, timeframe } = input;
      const userId = "user-1"; // For demo, using fixed user

      // Validate user has enough balance
      const user = users[userId];
      if (!user || user.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Get current price - map symbol to coin
      const coin = COINS.find((c) => c.symbol === cryptoSymbol);
      if (!coin) {
        throw new Error("Invalid cryptocurrency");
      }
      const currentPrice = cryptoPrices[coin.id]?.price;
      if (!currentPrice) {
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
      };

      // Deduct amount from user balance
      user.balance -= amount;

      // Add bet to storage
      bets.push(bet);

      console.log(
        `New bet placed: ${bet.id} - ${cryptoSymbol} ${betType} $${amount} for ${timeframe}`
      );

      return bet;
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
    register: async (_, { username, password }) => {
      const existing = await User.findOne({ username });
      if (existing) throw new Error("Username already exists");
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hashed });
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

// Start fetching prices every 30 seconds
setInterval(fetchCryptoPrices, 30000);

// Initial fetch
fetchCryptoPrices();
