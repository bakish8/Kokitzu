import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork, NetworkType, NETWORKS } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

import WalletConnectedModal from "./WalletConnectedModal";

import { formatEthWithUsd, ethToUsd } from "../utils/currencyUtils";
import { useEthPrice } from "../contexts/EthPriceContext";
import COLORS from "../constants/colors";

interface WalletConnectButtonProps {
  onConnected?: (address: string, signer: any) => void;
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
    walletConnectUri,
    connectionStatus,
  } = useWallet();
  const { currentNetwork, networkConfig, switchNetwork, isNetworkSwitching } =
    useNetwork();
  const [showWalletConnectedModal, setShowWalletConnectedModal] =
    useState(false);
  const [currentChain, setCurrentChain] = useState<string>(
    networkConfig.chainId
  );

  // Get ETH price for USD conversion (CoinGecko price, Sepolia ETH treated as regular ETH)
  const { ethPrice } = useEthPrice();

  // Use the WalletConnect modal hook
  const {
    open,
    isConnected: wcConnected,
    address: wcAddress,
    provider,
  } = useWalletConnectModal();

  // Debug WalletConnect modal state
  // useEffect(() => {
  //   console.log("🔍 WalletConnect Modal Debug:", {
  //     wcConnected,
  //     wcAddress,
  //     hasProvider: !!provider,
  //     showModal,
  //     modalView,
  //   });
  // }, [wcConnected, wcAddress, provider, showModal, modalView]);

  // Update current chain when network changes
  // useEffect(() => {
  //   setCurrentChain(networkConfig.chainId);
  //   console.log(
  //     "🌐 WalletConnectButton: Network changed to",
  //     currentNetwork,
  //     "Chain ID:",
  //     networkConfig.chainId
  //   );
  // }, [currentNetwork, networkConfig.chainId]);

  // Debug effect to monitor connection changes
  // useEffect(() => {
  //   console.log("🔗 WalletConnectButton: WalletConnect status:", {
  //     wcConnected,
  //     wcAddress,
  //     isConnected,
  //     walletAddress,
  //     currentChain,
  //     currentNetwork,
  //   });
  // }, [
  //   wcConnected,
  //   wcAddress,
  //   isConnected,
  //   walletAddress,
  //   currentChain,
  //   currentNetwork,
  // ]);

  // Effect to detect chain changes - we'll use a polling approach
  useEffect(() => {
    if (wcConnected && provider) {
      const checkChain = async () => {
        try {
          // Try to get the current chain from the provider
          const chainId = await provider.request({ method: "eth_chainId" });
          const chainIdDecimal = parseInt(chainId as string, 16).toString();
          if (chainIdDecimal !== currentChain) {
            setCurrentChain(chainIdDecimal);
            // console.log("🔗 Chain changed to:", chainIdDecimal);
          }
        } catch (error) {
          console.log(
            "🔗 Could not detect chain, using network context chain ID"
          );
          setCurrentChain(networkConfig.chainId);
        }
      };

      checkChain();
      // Poll for chain changes every 5 seconds
      const interval = setInterval(checkChain, 5000);
      return () => clearInterval(interval);
    }
  }, [wcConnected, provider, currentChain, networkConfig.chainId]);

  // Use global balance from wallet context instead of local balance
  const globalBalance = balance; // From wallet context

  // Effect to clear chain when disconnecting
  useEffect(() => {
    if (!wcConnected && !isConnected) {
      setCurrentChain(networkConfig.chainId);
    }
  }, [wcConnected, isConnected, networkConfig.chainId]);

  // Fix: Ensure disconnect clears all wallet states
  const handleDisconnect = async () => {
    try {
      console.log("🔌 Disconnecting from WalletConnect...");

      // Disconnect from WalletConnect provider
      if (provider) {
        try {
          // Try to disconnect using the provider's disconnect method
          if (typeof provider.disconnect === "function") {
            await provider.disconnect();
            console.log("✅ WalletConnect provider disconnected");
          } else {
            console.log("⚠️ No disconnect method available on provider");
          }
        } catch (providerError) {
          console.warn("⚠️ Provider disconnect error:", providerError);
        }
      }

      // Disconnect from wallet context
      disconnectWallet();
      setCurrentChain(networkConfig.chainId);

      // Clear any stored WalletConnect data
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem("walletconnect");
          window.localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");
          window.localStorage.removeItem("wc@2:client:0.3//session");
          console.log("✅ Cleared WalletConnect localStorage");
        }
      } catch (storageError) {
        console.warn("⚠️ Storage clear error:", storageError);
      }

      // Force a re-render
      setShowWalletConnectedModal(false);

      console.log("✅ Disconnect complete");

      // Debug: Check connection status after disconnect
      setTimeout(() => {
        console.log("[DEBUG] After disconnect:", {
          wcConnected,
          wcAddress,
          walletAddress,
          isConnected,
        });

        // If still connected, try to force a refresh
        if (wcConnected || wcAddress) {
          console.log(
            "⚠️ Still connected after disconnect, forcing refresh..."
          );
          // Force a re-render by updating state
          setCurrentChain(networkConfig.chainId);
        }
      }, 1000);
    } catch (error) {
      console.error("❌ Error disconnecting:", error);
      // Still try to disconnect from wallet context
      disconnectWallet();
      setCurrentChain(networkConfig.chainId);
      setShowWalletConnectedModal(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: string) => {
    switch (chainId) {
      case "1":
        return "ETH";
      case "11155111":
        return "Sepolia ETH";
      case "137":
        return "MATIC";
      case "56":
        return "BNB";
      case "42161":
        return "ARB";
      case "10":
        return "OP";
      default:
        return networkConfig.nativeCurrency.symbol;
    }
  };

  const getNetworkIcon = (network: NetworkType) => {
    switch (network) {
      case "mainnet":
        return "ethereum";
      case "sepolia":
        return "test-tube";

      default:
        return "server-network";
    }
  };

  const getNetworkColor = (network: NetworkType) => {
    switch (network) {
      case "mainnet":
        return "#10b981"; // Green for mainnet
      case "sepolia":
        return "#3b82f6"; // Blue for Sepolia

      default:
        return "#666";
    }
  };

  // Use WalletConnect connection status if available
  const connectedAddress = wcAddress || walletAddress;
  const isWalletConnected = wcConnected || isConnected;
  const displayBalance = globalBalance;
  const chainName = getChainName(currentChain || networkConfig.chainId);

  // Periodic balance refresh every 30 seconds when connected
  // useEffect(() => {
  //   if (isWalletConnected) {
  //     const interval = setInterval(() => {
  //       console.log("🔄 Periodic balance refresh");
  //       // Balance is handled by wallet context
  //     }, 30000); // 30 seconds

  //     return () => clearInterval(interval);
  //   }
  // }, [isWalletConnected]);

  // Debug: Log connection state before rendering

  // Show connected UI if either wallet context or WalletConnect is connected
  if ((isConnected && walletAddress) || (wcConnected && wcAddress)) {
    return (
      <>
        <TouchableOpacity
          style={styles.connectedButton}
          onPress={() => setShowWalletConnectedModal(true)}
        >
          <MaterialCommunityIcons name="wallet" size={20} color="#10b981" />
          <View style={styles.addressContainer}>
            <Text style={styles.connectedButtonText}>
              {formatAddress(connectedAddress || "")}
            </Text>
            {displayBalance && (
              <Text style={styles.balanceText}>
                {formatEthWithUsd(
                  parseFloat(displayBalance || "0"),
                  ethPrice,
                  false
                )}
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
            // Balance is handled by wallet context
          }}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={async () => {
          try {
            console.log("📱 Opening WalletConnect modal directly");
            await open();
            console.log("✅ WalletConnect modal opened successfully");
          } catch (wcError) {
            console.error("❌ WalletConnect modal error:", wcError);
            Alert.alert(
              "Connection Error",
              "Failed to open WalletConnect modal. Please try again."
            );
          }
        }}
      >
        <MaterialCommunityIcons name="wallet-outline" size={20} />
        <Text style={styles.connectButtonText}>Connect Wallet</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  connectionOptionIcon: {
    width: 24,
    height: 24,
  },
  debugContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    zIndex: 1000,
  },
  debugItem: {
    color: "white",
    fontSize: 12,
    marginBottom: 4,
  },
  connectButton: {
    backgroundColor: `${COLORS.accent}`,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: `${COLORS.background}`,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    padding: 4,
  },
  networkSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  networkSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  networkDetails: {
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  networkChainId: {
    fontSize: 12,
    color: "#666666",
  },
  networkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  spinning: {
    transform: [{ rotate: "360deg" }],
  },
  connectionOptions: {
    gap: 12,
  },
  connectionOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 12,
  },
  connectionOptionText: {
    flex: 1,
  },
  connectionOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  connectionOptionSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  networkListContainer: {
    backgroundColor: "#0f0f23",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    maxHeight: 300,
  },
  networkListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  networkListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  networkList: {
    maxHeight: 250,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
  },
  selectedNetworkItem: {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  testnetBadge: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});

export default WalletConnectButton;
