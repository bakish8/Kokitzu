import React from "react";
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
import { useNetwork, NetworkType, NETWORKS } from "../contexts/NetworkContext";

interface NetworkSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  isConnected: boolean;
}

const NetworkSelectionModal: React.FC<NetworkSelectionModalProps> = ({
  visible,
  onClose,
  onBack,
  isConnected,
}) => {
  const { currentNetwork, switchNetwork, isNetworkSwitching } = useNetwork();

  const handleNetworkSelect = async (networkType: NetworkType) => {
    try {
      await switchNetwork(networkType);

      if (isConnected) {
        // When connected: close the modal after network switch
        onClose();
      } else {
        // When disconnected: go back to connect modal with updated network
        onBack();
      }
    } catch (error) {
      console.error("Network switch error:", error);
      Alert.alert("Error", `Failed to switch to ${networkType}`);
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
        return "#10b981";
      case "sepolia":
        return "#3b82f6";
      case "goerli":
        return "#f59e0b";
      default:
        return "#666";
    }
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <MaterialCommunityIcons
                name="server-network"
                size={24}
                color="#3b82f6"
              />
              <Text style={styles.modalTitle}>Choose Network</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={16}
              color="#3b82f6"
            />
            <Text style={styles.backButtonText}>
              {isConnected ? "Back to Wallet" : "Back to Connect"}
            </Text>
          </TouchableOpacity>

          {/* Network Selection Section */}
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
  networkSection: {
    flex: 1,
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
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
});

export default NetworkSelectionModal;
