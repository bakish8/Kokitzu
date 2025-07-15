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
import {
  detectLocalIP,
  getCachedIP,
  forceRefreshIP,
  getPotentialIPs,
  setManualIP,
} from "../utils/networkUtils";
import { refreshApolloClient } from "../graphql/client";

interface NetworkStatusProps {
  visible?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ visible = true }) => {
  const [currentIP, setCurrentIP] = useState<string>("Detecting...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showIPModal, setShowIPModal] = useState(false);
  const [potentialIPs, setPotentialIPs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      updateIPDisplay();
    }
  }, [visible]);

  const updateIPDisplay = async () => {
    try {
      const cachedIP = getCachedIP();
      if (cachedIP) {
        setCurrentIP(cachedIP);
        setLastUpdated(new Date());
      } else {
        const detectedIP = await detectLocalIP();
        setCurrentIP(detectedIP);
        setLastUpdated(new Date());
      }
    } catch (error) {
      setCurrentIP("Error detecting IP");
      console.error("Error updating IP display:", error);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      console.log("🔄 Manual network refresh requested...");

      // Force refresh IP detection
      const newIP = await forceRefreshIP();
      setCurrentIP(newIP);
      setLastUpdated(new Date());

      // Refresh Apollo Client with new IP
      await refreshApolloClient();

      Alert.alert("Network Refreshed", `Successfully updated to IP: ${newIP}`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error refreshing network:", error);
      Alert.alert(
        "Refresh Failed",
        "Failed to refresh network connection. Please check your network settings.",
        [{ text: "OK" }]
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleScanForIPs = async () => {
    if (isScanning) return;

    setIsScanning(true);
    try {
      console.log("🔍 Scanning for available IPs...");
      const ips = await getPotentialIPs();
      setPotentialIPs(ips);
      setShowIPModal(true);
    } catch (error) {
      console.error("Error scanning for IPs:", error);
      Alert.alert("Scan Failed", "Failed to scan for available IPs.", [
        { text: "OK" },
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectIP = async (ip: string) => {
    try {
      console.log("🔧 Manually selecting IP:", ip);

      // Set the manual IP
      setManualIP(ip);
      setCurrentIP(ip);
      setLastUpdated(new Date());

      // Refresh Apollo Client with new IP
      await refreshApolloClient();

      setShowIPModal(false);

      Alert.alert("IP Updated", `Successfully set IP to: ${ip}`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error setting manual IP:", error);
      Alert.alert("Update Failed", "Failed to update IP address.", [
        { text: "OK" },
      ]);
    }
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons name="wifi" size={16} color="#3b82f6" />
          <Text style={styles.ipText}>IP: {currentIP}</Text>
          {lastUpdated && (
            <Text style={styles.timestamp}>
              {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanningButton]}
            onPress={handleScanForIPs}
            disabled={isScanning}
          >
            <MaterialCommunityIcons name="magnify" size={14} color="#ffffff" />
            <Text style={styles.scanText}>
              {isScanning ? "Scanning..." : "Scan"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.refreshButton,
              isRefreshing && styles.refreshingButton,
            ]}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color="#ffffff"
              style={isRefreshing ? styles.spinning : undefined}
            />
            <Text style={styles.refreshText}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* IP Selection Modal */}
      <Modal
        visible={showIPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIPModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select IP Address</Text>
              <TouchableOpacity
                onPress={() => setShowIPModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.ipList}>
              {potentialIPs.length > 0 ? (
                potentialIPs.map((ip, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.ipItem}
                    onPress={() => handleSelectIP(ip)}
                  >
                    <MaterialCommunityIcons
                      name="server-network"
                      size={20}
                      color="#3b82f6"
                    />
                    <Text style={styles.ipItemText}>{ip}</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noIPsText}>No IPs found</Text>
              )}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ipText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "monospace",
  },
  timestamp: {
    color: "#666",
    fontSize: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scanningButton: {
    backgroundColor: "#666",
  },
  scanText: {
    color: "#ffffff",
    fontSize: 12,
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshingButton: {
    backgroundColor: "#666",
  },
  refreshText: {
    color: "#ffffff",
    fontSize: 12,
    marginLeft: 4,
  },
  spinning: {
    transform: [{ rotate: "360deg" }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
  ipList: {
    maxHeight: 300,
  },
  ipItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  ipItemText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    fontFamily: "monospace",
  },
  noIPsText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});

export default NetworkStatus;
