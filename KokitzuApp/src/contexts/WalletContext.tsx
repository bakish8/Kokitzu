import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import "react-native-get-random-values";
import { getInfuraUrl, validateApiKeys } from "../config/api";
import {
  connectWalletConnect as connectWC,
  getWalletConnectSessions,
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

  useEffect(() => {
    loadStoredWallet();
  }, []);

  const loadStoredWallet = async () => {
    try {
      const storedAddress = await AsyncStorage.getItem("walletAddress");
      if (storedAddress) {
        setWalletAddress(storedAddress);
        setIsConnected(true);
        // Initialize provider for stored wallet
        initializeProvider();
      }
    } catch (error) {
      console.error("Error loading stored wallet:", error);
    }
  };

  const initializeProvider = () => {
    // Check if API keys are configured
    const errors = validateApiKeys();
    if (errors.length > 0) {
      console.warn("API Keys not configured:", errors.join(", "));
      return;
    }

    const infuraUrl = getInfuraUrl();
    const newProvider = new ethers.providers.JsonRpcProvider(infuraUrl);
    setProvider(newProvider);
  };

  const connectWallet = async (method: "metamask" | "walletconnect") => {
    setLoading(true);
    try {
      if (method === "metamask") {
        await connectMetaMask();
        return null;
      } else if (method === "walletconnect") {
        return await connectWalletConnect();
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      throw new Error(
        `Failed to connect ${method}: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      // Try to open MetaMask app using deep linking
      const metamaskUrl = "metamask://";
      const canOpen = await Linking.canOpenURL(metamaskUrl);

      if (canOpen) {
        // Show user instructions
        Alert.alert(
          "Connect MetaMask",
          "Opening MetaMask app... Please approve the connection in your MetaMask app.",
          [
            {
              text: "Open MetaMask",
              onPress: async () => {
                try {
                  await Linking.openURL(metamaskUrl);

                  // For now, simulate connection after a delay
                  // In a real app, you'd wait for the actual connection callback
                  setTimeout(async () => {
                    const mockAddress =
                      "0x" +
                      Array.from({ length: 40 }, () =>
                        Math.floor(Math.random() * 16).toString(16)
                      ).join("");

                    setWalletAddress(mockAddress);
                    setIsConnected(true);
                    setProvider(
                      new ethers.providers.JsonRpcProvider(getInfuraUrl())
                    );
                    await AsyncStorage.setItem("walletAddress", mockAddress);
                    setBalance("0.1234");
                    console.log("Connected to MetaMask:", mockAddress);
                  }, 2000);
                } catch (error) {
                  console.error("Failed to open MetaMask:", error);
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        // MetaMask not installed, show instructions
        Alert.alert(
          "MetaMask Not Found",
          "MetaMask app is not installed on your device. Please install MetaMask Mobile from the App Store or Google Play Store.",
          [
            {
              text: "Install MetaMask",
              onPress: () => {
                const storeUrl =
                  Platform.OS === "ios"
                    ? "https://apps.apple.com/app/metamask/id1438144202"
                    : "https://play.google.com/store/apps/details?id=io.metamask";
                Linking.openURL(storeUrl);
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    } catch (error: any) {
      throw new Error(
        `MetaMask connection failed: ${error?.message || "Unknown error"}`
      );
    }
  };

  const connectWalletConnect = async () => {
    try {
      // Check if API keys are configured
      const errors = validateApiKeys();
      if (errors.length > 0) {
        throw new Error(`API Keys not configured: ${errors.join(", ")}`);
      }

      // Use real WalletConnect v2
      const { uri, approval } = await connectWC();

      if (uri) {
        setWalletConnectUri(uri);
        console.log("WalletConnect URI generated:", uri);

        // Wait for user to connect via QR code
        // In a real app, you'd show the QR code and wait for approval
        return { uri, approval };
      }

      throw new Error("Failed to generate WalletConnect URI");
    } catch (error: any) {
      throw new Error(
        `WalletConnect connection failed: ${error?.message || "Unknown error"}`
      );
    }
  };

  const disconnectWallet = async () => {
    try {
      setWalletAddress(null);
      setIsConnected(false);
      setBalance(null);
      setProvider(null);
      await AsyncStorage.removeItem("walletAddress");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    try {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      // For demo purposes, return a mock signature
      // In production, you'd call the actual wallet's sign method
      const mockSignature =
        "0x" +
        Array.from({ length: 130 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

      return mockSignature;
    } catch (error) {
      console.error("Error signing message:", error);
      return null;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: string
  ): Promise<string | null> => {
    try {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      // For demo purposes, return a mock transaction hash
      // In production, you'd call the actual wallet's sendTransaction method
      const mockTxHash =
        "0x" +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

      return mockTxHash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      return null;
    }
  };

  const value: WalletContextType = {
    walletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    balance,
    loading,
    walletConnectUri,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
