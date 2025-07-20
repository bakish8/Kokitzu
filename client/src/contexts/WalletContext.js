import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return (
      typeof window !== "undefined" &&
      window.ethereum &&
      window.ethereum.isMetaMask
    );
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    try {
      setConnectionStatus("connecting");

      if (!isMetaMaskInstalled()) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      if (!account) {
        throw new Error("No accounts found");
      }

      // Create provider and signer
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const ethSigner = await ethProvider.getSigner();

      // Get chain ID
      const network = await ethProvider.getNetwork();
      const currentChainId = network.chainId.toString();

      // Get balance
      const balanceWei = await ethProvider.getBalance(account);
      const balanceEth = ethers.formatEther(balanceWei);

      setWalletAddress(account);
      setIsConnected(true);
      setProvider(ethProvider);
      setSigner(ethSigner);
      setChainId(currentChainId);
      setBalance(balanceEth);
      setConnectionStatus("connected");

      console.log("✅ MetaMask connected:", {
        address: account,
        chainId: currentChainId,
        balance: balanceEth,
      });

      return { address: account, signer: ethSigner };
    } catch (error) {
      console.error("❌ MetaMask connection error:", error);
      setConnectionStatus("error");
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress("");
    setIsConnected(false);
    setBalance(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setConnectionStatus("disconnected");
    console.log("🔌 Wallet disconnected");
  };

  // Get wallet balance
  const getWalletBalance = async (address, chainId) => {
    try {
      if (!provider || !address) return "0.0000";

      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceWei);
      return parseFloat(balanceEth).toFixed(4);
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      return "0.0000";
    }
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${parseInt(targetChainId).toString(16)}` }],
      });

      // Refresh connection after network switch
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        await connectMetaMask();
      }
    } catch (error) {
      console.error("❌ Network switch error:", error);
      throw error;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          // Account changed
          setWalletAddress(accounts[0]);
          if (provider) {
            getWalletBalance(accounts[0], chainId).then(setBalance);
          }
        }
      };

      const handleChainChanged = (chainId) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [walletAddress, provider, chainId]);

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connectMetaMask();
          }
        } catch (error) {
          console.log("No previous connection found");
        }
      }
    };

    checkConnection();
  }, []);

  const value = {
    walletAddress,
    isConnected,
    balance,
    provider,
    signer,
    chainId,
    connectionStatus,
    connectMetaMask,
    disconnectWallet,
    getWalletBalance,
    switchNetwork,
    isMetaMaskInstalled,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
