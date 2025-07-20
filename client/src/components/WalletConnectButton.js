import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useNetwork, NETWORKS } from "../contexts/NetworkContext";
import NetworkSelectionModal from "./NetworkSelectionModal";

const WalletConnectButton = () => {
  const {
    walletAddress,
    isConnected,
    balance,
    connectMetaMask,
    disconnectWallet,
    connectionStatus,
    isMetaMaskInstalled,
  } = useWallet();

  const { currentNetwork, networkConfig, switchNetwork, isNetworkSwitching } =
    useNetwork();
  const [showModal, setShowModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [modalView, setModalView] = useState("wallet"); // "wallet" or "network"

  // Handle modal open/close with body scroll lock
  const handleModalOpen = () => {
    setShowModal(true);
    document.body.classList.add("modal-open");
  };

  const handleModalClose = () => {
    setShowModal(false);
    setShowNetworkModal(false);
    setModalView("wallet");
    document.body.classList.remove("modal-open");
  };

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const handleConnect = async () => {
    try {
      if (!isMetaMaskInstalled()) {
        alert(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
        return;
      }
      await connectMetaMask();
      setShowModal(false);
    } catch (error) {
      console.error("Connection error:", error);
      alert(error.message);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleNetworkSelect = async (networkType) => {
    try {
      await switchNetwork(networkType);
    } catch (error) {
      console.error("Network switch error:", error);
      alert(`Failed to switch to ${networkType}: ${error.message}`);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkIcon = (network) => {
    switch (network) {
      case "mainnet":
        return "🔵";
      case "sepolia":
        return "🧪";

      default:
        return "🌐";
    }
  };

  const getNetworkColor = (network) => {
    switch (network) {
      case "mainnet":
        return "#10b981";
      case "sepolia":
        return "#3b82f6";

      default:
        return "#666";
    }
  };

  const getChainName = (chainId) => {
    switch (chainId) {
      case "1":
        return "ETH";
      case "11155111":
        return "Sepolia ETH";

      default:
        return networkConfig.nativeCurrency.symbol;
    }
  };

  // Connected state
  if (isConnected && walletAddress) {
    return (
      <>
        <div className="wallet-connect-container">
          <button
            className="wallet-connect-btn connected"
            onClick={handleModalOpen}
            title="Wallet Connected - Click to manage"
          >
            <span className="wallet-icon">🦊</span>
            <div className="wallet-info">
              <div className="wallet-address">
                {formatAddress(walletAddress)}
              </div>
              {balance && (
                <div className="wallet-balance">
                  {parseFloat(balance).toFixed(4)}{" "}
                  {getChainName(networkConfig.chainId)}
                </div>
              )}
            </div>
            <div
              className={`network-indicator ${
                networkConfig.isTestnet ? "testnet" : "mainnet"
              }`}
            ></div>
          </button>
          <button
            className="wallet-disconnect-quick"
            onClick={handleDisconnect}
            title="Disconnect Wallet"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Connected Wallet Modal */}
        {showModal && modalView === "wallet" && (
          <div className="wallet-modal-overlay" onClick={handleModalClose}>
            <div
              className="wallet-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="wallet-modal-header">
                <div className="wallet-modal-title">
                  <div className="wallet-icon">🦊</div>
                  <h3>Wallet Connected</h3>
                </div>
                <button
                  className="wallet-close-btn"
                  onClick={handleModalClose}
                  aria-label="Close modal"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Wallet Info Section */}
              <div className="wallet-info-section">
                <div className="wallet-section-title">
                  <span className="section-icon">👤</span>
                  <h4>Wallet Information</h4>
                </div>
                <div className="wallet-info-card">
                  <div className="wallet-info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">
                      {formatAddress(walletAddress)}
                    </span>
                  </div>
                  <div className="wallet-info-item">
                    <span className="info-label">Network:</span>
                    <span className="info-value">{networkConfig.name}</span>
                  </div>
                  <div className="wallet-info-item">
                    <span className="info-label">Balance:</span>
                    <span className="info-value">
                      {balance
                        ? `${parseFloat(balance).toFixed(4)} ${getChainName(
                            networkConfig.chainId
                          )}`
                        : "Loading..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wallet Actions */}
              <div className="wallet-actions-section">
                <div className="wallet-section-title">
                  <span className="section-icon">⚙️</span>
                  <h4>Wallet Actions</h4>
                </div>
                <div className="wallet-actions-list">
                  <button
                    className="wallet-action-btn"
                    onClick={() => {
                      window.open(
                        `https://etherscan.io/address/${walletAddress}`,
                        "_blank"
                      );
                      handleModalClose();
                    }}
                  >
                    <div className="action-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15,3 21,3 21,9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                    <div className="action-text">
                      <div className="action-title">View on Etherscan</div>
                      <div className="action-subtitle">
                        Open wallet on blockchain explorer
                      </div>
                    </div>
                  </button>

                  <button
                    className="wallet-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      handleModalClose();
                    }}
                  >
                    <div className="action-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </div>
                    <div className="action-text">
                      <div className="action-title">Copy Address</div>
                      <div className="action-subtitle">
                        Copy wallet address to clipboard
                      </div>
                    </div>
                  </button>

                  <button
                    className="wallet-action-btn"
                    onClick={() => {
                      setModalView("network");
                    }}
                  >
                    <div className="action-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div className="action-text">
                      <div className="action-title">Switch Network</div>
                      <div className="action-subtitle">
                        Change to different network
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Disconnect Section */}
              <div className="wallet-disconnect-section">
                <button
                  className="wallet-disconnect-btn"
                  onClick={() => {
                    handleDisconnect();
                    handleModalClose();
                  }}
                >
                  <div className="disconnect-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <span>Disconnect Wallet</span>
                </button>
              </div>

              {/* Footer */}
              <div className="wallet-modal-footer">
                <p className="wallet-footer-text">
                  Your wallet is securely connected to Kokitzu
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Network Selection Modal */}
        {showModal && modalView === "network" && (
          <NetworkSelectionModal
            onClose={handleModalClose}
            onBack={() => setModalView("wallet")}
            isConnected={isConnected}
          />
        )}
      </>
    );
  }

  // Disconnected state
  return (
    <>
      <button
        className={`wallet-connect-btn ${isConnected ? "connected" : ""}`}
        onClick={handleModalOpen}
        disabled={connectionStatus === "connecting"}
      >
        <span className="wallet-icon">🦊</span>
        {connectionStatus === "connecting" ? "Connecting..." : "Connect Wallet"}
      </button>

      {/* Wallet Connection Modal */}
      {showModal && modalView === "wallet" && (
        <div className="wallet-modal-overlay" onClick={handleModalClose}>
          <div
            className="wallet-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="wallet-modal-header">
              <div className="wallet-modal-title">
                <div className="wallet-icon">🔗</div>
                <h3>Connect Your Wallet</h3>
              </div>
              <button
                className="wallet-close-btn"
                onClick={handleModalClose}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Network Selection Section */}
            <div className="wallet-network-section">
              <div className="wallet-section-title">
                <span className="section-icon">🌐</span>
                <h4>Select Network</h4>
              </div>
              <div
                className="wallet-network-selector"
                style={{ borderColor: getNetworkColor(currentNetwork) }}
                onClick={() => setModalView("network")}
              >
                <div className="wallet-network-info">
                  <div
                    className="wallet-network-icon"
                    style={{ color: getNetworkColor(currentNetwork) }}
                  >
                    {getNetworkIcon(currentNetwork)}
                  </div>
                  <div className="wallet-network-details">
                    <div className="wallet-network-name">
                      {networkConfig.name}
                    </div>
                    <div className="wallet-network-chain">
                      Chain ID: {networkConfig.chainId}
                    </div>
                  </div>
                </div>
                <div className="wallet-network-actions">
                  {isNetworkSwitching && (
                    <div className="wallet-loading-spinner">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                    </div>
                  )}
                  <svg
                    className="wallet-chevron"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Connection Options */}
            <div className="wallet-connection-section">
              <div className="wallet-section-title">
                <span className="section-icon">🦊</span>
                <h4>Connect Wallet</h4>
              </div>
              <div className="wallet-connection-options">
                <button
                  className="wallet-connection-option"
                  onClick={handleConnect}
                  disabled={connectionStatus === "connecting"}
                >
                  <div className="wallet-option-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        fill="#F6851B"
                      />
                      <path
                        d="M12 3a9 9 0 100 18 9 9 0 000-18z"
                        fill="#F6851B"
                      />
                      <path
                        d="M12 6a6 6 0 100 12 6 6 0 000-12z"
                        fill="#F6851B"
                      />
                      <path d="M12 9a3 3 0 100 6 3 3 0 000-6z" fill="#F6851B" />
                    </svg>
                  </div>
                  <div className="wallet-option-details">
                    <div className="wallet-option-title">MetaMask</div>
                    <div className="wallet-option-subtitle">
                      Connect with MetaMask browser extension
                    </div>
                  </div>
                  <div className="wallet-option-arrow">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="wallet-modal-footer">
              <p className="wallet-footer-text">
                By connecting your wallet, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Selection Modal for Disconnected State */}
      {showModal && modalView === "network" && (
        <NetworkSelectionModal
          onClose={handleModalClose}
          onBack={() => setModalView("wallet")}
          isConnected={isConnected}
        />
      )}
    </>
  );
};

export default WalletConnectButton;
