import { getInfuraUrl, validateApiKeys, API_CONFIG } from "../config/api";
import { SignClient } from "@walletconnect/sign-client";

let signClient: any = null;
let isConnected = false;
let currentAddress: string | null = null;
let currentSession: any = null;

// Initialize WalletConnect SignClient
export const initializeWalletConnect = async () => {
  try {
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

// Connect to wallet using WalletConnect
export const connectWalletConnect = async () => {
  try {
    if (!signClient) {
      await initializeWalletConnect();
    }

    if (!signClient) {
      throw new Error("Failed to initialize WalletConnect");
    }

    // Create connection URI
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    if (!uri) {
      throw new Error("Failed to generate connection URI");
    }

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
export const disconnectWalletConnect = async (topic: string) => {
  try {
    if (signClient) {
      await signClient.disconnect({
        topic,
        reason: {
          code: 6000,
          message: "User disconnected",
        },
      });
    }
    isConnected = false;
    currentAddress = null;
    currentSession = null;
    console.log("Wallet disconnected");
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    throw error;
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
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const infuraUrl = getInfuraUrl();
    const response = await fetch(infuraUrl, {
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
      throw new Error(data.error.message);
    }

    // Convert from wei to ETH
    const balanceWei = data.result;
    const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);
    return balanceEth.toFixed(4);
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    throw new Error("Failed to fetch wallet balance");
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

    // Request signature from wallet
    const signature = await signClient.request({
      topic: session.topic,
      chainId: "eip155:1",
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

    // Request transaction from wallet
    const txHash = await signClient.request({
      topic: session.topic,
      chainId: "eip155:1",
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
};

// Get current session
export const getCurrentSession = () => currentSession;

// Check if wallet is connected
export const getConnectionStatus = () => ({
  isConnected,
  currentAddress,
});
