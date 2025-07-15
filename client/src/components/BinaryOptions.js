import React from "react";
import { useNavigate } from "react-router-dom";
import { TIMEFRAMES } from "../constants/timeframes";

function BinaryOptions({
  coinsData,
  data,
  loading,
  SkeletonCryptoCard,
  selectedCrypto,
  setSelectedCrypto,
  selectedTimeframe,
  setSelectedTimeframe,
  betAmount,
  setBetAmount,
  betType,
  setBetType,
  getSelectedTimeframeInfo,
  handlePlaceBet,
  showBetModal,
  setShowBetModal,
  getPriceChange,
  animatedPrices,
  activeBetsData,
  getTimeLeft,
  currentPrice,
}) {
  const navigate = useNavigate();

  return (
    <div className="betting-container" data-active={true}>
      <div className="betting-layout">
        {/* Main Betting Form */}
        <div className="betting-form-section">
          <div className="form-card">
            {/* Crypto Selection */}
            <div className="form-section">
              <label>Select Cryptocurrency</label>
              <div className="crypto-selector">
                {coinsData?.coins?.map((coin) => {
                  const priceObj = data?.cryptoPrices?.find(
                    (c) => c.symbol === coin.symbol
                  );
                  return (
                    <button
                      key={coin.symbol}
                      className={`crypto-option ${
                        selectedCrypto === coin.symbol ? "selected" : ""
                      }`}
                      onClick={() => setSelectedCrypto(coin.symbol)}
                    >
                      <span className="crypto-symbol">{coin.symbol}</span>
                      <span className="crypto-price">
                        {priceObj ? `$${priceObj.price.toLocaleString()}` : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bet Direction & Amount Row */}
            <div className="form-row">
              <div className="form-section">
                <label>Bet Direction</label>
                <div className="bet-direction">
                  <button
                    className={`direction-btn up ${
                      betType === "UP" ? "selected" : ""
                    }`}
                    onClick={() => setBetType("UP")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    UP
                  </button>
                  <button
                    className={`direction-btn down ${
                      betType === "DOWN" ? "selected" : ""
                    }`}
                    onClick={() => setBetType("DOWN")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                    DOWN
                  </button>
                </div>
              </div>

              <div className="form-section">
                <label>Bet Amount</label>
                <div className="amount-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="10"
                    max="10000"
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* Timeframe Selection */}
            <div className="form-section">
              <label>Timeframe</label>
              <div className="timeframe-scroll">
                <div className="timeframe-selector">
                  {TIMEFRAMES.map((timeframe) => (
                    <button
                      key={timeframe.value}
                      className={`timeframe-option ${
                        selectedTimeframe === timeframe.value ? "selected" : ""
                      }`}
                      onClick={() => setSelectedTimeframe(timeframe.value)}
                    >
                      <span className="timeframe-label">{timeframe.label}</span>
                      <span className="timeframe-payout">
                        {timeframe.payout}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bet Summary */}
            <div className="bet-summary">
              <div className="summary-item">
                <span>Potential Payout:</span>
                <span className="payout-amount">
                  $
                  {(
                    betAmount *
                    parseFloat(
                      getSelectedTimeframeInfo()?.payout.replace("x", "")
                    )
                  ).toFixed(2)}
                </span>
              </div>
              <div className="summary-item">
                <span>Profit:</span>
                <span className="profit-amount">
                  $
                  {(
                    betAmount *
                    (parseFloat(
                      getSelectedTimeframeInfo()?.payout.replace("x", "")
                    ) -
                      1)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bet Action Bar */}
            <div className="bet-action-bar">
              <div className="bet-preview">
                <div className="preview-item">
                  <span>{selectedCrypto}</span>
                  <span className={`direction ${betType.toLowerCase()}`}>
                    {betType}
                  </span>
                </div>
                <div className="preview-item">
                  <span>${betAmount}</span>
                  <span className="payout">
                    {getSelectedTimeframeInfo()?.payout}
                  </span>
                </div>
              </div>
              <button
                className="place-bet-btn"
                onClick={() => setShowBetModal(true)}
                disabled={!selectedCrypto || !betType || !betAmount}
              >
                Place Bet
              </button>
            </div>
          </div>
        </div>

        {/* Active Bets Sidebar */}
        <div className="active-bets-section">
          <div className="active-bets-card">
            <div className="card-header">
              <h3>Active Bets</h3>
              <span className="bet-count">
                {activeBetsData?.activeBets?.length || 0}
              </span>
            </div>

            {activeBetsData?.activeBets?.length > 0 ? (
              <div className="bets-list">
                {activeBetsData.activeBets.map((bet) => {
                  // Find the current price for this crypto symbol
                  const currentCrypto = data?.cryptoPrices?.find(
                    (c) => c.symbol === bet.cryptoSymbol
                  );
                  const currentPrice = currentCrypto
                    ? currentCrypto.price
                    : undefined;
                  const isFinished = bet.status !== "ACTIVE";
                  const comparePrice = isFinished
                    ? bet.exitPrice
                    : currentPrice;
                  let profitState = null;
                  if (
                    comparePrice !== undefined &&
                    bet.entryPrice !== undefined
                  ) {
                    if (bet.betType === "UP") {
                      if (comparePrice > bet.entryPrice) profitState = "profit";
                      else if (comparePrice < bet.entryPrice)
                        profitState = "loss";
                      else profitState = "neutral";
                    } else if (bet.betType === "DOWN") {
                      if (comparePrice < bet.entryPrice) profitState = "profit";
                      else if (comparePrice > bet.entryPrice)
                        profitState = "loss";
                      else profitState = "neutral";
                    }
                  }
                  // Overlay style
                  let overlayStyle = {};
                  if (profitState === "profit") {
                    overlayStyle = {
                      background: "rgba(16,185,129,0.15)",
                      boxShadow: "0 0 16px 0 rgba(16,185,129,0.15)",
                      backdropFilter: "blur(2px)",
                      border: "1.5px solid var(--profit)",
                    };
                  } else if (profitState === "loss") {
                    overlayStyle = {
                      background: "rgba(239,68,68,0.15)",
                      boxShadow: "0 0 16px 0 rgba(239,68,68,0.15)",
                      backdropFilter: "blur(2px)",
                      border: "1.5px solid var(--loss)",
                    };
                  }
                  // Price color
                  let priceColor = undefined;
                  if (profitState === "profit")
                    priceColor = "var(--accent-success)";
                  else if (profitState === "loss")
                    priceColor = "var(--accent-error)";
                  return (
                    <div key={bet.id} className="bet-item" style={overlayStyle}>
                      <div className="bet-header">
                        <div className="bet-crypto">{bet.cryptoSymbol}</div>
                        <div
                          className={`bet-direction ${bet.betType.toLowerCase()}`}
                        >
                          {bet.betType}
                        </div>
                      </div>
                      <div className="bet-details">
                        <div className="bet-amount">${bet.amount}</div>
                        <div className="bet-timeframe">
                          {bet.timeframe.replace("_", " ")}
                        </div>
                      </div>
                      <div
                        className="bet-status"
                        style={{ gap: 8, flexWrap: "wrap" }}
                      >
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.8em",
                          }}
                        >
                          Start: {new Date(bet.createdAt).toLocaleString()}
                        </span>
                        {isFinished ? (
                          <>
                            <span
                              style={{
                                color:
                                  bet.result === "WIN"
                                    ? "var(--accent-success)"
                                    : "var(--accent-error)",
                                fontWeight: 600,
                              }}
                            >
                              {bet.result === "WIN"
                                ? "Win"
                                : bet.result === "LOSS"
                                ? "Loss"
                                : bet.result}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                color: "var(--text-secondary)",
                              }}
                            >
                              Entry:{" "}
                              {bet.entryPrice !== undefined
                                ? `$${Number(bet.entryPrice).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}`
                                : "-"}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                color: priceColor,
                                fontWeight: 600,
                              }}
                            >
                              End:{" "}
                              {bet.exitPrice !== undefined
                                ? `$${Number(bet.exitPrice).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}`
                                : "-"}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="status-indicator active"></div>
                            <span>Active</span>
                            <span
                              style={{
                                marginLeft: "auto",
                                fontWeight: 600,
                              }}
                            >
                              {getTimeLeft(bet.expiresAt)}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                color: "var(--text-secondary)",
                              }}
                            >
                              Entry:{" "}
                              {bet.entryPrice !== undefined
                                ? `$${Number(bet.entryPrice).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}`
                                : "-"}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                color: priceColor,
                                fontWeight: 600,
                              }}
                            >
                              Current:{" "}
                              {currentPrice !== undefined
                                ? `$${Number(currentPrice).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}`
                                : "-"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-bets">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  <path d="M7 14l3-3 2 2 3-3" />
                </svg>
                <p>No active bets</p>
                <span>Place your first bet to get started</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BinaryOptions;
