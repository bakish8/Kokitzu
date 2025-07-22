import React, { useState } from "react";

function BetConfirmationModal({
  showBetModal,
  setShowBetModal,
  selectedCrypto,
  betType,
  betAmount,
  getSelectedTimeframeInfo,
  handlePlaceBet,
}) {
  const [bettingMode, setBettingMode] = useState("legacy"); // "legacy" or "blockchain"
  const [walletAddress, setWalletAddress] = useState(
    "0x742d35Cc6634C0532925a3b8D72Dc1E9C8b4c4C6"
  ); // Demo wallet

  if (!showBetModal) return null;

  const handleConfirmBet = () => {
    if (bettingMode === "blockchain") {
      console.log("🔗 Placing BLOCKCHAIN bet with wallet:", walletAddress);
      handlePlaceBet(true, walletAddress);
    } else {
      console.log("💾 Placing LEGACY bet");
      handlePlaceBet(false, null);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowBetModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Confirm Your Bet</h3>
        <div className="bet-confirmation">
          <div className="confirmation-item">
            <span>Cryptocurrency:</span>
            <span>{selectedCrypto}</span>
          </div>
          <div className="confirmation-item">
            <span>Direction:</span>
            <span className={`direction ${betType.toLowerCase()}`}>
              {betType}
            </span>
          </div>
          <div className="confirmation-item">
            <span>Timeframe:</span>
            <span>{getSelectedTimeframeInfo()?.label}</span>
          </div>
          <div className="confirmation-item">
            <span>Amount:</span>
            <span>${betAmount}</span>
          </div>
          <div className="confirmation-item">
            <span>Potential Payout:</span>
            <span>
              $
              {(
                betAmount *
                parseFloat(getSelectedTimeframeInfo()?.payout.replace("x", ""))
              ).toFixed(2)}
            </span>
          </div>

          {/* Betting Mode Selection */}
          <div className="confirmation-item">
            <span>Betting Mode:</span>
            <div className="betting-mode-selection">
              <label
                className={`mode-option ${
                  bettingMode === "legacy" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  value="legacy"
                  checked={bettingMode === "legacy"}
                  onChange={(e) => setBettingMode(e.target.value)}
                />
                💾 Legacy (In-Memory)
              </label>
              <label
                className={`mode-option ${
                  bettingMode === "blockchain" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  value="blockchain"
                  checked={bettingMode === "blockchain"}
                  onChange={(e) => setBettingMode(e.target.value)}
                />
                🔗 Blockchain (Smart Contract)
              </label>
            </div>
          </div>

          {/* Wallet Address Input (only show for blockchain mode) */}
          {bettingMode === "blockchain" && (
            <div className="confirmation-item">
              <span>Wallet Address:</span>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your wallet address"
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <small style={{ color: "#666", fontSize: "10px" }}>
                ⚠️ Make sure you have Sepolia ETH for gas fees
              </small>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowBetModal(false)}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={handleConfirmBet}>
            {bettingMode === "blockchain"
              ? "🔗 Confirm Blockchain Bet"
              : "💾 Confirm Legacy Bet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BetConfirmationModal;
