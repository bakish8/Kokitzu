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
import { getWalletBalance, getCurrentChainId } from "../services/walletconnect";
import WalletConnectedModal from "./WalletConnectedModal";
import NetworkSelectionModal from "./NetworkSelectionModal";

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
  const [localBalance, setLocalBalance] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<string>(
    networkConfig.chainId
  );

  // Use the WalletConnect modal hook
  const {
    open,
    isConnected: wcConnected,
    address: wcAddress,
    provider,
  } = useWalletConnectModal();

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

  // Effect to fetch balance when WalletConnect connects, chain changes, or network changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (wcConnected && wcAddress) {
        try {
          console.log(
            `💰 Fetching balance for WalletConnect address: ${wcAddress} on chain: ${currentChain} (${currentNetwork})`
          );
          const balance = await getWalletBalance(wcAddress, currentChain);
          setLocalBalance(balance);
          console.log("💰 Balance fetched:", balance, "for", currentNetwork);
        } catch (error) {
          console.error("❌ Error fetching balance:", error);
          setLocalBalance("0.0000");
        }
      }
    };

    fetchBalance();
  }, [wcConnected, wcAddress, currentChain, currentNetwork]);

  // Effect to clear balance when disconnecting
  useEffect(() => {
    if (!wcConnected && !isConnected) {
      setLocalBalance(null);
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
        setShowModal(false);
        await open();
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

  const handleDisconnect = async () => {
    try {
      if (provider) {
        await provider.disconnect();
      }
      disconnectWallet();
      setLocalBalance(null);
      setCurrentChain(networkConfig.chainId);
    } catch (error) {
      console.error("❌ Error disconnecting:", error);
      disconnectWallet();
      setLocalBalance(null);
      setCurrentChain(networkConfig.chainId);
    }
  };

  const handleNetworkSelect = async (network: NetworkType) => {
    console.log("🌐 Network selection clicked:", network);
    setShowNetworkModal(false);
    await switchNetwork(network);
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
      case "5":
        return "Goerli ETH";
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
      case "goerli":
        return "flask";
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
      case "goerli":
        return "#f59e0b"; // Orange for Goerli
      default:
        return "#666";
    }
  };

  // Use WalletConnect connection status if available
  const connectedAddress = wcAddress || walletAddress;
  const isWalletConnected = wcConnected || isConnected;
  const displayBalance = localBalance || balance;
  const chainName = getChainName(currentChain || networkConfig.chainId);

  // Debug modal state
  console.log("🔍 Modal states:", {
    showModal,
    showNetworkModal,
    isNetworkSwitching,
  });

  if (isWalletConnected && connectedAddress && connectedAddress !== "Unknown") {
    return (
      <>
        <TouchableOpacity
          style={styles.connectedButton}
          onPress={() => setShowWalletConnectedModal(true)}
        >
          <MaterialCommunityIcons name="wallet" size={20} color="#10b981" />
          <View style={styles.addressContainer}>
            <Text style={styles.connectedButtonText}>
              {formatAddress(connectedAddress)}
            </Text>
            {displayBalance && (
              <Text style={styles.balanceText}>
                {parseFloat(displayBalance || "0").toFixed(4)} {chainName}
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
    backgroundColor: "#1a1a2e",
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
    color: "#10b981",
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
