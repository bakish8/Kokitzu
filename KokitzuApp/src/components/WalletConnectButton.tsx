import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork, NetworkType } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

import WalletConnectedModal from "./WalletConnectedModal";

import { formatEthWithUsd } from "../utils/currencyUtils";
import { useEthPrice } from "../contexts/EthPriceContext";
import COLORS from "../constants/colors";

interface WalletConnectButtonProps {
  onConnected?: (address: string, provider: any) => void;
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  onConnected,
}) => {
  const {
    walletAddress,
    connectWallet,
    disconnectWallet,
    isConnected,
    balance,
    loading,
  } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();
  const [showWalletConnectedModal, setShowWalletConnectedModal] =
    useState(false);

  // Get ETH price for USD conversion
  const { ethPrice } = useEthPrice();

  // Use the WalletConnect modal hook for additional control
  const { provider } = useWalletConnectModal();

  // Call onConnected callback when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress && provider && onConnected) {
      onConnected(walletAddress, provider);
    }
  }, [isConnected, walletAddress, provider, onConnected]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Connection failed:", error);
      // Error is already handled in the context
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log("🔌 Initiating disconnect...");
      await disconnectWallet();
      setShowWalletConnectedModal(false);
      console.log("✅ Disconnect completed");
    } catch (error) {
      console.error("❌ Disconnect failed:", error);
      Alert.alert(
        "Disconnect Error",
        "Failed to disconnect wallet. Please try again."
      );
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (network: NetworkType) => {
    switch (network) {
      case "arbitrumOne":
        return "ARB";
      case "arbitrumSepolia":
        return "ARB Sepolia";
      default:
        return networkConfig.nativeCurrency.symbol;
    }
  };

  // Show connected UI if wallet is connected
  if (isConnected && walletAddress) {
    return (
      <>
        <TouchableOpacity
          style={styles.connectedButton}
          onPress={() => setShowWalletConnectedModal(true)}
        >
          <MaterialCommunityIcons name="wallet" size={20} color="#10b981" />
          <View style={styles.addressContainer}>
            <Text style={styles.connectedButtonText}>
              {formatAddress(walletAddress)}
            </Text>
            {balance && (
              <Text style={styles.balanceText}>
                {formatEthWithUsd(parseFloat(balance || "0"), ethPrice, false)}
              </Text>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>

        {/* Wallet Connected Modal */}
        <WalletConnectedModal
          visible={showWalletConnectedModal}
          onClose={() => setShowWalletConnectedModal(false)}
          onNetworkSelect={() => setShowWalletConnectedModal(false)}
          onRefreshBalance={() => {
            // Balance refresh is handled by wallet context
          }}
        />
      </>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.connectButton, loading && styles.connectButtonLoading]}
      onPress={handleConnect}
      disabled={loading}
    >
      {loading ? (
        <MaterialCommunityIcons
          name="loading"
          size={20}
          color="#ffffff"
          style={styles.spinningIcon}
        />
      ) : (
        <MaterialCommunityIcons
          name="wallet-outline"
          size={20}
          color="#ffffff"
        />
      )}
      <Text style={styles.connectButtonText}>
        {loading ? "Connecting..." : "Connect Wallet"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  connectButton: {
    backgroundColor: `${COLORS.accent}`,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonLoading: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  connectedButton: {
    backgroundColor: "#051923",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    gap: 6,
  },
  connectedButtonText: {
    color: `${COLORS.accent}`,
    fontWeight: "600",
    fontSize: 14,
  },
  addressContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  balanceText: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
});

export default WalletConnectButton;
