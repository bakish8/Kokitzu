import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNetwork, NetworkType, NETWORKS } from "../contexts/NetworkContext";

interface NetworkSelectorProps {
  compact?: boolean;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  compact = false,
}) => {
  const { currentNetwork, networkConfig, switchNetwork, isNetworkSwitching } =
    useNetwork();
  const [showModal, setShowModal] = useState(false);

  const handleNetworkSelect = async (network: NetworkType) => {
    setShowModal(false);
    await switchNetwork(network);
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

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.compactContainer,
            { borderColor: getNetworkColor(currentNetwork) },
          ]}
          onPress={() => setShowModal(true)}
          disabled={isNetworkSwitching}
        >
          <MaterialCommunityIcons
            name={getNetworkIcon(currentNetwork)}
            size={16}
            color={getNetworkColor(currentNetwork)}
          />
          <Text
            style={[
              styles.compactText,
              { color: getNetworkColor(currentNetwork) },
            ]}
          >
            {currentNetwork.toUpperCase()}
          </Text>
          {isNetworkSwitching && (
            <MaterialCommunityIcons
              name="loading"
              size={12}
              color={getNetworkColor(currentNetwork)}
              style={styles.spinning}
            />
          )}
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
                <Text style={styles.modalTitle}>Select Network</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.networkList}>
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
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          { borderColor: getNetworkColor(currentNetwork) },
        ]}
        onPress={() => setShowModal(true)}
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
          <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
        </View>
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
              <Text style={styles.modalTitle}>Select Network</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.networkList}>
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 200,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
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
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  networkChainId: {
    color: "#666",
    fontSize: 12,
    fontFamily: "monospace",
  },
  testnetBadge: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    marginTop: 2,
  },
  networkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  networkList: {
    padding: 16,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#2a2a3e",
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedNetworkItem: {
    borderColor: "#3b82f6",
    backgroundColor: "#1e3a8a",
  },
  spinning: {
    transform: [{ rotate: "360deg" }],
  },
});

export default NetworkSelector;
