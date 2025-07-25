import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export type NetworkType = "arbitrumOne" | "arbitrumSepolia";

export interface NetworkConfig {
  name: string;
  chainId: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  arbitrumOne: {
    name: "Arbitrum One",
    chainId: "42161",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    isTestnet: false,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    chainId: "421614",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    isTestnet: true,
    nativeCurrency: {
      name: "Arbitrum Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
};

interface NetworkContextType {
  currentNetwork: NetworkType;
  networkConfig: NetworkConfig;
  switchNetwork: (network: NetworkType) => Promise<void>;
  isNetworkSwitching: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
}) => {
  const [currentNetwork, setCurrentNetwork] =
    useState<NetworkType>("arbitrumSepolia"); // Default to Arbitrum for development
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  useEffect(() => {
    loadStoredNetwork();
  }, []);

  const loadStoredNetwork = async () => {
    try {
      const storedNetwork = await AsyncStorage.getItem("selectedNetwork");
      if (storedNetwork && storedNetwork in NETWORKS) {
        setCurrentNetwork(storedNetwork as NetworkType);
        console.log("🌐 Loaded stored network:", storedNetwork);
      } else {
        // Default to Arbitrum One for production
        await AsyncStorage.setItem("selectedNetwork", "arbitrumSepolia");
        console.log("🌐 Set default network to Arbitrum");
      }
    } catch (error) {
      console.error("Error loading stored network:", error);
    }
  };

  const switchNetwork = async (network: NetworkType) => {
    if (network === currentNetwork) return;

    setIsNetworkSwitching(true);
    try {
      console.log(`🌐 Switching network from ${currentNetwork} to ${network}`);

      // Show confirmation for mainnet
      if (network === "arbitrumOne") {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Switch to Mainnet",
            "You are about to switch to Ethereum Mainnet. This will use real ETH for transactions. Are you sure?",
            [
              { text: "Cancel", onPress: () => resolve(false) },
              { text: "Switch", onPress: () => resolve(true) },
            ]
          );
        });

        if (!confirmed) {
          setIsNetworkSwitching(false);
          return;
        }
      }

      // Store the new network
      await AsyncStorage.setItem("selectedNetwork", network);
      setCurrentNetwork(network);

      // Show success message
      Alert.alert(
        "Network Switched",
        `Successfully switched to ${NETWORKS[network].name}`,
        [{ text: "OK" }]
      );

      console.log(`✅ Network switched to ${network}`);
    } catch (error) {
      console.error("Error switching network:", error);
      Alert.alert(
        "Network Switch Failed",
        "Failed to switch network. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  const networkConfig = NETWORKS[currentNetwork];

  return (
    <NetworkContext.Provider
      value={{
        currentNetwork,
        networkConfig,
        switchNetwork,
        isNetworkSwitching,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
