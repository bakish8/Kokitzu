import React, { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "./WalletContext";

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

// Network configurations
export const NETWORKS = {
  mainnet: {
    name: "Ethereum Mainnet",
    chainId: "1",
    rpcUrl: "https://mainnet.infura.io/v3/your-project-id",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://etherscan.io"],
    isTestnet: false,
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: "11155111",
    rpcUrl: "https://sepolia.infura.io/v3/your-project-id",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "Sepolia ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    isTestnet: true,
  },
  goerli: {
    name: "Goerli Testnet",
    chainId: "5",
    rpcUrl: "https://goerli.infura.io/v3/your-project-id",
    nativeCurrency: {
      name: "Goerli Ether",
      symbol: "Goerli ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://goerli.etherscan.io"],
    isTestnet: true,
  },
};

export const NetworkProvider = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState("sepolia"); // Default to Sepolia
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const { switchNetwork: walletSwitchNetwork, chainId: walletChainId } =
    useWallet();

  // Get current network configuration
  const networkConfig = NETWORKS[currentNetwork] || NETWORKS.sepolia;

  // Switch network
  const switchNetwork = async (networkType) => {
    try {
      setIsNetworkSwitching(true);
      console.log(`🌐 Switching to ${networkType} network`);

      // Update local state
      setCurrentNetwork(networkType);

      // If wallet is connected, switch network in wallet too
      if (walletChainId && walletChainId !== NETWORKS[networkType].chainId) {
        await walletSwitchNetwork(NETWORKS[networkType].chainId);
      }

      console.log(`✅ Switched to ${networkType} network`);
    } catch (error) {
      console.error(`❌ Failed to switch to ${networkType}:`, error);
      // Revert to previous network on error
      setCurrentNetwork(currentNetwork);
      throw error;
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // Sync with wallet chain ID
  useEffect(() => {
    if (walletChainId) {
      const networkType = Object.keys(NETWORKS).find(
        (key) => NETWORKS[key].chainId === walletChainId.toString()
      );

      if (networkType && networkType !== currentNetwork) {
        console.log(`🔄 Syncing network with wallet: ${networkType}`);
        setCurrentNetwork(networkType);
      }
    }
  }, [walletChainId, currentNetwork]);

  const value = {
    currentNetwork,
    networkConfig,
    switchNetwork,
    isNetworkSwitching,
    NETWORKS,
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};
