import express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import dotenv from "dotenv";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import mongoose from "mongoose";
import contractService from "./contractService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CryptoGraphQL Server",
    blockchain: {
      contractAddress:
        process.env.CONTRACT_ADDRESS ||
        "0x192e65C1EaCfbE5d7A2f3C2CD287513713B283C6  ",
      network: "Sepolia Testnet",
    },
  });
});

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    return { req };
  },
});

async function startServer() {
  await server.start();

  // Apply Apollo Server middleware to Express
  server.applyMiddleware({
    app,
    path: "/graphql",
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(
      `📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(
      `🔍 GraphQL Playground: http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🔗 Contract Address: ${
        process.env.CONTRACT_ADDRESS ||
        "0x192e65C1EaCfbE5d7A2f3C2CD287513713B283C6  "
      }`
    );
    console.log(`🌐 Network: Sepolia Testnet`);
  });
}

// Initialize contract service after server startup
async function initializeServices() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 CRYPTOGRAPHQL SERVICES STARTING");
  console.log("=".repeat(60));

  // Display API configuration
  const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
  const FETCH_INTERVAL = process.env.COINGECKO_FETCH_INTERVAL
    ? parseInt(process.env.COINGECKO_FETCH_INTERVAL)
    : COINGECKO_API_KEY
    ? 60000
    : 90000;

  console.log(
    `📊 Price Service: CoinGecko API (${
      COINGECKO_API_KEY ? "Pro" : "Free"
    } tier)`
  );
  console.log(`⏱️  Fetch Interval: ${FETCH_INTERVAL / 1000}s`);
  console.log(`🪙 Tracking 20 cryptocurrencies`);
  console.log("=".repeat(60));

  // Setup contract service with proper async initialization
  console.log("🔗 Initializing Smart Contract Service...");
  console.log(`🔍 ContractService imported: ${contractService ? "YES" : "NO"}`);
  console.log(`🔍 ContractService type: ${typeof contractService}`);
  let contractServiceAvailable = false;

  try {
    // Initialize contract service
    console.log("🔧 Calling contractService.init()...");
    await contractService.init();
    console.log("✅ contractService.init() completed");

    // Setup event listeners
    contractService.setupEventListeners();
    contractServiceAvailable = true;

    console.log("✅ Smart Contract Service initialized successfully");

    // Test contract connectivity
    console.log("🧪 Testing contract connectivity...");
    try {
      const stats = await contractService.getContractStats();
      console.log("✅ Contract connectivity test passed");
      console.log(
        `📊 Current stats - Options: ${stats.totalOptions}, Balance: ${stats.contractBalance} ETH`
      );
    } catch (err) {
      console.warn("⚠️  Contract connectivity test failed:", err.message);
      console.warn(
        "🔍 Contract may be deployed on a different network or not accessible"
      );
    }
  } catch (error) {
    contractServiceAvailable = false;
    console.error(
      "❌ Failed to initialize Smart Contract Service:",
      error.message
    );
    console.error("⚠️  Blockchain betting features will not be available");
    console.error("💡 Falling back to in-memory betting only");
  }

  // Contract health check every 5 minutes
  setInterval(async () => {
    if (!contractServiceAvailable) return;

    try {
      console.log("🔍 Performing contract health check...");
      const stats = await contractService.getContractStats();
      console.log("💚 Contract health check passed");
      console.log(
        `📈 Stats: ${stats.totalOptions} options, ${stats.contractBalance} ETH balance`
      );
    } catch (error) {
      console.error("❤️‍🩹 Contract health check failed:", error.message);
      console.error("⚠️  Contract may be experiencing connectivity issues");
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log("=".repeat(60));
  console.log("🎯 ALL SERVICES INITIALIZED");
  console.log("=".repeat(60) + "\n");
}

startServer()
  .then(() => {
    // Initialize services after server is running
    return initializeServices();
  })
  .catch(console.error);
