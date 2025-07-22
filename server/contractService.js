import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Contract configuration
// ✅ UPDATED: New contract with PUSH/TIE logic (deployed 2025-01-22)
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x192e65C1EaCfbE5d7A2f3C2CD287513713B283C6";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI - you'll need to get this from your compiled contract
const CONTRACT_ABI = [
  // Event signatures
  "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
  "event OptionExecuted(uint256 indexed optionId, bool won, bool isPush, uint256 payout, uint256 finalPrice)",

  // Main functions
  "function createOption(string memory asset, uint256 amount, uint256 expiryTime, bool isCall) external payable",
  "function executeOption(uint256 optionId) external",
  "function getOption(uint256 optionId) external view returns (tuple(uint256 id, address trader, string asset, uint256 amount, uint256 expiry, bool isCall, bool executed, uint256 entryPrice, uint256 exitPrice, bool won))",
  "function assetConfigs(string) external view returns (address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage, bool isActive)",
  "function getUserOptions(address user) external view returns (uint256[])",
  "function getContractStats() external view returns (uint256 totalOptions, uint256 contractBalance)",

  // Owner functions
  "function updateAssetConfig(string memory asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage) external",
  "function pauseAsset(string memory asset) external",
  "function resumeAsset(string memory asset) external",
  "function withdrawFees() external",
  "function owner() external view returns (address)",
];

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    this.initializing = false;
    this.initializationError = null;
  }

  async init() {
    if (this.isInitialized) return;
    if (this.initializing) return; // Already initializing

    try {
      this.initializing = true;
      console.log("🔧 Initializing Contract Service...");

      // Check for required environment variables
      if (!PRIVATE_KEY) {
        console.warn(
          "⚠️  No PRIVATE_KEY in environment - running in read-only mode"
        );
      }

      if (SEPOLIA_RPC_URL.includes("YOUR_API_KEY")) {
        throw new Error(
          "RPC URL not configured - please set SEPOLIA_RPC_URL in .env"
        );
      }

      // Initialize provider with timeout configuration
      console.log("🌐 Connecting to Sepolia network...");
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

      // Test provider connection
      const network = await this.provider.getNetwork();
      console.log(
        `✅ Connected to network: ${network.name} (chainId: ${network.chainId})`
      );

      // Initialize signer if private key is provided
      if (PRIVATE_KEY) {
        this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
        const address = await this.signer.getAddress();
        const balance = await this.provider.getBalance(address);
        console.log(`🔑 Wallet connected: ${address}`);
        console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
      }

      // Initialize contract
      console.log(`📄 Connecting to contract: ${CONTRACT_ADDRESS}`);
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        this.signer || this.provider
      );

      // Test contract connection
      try {
        const owner = await this.contract.owner();
        console.log(`👑 Contract owner: ${owner}`);
        console.log("✅ Contract connection successful");

        // Mark as initialized to prevent concurrent re-initialization during asset config
        this.isInitialized = true;
        this.initializing = false;
      } catch (error) {
        if (error.message.includes("call revert exception")) {
          throw new Error(
            `Contract not deployed at ${CONTRACT_ADDRESS} or wrong network`
          );
        }
        throw error;
      }

      // Check and configure assets after successful connection
      console.log("🔧 Checking asset configurations...");
      try {
        await this.checkAndConfigureAssets();
      } catch (assetError) {
        console.warn(
          "⚠️  Asset configuration check failed:",
          assetError.message
        );
        console.warn(
          "   └─ Continuing with initialization. Manual asset configuration may be needed."
        );
      }

      console.log("🎯 ContractService initialized successfully");
    } catch (error) {
      this.initializing = false;
      this.initializationError = error;
      console.error("❌ Contract initialization failed:");
      console.error(`   └─ Error: ${error.message}`);
      throw error;
    }
  }

  // Map GraphQL symbols to contract asset names
  mapSymbolToAsset(symbol) {
    const mapping = {
      BTC: "BTC",
      ETH: "ETH",
      MATIC: "MATIC",
      USDC: "USDC",
      LINK: "LINK",
    };
    return mapping[symbol] || symbol;
  }

  // Check and configure common assets (for development/testing)
  async checkAndConfigureAssets() {
    const commonAssets = [
      {
        symbol: "BTC",
        priceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // BTC/USD Sepolia
        minAmount: ethers.parseEther("0.0001"), // 0.0001 ETH minimum
        maxAmount: ethers.parseEther("1.0"), // 1 ETH maximum
        feePercentage: 200, // 2%
      },
      {
        symbol: "ETH",
        priceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD Sepolia
        minAmount: ethers.parseEther("0.001"),
        maxAmount: ethers.parseEther("2.0"),
        feePercentage: 150, // 1.5%
      },
    ];

    console.log("🔧 Checking and configuring common assets...");

    for (const asset of commonAssets) {
      try {
        const config = await this.contract.assetConfigs(asset.symbol);
        console.log(`✅ ${asset.symbol} already configured:`, {
          isActive: config.isActive,
          priceFeed: config.priceFeed,
        });
      } catch (error) {
        console.log(
          `⚙️  ${asset.symbol} not configured, attempting to configure...`
        );
        try {
          if (!this.signer) {
            console.warn(
              `⚠️  Cannot configure ${asset.symbol} - no signer available`
            );
            continue;
          }

          const tx = await this.contract.updateAssetConfig(
            asset.symbol,
            asset.priceFeed,
            asset.minAmount,
            asset.maxAmount,
            asset.feePercentage
          );

          console.log(`📝 Configuring ${asset.symbol}... tx: ${tx.hash}`);
          const receipt = await tx.wait();
          console.log(
            `✅ ${asset.symbol} configured successfully! Block: ${receipt.blockNumber}`
          );

          // Wait for blockchain state to propagate
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (configError) {
          console.error(
            `❌ Failed to configure ${asset.symbol}:`,
            configError.message
          );
          if (
            configError.message.includes("Ownable: caller is not the owner")
          ) {
            console.error(
              "   └─ You are not the contract owner. Assets need to be configured by the owner."
            );
          }
        }
      }
    }
  }

  // Convert timeframe to expiry duration (in seconds)
  getExpiryTimestamp(timeframe) {
    const timeframes = {
      ONE_MINUTE: 5 * 60, // Contract minimum is 5 minutes, so use that
      FIVE_MINUTES: 5 * 60,
      FIFTEEN_MINUTES: 15 * 60,
      THIRTY_MINUTES: 30 * 60,
      ONE_HOUR: 60 * 60,
      FOUR_HOURS: 4 * 60 * 60,
      ONE_DAY: 24 * 60 * 60,
    };
    // Return duration only (not absolute timestamp)
    // Ensure minimum 5 minutes (300 seconds) as required by contract
    const expiry = Math.max(timeframes[timeframe] || 300, 300);

    console.log(`⏰ EXPIRY TIME DEBUG:`);
    console.log(`   └─ Requested timeframe: ${timeframe}`);
    console.log(
      `   └─ Raw mapping: ${timeframes[timeframe] || "undefined"} seconds`
    );
    console.log(
      `   └─ Final expiry: ${expiry} seconds (${expiry / 60} minutes)`
    );
    console.log(`   └─ Contract minimum: 300 seconds (5 minutes)`);
    console.log(
      `   └─ Will pass validation: ${expiry >= 300 ? "✅ YES" : "❌ NO"}`
    );

    return expiry;
  }

  // Place a bet on the blockchain
  async placeBet(cryptoSymbol, betType, amount, timeframe) {
    await this.ensureInitialized();

    if (!this.signer) {
      throw new Error("No signer available - cannot place bets");
    }

    try {
      const asset = this.mapSymbolToAsset(cryptoSymbol);
      const expiry = this.getExpiryTimestamp(timeframe);
      const isCall = betType === "UP";
      // Fix precision issue: ETH supports max 18 decimals, truncate if needed
      const originalAmount = amount.toString();
      const truncatedAmount =
        typeof amount === "number"
          ? amount.toFixed(18)
          : parseFloat(amount.toString()).toFixed(18);
      const amountInWei = ethers.parseEther(truncatedAmount);

      console.log(
        `🎯 Placing bet: ${asset} ${betType} ${amount} ETH for ${timeframe}`
      );

      // Debug precision handling
      if (originalAmount !== truncatedAmount) {
        console.log(`📏 Precision fix applied:`);
        console.log(
          `   └─ Original:  ${originalAmount} (${
            originalAmount.length - 1 - originalAmount.indexOf(".")
          } decimals)`
        );
        console.log(`   └─ Truncated: ${truncatedAmount} (18 decimals max)`);
      }

      // Check asset configuration with better error handling
      console.log(`🔍 Checking asset configuration for: ${asset}`);
      let assetConfig;
      try {
        assetConfig = await this.contract.assetConfigs(asset);
        console.log(`✅ Asset config found for ${asset}:`, {
          priceFeed: assetConfig.priceFeed,
          minAmount: ethers.formatEther(assetConfig.minAmount),
          maxAmount: ethers.formatEther(assetConfig.maxAmount),
          feePercentage: assetConfig.feePercentage.toString(),
          isActive: assetConfig.isActive,
        });
      } catch (error) {
        console.error(`❌ Asset ${asset} not configured in contract`);
        console.error(
          "Available assets might be different. Trying ETH as fallback..."
        );

        // Try ETH as a fallback since it's most likely to be configured
        try {
          assetConfig = await this.contract.assetConfigs("ETH");
          console.log(`✅ Using ETH as fallback asset configuration`);
        } catch (fallbackError) {
          console.error(
            `❌ ETH also not configured. Contract may not be properly initialized.`
          );
          throw new Error(
            `Asset ${asset} is not configured in the smart contract. Please contact the administrator to configure this asset.`
          );
        }
      }

      if (!assetConfig.isActive) {
        throw new Error(`Asset ${asset} is not active on the smart contract`);
      }

      // Check amount limits
      if (
        amountInWei < assetConfig.minAmount ||
        amountInWei > assetConfig.maxAmount
      ) {
        throw new Error(
          `Amount must be between ${ethers.formatEther(
            assetConfig.minAmount
          )} and ${ethers.formatEther(assetConfig.maxAmount)} ETH`
        );
      }

      // Create option on blockchain
      const tx = await this.contract.createOption(
        asset,
        amountInWei, // ← הפרמטר החסר!
        expiry,
        isCall,
        {
          value: amountInWei, // ETH to send with transaction
          gasLimit: 500000, // Increased from 300000 - transaction needs ~317000 gas
          maxFeePerGas: ethers.parseUnits("20", "gwei"), // Higher fee for faster confirmation
          maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        }
      );

      console.log("⏳ Transaction sent:", tx.hash);

      // Wait for transaction with timeout handling
      let receipt;
      try {
        console.log("⏰ Waiting for confirmation (timeout: 60s)...");
        receipt = await tx.wait(1); // Wait for 1 confirmation
        console.log("✅ Transaction confirmed:", receipt.hash);
        console.log(
          `⛽ Gas used: ${receipt.gasUsed.toString()} (limit was 500000)`
        );
      } catch (waitError) {
        if (waitError.code === "TIMEOUT") {
          console.log(
            "⏰ Transaction confirmation timeout - checking manually..."
          );

          // Try to get receipt manually with retries
          for (let i = 0; i < 5; i++) {
            try {
              receipt = await this.provider.getTransactionReceipt(tx.hash);
              if (receipt) {
                console.log(
                  `✅ Transaction found after ${i + 1} manual checks`
                );
                console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
                break;
              }
            } catch (checkError) {
              console.log(
                `❌ Manual check ${i + 1} failed: ${checkError.message}`
              );
            }

            // Wait 5 seconds before next check
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          if (!receipt) {
            throw new Error(
              `Transaction timeout: ${tx.hash}. Check manually on Sepolia explorer.`
            );
          }
        } else {
          throw waitError;
        }
      }

      // Parse the OptionCreated event to get the option ID
      const optionCreatedEvent = receipt.logs.find((log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === "OptionCreated";
        } catch {
          return false;
        }
      });

      if (optionCreatedEvent) {
        const parsedEvent =
          this.contract.interface.parseLog(optionCreatedEvent);
        const optionId = parsedEvent.args.optionId.toString();

        console.log("🎲 Option created with ID:", optionId);

        return {
          optionId,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      }

      throw new Error("OptionCreated event not found in transaction receipt");
    } catch (error) {
      console.error("❌ Bet placement failed:", error);
      throw error;
    }
  }

  // Get option details from blockchain
  async getOption(optionId) {
    await this.ensureInitialized();
    try {
      const option = await this.contract.getOption(optionId);
      return {
        id: option.id.toString(),
        trader: option.trader,
        asset: option.asset,
        amount: ethers.formatEther(option.amount),
        expiry: new Date(Number(option.expiry) * 1000).toISOString(),
        isCall: option.isCall,
        executed: option.executed,
        entryPrice: option.entryPrice.toString(),
        exitPrice: option.exitPrice.toString(),
        won: option.won,
      };
    } catch (error) {
      console.error("❌ Failed to get option:", error);
      throw error;
    }
  }

  // Execute an option (settle the bet)
  async executeOption(optionId) {
    console.log("🤖 Executing option:", optionId);
    await this.ensureInitialized();

    if (!this.signer) {
      throw new Error("No signer available - cannot execute options");
    }

    try {
      console.log(`⚡ Executing option ${optionId}`);

      const tx = await this.contract.executeOption(optionId, {
        gasLimit: 200000,
      });

      console.log("⏳ Execution transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Execution confirmed:", receipt.hash);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Option execution failed:", error);
      throw error;
    }
  }

  // Get user's options
  async getUserOptions(userAddress) {
    await this.ensureInitialized();
    try {
      const optionIds = await this.contract.getUserOptions(userAddress);
      const options = [];

      for (const optionId of optionIds) {
        const option = await this.getOption(optionId.toString());
        options.push(option);
      }

      return options;
    } catch (error) {
      console.error("❌ Failed to get user options:", error);
      throw error;
    }
  }

  // Get contract statistics
  async getContractStats() {
    await this.ensureInitialized();
    try {
      const stats = await this.contract.getContractStats();
      return {
        totalOptions: stats.totalOptions.toString(),
        contractBalance: ethers.formatEther(stats.contractBalance),
      };
    } catch (error) {
      console.error("❌ Failed to get contract stats:", error);
      throw error;
    }
  }

  // Listen for contract events
  setupEventListeners() {
    if (!this.isInitialized || !this.contract) {
      console.warn(
        "⚠️  Cannot setup event listeners - contract not initialized"
      );
      return;
    }

    console.log("🎯 Setting up contract event listeners...");

    this.contract.on(
      "OptionCreated",
      (optionId, trader, asset, amount, expiry, isCall, event) => {
        console.log("🎲 New option created:", {
          optionId: optionId.toString(),
          trader,
          asset,
          amount: ethers.formatEther(amount),
          expiry: new Date(Number(expiry) * 1000).toISOString(),
          isCall,
        });
      }
    );

    this.contract.on("OptionExecuted", (optionId, won, payout, event) => {
      console.log("⚡ Option executed:", {
        optionId: optionId.toString(),
        won,
        payout: ethers.formatEther(payout),
      });
    });

    console.log("✅ Contract event listeners active");
  }

  // Helper method to ensure initialization
  async ensureInitialized() {
    if (this.isInitialized) return;

    if (this.initializationError) {
      throw this.initializationError;
    }

    // Prevent concurrent initialization
    if (this.initializing) {
      console.log("⏳ Waiting for ongoing initialization to complete...");
      while (this.initializing && !this.isInitialized) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.isInitialized) return;
    }

    await this.init();
  }
}

export default new ContractService();
