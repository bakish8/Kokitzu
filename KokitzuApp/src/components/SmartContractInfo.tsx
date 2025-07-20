import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";
import NetworkSelector from "./NetworkSelector";

interface SmartContractInfoProps {
  contractAddress?: string;
}

const SmartContractInfo: React.FC<SmartContractInfoProps> = ({
  contractAddress = "0x1234567890123456789012345678901234567890",
}) => {
  const { isConnected, walletAddress, sendTransaction } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();
  const [loading, setLoading] = useState(false);

  const handlePlaceBet = async (direction: "UP" | "DOWN", amount: string) => {
    if (!isConnected) {
      Alert.alert("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd call the smart contract here
      const txHash = await sendTransaction(contractAddress, amount);

      if (txHash) {
        Alert.alert(
          "Transaction Sent",
          `Your ${direction} bet for ${amount} ${
            networkConfig.nativeCurrency.symbol
          } has been placed!\n\nTransaction Hash: ${txHash.slice(
            0,
            10
          )}...\n\nNetwork: ${networkConfig.name}`,
          [
            {
              text: "View on Explorer",
              onPress: () => console.log("Open Explorer"),
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert(
          "Transaction Failed",
          "Failed to place bet. Please try again."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to place bet"
      );
    } finally {
      setLoading(false);
    }
  };

  const getNetworkIcon = () => {
    switch (currentNetwork) {
      case "mainnet":
        return "ethereum";
      case "sepolia":
        return "test-tube";

      default:
        return "server-network";
    }
  };

  const getNetworkColor = () => {
    switch (currentNetwork) {
      case "mainnet":
        return "#10b981"; // Green for mainnet
      case "sepolia":
        return "#3b82f6"; // Blue for Sepolia

      default:
        return "#666";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={24}
          color="#3b82f6"
        />
        <Text style={styles.title}>Smart Contract</Text>
      </View>

      <View style={styles.contractInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Contract Address:</Text>
          <Text style={styles.value}>{contractAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Network:</Text>
          <View style={styles.networkContainer}>
            <MaterialCommunityIcons
              name={getNetworkIcon()}
              size={16}
              color={getNetworkColor()}
            />
            <Text style={[styles.networkText, { color: getNetworkColor() }]}>
              {networkConfig.name}
            </Text>
            {networkConfig.isTestnet && (
              <Text style={styles.testnetBadge}>TESTNET</Text>
            )}
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Chain ID:</Text>
          <Text style={styles.value}>{networkConfig.chainId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Network Selector */}
      <View style={styles.networkSelectorContainer}>
        <Text style={styles.sectionTitle}>Switch Network</Text>
        <NetworkSelector compact={true} />
      </View>

      {isConnected && (
        <View style={styles.bettingSection}>
          <Text style={styles.sectionTitle}>Place Bet on Chain</Text>
          <Text style={styles.sectionSubtitle}>
            Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </Text>

          <View style={styles.betButtons}>
            <TouchableOpacity
              style={[
                styles.betButton,
                styles.upButton,
                loading && styles.disabledButton,
              ]}
              onPress={() => handlePlaceBet("UP", "0.01")}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.betButtonText}>
                UP 0.01 {networkConfig.nativeCurrency.symbol}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.betButton,
                styles.downButton,
                loading && styles.disabledButton,
              ]}
              onPress={() => handlePlaceBet("DOWN", "0.01")}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="trending-down"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.betButtonText}>
                DOWN 0.01 {networkConfig.nativeCurrency.symbol}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contractFeatures}>
            <View style={styles.feature}>
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color="#10b981"
              />
              <Text style={styles.featureText}>Audited Contract</Text>
            </View>
            <View style={styles.feature}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#f59e0b"
              />
              <Text style={styles.featureText}>1-5 Minute Expiry</Text>
            </View>
            <View style={styles.feature}>
              <MaterialCommunityIcons
                name="percent"
                size={16}
                color="#3b82f6"
              />
              <Text style={styles.featureText}>95% Payout</Text>
            </View>
          </View>
        </View>
      )}

      {!isConnected && (
        <View style={styles.connectPrompt}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={32}
            color="#666"
          />
          <Text style={styles.connectText}>
            Connect your wallet to place bets on-chain
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  contractInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#666666",
  },
  value: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  networkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  testnetBadge: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  statusText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
  networkSelectorContainer: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
    marginBottom: 16,
  },
  bettingSection: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 12,
  },
  betButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  betButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  upButton: {
    backgroundColor: "#10b981",
  },
  downButton: {
    backgroundColor: "#ef4444",
  },
  disabledButton: {
    opacity: 0.6,
  },
  betButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  contractFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: "#666666",
  },
  connectPrompt: {
    alignItems: "center",
    paddingVertical: 20,
  },
  connectText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
});

export default SmartContractInfo;
