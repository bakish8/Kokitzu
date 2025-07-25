import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ethers } from "ethers";
import "react-native-get-random-values";
import {
  getWalletBalance,
  signMessage as signMessageWC,
  sendTransaction as sendTransactionWC,
  setCurrentNetwork as setWalletNetwork,
  getCurrentNetwork as getWalletNetwork,
  clearWalletConnectStorage,
  validateWalletConnectConfig,
} from "../services/walletconnect";
import { useNetwork } from "./NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { Alert } from "react-native";

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  balance: string | null;
  loading: boolean;
  provider: any;
  refreshBalance: () => Promise<void>;
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
  const { currentNetwork, networkConfig } = useNetwork();

  // WalletConnect modal hook - this is our main connection method
  const {
    isConnected: wcConnected,
    address: wcAddress,
    provider: wcProvider,
    open: openModal,
    close: closeModal,
  } = useWalletConnectModal();

  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update wallet service network when network context changes
  useEffect(() => {
    setWalletNetwork(currentNetwork);
    console.log("🌐 WalletContext: Network changed to", currentNetwork);

    // Refresh balance when network changes if connected
    if (wcConnected && wcAddress) {
      refreshBalance();
    }
  }, [currentNetwork, wcConnected, wcAddress]);

  // Handle WalletConnect connection changes
  useEffect(() => {
    if (wcConnected && wcAddress) {
      console.log("✅ WalletConnect connected:", wcAddress);
      // Save connection state to prevent auto-reconnect issues
      saveConnectionState(wcAddress);
      refreshBalance();
    } else {
      console.log("❌ WalletConnect disconnected");
      clearConnectionState();
      setBalance(null);
    }
  }, [wcConnected, wcAddress]);

  // Initialize and check for existing connections
  useEffect(() => {
    const initialize = async () => {
      try {
        // Clear any stored connection state on app start to prevent auto-reconnect
        await clearConnectionState();
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing WalletContext:", error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const saveConnectionState = async (address: string) => {
    try {
      await AsyncStorage.setItem("lastConnectedAddress", address);
      await AsyncStorage.setItem("connectionTimestamp", Date.now().toString());
    } catch (error) {
      console.warn("Failed to save connection state:", error);
    }
  };

  const clearConnectionState = async () => {
    try {
      await AsyncStorage.multiRemove([
        "lastConnectedAddress",
        "connectionTimestamp",
        "walletAddress", // Legacy key
        "walletSession", // Legacy key
      ]);
      console.log("🧹 Cleared connection state from AsyncStorage");
    } catch (error) {
      console.warn("Failed to clear connection state:", error);
    }
  };

  const connectWallet = async (): Promise<void> => {
    setLoading(true);
    try {
      // Validate configuration
      validateWalletConnectConfig();

      console.log("🔗 Opening WalletConnect modal...");
      await openModal();

      // The connection state will be handled by the useEffect hook
      // when wcConnected and wcAddress change
    } catch (error: any) {
      console.error("❌ Error connecting wallet:", error);
      Alert.alert(
        "Connection Error",
        error?.message || "Failed to connect wallet. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      console.log("🔌 Disconnecting wallet...");

      // Clear WalletConnect storage
      clearWalletConnectStorage();

      // Clear AsyncStorage
      await clearConnectionState();

      // Close the modal connection
      if (wcProvider && typeof wcProvider.disconnect === "function") {
        try {
          await wcProvider.disconnect();
        } catch (disconnectError) {
          console.warn("Provider disconnect error:", disconnectError);
        }
      }

      // Close modal if open
      await closeModal();

      // Clear local state
      setBalance(null);

      console.log("✅ Wallet disconnected successfully");
    } catch (error) {
      console.error("❌ Error disconnecting wallet:", error);
      // Still clear local state even if there's an error
      await clearConnectionState();
      setBalance(null);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      if (!wcConnected || !wcProvider) {
        throw new Error("Wallet not connected");
      }

      console.log("🖊️ Signing message...");
      const signature = await signMessageWC(message, wcProvider);
      console.log("✅ Message signed successfully");
      return signature;
    } catch (error) {
      console.error("❌ Error signing message:", error);
      throw error;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: string
  ): Promise<string> => {
    try {
      if (!wcConnected || !wcProvider) {
        throw new Error("Wallet not connected");
      }

      const transaction = {
        to,
        value: ethers.utils.parseEther(amount).toHexString(),
        gas: "0x5208", // 21000 gas for simple transfer
      };

      console.log("🚀 Sending transaction...");
      const txHash = await sendTransactionWC(transaction, wcProvider);
      console.log("✅ Transaction sent successfully:", txHash);
      return txHash;
    } catch (error) {
      console.error("❌ Error sending transaction:", error);
      throw error;
    }
  };

  const refreshBalance = async () => {
    try {
      if (wcConnected && wcAddress) {
        console.log("🔄 Refreshing balance for", currentNetwork);
        const realBalance = await getWalletBalance(
          wcAddress,
          undefined,
          currentNetwork
        );
        setBalance(realBalance);
        console.log(
          "💰 Balance refreshed:",
          realBalance,
          "for",
          currentNetwork
        );
      }
    } catch (error) {
      console.error("❌ Error refreshing balance:", error);
      setBalance("0.0000");
    }
  };

  // Don't render until initialized to prevent flash of wrong state
  if (!isInitialized) {
    return null;
  }

  return (
    <WalletContext.Provider
      value={{
        walletAddress: wcAddress || null,
        isConnected: wcConnected,
        connectWallet,
        disconnectWallet,
        signMessage,
        sendTransaction,
        balance,
        loading,
        provider: wcProvider,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
