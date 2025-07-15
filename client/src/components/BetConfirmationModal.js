import React from "react";

function BetConfirmationModal({
  showBetModal,
  setShowBetModal,
  selectedCrypto,
  betType,
  betAmount,
  getSelectedTimeframeInfo,
  handlePlaceBet,
}) {
  if (!showBetModal) return null;

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
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowBetModal(false)}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={handlePlaceBet}>
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  );
}

export default BetConfirmationModal;
