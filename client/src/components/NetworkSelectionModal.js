import React from "react";
import { useNetwork, NETWORKS } from "../contexts/NetworkContext";

const NetworkSelectionModal = ({
  onClose,
  onBack,
  isConnected = false,
  onNetworkSelect = null,
}) => {
  const { currentNetwork, switchNetwork, isNetworkSwitching } = useNetwork();

  const handleNetworkSelect = async (networkType) => {
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
      alert(`Failed to switch to ${networkType}: ${error.message}`);
    }
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

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div
        className="wallet-modal-content network-selection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="wallet-modal-header">
          <div className="wallet-modal-title">
            <div className="wallet-icon">🌐</div>
            <h3>Choose Network</h3>
          </div>
          <button
            className="wallet-close-btn"
            onClick={onClose}
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

        {/* Back Button */}
        <div className="network-modal-back-section">
          <button
            className="network-back-btn"
            onClick={onBack}
            aria-label={
              isConnected ? "Go back to wallet" : "Go back to connect"
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{isConnected ? "Back to Wallet" : "Back to Connect"}</span>
          </button>
        </div>

        {/* Network Selection Section */}
        <div className="wallet-network-section">
          <div className="wallet-section-title">
            <span className="section-icon">🔗</span>
            <h4>Select Network</h4>
          </div>
          <div className="wallet-network-list">
            {Object.entries(NETWORKS).map(([key, network]) => (
              <div
                key={key}
                className={`wallet-network-item ${
                  currentNetwork === key ? "selected" : ""
                }`}
                onClick={() => handleNetworkSelect(key)}
              >
                <div className="wallet-network-item-info">
                  <div
                    className="wallet-network-item-icon"
                    style={{ color: getNetworkColor(key) }}
                  >
                    {getNetworkIcon(key)}
                  </div>
                  <div className="wallet-network-item-details">
                    <div className="wallet-network-item-name">
                      {network.name}
                    </div>
                    <div className="wallet-network-item-chain">
                      Chain ID: {network.chainId}
                    </div>
                    {network.isTestnet && (
                      <span className="wallet-testnet-badge">TESTNET</span>
                    )}
                  </div>
                </div>
                {currentNetwork === key && (
                  <div
                    className="wallet-check-icon"
                    style={{ color: getNetworkColor(key) }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
                {isNetworkSwitching && currentNetwork === key && (
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
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="wallet-modal-footer">
          <p className="wallet-footer-text">
            Select a network to switch your wallet connection
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkSelectionModal;
