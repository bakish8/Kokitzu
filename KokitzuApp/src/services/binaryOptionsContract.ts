import { ethers } from "ethers";

// Contract ABI for the binary options contract
const BINARY_OPTIONS_ABI = [
  // Allowance-based trading functions
  "function setAllowance(uint256 amount) external payable",
  "function getAllowance(address user) external view returns (uint256)",
  "function createOptionWithAllowance(string memory asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall) external",

  // Option execution (automatic)
  "function executeOption(uint256 optionId) external",

  // Option getters
  "function getOptionId(uint256 optionId) external view returns (uint256)",
  "function getOptionTrader(uint256 optionId) external view returns (address)",
  "function getOptionAsset(uint256 optionId) external view returns (string memory)",
  "function getOptionAmount(uint256 optionId) external view returns (uint256)",
  "function getOptionStrikePrice(uint256 optionId) external view returns (uint256)",
  "function getOptionExpiryTime(uint256 optionId) external view returns (uint256)",
  "function getOptionIsCall(uint256 optionId) external view returns (bool)",
  "function getOptionIsExecuted(uint256 optionId) external view returns (bool)",
  "function getOptionIsWon(uint256 optionId) external view returns (bool)",
  "function getOptionPayout(uint256 optionId) external view returns (uint256)",
  "function getOptionTimestamp(uint256 optionId) external view returns (uint256)",
  "function getOptionFinalPrice(uint256 optionId) external view returns (uint256)",

  // Withdrawal
  "function withdrawAllowance(uint256 amount) external",

  // Events
  "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
  "event OptionExecuted(uint256 indexed optionId, bool isWon, bool isPush, uint256 payout, uint256 finalPrice)",
  "event AllowanceSet(address indexed user, uint256 amount)",
  "event AllowanceWithdrawn(address indexed user, uint256 amount)",
];

// Contract address on Arbitrum Sepolia (updated after deployment)
const CONTRACT_ADDRESS = "0x44877E23864A0959292c10bee2C4cba49Caaf3Ed";

export class BinaryOptionsContract {
  private contract: ethers.Contract | null = null;
  private provider: any = null;
  private signer: any = null;
  private isInitialized: boolean = false;
  private userAddress: string = "";

  constructor() {}

  // Initialize with WalletConnect provider (one-time setup)
  async init(wcProvider: any, userAddress: string) {
    // Return early if already initialized with same provider
    if (
      this.isInitialized &&
      this.provider === wcProvider &&
      this.userAddress === userAddress
    ) {
      console.log("✅ Contract already initialized, reusing existing instance");
      return true;
    }

    try {
      console.log("🔧 Initializing Binary Options Contract...");
      console.log(`👤 User Address: ${userAddress}`);

      this.provider = wcProvider;
      this.userAddress = userAddress;

      // Create ethers provider from WalletConnect provider
      const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
      this.signer = ethersProvider.getSigner();

      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        BINARY_OPTIONS_ABI,
        this.signer
      );

      this.isInitialized = true;
      console.log("✅ Binary Options Contract initialized");
      console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize contract:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Set allowance (one-time approval to trade)
  async setAllowance(amountInEth: string) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      console.log(`💰 Setting allowance for ${amountInEth} ETH...`);

      const amountWei = ethers.utils.parseEther(amountInEth);

      // Send ETH to contract as allowance
      const tx = await this.contract.setAllowance(amountWei, {
        value: amountWei,
      });

      console.log(`⏳ Allowance transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(
        `✅ Allowance set successfully in block ${receipt.blockNumber}`
      );

      return receipt;
    } catch (error) {
      console.error("❌ Failed to set allowance:", error);
      throw error;
    }
  }

  // Get user's current allowance
  async getAllowance(): Promise<string> {
    if (!this.contract || !this.userAddress) {
      throw new Error("Contract not initialized or no user address");
    }

    try {
      const allowance = await this.contract.getAllowance(this.userAddress);
      const allowanceEth = ethers.utils.formatEther(allowance);

      console.log(`💰 Current allowance: ${allowanceEth} ETH`);
      return allowanceEth;
    } catch (error) {
      console.error("❌ Failed to get allowance:", error);
      throw error;
    }
  }

  // Create option using allowance (no additional signing)
  async createOptionWithAllowance(
    asset: string,
    amountInEth: string,
    strikePrice: number,
    expiryTimeSeconds: number,
    isCall: boolean
  ) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      console.log(`📝 Creating option with allowance:`, {
        asset,
        amount: amountInEth,
        strikePrice,
        expiryTime: expiryTimeSeconds,
        isCall,
      });

      const amountWei = ethers.utils.parseEther(amountInEth);
      const strikePriceFormatted = Math.round(strikePrice * 100); // Convert to contract format

      // This doesn't require user signature - uses pre-approved allowance
      const tx = await this.contract.createOptionWithAllowance(
        asset,
        amountWei,
        strikePriceFormatted,
        expiryTimeSeconds,
        isCall
      );

      console.log(`⏳ Option creation sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Option created in block ${receipt.blockNumber}`);

      // Extract option ID from events
      const optionCreatedEvent = receipt.events?.find(
        (event: any) => event.event === "OptionCreated"
      );

      const optionId = optionCreatedEvent?.args?.optionId?.toString();
      console.log(`🎯 Option ID: ${optionId}`);

      return {
        optionId,
        transactionHash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error("❌ Failed to create option with allowance:", error);
      throw error;
    }
  }

  // Withdraw unused allowance
  async withdrawAllowance(amountInEth: string) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      console.log(`💸 Withdrawing ${amountInEth} ETH from allowance...`);

      const amountWei = ethers.utils.parseEther(amountInEth);

      const tx = await this.contract.withdrawAllowance(amountWei);
      console.log(`⏳ Withdrawal transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`✅ Withdrawal successful in block ${receipt.blockNumber}`);

      return receipt;
    } catch (error) {
      console.error("❌ Failed to withdraw allowance:", error);
      throw error;
    }
  }

  // Get option details
  async getOption(optionId: string) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      console.log(`🔍 Getting option details for ID: ${optionId}`);

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

      // Convert to readable format
      const originalAmount = ethers.utils.formatEther(amount || 0);
      const payoutAmount = ethers.utils.formatEther(payout || 0);
      const isPush = isExecuted && !isWon && payoutAmount === originalAmount;

      const option = {
        id: id?.toString() || "0",
        trader: trader || "0x0000000000000000000000000000000000000000",
        asset: asset || "",
        amount: originalAmount,
        expiry: new Date(Number(expiryTime) * 1000).toISOString(),
        isCall: Boolean(isCall),
        executed: Boolean(isExecuted),
        entryPrice: (Number(strikePrice) / 100).toString(), // Convert from contract format
        exitPrice: isExecuted ? (Number(finalPrice) / 100).toString() : "0",
        won: Boolean(isWon),
        isPush: isPush,
        payout: payoutAmount,
      };

      console.log(`✅ Option details:`, option);
      return option;
    } catch (error) {
      console.error(`❌ Failed to get option ${optionId}:`, error);
      throw error;
    }
  }

  // Execute option (settle bet)
  async executeOption(optionId: string) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    try {
      console.log(`🎯 Executing option ${optionId}...`);

      // First check if option exists and is not executed
      const option = await this.getOption(optionId);

      if (option.executed) {
        console.log(`⚠️ Option ${optionId} already executed`);
        return option;
      }

      if (option.trader === "0x0000000000000000000000000000000000000000") {
        throw new Error(`Option ${optionId} does not exist`);
      }

      // Execute the option
      console.log(`📝 Sending executeOption transaction...`);
      const tx = await this.contract.executeOption(optionId);
      console.log(`⏳ Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Get updated option details
      const updatedOption = await this.getOption(optionId);
      console.log(`🎯 Execution result:`, {
        optionId,
        won: updatedOption.won,
        isPush: updatedOption.isPush,
        payout: updatedOption.payout,
        status: updatedOption.won
          ? "WON"
          : updatedOption.isPush
          ? "PUSH"
          : "LOST",
      });

      return updatedOption;
    } catch (error) {
      console.error(`❌ Failed to execute option ${optionId}:`, error);
      throw error;
    }
  }

  // Check if option has expired and needs execution
  async isOptionExpired(optionId: string): Promise<boolean> {
    try {
      const option = await this.getOption(optionId);
      const now = new Date();
      const expiry = new Date(option.expiry);

      return now >= expiry && !option.executed;
    } catch (error) {
      console.error(`❌ Failed to check expiry for option ${optionId}:`, error);
      return false;
    }
  }

  // Reset initialization (call when wallet disconnects)
  reset() {
    console.log("🔄 Resetting contract instance");
    this.contract = null;
    this.provider = null;
    this.signer = null;
    this.userAddress = "";
    this.isInitialized = false;
  }
}

export const binaryOptionsContract = new BinaryOptionsContract();
