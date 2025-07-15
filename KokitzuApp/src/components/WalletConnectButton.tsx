import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ethers } from "ethers";
import { useWallet } from "../contexts/WalletContext";
import WalletConnectQR from "./WalletConnectQR";

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
    loading,
    balance,
    walletConnectUri,
  } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (method: "metamask" | "walletconnect") => {
    setConnecting(true);
    try {
      if (method === "metamask") {
        // For MetaMask, directly connect without showing modal
        await connectWallet(method);
        setShowModal(false);
        if (onConnected && walletAddress) {
          onConnected(walletAddress, null);
        }
      } else {
        // For WalletConnect, show QR code modal
        const result = await connectWallet(method);
        if (result?.uri) {
          setShowModal(false);
          setShowQRModal(true);
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

  const handleDisconnect = () => {
    disconnectWallet();
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

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
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

            <View style={styles.walletOptions}>
              <TouchableOpacity
                style={[
                  styles.walletOption,
                  connecting && styles.walletOptionDisabled,
                ]}
                onPress={() => handleConnect("metamask")}
                disabled={connecting}
              >
                <MaterialCommunityIcons
                  name="ethereum"
                  size={32}
                  color="#f6851b"
                />
                <View style={styles.walletOptionText}>
                  <Text style={styles.walletOptionTitle}>MetaMask</Text>
                  <Text style={styles.walletOptionSubtitle}>
                    Connect with MetaMask
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
                  styles.walletOption,
                  connecting && styles.walletOptionDisabled,
                ]}
                onPress={() => handleConnect("walletconnect")}
                disabled={connecting}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={32}
                  color="#3b82f6"
                />
                <View style={styles.walletOptionText}>
                  <Text style={styles.walletOptionTitle}>WalletConnect</Text>
                  <Text style={styles.walletOptionSubtitle}>
                    Scan QR code to connect
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
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          {walletConnectUri && (
            <WalletConnectQR
              uri={walletConnectUri}
              onClose={() => setShowQRModal(false)}
            />
          )}
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  walletOptions: {
    gap: 12,
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
});

export default WalletConnectButton;
