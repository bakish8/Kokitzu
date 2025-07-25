import { getInfuraUrl, validateApiKeys, API_CONFIG } from "../config/api";
import { NetworkType, NETWORKS } from "../contexts/NetworkContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Simplified WalletConnect service that works with the modal
let currentNetwork: NetworkType = "arbitrumSepolia"; // Default to Arbitrum Sepolia (Testnet)

// Set current network
export const setCurrentNetwork = (network: NetworkType) => {
  currentNetwork = network;
  console.log("🌐 WalletConnect network set to:", network);
};

// Get current network
export const getCurrentNetwork = (): NetworkType => {
  return currentNetwork;
};

// Get wallet balance (real balance from RPC)
export const getWalletBalance = async (
  address: string,
  chainId?: string,
  network?: NetworkType
): Promise<string> => {
  try {
    // Use provided network, chainId, or current network chainId
    const targetNetwork = network || currentNetwork;
    const targetChainId = chainId || NETWORKS[targetNetwork].chainId;

    console.log(
      `💰 Fetching balance for address ${address} on chain ${targetChainId} (${targetNetwork})`
    );

    // Get the appropriate RPC URL based on chain
    let rpcUrl: string;
    switch (targetChainId) {
      case "1": // Ethereum Mainnet
        rpcUrl = getInfuraUrl("mainnet");
        break;
      case "11155111": // Sepolia
        rpcUrl = getInfuraUrl("sepolia");
        break;
      case "137": // Polygon
        rpcUrl = "https://polygon-rpc.com";
        break;
      case "56": // BSC
        rpcUrl = "https://bsc-dataseed.binance.org";
        break;
      case "42161": // Arbitrum One
        rpcUrl = "https://arb1.arbitrum.io/rpc";
        break;
      case "421614": // Arbitrum Sepolia
        rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
        break;
      case "10": // Optimism
        rpcUrl = "https://mainnet.optimism.io";
        break;
      default:
        rpcUrl = getInfuraUrl(targetNetwork); // Use target network
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("❌ RPC Error:", data.error);
      throw new Error(data.error.message);
    }

    // Convert from wei to ETH (or appropriate token)
    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);

    console.log(
      `💰 Balance fetched: ${balanceEth.toFixed(
        4
      )} on chain ${targetChainId} (${targetNetwork})`
    );
    return balanceEth.toFixed(4);
  } catch (error) {
    console.error("❌ Error getting wallet balance:", error);
    // Return 0 instead of throwing to prevent app crashes
    return "0.0000";
  }
};

// Sign message with WalletConnect provider
export const signMessage = async (
  message: string,
  provider: any
): Promise<string> => {
  try {
    if (!provider) {
      throw new Error("Provider not available");
    }

    // Get accounts from provider
    const accounts = await provider.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const address = accounts[0];
    console.log("🖊️ Signing message with address:", address);

    // Request signature using personal_sign
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, address],
    });

    console.log("✅ Message signed successfully");
    return signature;
  } catch (error) {
    console.error("❌ Error signing message:", error);
    throw error;
  }
};

// Send transaction with WalletConnect provider
export const sendTransaction = async (
  transaction: any,
  provider: any
): Promise<string> => {
  try {
    if (!provider) {
      throw new Error("Provider not available");
    }

    console.log("🚀 Sending transaction:", transaction);

    // Send transaction
    const txHash = await provider.request({
      method: "eth_sendTransaction",
      params: [transaction],
    });

    console.log("✅ Transaction sent successfully:", txHash);
    return txHash;
  } catch (error) {
    console.error("❌ Error sending transaction:", error);
    throw error;
  }
};

// Clear all WalletConnect related storage (both web and React Native)
export const clearWalletConnectStorage = async () => {
  try {
    // Clear web localStorage if available
    if (typeof window !== "undefined" && window.localStorage) {
      const webKeysToRemove = [
        "walletconnect",
        "WALLETCONNECT_DEEPLINK_CHOICE",
        "wc@2:client:0.3//session",
        "wc@2:core:0.3//history",
        "wc@2:core:0.3//messages",
        "wc@2:core:0.3//subscription",
        "wc@2:universal_provider:0.3//proposal",
        "wc@2:universal_provider:0.3//session",
      ];

      webKeysToRemove.forEach((key) => {
        window.localStorage.removeItem(key);
      });

      // Also clear any keys that start with wc@2
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("wc@2") || key.includes("walletconnect")) {
          window.localStorage.removeItem(key);
        }
      });

      console.log("🧹 Cleared WalletConnect web localStorage");
    }

    // Clear React Native AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const walletConnectKeys = allKeys.filter(
        (key) =>
          key.includes("walletconnect") ||
          key.includes("wc@2") ||
          key.includes("WALLETCONNECT") ||
          key === "lastConnectedAddress" ||
          key === "connectionTimestamp" ||
          key === "walletAddress" ||
          key === "walletSession"
      );

      if (walletConnectKeys.length > 0) {
        await AsyncStorage.multiRemove(walletConnectKeys);
        console.log(
          "🧹 Cleared WalletConnect AsyncStorage keys:",
          walletConnectKeys
        );
      }
    } catch (asyncStorageError) {
      console.warn("⚠️ Error clearing AsyncStorage:", asyncStorageError);
    }

    console.log("✅ WalletConnect storage cleanup completed");
  } catch (error) {
    console.warn("⚠️ Error clearing WalletConnect storage:", error);
  }
};

// Validate WalletConnect configuration
export const validateWalletConnectConfig = () => {
  const errors = validateApiKeys();
  if (errors.length > 0) {
    throw new Error(`API Keys not configured: ${errors.join(", ")}`);
  }

  const projectId = API_CONFIG.WALLETCONNECT_PROJECT_ID;
  if (!projectId || projectId === "YOUR_WALLETCONNECT_PROJECT_ID") {
    throw new Error("WalletConnect Project ID not configured");
  }

  return true;
};
