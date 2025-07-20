import { ethers } from "ethers";
import { getInfuraUrl } from "../config/api";
import { NetworkType, NETWORKS } from "../contexts/NetworkContext";

// BinaryOptions Contract ABI (simplified for key functions)
const BINARY_OPTIONS_ABI = [
  // Events
  "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
  "event OptionExecuted(uint256 indexed optionId, bool isWon, uint256 payout, uint256 finalPrice)",

  // View functions
  "function getOption(uint256 optionId) external view returns (uint256 id, address trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall, bool isExecuted, bool isWon, uint256 payout, uint256 timestamp)",
  "function getUserOptions(address user) external view returns (uint256[])",
  "function getCurrentPrice(string memory asset) external view returns (uint256)",
  "function getContractStats() external view returns (uint256 totalOptions, uint256 totalVolume, uint256 contractBalance)",

  // State changing functions
  "function createOption(string memory asset, uint256 amount, uint256 expiryTime, bool isCall) external payable",
  "function executeOption(uint256 optionId) external",

  // Admin functions
  "function updateAssetConfig(string memory asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage) external",
  "function withdrawFees() external",
  "function pauseAsset(string memory asset) external",
  "function resumeAsset(string memory asset) external",
];

// Contract addresses for different networks
const CONTRACT_ADDRESSES: Record<NetworkType, string> = {
  mainnet: "0x...", // Deploy and add mainnet address
  sepolia: "0x...", // Deploy and add sepolia address
  goerli: "0x...", // Deploy and add goerli address
};

export interface Option {
  id: number;
  trader: string;
  asset: string;
  amount: string;
  strikePrice: string;
  expiryTime: number;
  isCall: boolean;
  isExecuted: boolean;
  isWon: boolean;
  payout: string;
  timestamp: number;
}

export interface ContractStats {
  totalOptions: number;
  totalVolume: string;
  contractBalance: string;
}

export interface CreateOptionParams {
  asset: string;
  amount: string; // in ETH
  expiryTime: number; // in seconds
  isCall: boolean;
}

class BinaryOptionsContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private currentNetwork: NetworkType = "sepolia"; // Default to Sepolia

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(
        getInfuraUrl(this.currentNetwork)
      );
      console.log(
        "✅ BinaryOptions contract provider initialized for",
        this.currentNetwork
      );
    } catch (error) {
      console.error("❌ Failed to initialize provider:", error);
    }
  }

  /**
   * Set network and reinitialize provider
   */
  setNetwork(network: NetworkType) {
    this.currentNetwork = network;
    this.initializeProvider();
    console.log("🌐 BinaryOptions contract network set to:", network);
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): NetworkType {
    return this.currentNetwork;
  }

  /**
   * Get current network config
   */
  getCurrentNetworkConfig() {
    return NETWORKS[this.currentNetwork];
  }

  /**
   * Connect wallet to contract
   */
  async connectWallet(signer: ethers.Signer) {
    try {
      this.signer = signer;
      const contractAddress = CONTRACT_ADDRESSES[this.currentNetwork];

      if (!contractAddress || contractAddress === "0x...") {
        throw new Error(
          `Contract not deployed on ${this.currentNetwork}. Please deploy the contract first.`
        );
      }

      this.contract = new ethers.Contract(
        contractAddress,
        BINARY_OPTIONS_ABI,
        signer
      );
      console.log(
        "✅ Connected to BinaryOptions contract:",
        contractAddress,
        "on",
        this.currentNetwork
      );

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to contract:", error);
      return false;
    }
  }

  /**
   * Get current price for an asset
   */
  async getCurrentPrice(asset: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const price = await this.contract.getCurrentPrice(asset);
      return ethers.utils.formatUnits(price, 8); // Chainlink prices have 8 decimals
    } catch (error) {
      console.error("❌ Failed to get current price:", error);
      throw error;
    }
  }

  /**
   * Create a new binary option
   */
  async createOption(
    params: CreateOptionParams
  ): Promise<ethers.ContractTransaction> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error("Contract not connected");
      }

      const amountWei = ethers.utils.parseEther(params.amount);

      console.log("📝 Creating option on", this.currentNetwork, ":", {
        asset: params.asset,
        amount: params.amount,
        expiryTime: params.expiryTime,
        isCall: params.isCall,
      });

      const tx = await this.contract.createOption(
        params.asset,
        amountWei,
        params.expiryTime,
        params.isCall,
        { value: amountWei }
      );

      console.log(
        "✅ Option creation transaction sent:",
        tx.hash,
        "on",
        this.currentNetwork
      );
      return tx;
    } catch (error) {
      console.error("❌ Failed to create option:", error);
      throw error;
    }
  }

  /**
   * Execute an expired option
   */
  async executeOption(optionId: number): Promise<ethers.ContractTransaction> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      console.log("🎯 Executing option:", optionId, "on", this.currentNetwork);

      const tx = await this.contract.executeOption(optionId);
      console.log(
        "✅ Option execution transaction sent:",
        tx.hash,
        "on",
        this.currentNetwork
      );

      return tx;
    } catch (error) {
      console.error("❌ Failed to execute option:", error);
      throw error;
    }
  }

  /**
   * Get option details
   */
  async getOption(optionId: number): Promise<Option> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const option = await this.contract.getOption(optionId);

      return {
        id: option.id.toNumber(),
        trader: option.trader,
        asset: option.asset,
        amount: ethers.utils.formatEther(option.amount),
        strikePrice: ethers.utils.formatUnits(option.strikePrice, 8),
        expiryTime: option.expiryTime.toNumber(),
        isCall: option.isCall,
        isExecuted: option.isExecuted,
        isWon: option.isWon,
        payout: ethers.utils.formatEther(option.payout),
        timestamp: option.timestamp.toNumber(),
      };
    } catch (error) {
      console.error("❌ Failed to get option:", error);
      throw error;
    }
  }

  /**
   * Get user's options
   */
  async getUserOptions(userAddress: string): Promise<number[]> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const optionIds = await this.contract.getUserOptions(userAddress);
      return optionIds.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error("❌ Failed to get user options:", error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const stats = await this.contract.getContractStats();

      return {
        totalOptions: stats.totalOptions.toNumber(),
        totalVolume: ethers.utils.formatEther(stats.totalVolume),
        contractBalance: ethers.utils.formatEther(stats.contractBalance),
      };
    } catch (error) {
      console.error("❌ Failed to get contract stats:", error);
      throw error;
    }
  }

  /**
   * Get user's active options
   */
  async getUserActiveOptions(userAddress: string): Promise<Option[]> {
    try {
      const optionIds = await this.getUserOptions(userAddress);
      const activeOptions: Option[] = [];

      for (const optionId of optionIds) {
        const option = await this.getOption(optionId);
        if (!option.isExecuted) {
          activeOptions.push(option);
        }
      }

      return activeOptions;
    } catch (error) {
      console.error("❌ Failed to get user active options:", error);
      throw error;
    }
  }

  /**
   * Get user's completed options
   */
  async getUserCompletedOptions(userAddress: string): Promise<Option[]> {
    try {
      const optionIds = await this.getUserOptions(userAddress);
      const completedOptions: Option[] = [];

      for (const optionId of optionIds) {
        const option = await this.getOption(optionId);
        if (option.isExecuted) {
          completedOptions.push(option);
        }
      }

      return completedOptions;
    } catch (error) {
      console.error("❌ Failed to get user completed options:", error);
      throw error;
    }
  }

  /**
   * Check if option can be executed
   */
  async canExecuteOption(optionId: number): Promise<boolean> {
    try {
      const option = await this.getOption(optionId);
      return !option.isExecuted && Date.now() / 1000 >= option.expiryTime;
    } catch (error) {
      console.error("❌ Failed to check if option can be executed:", error);
      return false;
    }
  }

  /**
   * Listen to option creation events
   */
  onOptionCreated(
    callback: (
      optionId: number,
      trader: string,
      asset: string,
      amount: string,
      isCall: boolean
    ) => void
  ) {
    if (!this.contract) {
      console.error("❌ Contract not connected");
      return;
    }

    this.contract.on(
      "OptionCreated",
      (optionId, trader, asset, amount, strikePrice, expiryTime, isCall) => {
        callback(
          optionId.toNumber(),
          trader,
          asset,
          ethers.utils.formatEther(amount),
          isCall
        );
      }
    );
  }

  /**
   * Listen to option execution events
   */
  onOptionExecuted(
    callback: (
      optionId: number,
      isWon: boolean,
      payout: string,
      finalPrice: string
    ) => void
  ) {
    if (!this.contract) {
      console.error("❌ Contract not connected");
      return;
    }

    this.contract.on(
      "OptionExecuted",
      (optionId, isWon, payout, finalPrice) => {
        callback(
          optionId.toNumber(),
          isWon,
          ethers.utils.formatEther(payout),
          ethers.utils.formatUnits(finalPrice, 8)
        );
      }
    );
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton instance
export const binaryOptionsContract = new BinaryOptionsContractService();
export default binaryOptionsContract;
