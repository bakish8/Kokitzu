import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork } from "../contexts/NetworkContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

const NetworkStatus: React.FC = () => {
  const { isConnected, provider } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();
  const [walletChainId, setWalletChainId] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  useEffect(() => {
    checkNetwork();
  }, [isConnected, provider, currentNetwork]);

  const checkNetwork = async () => {
    if (!isConnected || !provider) {
      setIsCorrectNetwork(true);
      return;
    }

    try {
      // Get the current chain ID from the wallet
      const chainId = await provider.request({ method: "eth_chainId" });
      const currentChainId = parseInt(chainId, 16).toString();
      setWalletChainId(currentChainId);

      // Check if wallet is on the correct network
      const expectedChainId = networkConfig.chainId;
      const correct = currentChainId === expectedChainId;
      setIsCorrectNetwork(correct);

      if (!correct) {
        showNetworkAlert(currentChainId, expectedChainId);
      }
    } catch (error) {
      console.error("Failed to check network:", error);
    }
  };

  const showNetworkAlert = (current: string, expected: string) => {
    const currentNetworkName =
      current === "1"
        ? "Ethereum Mainnet"
        : current === "421614"
        ? "Arbitrum Sepolia"
        : current === "42161"
        ? "Arbitrum One"
        : `Chain ID ${current}`;

    Alert.alert(
      "⚠️ Wrong Network",
      `You're connected to ${currentNetworkName}, but this app requires ${networkConfig.name}.\n\n` +
        `Please switch to ${networkConfig.name} (Chain ID: ${expected}) in your wallet.\n\n` +
        `In MetaMask:\n` +
        `1. Click the network dropdown\n` +
        `2. Select "Arbitrum Sepolia"\n` +
        `3. If not available, add it manually with:\n` +
        `   • Network Name: Arbitrum Sepolia\n` +
        `   • RPC URL: ${networkConfig.rpcUrl}\n` +
        `   • Chain ID: ${expected}\n` +
        `   • Currency Symbol: ETH`,
      [
        { text: "I'll switch manually", style: "default" },
        { text: "Try auto-switch", onPress: requestNetworkSwitch },
      ]
    );
  };

  const requestNetworkSwitch = async () => {
    if (!provider) return;

    try {
      // Try to switch network automatically
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          { chainId: `0x${parseInt(networkConfig.chainId).toString(16)}` },
        ],
      });
    } catch (switchError: any) {
      // If network doesn't exist, try to add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${parseInt(networkConfig.chainId).toString(16)}`,
                chainName: networkConfig.name,
                nativeCurrency: {
                  name: networkConfig.nativeCurrency.name,
                  symbol: networkConfig.nativeCurrency.symbol,
                  decimals: networkConfig.nativeCurrency.decimals,
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
          Alert.alert(
            "Error",
            "Failed to add network. Please add it manually."
          );
        }
      } else {
        console.error("Failed to switch network:", switchError);
        Alert.alert(
          "Error",
          "Failed to switch network. Please switch manually."
        );
      }
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          isCorrectNetwork ? styles.correct : styles.wrong,
        ]}
      >
        <MaterialCommunityIcons
          name={isCorrectNetwork ? "check-circle" : "alert-circle"}
          size={16}
          color={isCorrectNetwork ? COLORS.success : COLORS.error}
        />
        <Text
          style={[
            styles.text,
            { color: isCorrectNetwork ? COLORS.success : COLORS.error },
          ]}
        >
          {isCorrectNetwork ? "✅ Arbitrum Sepolia" : "⚠️ Wrong Network"}
        </Text>
        {!isCorrectNetwork && (
          <TouchableOpacity onPress={checkNetwork} style={styles.refreshButton}>
            <MaterialCommunityIcons
              name="refresh"
              size={14}
              color={COLORS.error}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 4,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  correct: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  wrong: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  text: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
  },
  refreshButton: {
    marginLeft: 8,
    padding: 2,
  },
});

export default NetworkStatus;
