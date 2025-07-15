import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import WalletConnectQR from "./WalletConnectQR";

interface WalletConnectButtonProps {
  onConnected?: (address: string, signer: any) => void;
}

// Popular WalletConnect-compatible wallets
const WALLET_OPTIONS = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "The most popular Ethereum wallet",
    icon: "ethereum",
    color: "#f6851b",
    type: "metamask" as const,
  },
  {
    id: "trustwallet",
    name: "Trust Wallet",
    description: "Binance's official wallet",
    icon: "shield-check",
    color: "#3b82f6",
    type: "walletconnect" as const,
  },
  {
    id: "binance",
    name: "Binance",
    description: "Binance exchange wallet",
    icon: "currency-btc",
    color: "#f7931a",
    type: "walletconnect" as const,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    description: "OKX exchange wallet",
    icon: "wallet",
    color: "#000000",
    type: "walletconnect" as const,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    description: "Bitget exchange wallet",
    icon: "wallet",
    color: "#00d4aa",
    type: "walletconnect" as const,
  },
  {
    id: "safepal",
    name: "SafePal",
    description: "Binance Labs backed wallet",
    icon: "shield-check",
    color: "#f59e0b",
    type: "walletconnect" as const,
  },
  {
    id: "tokenpocket",
    name: "TokenPocket",
    description: "Multi-chain wallet",
    icon: "wallet",
    color: "#6366f1",
    type: "walletconnect" as const,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "Beautiful, simple Ethereum wallet",
    icon: "palette",
    color: "#8b5cf6",
    type: "walletconnect" as const,
  },
  {
    id: "argent",
    name: "Argent",
    description: "The most secure wallet for DeFi",
    icon: "shield",
    color: "#10b981",
    type: "walletconnect" as const,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Official Coinbase wallet",
    icon: "currency-btc",
    color: "#0052ff",
    type: "walletconnect" as const,
  },
  {
    id: "imtoken",
    name: "imToken",
    description: "Professional digital wallet",
    icon: "wallet",
    color: "#ff6b35",
    type: "walletconnect" as const,
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Solana wallet",
    icon: "ghost",
    color: "#9945ff",
    type: "walletconnect" as const,
  },
  {
    id: "walletconnect",
    name: "View All",
    description: "100+ more wallets available",
    icon: "dots-horizontal",
    color: "#666666",
    type: "walletconnect" as const,
  },
];

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  onConnected,
}) => {
  const {
    walletAddress,
    connectWallet,
    disconnectWallet,
    isConnected,
    loading,
    balance,
    walletConnectUri,
  } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletConnectResult, setWalletConnectResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "waiting" | "connecting" | "connected" | "failed"
  >("waiting");

  // Monitor connection status and close QR modal when connected
  useEffect(() => {
    if (isConnected && showQRModal) {
      setConnectionStatus("connected");
      setTimeout(() => {
        setShowQRModal(false);
        setWalletConnectResult(null);
        setConnectionStatus("waiting");
        if (onConnected && walletAddress) {
          onConnected(walletAddress, null);
        }
      }, 1000); // Show success for 1 second
    }
  }, [isConnected, showQRModal, walletAddress, onConnected]);

  // Add connection timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showQRModal && walletConnectResult) {
      timeoutId = setTimeout(() => {
        setConnectionStatus("failed");
        Alert.alert(
          "Connection Timeout",
          "WalletConnect connection timed out. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setShowQRModal(false);
                setWalletConnectResult(null);
                setConnectionStatus("waiting");
              },
            },
          ]
        );
      }, 60000); // 60 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showQRModal, walletConnectResult]);

  const handleConnect = async (method: "metamask" | "walletconnect") => {
    setConnecting(true);
    try {
      if (method === "metamask") {
        // For MetaMask, directly connect without showing modal
        await connectWallet(method);
        setShowModal(false);
        setShowWalletSelection(false);
        if (onConnected && walletAddress) {
          onConnected(walletAddress, null);
        }
      } else {
        // For WalletConnect, show QR code modal and wait for approval
        const result = await connectWallet(method);
        if (result?.uri) {
          setShowModal(false);
          setShowWalletSelection(false);
          setWalletConnectResult(result);
          setShowQRModal(true);
          setConnectionStatus("waiting");

          console.log(
            "WalletConnectButton: Showing QR modal, waiting for approval..."
          );

          // Wait for approval
          try {
            console.log("WalletConnectButton: Calling approval function...");
            setConnectionStatus("connecting");
            const session = await result.approval();
            console.log(
              "WalletConnectButton: Session approved successfully:",
              session
            );
            // The connection will be handled by the useEffect above
          } catch (approvalError: any) {
            console.error(
              "WalletConnectButton: Approval failed:",
              approvalError
            );
            setConnectionStatus("failed");
            Alert.alert(
              "Connection Failed",
              `Failed to approve WalletConnect connection: ${
                approvalError?.message || "Unknown error"
              }. Please try again.`
            );
            setShowQRModal(false);
            setWalletConnectResult(null);
            setConnectionStatus("waiting");
          }
        } else {
          throw new Error("Failed to get WalletConnect URI");
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Connection Error",
        error?.message ||
          "Failed to connect wallet. Please check the setup guide for required API keys."
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleWalletSelect = (wallet: (typeof WALLET_OPTIONS)[0]) => {
    setShowWalletSelection(false);
    handleConnect(wallet.type);
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setWalletConnectResult(null);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && walletAddress) {
    return (
      <TouchableOpacity
        style={styles.connectedButton}
        onPress={handleDisconnect}
      >
        <MaterialCommunityIcons name="wallet" size={20} color="#10b981" />
        <View style={styles.addressContainer}>
          <Text style={styles.connectedButtonText}>
            {formatAddress(walletAddress)}
          </Text>
          {balance && (
            <Text style={styles.balanceText}>
              {parseFloat(balance).toFixed(4)} ETH
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="logout" size={16} color="#666" />
      </TouchableOpacity>
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

      {/* Main Connection Modal */}
      <Modal
        visible={showModal}
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

            <View style={styles.connectionOptions}>
              <TouchableOpacity
                style={[
                  styles.connectionOption,
                  connecting && styles.connectionOptionDisabled,
                ]}
                onPress={() => handleConnect("metamask")}
                disabled={connecting}
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
                {connecting && (
                  <MaterialCommunityIcons
                    name="loading"
                    size={20}
                    color="#666"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.connectionOption,
                  connecting && styles.connectionOptionDisabled,
                ]}
                onPress={() => {
                  console.log("🔵 Other Wallets button pressed");
                  console.log(
                    "Current showWalletSelection state:",
                    showWalletSelection
                  );
                  setShowWalletSelection(true);
                  console.log("Set showWalletSelection to true");
                }}
                disabled={connecting}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={32}
                  color="#3b82f6"
                />
                <View style={styles.connectionOptionText}>
                  <Text style={styles.connectionOptionTitle}>
                    Other Wallets
                  </Text>
                  <Text style={styles.connectionOptionSubtitle}>
                    Choose from 100+ compatible wallets
                  </Text>
                </View>
                {connecting && (
                  <MaterialCommunityIcons
                    name="loading"
                    size={20}
                    color="#666"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WalletConnect QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseQRModal}
      >
        <View style={styles.modalOverlay}>
          {walletConnectUri && (
            <WalletConnectQR
              uri={walletConnectUri}
              onClose={handleCloseQRModal}
              connectionStatus={connectionStatus}
            />
          )}
        </View>
      </Modal>

      {/* Wallet Selection Modal - Moved to end */}
      <Modal
        visible={showWalletSelection}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWalletSelection(false)}
        onShow={() => console.log("✅ Wallet selection modal shown")}
        onDismiss={() => console.log("❌ Wallet selection modal dismissed")}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.walletSelectionContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <MaterialCommunityIcons
                  name="wallet"
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.modalTitle}>WalletConnect</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWalletSelection(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletGridContainer}>
              <Text style={styles.walletGridTitle}>Connect your wallet</Text>
              <ScrollView
                style={styles.walletList}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.walletGrid}>
                  {WALLET_OPTIONS.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      style={[
                        styles.walletGridItem,
                        connecting && styles.walletOptionDisabled,
                      ]}
                      onPress={() => handleWalletSelect(wallet)}
                      disabled={connecting}
                    >
                      <View
                        style={[
                          styles.walletIconContainer,
                          { backgroundColor: wallet.color + "20" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={wallet.icon as any}
                          size={24}
                          color={wallet.color}
                        />
                      </View>
                      <Text style={styles.walletGridName}>{wallet.name}</Text>
                      {connecting && (
                        <View style={styles.walletConnectBadge}>
                          <MaterialCommunityIcons
                            name="wallet"
                            size={12}
                            color="#ffffff"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.walletSelectionFooter}>
              <Text style={styles.walletSelectionFooterText}>
                Don't see your wallet? Most wallets support WalletConnect
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
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
  connectionOptionDisabled: {
    opacity: 0.6,
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
  walletSelectionContent: {
    maxHeight: "80%",
    paddingBottom: 20,
  },
  walletList: {
    marginBottom: 20,
  },
  walletOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 12,
    marginBottom: 8,
  },
  walletOptionDisabled: {
    opacity: 0.6,
  },
  walletOptionText: {
    flex: 1,
  },
  walletOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  walletOptionSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  walletSelectionFooter: {
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  walletSelectionFooterText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
  walletGridContainer: {
    marginBottom: 20,
  },
  walletGridTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  walletGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  walletGridItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  walletGridName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  walletConnectBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WalletConnectButton;
