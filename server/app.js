import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ethers } from "ethers";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Chainlink Price Feed Addresses (Sepolia Testnet)
const CHAINLINK_FEEDS = {
  ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD
  BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // BTC/USD
  LINK: "0xc59E3633BAAC79493d908e63626716e204A45EdF", // LINK/USD
};

// Ethereum provider
const provider = new ethers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL ||
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
);

// Chainlink AggregatorV3Interface ABI
const CHAINLINK_ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
];

// Contract Service
import contractService from "./contractService.js";

// Database Models
const betSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  cryptoSymbol: { type: String, required: true },
  betType: { type: String, enum: ["UP", "DOWN"], required: true },
  amount: { type: Number, required: true },
  timeframe: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["ACTIVE", "WON", "LOST", "EXPIRED"],
    default: "ACTIVE",
  },
  result: {
    type: String,
    enum: ["WIN", "LOSS", "DRAW", "INVALID_OPTION", "ERROR", null],
    default: null,
  },
  exitPrice: { type: Number, default: null },
  payout: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isBlockchainBet: { type: Boolean, default: false },
  optionId: { type: String },
  transactionHash: { type: String },
  blockNumber: { type: Number },
  walletAddress: { type: String },
});

const Bet = mongoose.models.Bet || mongoose.model("Bet", betSchema);

// 🔥 PURE CHAINLINK PRICE SERVICE
class ChainlinkPriceService {
  constructor() {
    this.prices = {};
    this.lastUpdate = {};
  }

  async getPrice(symbol) {
    const feedAddress = CHAINLINK_FEEDS[symbol];
    if (!feedAddress) {
      throw new Error(`No Chainlink feed for ${symbol}`);
    }

    try {
      const priceFeed = new ethers.Contract(
        feedAddress,
        CHAINLINK_ABI,
        provider
      );
      const [, answer, , updatedAt] = await priceFeed.latestRoundData();

      // Convert BigInt to proper decimal format (handle BigInt explicitly)
      const price = parseFloat(answer.toString()) / 1e8; // Convert from 8 decimals to USD

      this.prices[symbol] = price;
      this.lastUpdate[symbol] = new Date(Number(updatedAt.toString()) * 1000);

      console.log(`📊 ${symbol}: $${price.toLocaleString()} (Chainlink)`);
      return price;
    } catch (error) {
      console.error(
        `❌ Error getting ${symbol} price from Chainlink:`,
        error.message
      );
      throw error;
    }
  }

  async getAllPrices() {
    const prices = {};
    for (const symbol of Object.keys(CHAINLINK_FEEDS)) {
      try {
        prices[symbol] = await this.getPrice(symbol);
      } catch (error) {
        console.error(`❌ Failed to get ${symbol} price:`, error.message);
        prices[symbol] = null;
      }
    }
    return prices;
  }
}

const priceService = new ChainlinkPriceService();

// 🚀 REST API ENDPOINTS

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Decentralized Trading API",
    priceSource: "Chainlink Only",
    blockchain: {
      contractAddress:
        process.env.CONTRACT_ADDRESS ||
        "0x569b1c7dA5ec9E57A33BBe99CC2E2Bfbb1b819C4",
      network: "Sepolia Testnet",
    },
  });
});

// Get all crypto prices (Chainlink only)
app.get("/api/prices", async (req, res) => {
  try {
    console.log("🔍 Fetching all prices from Chainlink...");
    const prices = await priceService.getAllPrices();

    const response = Object.entries(prices).map(([symbol, price]) => ({
      symbol,
      price,
      lastUpdated:
        priceService.lastUpdate[symbol]?.toISOString() ||
        new Date().toISOString(),
      source: "Chainlink",
    }));

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching prices:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific crypto price
app.get("/api/prices/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await priceService.getPrice(symbol.toUpperCase());

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price,
        lastUpdated:
          priceService.lastUpdate[symbol.toUpperCase()]?.toISOString(),
        source: "Chainlink",
      },
    });
  } catch (error) {
    console.error(`❌ Error fetching ${symbol} price:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific bet by ID
app.get("/api/bets/:betId", async (req, res) => {
  try {
    const { betId } = req.params;

    // Find bet in database
    const bet = await Bet.findOne({ id: betId });

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: "Bet not found",
      });
    }

    res.json({
      success: true,
      data: bet,
    });
  } catch (error) {
    console.error(`❌ Error fetching bet ${req.params.betId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Prepare blockchain transaction
app.post("/api/prepare-transaction", async (req, res) => {
  try {
    const { cryptoSymbol, betType, amount, timeframe, walletAddress } =
      req.body;

    console.log("🔍 Preparing transaction with Chainlink price:", {
      cryptoSymbol,
      betType,
      amount,
      timeframe,
      walletAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(
        -4
      )}`,
    });

    // Get current price from Chainlink (same source as contract!)
    const currentPrice = await priceService.getPrice(cryptoSymbol);
    console.log(
      `📊 Entry price for ${cryptoSymbol}: $${currentPrice.toLocaleString()} (Chainlink)`
    );

    const transactionData = await contractService.prepareTransaction(
      cryptoSymbol,
      betType,
      amount,
      timeframe,
      walletAddress,
      currentPrice
    );

    res.json({
      success: true,
      data: {
        transactionData: {
          to: transactionData.contractAddress,
          data: transactionData.data,
          value: transactionData.value,
          gasLimit: transactionData.gasLimit,
        },
        entryPrice: currentPrice,
        message: "Transaction prepared with Chainlink price",
      },
    });
  } catch (error) {
    console.error("❌ Failed to prepare transaction:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Record blockchain bet
app.post("/api/record-bet", async (req, res) => {
  try {
    const {
      cryptoSymbol,
      betType,
      amount,
      timeframe,
      walletAddress,
      transactionHash,
      entryPrice,
    } = req.body;
    const userId = "user-1"; // For demo

    console.log("📝 Recording blockchain bet:", {
      cryptoSymbol,
      betType,
      amount: amount + " ETH",
      timeframe,
      walletAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(
        -4
      )}`,
      transactionHash,
      entryPrice: `$${entryPrice.toLocaleString()}`,
    });

    // Check for duplicates
    const existingBet = await Bet.findOne({
      transactionHash: transactionHash,
      isBlockchainBet: true,
    });

    if (existingBet) {
      console.log("⚠️ Bet already exists, returning existing record");
      return res.json({
        success: true,
        data: existingBet,
        message: "Bet already recorded",
      });
    }

    // Get real option ID from blockchain transaction
    console.log("🔍 Getting real option ID from transaction receipt...");
    let realOptionId;

    try {
      const receipt = await contractService.getTransactionReceipt(
        transactionHash
      );
      realOptionId = await contractService.parseOptionCreatedEvent(receipt);
      console.log(`✅ Real option ID from blockchain: ${realOptionId}`);
    } catch (error) {
      console.warn(
        "⚠️ Could not get real option ID, will resolve later:",
        error.message
      );
      realOptionId = null; // No fake option ID - will resolve later
    }

    // Create bet record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 1 minute for demo

    const bet = new Bet({
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      cryptoSymbol,
      betType,
      amount,
      timeframe,
      entryPrice,
      status: "ACTIVE",
      createdAt: now,
      expiresAt,
      isBlockchainBet: true,
      optionId: realOptionId,
      transactionHash,
      walletAddress,
    });

    await bet.save();

    console.log(`✅ Bet recorded: ${bet.id}`);

    res.json({
      success: true,
      data: bet,
      message: "Bet recorded successfully",
    });
  } catch (error) {
    console.error("❌ Failed to record bet:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user bets
app.get("/api/bets/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bets = await Bet.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bets,
    });
  } catch (error) {
    console.error("❌ Error fetching bets:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all bets (for debugging)
app.get("/api/bets", async (req, res) => {
  try {
    const bets = await Bet.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bets,
    });
  } catch (error) {
    console.error("❌ Error fetching all bets:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get active bets
app.get("/api/bets/:userId/active", async (req, res) => {
  try {
    const { userId } = req.params;
    const activeBets = await Bet.find({
      userId,
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: activeBets,
    });
  } catch (error) {
    console.error("❌ Error fetching active bets:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get contract stats
app.get("/api/contract/stats", async (req, res) => {
  try {
    const stats = await contractService.getContractStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching contract stats:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Check transaction status
app.get("/api/transaction-status/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;

    console.log(`🔍 Checking transaction status: ${txHash}`);

    const receipt = await contractService.getTransactionReceipt(txHash);

    if (receipt) {
      if (receipt.status === 1) {
        // Transaction confirmed, try to parse option ID
        const optionId = await contractService.parseOptionCreatedEvent(receipt);

        res.json({
          success: true,
          data: {
            status: "confirmed",
            optionId: optionId,
            receipt: receipt,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            status: "failed",
            receipt: receipt,
          },
        });
      }
    } else {
      res.json({
        success: true,
        data: {
          status: "pending",
        },
      });
    }
  } catch (error) {
    console.error(`❌ Error checking transaction status:`, error.message);
    res.json({
      success: true,
      data: {
        status: "pending",
        error: error.message,
      },
    });
  }
});

// Auto-update prices every 30 seconds
setInterval(async () => {
  try {
    console.log("🔄 Auto-updating Chainlink prices...");
    await priceService.getAllPrices();

    // Check for expired bets
    await checkExpiredBets();

    // Check for pending option IDs
    await resolvePendingOptionIds();
  } catch (error) {
    console.error("❌ Error in auto-update:", error.message);
  }
}, 60000); // Increased to 60 seconds to reduce RPC load

// Check expired bets function
async function checkExpiredBets() {
  try {
    const now = new Date();
    const expiredBets = await Bet.find({
      isBlockchainBet: true,
      status: "ACTIVE",
      expiresAt: { $lte: now },
    });

    console.log(`📋 Found ${expiredBets.length} expired bets`);

    // Debug: Check what options exist in the contract
    try {
      const contractStats = await contractService.getContractStats();
      console.log(`📊 Contract stats:`, contractStats);
    } catch (statsError) {
      console.warn(`⚠️ Could not get contract stats:`, statsError.message);
    }

    for (const bet of expiredBets) {
      try {
        console.log(`⚡ Processing expired bet: ${bet.id}`);
        console.log(`   └─ Option ID: ${bet.optionId}`);

        // Skip if option ID is null or pending
        if (!bet.optionId || bet.optionId.startsWith("pending-")) {
          console.log(`⏳ Option ID is null/pending, skipping for now`);
          console.log(
            `   └─ This bet will be processed when option ID is resolved`
          );
          continue;
        }

        // Check if option exists in contract before trying to execute
        try {
          const optionCheck = await contractService.getOption(bet.optionId);
          console.log(`🔍 Option ${bet.optionId} exists in contract:`, {
            trader: optionCheck.trader,
            isZeroAddress:
              optionCheck.trader ===
              "0x0000000000000000000000000000000000000000",
            amount: optionCheck.amount,
            isExecuted: optionCheck.executed,
          });

          if (
            optionCheck.trader === "0x0000000000000000000000000000000000000000"
          ) {
            console.error(
              `❌ Option ${bet.optionId} does not exist in contract`
            );
            bet.status = "LOST";
            bet.result = "INVALID_OPTION";
            await bet.save();
            console.log(
              `⚠️ Bet ${bet.id} marked as LOST - option does not exist`
            );
            continue;
          }
        } catch (optionError) {
          console.error(
            `❌ Error checking option ${bet.optionId}:`,
            optionError.message
          );
          bet.status = "LOST";
          bet.result = "ERROR";
          await bet.save();
          console.log(`⚠️ Bet ${bet.id} marked as LOST - cannot verify option`);
          continue;
        }

        // Execute the option on blockchain
        console.log(`🎯 Executing option ${bet.optionId} for bet ${bet.id}`);
        console.log(`   └─ Wallet address: ${bet.walletAddress}`);

        try {
          const executionResult = await contractService.executeOption(
            bet.optionId,
            bet.walletAddress
          );
          console.log(`✅ Option execution successful:`, executionResult);
        } catch (executionError) {
          console.error(`❌ Option execution failed:`, executionError.message);

          // If execution fails, mark the bet as lost
          bet.status = "LOST";
          bet.result = "ERROR";
          await bet.save();
          console.log(`⚠️ Bet ${bet.id} marked as LOST due to execution error`);
          continue; // Skip to next bet
        }

        // Get updated option data
        const option = await contractService.getOption(bet.optionId);

        console.log(`📊 Option data after execution:`, option);

        const isWon = option.won;
        const contractPayout = parseFloat(option.payout);
        const finalPrice = parseFloat(option.exitPrice) / 100; // Convert from contract format

        console.log(`🎯 Bet result:`, {
          isWon: isWon,
          contractPayout: contractPayout,
          finalPrice: finalPrice,
          status: isWon ? "WON" : "LOST",
          result: isWon ? "WIN" : "LOSS",
        });

        // Update bet
        bet.status = isWon ? "WON" : "LOST";
        bet.result = isWon ? "WIN" : "LOSS";
        bet.exitPrice = finalPrice;
        bet.payout = contractPayout;

        await bet.save();

        console.log(
          `✅ Bet ${bet.id} updated: ${bet.result} (${contractPayout} ETH)`
        );
      } catch (error) {
        console.error(`❌ Error processing bet ${bet.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error checking expired bets:", error.message);
  }
}

// Resolve pending option IDs function
async function resolvePendingOptionIds() {
  try {
    const pendingBets = await Bet.find({
      isBlockchainBet: true,
      status: "ACTIVE",
      optionId: null,
    });

    console.log(`🔍 Found ${pendingBets.length} bets with pending option IDs`);

    for (const bet of pendingBets) {
      try {
        console.log(`🔍 Resolving option ID for bet: ${bet.id}`);
        console.log(`   └─ Transaction: ${bet.transactionHash}`);

        // Try to get transaction receipt
        const receipt = await contractService.getTransactionReceipt(
          bet.transactionHash
        );

        if (receipt && receipt.status === 1) {
          // Transaction confirmed, try to parse option ID
          const realOptionId = await contractService.parseOptionCreatedEvent(
            receipt
          );

          if (realOptionId) {
            console.log(`✅ Resolved option ID: ${realOptionId}`);
            bet.optionId = realOptionId;
            await bet.save();
            console.log(
              `✅ Updated bet ${bet.id} with option ID: ${realOptionId}`
            );
          } else {
            console.log(`⚠️ Transaction confirmed but no option ID found`);
          }
        } else if (receipt && receipt.status === 0) {
          console.log(`❌ Transaction failed`);
          bet.status = "EXPIRED";
          bet.result = "LOSS";
          await bet.save();
        } else {
          console.log(`⏳ Transaction still pending...`);
        }
      } catch (error) {
        console.log(`⏳ Transaction not yet confirmed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Error resolving pending option IDs:", error.message);
  }
}

// Initialize contract service before starting server
async function startServer() {
  try {
    console.log("🔧 Initializing contract service...");
    await contractService.init();
    console.log("✅ Contract service initialized successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 DECENTRALIZED API SERVER RUNNING ON PORT ${PORT}`);
      console.log(`📊 Price Source: Chainlink Only`);
      console.log(`🌐 No GraphQL, No CoinGecko - Pure Decentralized!`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
      console.log(`💰 Prices: http://localhost:${PORT}/api/prices`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize contract service:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
