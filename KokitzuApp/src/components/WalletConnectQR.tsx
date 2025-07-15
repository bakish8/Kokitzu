import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface WalletConnectQRProps {
  uri: string;
  onClose: () => void;
}

const WalletConnectQR: React.FC<WalletConnectQRProps> = ({ uri, onClose }) => {
  const handleCopyURI = () => {
    // In a real app, you'd copy to clipboard
    Alert.alert(
      "WalletConnect URI",
      "Copy this URI and paste it in your wallet app:",
      [
        { text: "Copy URI", onPress: () => console.log("Copy URI:", uri) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Wallet</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.qrContainer}>
        <MaterialCommunityIcons name="qrcode" size={200} color="#3b82f6" />
        <Text style={styles.instructions}>
          Scan this QR code with your wallet app
        </Text>
        <Text style={styles.subInstructions}>
          Or copy the connection URI below
        </Text>
      </View>

      <View style={styles.uriContainer}>
        <Text style={styles.uriLabel}>Connection URI:</Text>
        <Text style={styles.uri} numberOfLines={3} ellipsizeMode="middle">
          {uri}
        </Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyURI}>
          <MaterialCommunityIcons
            name="content-copy"
            size={16}
            color="#ffffff"
          />
          <Text style={styles.copyButtonText}>Copy URI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>How to connect:</Text>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1.</Text>
          <Text style={styles.stepText}>
            Open your wallet app (MetaMask, Trust Wallet, etc.)
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>2.</Text>
          <Text style={styles.stepText}>
            Look for "Connect" or "Scan QR" option
          </Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>3.</Text>
          <Text style={styles.stepText}>Scan the QR code or paste the URI</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>4.</Text>
          <Text style={styles.stepText}>
            Approve the connection in your wallet
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  subInstructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  uriContainer: {
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  uriLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  uri: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "monospace",
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  steps: {
    marginTop: 16,
  },
  stepsTitle: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 12,
  },
  step: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "bold",
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    fontSize: 14,
    color: "#cccccc",
    flex: 1,
  },
});

export default WalletConnectQR;
