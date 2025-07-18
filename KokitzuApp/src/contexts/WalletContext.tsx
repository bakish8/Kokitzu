import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import "react-native-get-random-values";
import { getInfuraUrl, validateApiKeys } from "../config/api";
import {
  connectWalletConnect as connectWC,
  getWalletConnectSessions,
  getWalletAddress,
  getWalletBalance,
  signMessage as signMessageWC,
  sendTransaction as sendTransactionWC,
  disconnectWalletConnect,
  setCurrentSession,
  getCurrentSession,
  getConnectionStatus,
  forceDisconnectAll,
} from "../services/walletconnect";
import { Linking, Alert, Platform } from "react-native";

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  connectWallet: (method: "metamask" | "walletconnect") => Promise<any>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (to: string, amount: string) => Promise<string | null>;
  balance: string | null;
  loading: boolean;
  walletConnectUri: string | null;
  connectionStatus: "waiting" | "connecting" | "connected" | "failed";
  provider: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [walletConnectUri, setWalletConnectUri] = useState<string | null>(null);
  const [walletSession, setWalletSession] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "waiting" | "connecting" | "connected" | "failed"
  >("waiting");

  useEffect(() => {
    loadStoredWallet();
  }, []);

  const loadStoredWallet = async () => {
    try {
      const storedAddress = await AsyncStorage.getItem("walletAddress");
      const storedSession = await AsyncStorage.getItem("walletSession");

      if (storedAddress && storedSession) {
        const session = JSON.parse(storedSession);
        setWalletAddress(storedAddress);
        setIsConnected(true);
        setWalletSession(session);
        setCurrentSession(session);
        setProvider(new ethers.providers.JsonRpcProvider(getInfuraUrl()));

        // Get real balance
        const realBalance = await getWalletBalance(storedAddress);
        setBalance(realBalance);
        console.log(
          "Loaded stored wallet:",
          storedAddress,
          "Balance:",
          realBalance
        );
      }
    } catch (error) {
      console.error("Error loading stored wallet:", error);
    }
  };

  const connectWallet = async (method: "metamask" | "walletconnect") => {
    setLoading(true);
    setConnectionStatus("connecting");
    try {
      if (method === "metamask") {
        // For MetaMask, use WalletConnect to connect
        await connectMetaMaskViaWalletConnect();
        return null;
      } else if (method === "walletconnect") {
        return await connectWalletConnect();
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setConnectionStatus("failed");
      throw new Error(
        `Failed to connect ${method}: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const connectMetaMaskViaWalletConnect = async () => {
    try {
      // Check if API keys are configured
      const errors = validateApiKeys();
      if (errors.length > 0) {
        throw new Error(`API Keys not configured: ${errors.join(", ")}`);
      }

      // Use WalletConnect to connect to MetaMask
      const { uri, approval } = await connectWC();

      if (uri) {
        console.log("MetaMask connection URI generated:", uri);

        // Try to open MetaMask directly with the URI
        const metamaskUrl = `metamask://wc?uri=${encodeURIComponent(uri)}`;

        try {
          await Linking.openURL(metamaskUrl);
          console.log("Opened MetaMask with connection URI");
        } catch (error) {
          console.log(
            "Could not open MetaMask directly, trying alternative method"
          );
          // Fallback: try to open MetaMask app
          await Linking.openURL("metamask://");
        }

        // Wait for approval
        const session = await approval();
        console.log("MetaMask session approved:", session);

        // Set current session
        setCurrentSession(session);

        // Extract wallet address from session
        const address = getWalletAddress(session);
        if (address) {
          setWalletAddress(address);
          setIsConnected(true);
          setWalletSession(session);
          setProvider(new ethers.providers.JsonRpcProvider(getInfuraUrl()));
          await AsyncStorage.setItem("walletAddress", address);
          await AsyncStorage.setItem("walletSession", JSON.stringify(session));

          // Get real balance
          const realBalance = await getWalletBalance(address);
          setBalance(realBalance);
          setConnectionStatus("connected");
          console.log(
            "Connected to MetaMask:",
            address,
            "Balance:",
            realBalance
          );
        }
      } else {
        throw new Error("Failed to generate MetaMask connection URI");
      }
    } catch (error: any) {
      setConnectionStatus("failed");
      throw new Error(
        `MetaMask connection failed: ${error?.message || "Unknown error"}`
      );
    }
  };

  const connectWalletConnect = async () => {
    try {
      console.log("WalletContext: Starting WalletConnect connection...");

      // Check if API keys are configured
      const errors = validateApiKeys();
      if (errors.length > 0) {
        throw new Error(`API Keys not configured: ${errors.join(", ")}`);
      }

      // Use real WalletConnect v2
      const { uri, approval } = await connectWC();
      console.log("WalletContext: Got WalletConnect URI and approval function");

      if (uri) {
        setWalletConnectUri(uri);
        setConnectionStatus("waiting");
        console.log(
          "🔗 WalletContext: Setting walletConnectUri:",
          uri.substring(0, 50) + "..."
        );
        console.log(
          "🔗 WalletContext: walletConnectUri state should now be available"
        );
        console.log(
          "WalletContext: WalletConnect URI generated:",
          uri.substring(0, 50) + "..."
        );

        // Wait for approval
        console.log("WalletContext: Waiting for wallet approval...");
        const session = await approval();
        console.log("WalletContext: WalletConnect session approved:", session);

        // Set current session
        setCurrentSession(session);
        console.log("WalletContext: Current session set");

        // Extract wallet address from session
        const address = getWalletAddress(session);
        console.log("WalletContext: Extracted address from session:", address);

        if (address) {
          console.log("WalletContext: Setting wallet state...");
          setWalletAddress(address);
          setIsConnected(true);
          setWalletSession(session);
          setProvider(new ethers.providers.JsonRpcProvider(getInfuraUrl()));
          setConnectionStatus("connected");

          console.log("WalletContext: Saving to AsyncStorage...");
          await AsyncStorage.setItem("walletAddress", address);
          await AsyncStorage.setItem("walletSession", JSON.stringify(session));

          // Get real balance
          console.log("WalletContext: Fetching balance...");
          const realBalance = await getWalletBalance(address);
          setBalance(realBalance);
          console.log(
            "WalletContext: Connected to wallet:",
            address,
            "Balance:",
            realBalance
          );
        } else {
          throw new Error("Failed to extract wallet address from session");
        }

        return { uri, approval };
      }

      throw new Error("Failed to generate WalletConnect URI");
    } catch (error: any) {
      console.error("WalletContext: WalletConnect connection failed:", error);
      setConnectionStatus("failed");
      throw new Error(
        `WalletConnect connection failed: ${error?.message || "Unknown error"}`
      );
    }
  };

  const disconnectWallet = async () => {
    try {
      console.log("Disconnecting wallet...");

      // Use the improved disconnect function
      if (walletSession?.topic) {
        console.log("Disconnecting session with topic:", walletSession.topic);
        await disconnectWalletConnect(walletSession.topic);
      }

      // Clear local state
      setWalletAddress(null);
      setIsConnected(false);
      setBalance(null);
      setProvider(null);
      setWalletSession(null);
      setWalletConnectUri(null);
      setConnectionStatus("waiting");

      // Clear stored data
      await AsyncStorage.removeItem("walletAddress");
      await AsyncStorage.removeItem("walletSession");

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      // Still clear local state even if there's an error
      setWalletAddress(null);
      setIsConnected(false);
      setBalance(null);
      setProvider(null);
      setWalletSession(null);
      setWalletConnectUri(null);
      setConnectionStatus("waiting");
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    try {
      if (!walletSession) {
        throw new Error("No wallet session found");
      }

      const signature = await signMessageWC(message, walletSession);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: string
  ): Promise<string | null> => {
    try {
      if (!walletSession) {
        throw new Error("No wallet session found");
      }

      const transaction = {
        to,
        value: ethers.utils.parseEther(amount).toHexString(),
      };

      const txHash = await sendTransactionWC(transaction, walletSession);
      return txHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
        signMessage,
        sendTransaction,
        balance,
        loading,
        walletConnectUri,
        connectionStatus,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
