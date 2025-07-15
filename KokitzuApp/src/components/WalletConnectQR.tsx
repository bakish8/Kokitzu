import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";

interface WalletConnectQRProps {
  uri: string;
  onClose: () => void;
  connectionStatus?: "waiting" | "connecting" | "connected" | "failed";
}

const WalletConnectQR: React.FC<WalletConnectQRProps> = ({
  uri,
  onClose,
  connectionStatus = "waiting",
}) => {
  const handleCopyURI = async () => {
    try {
      await Clipboard.setStringAsync(uri);
      Alert.alert("Success", "WalletConnect URI copied to clipboard!");
    } catch (error) {
      Alert.alert("Error", "Failed to copy URI to clipboard");
    }
  };

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case "waiting":
        return {
          icon: "clock-outline",
          color: "#fbbf24",
          text: "Waiting for connection...",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          borderColor: "#fbbf24",
        };
      case "connecting":
        return {
          icon: "sync",
          color: "#3b82f6",
          text: "Connecting to wallet...",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderColor: "#3b82f6",
        };
      case "connected":
        return {
          icon: "check-circle",
          color: "#10b981",
          text: "Connected successfully!",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "#10b981",
        };
      case "failed":
        return {
          icon: "alert-circle",
          color: "#ef4444",
          text: "Connection failed",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "#ef4444",
        };
      default:
        return {
          icon: "clock-outline",
          color: "#fbbf24",
          text: "Waiting for connection...",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          borderColor: "#fbbf24",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Wallet</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: statusInfo.backgroundColor,
              borderColor: statusInfo.borderColor,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={statusInfo.icon as any}
            size={16}
            color={statusInfo.color}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={uri}
            size={200}
            color="#ffffff"
            backgroundColor="#1a1a2e"
            ecl="M"
          />
        </View>
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

      <View style={styles.troubleshooting}>
        <Text style={styles.troubleshootingTitle}>Having trouble?</Text>
        <Text style={styles.troubleshootingText}>
          • Make sure your wallet app supports WalletConnect v2
        </Text>
        <Text style={styles.troubleshootingText}>
          • Try copying the URI and pasting it in your wallet
        </Text>
        <Text style={styles.troubleshootingText}>
          • Check that you're on the same network as this device
        </Text>
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
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statusWaiting: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  statusText: {
    fontSize: 14,
    color: "#fbbf24",
    fontWeight: "600",
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginTop: 8,
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
    marginBottom: 20,
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
    marginBottom: 16,
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
  troubleshooting: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
  },
  troubleshootingTitle: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
});

export default WalletConnectQR;
