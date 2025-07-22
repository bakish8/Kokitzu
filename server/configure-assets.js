#!/usr/bin/env node

/**
 * Smart Contract Asset Configuration Script
 *
 * This script configures common crypto assets in the binary options smart contract.
 * Run this after deploying the contract to set up BTC, ETH, and other assets.
 */

import { ethers } from "ethers";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const CONTRACT_ADDRESS = "0x0F93acd0ea7b9919C902695185B189C2630a73Df";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI (only the functions we need)
const CONTRACT_ABI = [
  "function updateAssetConfig(string memory asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage) external",
  "function getAssetConfig(string memory asset) external view returns (tuple(address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage, bool isActive))",
  "function owner() external view returns (address)",
];

// Sepolia Chainlink Price Feeds
const PRICE_FEEDS = {
  BTC: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // BTC/USD
  ETH: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD
  LINK: "0xc59E3633BAAC79493d908e63626716e204A45EdF", // LINK/USD
  MATIC: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada", // MATIC/USD
};

const ASSETS_TO_CONFIGURE = [
  {
    symbol: "BTC",
    priceFeed: PRICE_FEEDS.BTC,
    minAmount: "0.0001", // 0.0001 ETH minimum (≈$0.20)
    maxAmount: "1.0", // 1 ETH maximum (≈$2000)
    feePercentage: 200, // 2% fee
  },
  {
    symbol: "ETH",
    priceFeed: PRICE_FEEDS.ETH,
    minAmount: "0.001", // 0.001 ETH minimum (≈$2)
    maxAmount: "2.0", // 2 ETH maximum (≈$4000)
    feePercentage: 150, // 1.5% fee
  },
  {
    symbol: "LINK",
    priceFeed: PRICE_FEEDS.LINK,
    minAmount: "0.005", // 0.005 ETH minimum
    maxAmount: "1.5", // 1.5 ETH maximum
    feePercentage: 200, // 2% fee
  },
  {
    symbol: "MATIC",
    priceFeed: PRICE_FEEDS.MATIC,
    minAmount: "0.01", // 0.01 ETH minimum
    maxAmount: "2.0", // 2 ETH maximum
    feePercentage: 250, // 2.5% fee
  },
];

async function configureAssets() {
  console.log("🚀 Smart Contract Asset Configuration");
  console.log("=".repeat(50));

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not set in environment");
    process.exit(1);
  }

  if (SEPOLIA_RPC_URL.includes("YOUR_API_KEY")) {
    console.error("❌ SEPOLIA_RPC_URL not properly configured");
    process.exit(1);
  }

  try {
    // Setup provider and signer
    console.log("🌐 Connecting to Sepolia...");
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);

    console.log(`🔑 Connected wallet: ${address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
      console.warn("⚠️  Low balance. You may need more ETH for gas fees.");
    }

    // Connect to contract
    console.log(`📄 Connecting to contract: ${CONTRACT_ADDRESS}`);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    // Check if we're the owner
    const owner = await contract.owner();
    console.log(`👑 Contract owner: ${owner}`);

    if (address.toLowerCase() !== owner.toLowerCase()) {
      console.error(`❌ You are not the contract owner!`);
      console.error(`   Your address: ${address}`);
      console.error(`   Owner address: ${owner}`);
      console.error(`   Only the owner can configure assets.`);
      process.exit(1);
    }

    console.log(
      "✅ You are the contract owner. Proceeding with configuration...\n"
    );

    // Configure each asset
    for (const asset of ASSETS_TO_CONFIGURE) {
      console.log(`🔧 Configuring ${asset.symbol}...`);
      console.log(`   └─ Price Feed: ${asset.priceFeed}`);
      console.log(`   └─ Min Amount: ${asset.minAmount} ETH`);
      console.log(`   └─ Max Amount: ${asset.maxAmount} ETH`);
      console.log(`   └─ Fee: ${asset.feePercentage / 100}%`);

      try {
        // Check if already configured
        try {
          const existingConfig = await contract.getAssetConfig(asset.symbol);
          console.log(
            `   └─ Current status: ${
              existingConfig.isActive ? "ACTIVE" : "INACTIVE"
            }`
          );
        } catch (e) {
          console.log(`   └─ Current status: NOT CONFIGURED`);
        }

        // Configure the asset
        const tx = await contract.updateAssetConfig(
          asset.symbol,
          asset.priceFeed,
          ethers.parseEther(asset.minAmount),
          ethers.parseEther(asset.maxAmount),
          asset.feePercentage
        );

        console.log(`   └─ Transaction sent: ${tx.hash}`);
        console.log(`   └─ Waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`   └─ ✅ Confirmed in block ${receipt.blockNumber}`);
        console.log(`   └─ Gas used: ${receipt.gasUsed.toString()}`);

        // Verify configuration
        const newConfig = await contract.getAssetConfig(asset.symbol);
        console.log(
          `   └─ ✅ ${asset.symbol} is now ${
            newConfig.isActive ? "ACTIVE" : "INACTIVE"
          }\n`
        );
      } catch (error) {
        console.error(`   └─ ❌ Failed to configure ${asset.symbol}:`);
        console.error(`   └─    ${error.message}\n`);
      }
    }

    console.log("🎯 Asset configuration completed!");
    console.log("\n📊 Final Asset Status:");

    // Show final status of all assets
    for (const asset of ASSETS_TO_CONFIGURE) {
      try {
        const config = await contract.getAssetConfig(asset.symbol);
        const status = config.isActive ? "✅ ACTIVE" : "❌ INACTIVE";
        console.log(`   ${asset.symbol}: ${status}`);
      } catch (e) {
        console.log(`   ${asset.symbol}: ❌ NOT CONFIGURED`);
      }
    }

    console.log("\n🚀 Your binary options contract is ready!");
    console.log("Users can now place bets on the configured assets.");
  } catch (error) {
    console.error("❌ Configuration failed:", error.message);
    process.exit(1);
  }
}

// Run the script
configureAssets().catch(console.error);
