import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { getWalletBalance, getCurrentChainId } from "../services/walletconnect";

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
  const [showModal, setShowModal] = useState(false);
  const [localBalance, setLocalBalance] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<string>("1");

  // Use the WalletConnect modal hook
  const {
    open,
    isConnected: wcConnected,
    address: wcAddress,
    provider,
  } = useWalletConnectModal();

  // Debug effect to monitor connection changes
  useEffect(() => {
    console.log("🔗 WalletConnectButton: WalletConnect status:", {
      wcConnected,
      wcAddress,
      isConnected,
      walletAddress,
      currentChain,
    });
  }, [wcConnected, wcAddress, isConnected, walletAddress, currentChain]);

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
          console.log("🔗 Could not detect chain, using default");
        }
      };

      checkChain();
      // Poll for chain changes every 5 seconds
      const interval = setInterval(checkChain, 5000);
      return () => clearInterval(interval);
    }
  }, [wcConnected, provider, currentChain]);

  // Effect to fetch balance when WalletConnect connects or chain changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (wcConnected && wcAddress) {
        try {
          console.log(
            `💰 Fetching balance for WalletConnect address: ${wcAddress} on chain: ${currentChain}`
          );
          const balance = await getWalletBalance(wcAddress, currentChain);
          setLocalBalance(balance);
          console.log("💰 Balance fetched:", balance);
        } catch (error) {
          console.error("❌ Error fetching balance:", error);
          setLocalBalance("0.0000");
        }
      }
    };

    fetchBalance();
  }, [wcConnected, wcAddress, currentChain]);

  // Effect to clear balance when disconnecting
  useEffect(() => {
    if (!wcConnected && !isConnected) {
      setLocalBalance(null);
      setCurrentChain("1");
    }
  }, [wcConnected, isConnected]);

  const handleConnect = async (method: "metamask" | "walletconnect") => {
    try {
      console.log("🔗 Starting wallet connection with method:", method);

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
      setCurrentChain("1");
    } catch (error) {
      console.error("❌ Error disconnecting:", error);
      disconnectWallet();
      setLocalBalance(null);
      setCurrentChain("1");
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
      case "137":
        return "MATIC";
      case "56":
        return "BNB";
      case "42161":
        return "ARB";
      case "10":
        return "OP";
      default:
        return "ETH";
    }
  };

  // Use WalletConnect connection status if available
  const connectedAddress = wcAddress || walletAddress;
  const isWalletConnected = wcConnected || isConnected;
  const displayBalance = localBalance || balance;
  const chainName = getChainName(currentChain || "1");

  if (isWalletConnected && connectedAddress && connectedAddress !== "Unknown") {
    return (
      <TouchableOpacity
        style={styles.connectedButton}
        onPress={handleDisconnect}
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

      {/* Wallet Selection Modal */}
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
