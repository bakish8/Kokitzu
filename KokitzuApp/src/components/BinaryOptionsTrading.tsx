import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import binaryOptionsContract, {
  Option,
  CreateOptionParams,
} from "../services/binaryOptionsContract";
import { ethers } from "ethers";

interface BinaryOptionsTradingProps {
  asset: string;
  currentPrice: string;
}

const BinaryOptionsTrading: React.FC<BinaryOptionsTradingProps> = ({
  asset,
  currentPrice,
}) => {
  const { walletAddress, isConnected, provider } = useWallet();

  const [showTradingModal, setShowTradingModal] = useState(false);
  const [amount, setAmount] = useState("0.01");
  const [expiryTime, setExpiryTime] = useState(300); // 5 minutes default
  const [isCall, setIsCall] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [contractStats, setContractStats] = useState<any>(null);

  // Expiry time options
  const expiryOptions = [
    { label: "5 min", value: 300 },
    { label: "15 min", value: 900 },
    { label: "1 hour", value: 3600 },
    { label: "4 hours", value: 14400 },
    { label: "24 hours", value: 86400 },
  ];

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadUserOptions();
      loadContractStats();
    }
  }, [isConnected, walletAddress]);

  const loadUserOptions = async () => {
    try {
      if (!walletAddress) return;

      const activeOptions = await binaryOptionsContract.getUserActiveOptions(
        walletAddress
      );
      setUserOptions(activeOptions);
    } catch (error) {
      console.error("Failed to load user options:", error);
    }
  };

  const loadContractStats = async () => {
    try {
      const stats = await binaryOptionsContract.getContractStats();
      setContractStats(stats);
    } catch (error) {
      console.error("Failed to load contract stats:", error);
    }
  };

  const connectToContract = async () => {
    try {
      if (!provider || !walletAddress) {
        throw new Error("Wallet not connected");
      }

      const signer = provider.getSigner();
      await binaryOptionsContract.connectWallet(signer);
      console.log("✅ Connected to BinaryOptions contract");
    } catch (error) {
      console.error("Failed to connect to contract:", error);
      Alert.alert("Error", "Failed to connect to smart contract");
    }
  };

  const createOption = async () => {
    try {
      setIsLoading(true);

      if (!isConnected || !walletAddress) {
        throw new Error("Wallet not connected");
      }

      // Connect to contract if not already connected
      if (!provider) {
        throw new Error("Provider not available");
      }

      const signer = provider.getSigner();
      await binaryOptionsContract.connectWallet(signer);

      const params: CreateOptionParams = {
        asset,
        amount,
        expiryTime,
        isCall,
      };

      console.log("Creating option with params:", params);

      const tx = await binaryOptionsContract.createOption(params);

      Alert.alert(
        "Option Created!",
        `Transaction sent: ${
          tx.hash
        }\n\nAsset: ${asset}\nAmount: ${amount} ETH\nType: ${
          isCall ? "Call" : "Put"
        }\nExpiry: ${expiryTime / 60} minutes`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowTradingModal(false);
              loadUserOptions();
            },
          },
        ]
      );

      // Wait for transaction confirmation
      await tx.wait();
      console.log("✅ Option created successfully");
    } catch (error: any) {
      console.error("Failed to create option:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create option. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const executeOption = async (optionId: number) => {
    try {
      setIsLoading(true);

      if (!provider) {
        throw new Error("Provider not available");
      }

      const signer = provider.getSigner();
      await binaryOptionsContract.connectWallet(signer);

      const tx = await binaryOptionsContract.executeOption(optionId);

      Alert.alert("Option Executed!", `Transaction sent: ${tx.hash}`, [
        { text: "OK" },
      ]);

      await tx.wait();
      console.log("✅ Option executed successfully");

      // Reload user options
      loadUserOptions();
    } catch (error: any) {
      console.error("Failed to execute option:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to execute option. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTimeRemaining = (expiryTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiryTime - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getOptionStatus = (option: Option) => {
    if (option.isExecuted) {
      return option.isWon ? "Won" : "Lost";
    }

    const now = Math.floor(Date.now() / 1000);
    if (now >= option.expiryTime) {
      return "Ready to Execute";
    }

    return "Active";
  };

  const getOptionStatusColor = (option: Option) => {
    if (option.isExecuted) {
      return option.isWon ? "#10b981" : "#ef4444";
    }

    const now = Math.floor(Date.now() / 1000);
    if (now >= option.expiryTime) {
      return "#f59e0b";
    }

    return "#3b82f6";
  };

  return (
    <View style={styles.container}>
      {/* Trading Button */}
      <TouchableOpacity
        style={styles.tradingButton}
        onPress={() => setShowTradingModal(true)}
      >
        <MaterialCommunityIcons name="trending-up" size={24} color="#ffffff" />
        <Text style={styles.tradingButtonText}>Trade Binary Options</Text>
      </TouchableOpacity>

      {/* User Options */}
      {userOptions.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Your Active Options</Text>
          <ScrollView style={styles.optionsList}>
            {userOptions.map((option) => (
              <View key={option.id} style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionAsset}>{option.asset}</Text>
                  <Text
                    style={[
                      styles.optionStatus,
                      { color: getOptionStatusColor(option) },
                    ]}
                  >
                    {getOptionStatus(option)}
                  </Text>
                </View>

                <View style={styles.optionDetails}>
                  <Text style={styles.optionText}>
                    Amount: {option.amount} ETH
                  </Text>
                  <Text style={styles.optionText}>
                    Type: {option.isCall ? "Call" : "Put"}
                  </Text>
                  <Text style={styles.optionText}>
                    Strike: ${parseFloat(option.strikePrice).toFixed(2)}
                  </Text>
                  <Text style={styles.optionText}>
                    Expiry: {formatTime(option.expiryTime)}
                  </Text>
                  {!option.isExecuted && (
                    <Text style={styles.optionText}>
                      Time Left: {getTimeRemaining(option.expiryTime)}
                    </Text>
                  )}
                </View>

                {!option.isExecuted &&
                  getTimeRemaining(option.expiryTime) === "Expired" && (
                    <TouchableOpacity
                      style={styles.executeButton}
                      onPress={() => executeOption(option.id)}
                      disabled={isLoading}
                    >
                      <Text style={styles.executeButtonText}>Execute</Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trading Modal */}
      <Modal
        visible={showTradingModal}
        transparent={true}
        onRequestClose={() => setShowTradingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trade {asset}</Text>
              <TouchableOpacity onPress={() => setShowTradingModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Current Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Current Price</Text>
                <Text style={styles.priceValue}>
                  ${parseFloat(currentPrice).toFixed(2)}
                </Text>
              </View>

              {/* Amount Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount (ETH)</Text>
                <View style={styles.amountButtons}>
                  {["0.01", "0.05", "0.1", "0.5", "1.0"].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.amountButton,
                        amount === value && styles.amountButtonActive,
                      ]}
                      onPress={() => setAmount(value)}
                    >
                      <Text
                        style={[
                          styles.amountButtonText,
                          amount === value && styles.amountButtonTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Expiry Time */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Expiry Time</Text>
                <View style={styles.expiryButtons}>
                  {expiryOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.expiryButton,
                        expiryTime === option.value &&
                          styles.expiryButtonActive,
                      ]}
                      onPress={() => setExpiryTime(option.value)}
                    >
                      <Text
                        style={[
                          styles.expiryButtonText,
                          expiryTime === option.value &&
                            styles.expiryButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Call/Put Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Option Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      isCall && styles.typeButtonActive,
                      { backgroundColor: isCall ? "#10b981" : "#374151" },
                    ]}
                    onPress={() => setIsCall(true)}
                  >
                    <MaterialCommunityIcons
                      name="trending-up"
                      size={20}
                      color={isCall ? "#ffffff" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: isCall ? "#ffffff" : "#9ca3af" },
                      ]}
                    >
                      Call (Price Up)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      !isCall && styles.typeButtonActive,
                      { backgroundColor: !isCall ? "#ef4444" : "#374151" },
                    ]}
                    onPress={() => setIsCall(false)}
                  >
                    <MaterialCommunityIcons
                      name="trending-down"
                      size={20}
                      color={!isCall ? "#ffffff" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: !isCall ? "#ffffff" : "#9ca3af" },
                      ]}
                    >
                      Put (Price Down)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Potential Payout */}
              <View style={styles.payoutContainer}>
                <Text style={styles.payoutLabel}>Potential Payout</Text>
                <Text style={styles.payoutValue}>
                  {(parseFloat(amount) * 0.8).toFixed(4)} ETH
                </Text>
                <Text style={styles.payoutNote}>
                  (80% of bet amount if you win)
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTradingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  isLoading && styles.createButtonDisabled,
                ]}
                onPress={createOption}
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Option</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tradingButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  tradingButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  optionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  optionsList: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionAsset: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  optionStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionDetails: {
    marginBottom: 12,
  },
  optionText: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  executeButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  executeButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
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
    width: "90%",
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalBody: {
    padding: 20,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  amountButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amountButton: {
    backgroundColor: "#374151",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  amountButtonActive: {
    backgroundColor: "#3b82f6",
  },
  amountButtonText: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  amountButtonTextActive: {
    color: "#ffffff",
  },
  expiryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expiryButton: {
    backgroundColor: "#374151",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  expiryButtonActive: {
    backgroundColor: "#3b82f6",
  },
  expiryButtonText: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  expiryButtonTextActive: {
    color: "#ffffff",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  typeButtonActive: {
    // Handled inline
  },
  typeButtonText: {
    fontWeight: "600",
  },
  payoutContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    backgroundColor: "#0f0f23",
    borderRadius: 8,
  },
  payoutLabel: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 4,
  },
  payoutValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  payoutNote: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#6b7280",
  },
  createButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default BinaryOptionsTrading;
