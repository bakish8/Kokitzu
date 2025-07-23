import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Contract configuration
// ✅ UPDATED: New contract with individual getter functions (deployed 2025-01-23)
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x569b1c7dA5ec9E57A33BBe99CC2E2Bfbb1b819C4";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI - you'll need to get this from your compiled contract
const CONTRACT_ABI = [
  // Event signatures
  "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
  "event OptionExecuted(uint256 indexed optionId, bool won, bool isPush, uint256 payout, uint256 finalPrice)",

  // Main functions
  "function createOption(string memory asset, uint256 amount, uint256 expiryTime, bool isCall) external payable",
  "function createOptionFor(address beneficiary, string memory asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall) external payable",
  "function executeOption(uint256 optionId) external",
  "function getCurrentPrice(string memory asset) external view returns (uint256)",
  "function assetConfigs(string) external view returns (address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage, bool isActive)",
  "function getUserOptions(address user) external view returns (uint256[])",
  "function getContractStats() external view returns (uint256 totalOptions, uint256 totalVolume, uint256 contractBalance)",

  // Individual option getter functions
  "function getOptionId(uint256 optionId) external view returns (uint256)",
  "function getOptionTrader(uint256 optionId) external view returns (address)",
  "function getOptionAsset(uint256 optionId) external view returns (string)",
  "function getOptionAmount(uint256 optionId) external view returns (uint256)",
  "function getOptionStrikePrice(uint256 optionId) external view returns (uint256)",
  "function getOptionExpiryTime(uint256 optionId) external view returns (uint256)",
  "function getOptionIsCall(uint256 optionId) external view returns (bool)",
  "function getOptionIsExecuted(uint256 optionId) external view returns (bool)",
  "function getOptionIsWon(uint256 optionId) external view returns (bool)",
  "function getOptionPayout(uint256 optionId) external view returns (uint256)",
  "function getOptionTimestamp(uint256 optionId) external view returns (uint256)",
  "function getOptionFinalPrice(uint256 optionId) external view returns (uint256)",

  // Owner functions
  "function updateAssetConfig(string memory asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage) external",
  "function pauseAsset(string memory asset) external",
  "function resumeAsset(string memory asset) external",
  "function withdrawFees() external",
  "function fundContract() external payable",
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

    // Rate limiting configuration
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 seconds between requests (increased to reduce load)
    this.maxRetries = 1; // Minimal retries to avoid overwhelming
    this.retryDelay = 3000; // 3 seconds (increased to reduce load)
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
      console.log(
        `🔧 DEBUG: Using contract address from: ${
          process.env.CONTRACT_ADDRESS ? "ENV" : "DEFAULT"
        }`
      );
      console.log(
        `🔧 DEBUG: Expected NEW contract: 0x569b1c7dA5ec9E57A33BBe99CC2E2Bfbb1b819C4`
      );
      console.log(
        `🔧 DEBUG: Expected OLD contract: 0x7aC3058352cc4360dd12fD592BF33baBEE55dBdc`
      );
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
      ONE_MINUTE: 60, // Back to 60 seconds (1 minute)
      FIVE_MINUTES: 5 * 60,
      FIFTEEN_MINUTES: 15 * 60,
      THIRTY_MINUTES: 30 * 60,
      ONE_HOUR: 60 * 60,
      FOUR_HOURS: 4 * 60 * 60,
      ONE_DAY: 24 * 60 * 60,
    };
    // Return duration only (not absolute timestamp)
    // Ensure minimum 30 seconds as required by contract (updated from 5 minutes)
    const expiry = Math.max(timeframes[timeframe] || 60, 30);

    console.log(`⏰ EXPIRY TIME DEBUG:`);
    console.log(`   └─ Requested timeframe: ${timeframe}`);
    console.log(
      `   └─ Raw mapping: ${timeframes[timeframe] || "undefined"} seconds`
    );
    console.log(
      `   └─ Final expiry: ${expiry} seconds (${expiry / 60} minutes)`
    );
    console.log(`   └─ Contract minimum: 30 seconds`);
    console.log(
      `   └─ Will pass validation: ${expiry >= 30 ? "✅ YES" : "❌ NO"}`
    );

    return expiry;
  }

  // Prepare transaction data for user's wallet to sign (NEW)
  async prepareTransaction(
    cryptoSymbol,
    betType,
    amount,
    timeframe,
    walletAddress,
    entryPrice
  ) {
    await this.ensureInitialized();

    try {
      const asset = this.mapSymbolToAsset(cryptoSymbol);
      const expiry = this.getExpiryTimestamp(timeframe);
      const isCall = betType === "UP";
      const truncatedAmount = parseFloat(amount.toString()).toFixed(18);
      const amountInWei = ethers.parseEther(truncatedAmount);

      console.log(
        `📝 Preparing transaction data for: ${asset} ${betType} ${amount} ETH`
      );

      // 🔍 DEBUG VALUE CALCULATION
      console.log("🔍 VALUE CALCULATION DEBUG:");
      console.log(`   └─ Original amount: ${amount}`);
      console.log(`   └─ Amount type: ${typeof amount}`);
      console.log(`   └─ Truncated amount: ${truncatedAmount}`);
      console.log(`   └─ amountInWei: ${amountInWei.toString()}`);
      console.log(`   └─ amountInWei (hex): 0x${amountInWei.toString(16)}`);
      console.log(`   └─ Back to ETH: ${ethers.formatEther(amountInWei)} ETH`);

      // Convert entry price to contract format (USD with 2 decimals)
      const strikePriceForContract = Math.round(entryPrice * 100);
      console.log(
        `📊 Entry price: $${entryPrice} -> ${strikePriceForContract} (contract format)`
      );

      // Prepare transaction data (don't send yet) - use createOptionFor with entry price
      const txData = await this.contract.createOptionFor.populateTransaction(
        walletAddress, // User's wallet address as beneficiary
        asset,
        amountInWei,
        strikePriceForContract, // Entry price in contract format
        expiry,
        isCall
      );

      const result = {
        contractAddress: await this.contract.getAddress(),
        data: txData.data,
        value: amountInWei.toString(),
        gasLimit: 500000, // Increased from 300k to 500k due to out of gas errors
        asset,
        expiry,
        isCall,
      };

      console.log("🔍 RETURNING TRANSACTION DATA:");
      console.log(`   └─ value (wei string): ${result.value}`);
      console.log(`   └─ value (ETH): ${ethers.formatEther(result.value)} ETH`);

      return result;
    } catch (error) {
      console.error("❌ Failed to prepare transaction:", error);
      throw error;
    }
  }

  // Place a bet on the blockchain (OLD - for fallback)
  async placeBet(
    cryptoSymbol,
    betType,
    amount,
    timeframe,
    userWalletAddress = null,
    strikePrice = null
  ) {
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

      // Create option on blockchain - use createOptionFor if userWalletAddress provided
      let tx;
      if (userWalletAddress) {
        console.log(`🎯 Creating option FOR user: ${userWalletAddress}`);
        console.log(`💰 Server pays, but user gets credited as trader`);

        // Convert strike price to contract format (USD with 2 decimals)
        // e.g., $3656.84 -> 365684
        const strikePriceForContract = strikePrice
          ? Math.round(strikePrice * 100)
          : 0;
        console.log(
          `📊 Strike price: $${strikePrice} -> ${strikePriceForContract} (contract format)`
        );

        tx = await this.contract.createOptionFor(
          userWalletAddress, // Beneficiary - user gets the payout
          asset,
          amountInWei,
          strikePriceForContract, // Strike price in contract format
          expiry,
          isCall,
          {
            value: amountInWei, // Server wallet sends ETH
            gasLimit: 500000, // Reduced from 500k to 300k
            maxFeePerGas: ethers.parseUnits("1", "gwei"), // Ultra-low 1 gwei for Sepolia
            maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"), // Keep priority at 1 gwei
          }
        );
      } else {
        console.log(`🏦 Creating option for server wallet`);
        tx = await this.contract.createOption(
          asset,
          amountInWei,
          expiry,
          isCall,
          {
            value: amountInWei,
            gasLimit: 500000, // Reduced from 500k to 300k
            maxFeePerGas: ethers.parseUnits("1", "gwei"), // Ultra-low 1 gwei for Sepolia
            maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"), // Keep priority at 1 gwei
          }
        );
      }

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
    return this.withRetry(async () => {
      console.log(`🔍 Getting option details for ID: ${optionId}`);

      // Use individual getter functions to avoid struct decoding issues
      const [
        id,
        trader,
        asset,
        amount,
        strikePrice,
        expiryTime,
        isCall,
        isExecuted,
        isWon,
        payout,
        timestamp,
        finalPrice,
      ] = await Promise.all([
        this.contract.getOptionId(optionId),
        this.contract.getOptionTrader(optionId),
        this.contract.getOptionAsset(optionId),
        this.contract.getOptionAmount(optionId),
        this.contract.getOptionStrikePrice(optionId),
        this.contract.getOptionExpiryTime(optionId),
        this.contract.getOptionIsCall(optionId),
        this.contract.getOptionIsExecuted(optionId),
        this.contract.getOptionIsWon(optionId),
        this.contract.getOptionPayout(optionId),
        this.contract.getOptionTimestamp(optionId),
        this.contract.getOptionFinalPrice(optionId),
      ]);

      console.log(`📊 Raw option data:`, {
        id: id?.toString(),
        trader: trader,
        asset: asset,
        amount: amount?.toString(),
        strikePrice: strikePrice?.toString(),
        expiryTime: expiryTime?.toString(),
        isCall: isCall,
        isExecuted: isExecuted,
        isWon: isWon,
        payout: payout?.toString(),
        timestamp: timestamp?.toString(),
        finalPrice: finalPrice?.toString(),
      });

      // Safe timestamp conversion with validation
      let expiryISO = null;
      try {
        const expirySeconds = Number(expiryTime);
        if (expirySeconds > 0 && expirySeconds < 4000000000) {
          // Valid Unix timestamp range
          expiryISO = new Date(expirySeconds * 1000).toISOString();
        } else {
          console.warn(`⚠️  Invalid expiry timestamp: ${expirySeconds}`);
          expiryISO = new Date().toISOString(); // Fallback to current time
        }
      } catch (timeError) {
        console.warn(`⚠️  Timestamp conversion failed: ${timeError.message}`);
        expiryISO = new Date().toISOString();
      }

      const result = {
        id: id?.toString() || "0",
        trader: trader || "0x0000000000000000000000000000000000000000",
        asset: asset || "",
        amount: ethers.formatEther(amount || 0),
        expiry: expiryISO,
        isCall: Boolean(isCall),
        executed: Boolean(isExecuted),
        entryPrice: strikePrice?.toString() || "0", // strikePrice
        exitPrice: isExecuted ? finalPrice?.toString() || "0" : "0", // finalPrice if executed
        won: Boolean(isWon),
        payout: ethers.formatEther(payout || 0),
      };

      console.log(`✅ Processed option data:`, result);
      return result;
    }, `getOption(${optionId})`);
  }

  // Execute an option (settle the bet)
  async executeOption(optionId, userWalletAddress = null) {
    console.log(`🎯 Starting execution for option ${optionId}`);
    if (userWalletAddress) {
      console.log(`👤 User wallet address: ${userWalletAddress}`);
    }

    // First, let's try to get the option details using the processed getOption function
    try {
      console.log(`🔍 Getting option details using processed function...`);
      const processedOption = await this.getOption(optionId);
      console.log(`📊 Processed option details:`, processedOption);

      if (
        !processedOption.trader ||
        processedOption.trader === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(
          `Invalid trader address from processed option: ${processedOption.trader}`
        );
      }

      console.log(
        `✅ Using trader address from processed option: ${processedOption.trader}`
      );
    } catch (processedError) {
      console.warn(
        `⚠️ Could not get processed option details:`,
        processedError.message
      );
      console.log(`🔄 Falling back to raw contract call...`);
    }

    try {
      // Ensure contract is initialized
      if (!this.contract) {
        console.log("🔧 Contract not initialized, initializing now...");
        await this.ensureInitialized();
      }

      // 1. בדוק יתרת החוזה
      const contractAddress = CONTRACT_ADDRESS;
      const contractBalance = await this.provider.getBalance(contractAddress);
      console.log(
        `💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`
      );

      // 2. קבל פרטי האופציה
      const [trader, amount, isExecuted] = await Promise.all([
        this.contract.getOptionTrader(optionId),
        this.contract.getOptionAmount(optionId),
        this.contract.getOptionIsExecuted(optionId),
      ]);

      console.log(`📊 Raw option data:`, {
        trader: trader,
        amount: amount?.toString(),
        isExecuted: isExecuted,
      });

      // Check if option exists (all values should not be null/zero)
      if (!trader) {
        throw new Error(`Option ${optionId} does not exist`);
      }

      console.log(`🔍 Option validation:`, {
        optionId: optionId,
        trader: trader,
        traderIsZero: trader === "0x0000000000000000000000000000000000000000",
        traderIsNull: trader === null || trader === undefined,
        amount: amount?.toString(),
        isExecuted: isExecuted,
      });

      // If trader is zero address, the option doesn't exist
      if (trader === "0x0000000000000000000000000000000000000000") {
        throw new Error(
          `Option ${optionId} does not exist (trader is zero address)`
        );
      }

      console.log(`📊 Extracted values:`, {
        trader: trader,
        traderType: typeof trader,
        amount: amount,
        isExecuted: isExecuted,
      });

      console.log(`📊 Option details:`, {
        trader: trader,
        amount: ethers.formatEther(amount || 0),
        isExecuted: isExecuted,
      });

      // 3. בדוק שהארנק של הלקוח תואם לארנק ששמור באופציה
      if (
        userWalletAddress &&
        userWalletAddress.toLowerCase() !== trader.toLowerCase()
      ) {
        console.warn(
          `⚠️ Warning: User wallet address (${userWalletAddress}) doesn't match option trader (${trader})`
        );
      }

      // 4. בדוק יתרת הלקוח לפני
      console.log(`🔍 Checking trader address: ${trader}`);
      console.log(`🔍 Trader address type: ${typeof trader}`);
      console.log(
        `🔍 Trader address length: ${trader ? trader.length : "null"}`
      );

      // Validate trader address BEFORE trying to get balance
      if (
        !trader ||
        trader === "0x0000000000000000000000000000000000000000" ||
        trader === null ||
        trader === undefined
      ) {
        console.error(`❌ Invalid trader address: ${trader}`);
        console.error(
          `❌ Cannot proceed with execution - trader address is invalid`
        );
        throw new Error(`Invalid trader address: ${trader}`);
      }

      // Validate address format
      if (!trader.startsWith("0x") || trader.length !== 42) {
        console.error(`❌ Invalid address format: ${trader}`);
        throw new Error(`Invalid address format: ${trader}`);
      }

      console.log(`✅ Trader address is valid: ${trader}`);

      // Additional validation before calling getBalance
      let traderBalanceBefore;
      try {
        traderBalanceBefore = await this.provider.getBalance(trader);
        console.log(
          `👤 Trader balance before: ${ethers.formatEther(
            traderBalanceBefore
          )} ETH`
        );
      } catch (balanceError) {
        console.error(`❌ Error getting trader balance:`, balanceError);
        console.error(`❌ Trader address that caused error: ${trader}`);
        throw new Error(
          `Failed to get trader balance: ${balanceError.message}`
        );
      }

      // 5. בצע את הטרנזקציה
      const tx = await this.contract.executeOption(optionId, {
        gasLimit: 800000,
      });

      console.log(`⏳ Transaction sent: ${tx.hash}`);

      // 6. חכה לאישור
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`📋 Status: ${receipt.status === 1 ? "SUCCESS" : "FAILED"}`);

      // 7. בדוק events
      console.log(`📋 Transaction logs count: ${receipt.logs.length}`);

      const events = receipt.logs
        .map((log) => {
          try {
            return this.contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      console.log(
        `📋 Parsed events:`,
        events.map((e) => e.name)
      );

      const optionExecutedEvent = events.find(
        (e) => e.name === "OptionExecuted"
      );

      if (optionExecutedEvent) {
        console.log(`🎉 OptionExecuted event:`, {
          isWon: optionExecutedEvent.args.isWon,
          isPush: optionExecutedEvent.args.isPush,
          payout: ethers.formatEther(optionExecutedEvent.args.payout),
          finalPrice: optionExecutedEvent.args.finalPrice.toString(),
        });
      } else {
        console.log(`❌ No OptionExecuted event found!`);
        console.log(
          `📋 Available events:`,
          events.map((e) => ({ name: e.name, args: e.args }))
        );
      }

      // 8. בדוק יתרת הלקוח אחרי
      let traderBalanceAfter;
      try {
        traderBalanceAfter = await this.provider.getBalance(trader);
        const balanceChange = traderBalanceAfter.sub(traderBalanceBefore);
        console.log(
          `👤 Trader balance after: ${ethers.formatEther(
            traderBalanceAfter
          )} ETH`
        );
        console.log(
          `💸 Balance change: ${ethers.formatEther(balanceChange)} ETH`
        );
      } catch (balanceError) {
        console.error(
          `❌ Error getting trader balance after execution:`,
          balanceError
        );
        console.error(`❌ Trader address that caused error: ${trader}`);
      }

      return receipt;
    } catch (error) {
      console.error(`❌ Execution failed:`, error);
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

  // Get current price for an asset
  async getCurrentPrice(asset) {
    await this.ensureInitialized();
    return this.withRetry(async () => {
      const price = await this.contract.getCurrentPrice(asset);
      return price;
    }, `getCurrentPrice(${asset})`);
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash) {
    await this.ensureInitialized();
    try {
      console.log(`🔍 Getting receipt for transaction: ${txHash}`);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error(
          "Transaction receipt not found - transaction may be pending"
        );
      }
      console.log(
        `✅ Transaction receipt found, block: ${receipt.blockNumber}`
      );
      return receipt;
    } catch (error) {
      console.error(`❌ Failed to get transaction receipt:`, error);
      throw error;
    }
  }

  // Parse OptionCreated event from transaction receipt
  async parseOptionCreatedEvent(receipt) {
    await this.ensureInitialized();
    try {
      console.log(
        `🔍 Parsing OptionCreated event from ${receipt.logs.length} logs...`
      );

      // Find the OptionCreated event
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (parsedLog && parsedLog.name === "OptionCreated") {
            const optionId = parsedLog.args.optionId.toString();
            console.log(`✅ Found OptionCreated event: optionId = ${optionId}`);
            return optionId;
          }
        } catch (parseError) {
          // This log is not from our contract, skip it
          continue;
        }
      }

      throw new Error("OptionCreated event not found in transaction logs");
    } catch (error) {
      console.error(`❌ Failed to parse OptionCreated event:`, error);
      throw error;
    }
  }

  // Get contract statistics
  async getContractStats() {
    await this.ensureInitialized();
    try {
      const stats = await this.contract.getContractStats();
      return {
        totalOptions: stats[0].toString(),
        totalVolume: ethers.formatEther(stats[1]),
        contractBalance: ethers.formatEther(stats[2]),
      };
    } catch (error) {
      console.error("❌ Failed to get contract stats:", error);
      throw error;
    }
  }

  // Fund the contract with ETH to cover payouts
  async fundContract(amountEth) {
    await this.ensureInitialized();

    if (!this.signer) {
      throw new Error("No signer available - cannot fund contract");
    }

    try {
      const amountWei = ethers.parseEther(amountEth.toString());

      console.log(`💰 Funding contract with ${amountEth} ETH...`);

      const tx = await this.contract.fundContract({
        value: amountWei,
        gasLimit: 100000,
      });

      console.log("⏳ Funding transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Contract funded successfully!");
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amountFunded: amountEth,
      };
    } catch (error) {
      console.error("❌ Contract funding failed:", error);
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
      (
        optionId,
        trader,
        asset,
        amount,
        strikePrice,
        expiryTime,
        isCall,
        event
      ) => {
        // Safe timestamp conversion
        let expiryISO = "Invalid Date";
        try {
          const expirySeconds = Number(expiryTime);
          if (expirySeconds > 0 && expirySeconds < 4000000000) {
            expiryISO = new Date(expirySeconds * 1000).toISOString();
          }
        } catch (error) {
          console.warn("⚠️  Event timestamp conversion failed:", error.message);
        }

        console.log("🎲 New option created:", {
          optionId: optionId.toString(),
          trader,
          asset,
          amount: ethers.formatEther(amount),
          strikePrice: ethers.formatEther(strikePrice),
          expiry: expiryISO,
          isCall: Boolean(isCall),
        });
      }
    );

    this.contract.on(
      "OptionExecuted",
      (optionId, isWon, isPush, payout, finalPrice, event) => {
        console.log("⚡ Option executed:", {
          optionId: optionId.toString(),
          isWon: Boolean(isWon),
          isPush: Boolean(isPush),
          payout: ethers.formatEther(payout),
          finalPrice: (Number(finalPrice) / 1e8).toLocaleString(), // Price feed format
        });
      }
    );

    console.log("✅ Contract event listeners active");
  }

  // Rate limiting wrapper for blockchain requests
  async withRateLimit(operation, operationName = "blockchain operation") {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(
        `⏳ Rate limiting: waiting ${waitTime}ms before ${operationName}`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    return operation();
  }

  // Retry wrapper for failed requests
  async withRetry(operation, operationName = "blockchain operation") {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.withRateLimit(operation, operationName);
      } catch (error) {
        lastError = error;

        // Check if it's a rate limit error
        if (
          error.message.includes("Too Many Requests") ||
          error.message.includes("-32005") ||
          error.code === "BAD_DATA"
        ) {
          console.warn(
            `⚠️ Rate limit hit on attempt ${attempt}/${this.maxRetries} for ${operationName}`
          );

          if (attempt < this.maxRetries) {
            const delay = this.retryDelay * attempt; // Exponential backoff
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // For non-rate-limit errors, don't retry
        throw error;
      }
    }

    throw lastError;
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
