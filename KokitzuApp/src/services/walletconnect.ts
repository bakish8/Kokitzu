import { getInfuraUrl, validateApiKeys, API_CONFIG } from "../config/api";
import { SignClient } from "@walletconnect/sign-client";
import { NetworkType, NETWORKS } from "../contexts/NetworkContext";

let signClient: any = null;
let isConnected = false;
let currentAddress: string | null = null;
let currentSession: any = null;
let currentNetwork: NetworkType = "sepolia"; // Default to Sepolia

// Initialize WalletConnect SignClient
export const initializeWalletConnect = async () => {
  try {
    // Check if already initialized
    if (signClient) {
      console.log("WalletConnect SignClient already initialized");
      return true;
    }

    // Check if API keys are configured
    const errors = validateApiKeys();
    if (errors.length > 0) {
      throw new Error(`API Keys not configured: ${errors.join(", ")}`);
    }

    const projectId = API_CONFIG.WALLETCONNECT_PROJECT_ID;
    if (!projectId || projectId === "YOUR_WALLETCONNECT_PROJECT_ID") {
      throw new Error("WalletConnect Project ID not configured");
    }

    // Initialize SignClient
    signClient = await SignClient.init({
      projectId,
      metadata: {
        name: "KokitzuApp",
        description: "Crypto Binary Options Trading App",
        url: "https://kokitzu.app",
        icons: ["https://kokitzu.app/icon.png"],
      },
    });

    console.log("WalletConnect SignClient initialized");
    return true;
  } catch (error) {
    console.error("Error initializing WalletConnect:", error);
    throw error;
  }
};

// Set current network
export const setCurrentNetwork = (network: NetworkType) => {
  currentNetwork = network;
  console.log("🌐 WalletConnect network set to:", network);
};

// Get current network
export const getCurrentNetwork = (): NetworkType => {
  return currentNetwork;
};

// Connect to wallet using WalletConnect
export const connectWalletConnect = async () => {
  try {
    console.log("Starting WalletConnect connection on", currentNetwork);

    // Initialize if not already done
    if (!signClient) {
      console.log("Initializing WalletConnect SignClient...");
      await initializeWalletConnect();
    }

    if (!signClient) {
      throw new Error("Failed to initialize WalletConnect");
    }

    console.log("Creating WalletConnect connection...");

    // Get chain ID for current network
    const chainId = NETWORKS[currentNetwork].chainId;

    // Create connection URI
    const { uri, approval } = await signClient.connect({
      optionalNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
          chains: [`eip155:${chainId}`],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    if (!uri) {
      throw new Error("Failed to generate connection URI");
    }

    console.log(
      "WalletConnect URI generated successfully for",
      currentNetwork,
      ":",
      uri.substring(0, 50) + "..."
    );
    console.log("Waiting for wallet approval...");

    return { uri, approval };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

// Get active sessions
export const getWalletConnectSessions = () => {
  if (!signClient) {
    return {};
  }
  return signClient.session.getAll();
};

// Disconnect wallet
export const disconnectWalletConnect = async (topic?: string) => {
  try {
    if (!signClient) {
      console.log("No SignClient to disconnect");
      return;
    }

    // If no topic provided, try to disconnect current session
    if (!topic && currentSession?.topic) {
      topic = currentSession.topic;
    }

    // If we have a valid topic, try to disconnect
    if (topic && topic !== "0" && topic !== "mock-topic") {
      try {
        await signClient.disconnect({
          topic,
          reason: {
            code: 6000,
            message: "User disconnected",
          },
        });
        console.log("Successfully disconnected session:", topic);
      } catch (disconnectError) {
        console.log("Session already disconnected or doesn't exist:", topic);
      }
    }

    // Clear local state regardless of disconnect success
    isConnected = false;
    currentAddress = null;
    currentSession = null;
    console.log("Wallet disconnected and local state cleared");
  } catch (error) {
    console.error("Error in disconnect process:", error);
    // Still clear local state even if there's an error
    isConnected = false;
    currentAddress = null;
    currentSession = null;
  }
};

// Get current chain ID from session
export const getCurrentChainId = (session: any): string => {
  try {
    if (session?.namespaces?.eip155?.chains) {
      const chains = session.namespaces.eip155.chains;
      if (chains.length > 0) {
        // Extract chain ID from chain string (format: eip155:1)
        const chain = chains[0];
        const chainId = chain.split(":")[1];
        console.log("🔗 Current chain ID:", chainId);
        return chainId;
      }
    }
    // Default to current network chain ID
    const defaultChainId = NETWORKS[currentNetwork].chainId;
    console.log("🔗 Using default chain ID:", defaultChainId);
    return defaultChainId;
  } catch (error) {
    console.error("Error getting current chain ID:", error);
    return NETWORKS[currentNetwork].chainId;
  }
};

// Get wallet address from session
export const getWalletAddress = (session: any): string | null => {
  try {
    if (session?.namespaces?.eip155?.accounts) {
      const accounts = session.namespaces.eip155.accounts;
      if (accounts.length > 0) {
        // Extract address from account string (format: eip155:1:0x...)
        const account = accounts[0];
        const address = account.split(":")[2];
        return address;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return null;
  }
};

// Get wallet balance (real balance from Infura)
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
      case "42161": // Arbitrum
        rpcUrl = "https://arb1.arbitrum.io/rpc";
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

// Sign message with real wallet
export const signMessage = async (
  message: string,
  session: any
): Promise<string | null> => {
  try {
    if (!signClient || !session) {
      throw new Error("Wallet not connected");
    }

    const address = getWalletAddress(session);
    if (!address) {
      throw new Error("No wallet address found");
    }

    const chainId = NETWORKS[currentNetwork].chainId;

    // Request signature from wallet
    const signature = await signClient.request({
      topic: session.topic,
      chainId: `eip155:${chainId}`,
      request: {
        method: "personal_sign",
        params: [message, address],
      },
    });

    return signature as string;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
};

// Send transaction with real wallet
export const sendTransaction = async (
  transaction: any,
  session: any
): Promise<string | null> => {
  try {
    if (!signClient || !session) {
      throw new Error("Wallet not connected");
    }

    const chainId = NETWORKS[currentNetwork].chainId;

    // Request transaction from wallet
    const txHash = await signClient.request({
      topic: session.topic,
      chainId: `eip155:${chainId}`,
      request: {
        method: "eth_sendTransaction",
        params: [transaction],
      },
    });

    return txHash as string;
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw error;
  }
};

// Set current session
export const setCurrentSession = (session: any) => {
  currentSession = session;
  currentAddress = getWalletAddress(session);
  isConnected = !!currentAddress;
  console.log(
    "Current session set:",
    session?.topic,
    "Address:",
    currentAddress,
    "Network:",
    currentNetwork
  );
};

// Get current session
export const getCurrentSession = () => currentSession;

// Check if wallet is connected
export const getConnectionStatus = () => ({
  isConnected,
  currentAddress,
  currentNetwork,
});

// Force disconnect all sessions
export const forceDisconnectAll = async () => {
  try {
    if (!signClient) {
      return;
    }

    const sessions = signClient.session.getAll();
    const disconnectPromises = Object.keys(sessions).map(async (topic) => {
      try {
        await signClient.disconnect({
          topic,
          reason: {
            code: 6000,
            message: "User disconnected",
          },
        });
        console.log("Disconnected session:", topic);
      } catch (error) {
        console.log("Failed to disconnect session:", topic, error);
      }
    });

    await Promise.all(disconnectPromises);

    // Clear local state
    isConnected = false;
    currentAddress = null;
    currentSession = null;
    console.log("All sessions disconnected and local state cleared");
  } catch (error) {
    console.error("Error force disconnecting all sessions:", error);
    // Still clear local state
    isConnected = false;
    currentAddress = null;
    currentSession = null;
  }
};
