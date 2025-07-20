import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Linking,
  Clipboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork, NetworkType, NETWORKS } from "../contexts/NetworkContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { useEthPrice, formatEthWithUsd } from "../utils/currencyUtils";

interface WalletConnectedModalProps {
  visible: boolean;
  onClose: () => void;
  onNetworkSelect: () => void;
  onRefreshBalance?: () => void;
}

const WalletConnectedModal: React.FC<WalletConnectedModalProps> = ({
  visible,
  onClose,
  onNetworkSelect,
  onRefreshBalance,
}) => {
  const { walletAddress, disconnectWallet, isConnected, balance } = useWallet();
  const { currentNetwork, networkConfig, switchNetwork, isNetworkSwitching } =
    useNetwork();
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Use WalletConnect modal hook
  const { provider } = useWalletConnectModal();

  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  // Debug logging
  console.log("🔍 WalletConnectedModal Debug:", {
    walletAddress,
    currentNetwork,
    networkConfig: networkConfig?.name,
    isConnected,
    balance,
    hasProvider: !!provider,
  });

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        return "#10b981";
      case "sepolia":
        return "#3b82f6";

      default:
        return "#666";
    }
  };

  const getEtherscanUrl = () => {
    const address = walletAddress;
    if (!address) return null;

    switch (currentNetwork) {
      case "mainnet":
        return `https://etherscan.io/address/${address}`;
      case "sepolia":
        return `https://sepolia.etherscan.io/address/${address}`;

      default:
        return null;
    }
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

  const getExplorerName = () => {
    switch (currentNetwork) {
      case "mainnet":
        return "Etherscan";
      case "sepolia":
        return "Sepolia Etherscan";

      default:
        return "Blockchain Explorer";
    }
  };

  const handleViewOnEtherscan = async () => {
    const url = getEtherscanUrl();
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert("Error", `Could not open ${getExplorerName()}`);
      }
    } else {
      Alert.alert(
        "Error",
        "No wallet address available or unsupported network"
      );
    }
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await Clipboard.setString(walletAddress);
        Alert.alert("Success", "Address copied to clipboard");
      } catch (error) {
        Alert.alert("Error", "Could not copy address");
      }
    }
  };

  const handleSwitchNetwork = () => {
    setShowNetworkModal(true);
  };

  const handleNetworkSelect = async (network: NetworkType) => {
    try {
      await switchNetwork(network);
      setShowNetworkModal(false);
      onClose(); // Close the modal after network switch
    } catch (error) {
      console.error("Network switch error:", error);
      Alert.alert("Error", `Failed to switch to ${network}`);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Wallet",
      "Are you sure you want to disconnect your wallet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🔌 Disconnecting wallet...");

              // Disconnect from WalletConnect if connected
              if (provider) {
                console.log("🔌 Disconnecting from WalletConnect provider...");
                await provider.disconnect();
              }

              // Disconnect from local wallet context
              console.log("🔌 Disconnecting from local wallet context...");
              disconnectWallet();

              console.log("✅ Wallet disconnected successfully");
              onClose();
            } catch (error) {
              console.error("❌ Error disconnecting wallet:", error);

              // Fallback: try to disconnect from local context anyway
              try {
                disconnectWallet();
                onClose();
              } catch (fallbackError) {
                console.error(
                  "❌ Fallback disconnect also failed:",
                  fallbackError
                );
                Alert.alert(
                  "Error",
                  "Failed to disconnect wallet. Please try again."
                );
              }
            }
          },
        },
      ]
    );
  };

  if (showNetworkModal) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Network Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialCommunityIcons
                  name="server-network"
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.modalTitle}>Choose Network</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowNetworkModal(false)}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={16}
                color="#3b82f6"
              />
              <Text style={styles.backButtonText}>Back to Wallet</Text>
            </TouchableOpacity>

            {/* Network Selection */}
            <View style={styles.networkSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="link" size={20} color="#666" />
                <Text style={styles.sectionTitle}>Select Network</Text>
              </View>
              <ScrollView
                style={styles.networkList}
                showsVerticalScrollIndicator={false}
              >
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.networkItem,
                      currentNetwork === key && styles.selectedNetworkItem,
                    ]}
                    onPress={() => handleNetworkSelect(key as NetworkType)}
                  >
                    <View style={styles.networkInfo}>
                      <MaterialCommunityIcons
                        name={getNetworkIcon(key as NetworkType)}
                        size={24}
                        color={getNetworkColor(key as NetworkType)}
                      />
                      <View style={styles.networkDetails}>
                        <Text style={styles.networkName}>{network.name}</Text>
                        <Text style={styles.networkChainId}>
                          Chain ID: {network.chainId}
                        </Text>
                        {network.isTestnet && (
                          <Text style={styles.testnetBadge}>TESTNET</Text>
                        )}
                      </View>
                    </View>
                    {currentNetwork === key && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={getNetworkColor(key as NetworkType)}
                      />
                    )}
                    {isNetworkSwitching && currentNetwork === key && (
                      <MaterialCommunityIcons
                        name="loading"
                        size={20}
                        color={getNetworkColor(key as NetworkType)}
                        style={styles.spinning}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.footerText}>
                Select a network to switch your wallet connection
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MaterialCommunityIcons name="wallet" size={24} color="#10b981" />
              <Text style={styles.modalTitle}>Wallet Connected</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Wallet Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color="#666" />
              <Text style={styles.sectionTitle}>Wallet Information</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>
                {formatAddress(walletAddress || "")}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Network:</Text>
              <View style={styles.networkInfo}>
                <MaterialCommunityIcons
                  name={getNetworkIcon(currentNetwork)}
                  size={16}
                  color={getNetworkColor(currentNetwork)}
                />
                <Text style={styles.infoValue}>
                  {networkConfig.name || currentNetwork || "Unknown"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Balance:</Text>
              <Text style={styles.infoValue}>
                {formatEthWithUsd(parseFloat(balance || "0"), ethPrice, false)}
              </Text>
            </View>
          </View>

          {/* Wallet Actions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cog" size={20} color="#666" />
              <Text style={styles.sectionTitle}>Wallet Actions</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.actionItem,
                !walletAddress && styles.disabledActionItem,
              ]}
              onPress={handleViewOnEtherscan}
              disabled={!walletAddress}
            >
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color={walletAddress ? "#3b82f6" : "#666"}
              />
              <View style={styles.actionText}>
                <Text
                  style={[
                    styles.actionTitle,
                    !walletAddress && styles.disabledText,
                  ]}
                >
                  View on {getExplorerName()}
                </Text>
                <Text
                  style={[
                    styles.actionSubtitle,
                    !walletAddress && styles.disabledText,
                  ]}
                >
                  {walletAddress
                    ? "Open wallet on blockchain explorer"
                    : "No wallet address available"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={walletAddress ? "#666" : "#444"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleCopyAddress}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={20}
                color="#3b82f6"
              />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Copy Address</Text>
                <Text style={styles.actionSubtitle}>
                  Copy wallet address to clipboard
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleSwitchNetwork}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={20}
                color="#3b82f6"
              />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Switch Network</Text>
                <Text style={styles.actionSubtitle}>
                  Change to different network
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleDisconnect}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: "#ef4444" }]}>
                  Disconnect Wallet
                </Text>
                <Text style={styles.actionSubtitle}>
                  Disconnect your wallet
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
  },
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  networkSection: {
    flex: 1,
  },
  networkList: {
    maxHeight: 300,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
  },
  selectedNetworkItem: {
    borderColor: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  networkDetails: {
    flex: 1,
    marginLeft: 12,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  networkChainId: {
    fontSize: 12,
    color: "#666",
  },
  testnetBadge: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 2,
  },
  spinning: {
    transform: [{ rotate: "360deg" }],
  },
  modalFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  disabledActionItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#666",
  },
});

export default WalletConnectedModal;
