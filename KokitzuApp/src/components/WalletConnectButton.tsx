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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork, NetworkType, NETWORKS } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

import WalletConnectedModal from "./WalletConnectedModal";
import NetworkSelectionModal from "./NetworkSelectionModal";
import { useEthPrice, formatEthWithUsd } from "../utils/currencyUtils";
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
  const [showModal, setShowModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showWalletConnectedModal, setShowWalletConnectedModal] =
    useState(false);
  const [modalView, setModalView] = useState<"wallet" | "network">("wallet");
  const [currentChain, setCurrentChain] = useState<string>(
    networkConfig.chainId
  );

  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  // Use the WalletConnect modal hook
  const {
    open,
    isConnected: wcConnected,
    address: wcAddress,
    provider,
  } = useWalletConnectModal();

  // Debug WalletConnect modal state
  useEffect(() => {
    console.log("🔍 WalletConnect Modal Debug:", {
      wcConnected,
      wcAddress,
      hasProvider: !!provider,
      showModal,
      modalView,
    });
  }, [wcConnected, wcAddress, provider, showModal, modalView]);

  // Update current chain when network changes
  useEffect(() => {
    setCurrentChain(networkConfig.chainId);
    console.log(
      "🌐 WalletConnectButton: Network changed to",
      currentNetwork,
      "Chain ID:",
      networkConfig.chainId
    );
  }, [currentNetwork, networkConfig.chainId]);

  // Debug effect to monitor connection changes
  useEffect(() => {
    console.log("🔗 WalletConnectButton: WalletConnect status:", {
      wcConnected,
      wcAddress,
      isConnected,
      walletAddress,
      currentChain,
      currentNetwork,
    });
  }, [
    wcConnected,
    wcAddress,
    isConnected,
    walletAddress,
    currentChain,
    currentNetwork,
  ]);

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
            console.log("🔗 Chain changed to:", chainIdDecimal);
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

  const handleConnect = async (method: "metamask" | "walletconnect") => {
    try {
      console.log(
        "🔗 Starting wallet connection with method:",
        method,
        "on",
        currentNetwork
      );

      if (method === "walletconnect") {
        // For WalletConnect, directly open the official modal
        console.log("📱 Opening official WalletConnect modal");
        // Close our modal first, then open WalletConnect modal
        setShowModal(false);
        // Small delay to ensure our modal is closed
        setTimeout(async () => {
          try {
            await open();
            console.log("✅ WalletConnect modal opened successfully");
          } catch (wcError) {
            console.error("❌ WalletConnect modal error:", wcError);
            Alert.alert(
              "WalletConnect Error",
              "Failed to open WalletConnect modal. Please try again."
            );
          }
        }, 100);
      } else {
        // For MetaMask, proceed normally
        console.log("🦊 Connecting to MetaMask");
        await connectWallet(method);
        setShowModal(false);
        if (onConnected && walletAddress) {
          onConnected(walletAddress, null);
        }
      }
    } catch (error: any) {
      console.error("❌ Wallet connection error:", error);
      Alert.alert(
        "Connection Error",
        error?.message || "Failed to connect wallet. Please try again."
      );
    }
  };

  // Fix: Ensure disconnect clears all wallet states
  const handleDisconnect = async () => {
    try {
      if (provider && provider.disconnect) {
        await provider.disconnect();
      }
      disconnectWallet();
      setCurrentChain(networkConfig.chainId);
      // Manually clear WalletConnect modal state if possible
      if (typeof window !== "undefined" && window.localStorage) {
        // WalletConnect v2 uses this key, but may vary by implementation
        window.localStorage.removeItem("walletconnect");
        window.localStorage.removeItem("WALLETCONNECT_DEEPLINK_CHOICE");
      }
      setTimeout(() => {
        console.log("[DEBUG] After disconnect:", {
          wcConnected,
          wcAddress,
          walletAddress,
          isConnected,
        });
      }, 500);
      // Force a re-render by toggling modal state
      setShowWalletConnectedModal(false);
      setShowModal(false);
    } catch (error) {
      console.error("❌ Error disconnecting:", error);
      disconnectWallet();
      setCurrentChain(networkConfig.chainId);
      setShowWalletConnectedModal(false);
      setShowModal(false);
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
  useEffect(() => {
    if (isWalletConnected) {
      const interval = setInterval(() => {
        console.log("🔄 Periodic balance refresh");
        // Balance is handled by wallet context
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isWalletConnected]);

  // Debug: Log connection state before rendering
  console.log("WalletConnectButton render:", {
    isWalletConnected,
    connectedAddress,
    wcConnected,
    wcAddress,
    isConnected,
    walletAddress,
  });

  // Only show connected UI if app wallet context is connected
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
              {formatAddress(walletAddress || "")}
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
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons
          name="wallet-outline"
          size={20}
          color="#ffffff"
        />
        <Text style={styles.connectButtonText}>Connect Wallet</Text>
      </TouchableOpacity>
      {/* Wallet Selection Modal */}
      <Modal
        visible={showModal && modalView === "wallet"}
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Wallet</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Network Selection Section */}
            <View style={styles.networkSection}>
              <Text style={styles.sectionTitle}>Network</Text>
              <TouchableOpacity
                style={[
                  styles.networkSelector,
                  { borderColor: getNetworkColor(currentNetwork) },
                ]}
                onPress={() => {
                  console.log(
                    "🔘 Network selector clicked, showing network modal"
                  );
                  setModalView("network");
                }}
                disabled={isNetworkSwitching}
              >
                <View style={styles.networkInfo}>
                  <MaterialCommunityIcons
                    name={getNetworkIcon(currentNetwork)}
                    size={20}
                    color={getNetworkColor(currentNetwork)}
                  />
                  <View style={styles.networkDetails}>
                    <Text style={styles.networkName}>{networkConfig.name}</Text>
                  </View>
                </View>
                <View style={styles.networkActions}>
                  {isNetworkSwitching && (
                    <MaterialCommunityIcons
                      name="loading"
                      size={16}
                      color={getNetworkColor(currentNetwork)}
                      style={styles.spinning}
                    />
                  )}
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color="#666"
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.connectionOptions}>
              <TouchableOpacity
                style={styles.connectionOption}
                onPress={() => handleConnect("metamask")}
              >
                <MaterialCommunityIcons
                  name="ethereum"
                  size={32}
                  color="#f6851b"
                />
                <View style={styles.connectionOptionText}>
                  <Text style={styles.connectionOptionTitle}>MetaMask</Text>
                  <Text style={styles.connectionOptionSubtitle}>
                    Connect directly with MetaMask
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.connectionOption}
                onPress={() => handleConnect("walletconnect")}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={32}
                  color="#3b82f6"
                />
                <View style={styles.connectionOptionText}>
                  <Text style={styles.connectionOptionTitle}>
                    WalletConnect
                  </Text>
                  <Text style={styles.connectionOptionSubtitle}>
                    Choose from 100+ compatible wallets
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Network Selection Modal */}
      <NetworkSelectionModal
        visible={showModal && modalView === "network"}
        onClose={() => setShowModal(false)}
        onBack={() => setModalView("wallet")}
        isConnected={false}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
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
