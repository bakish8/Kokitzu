import React from "react";
import { useNavigate } from "react-router-dom";

function LiveMarketData({
  filteredCryptoData,
  loading,
  SkeletonCryptoCard,
  getPriceChange,
  animatedPrices,
  setSelectedCrypto,
  setBetType,
}) {
  const navigate = useNavigate();

  const getCryptoIcon = (symbol) => {
    const iconMap = {
      BTC: "₿",
      ETH: "Ξ",
      SOL: "◎",
      BNB: "BNB",
      DOGE: "Ð",
      ADA: "₳",
      XRP: "✕",
      DOT: "•",
      LTC: "Ł",
      AVAX: "AVAX",
      LINK: "LINK",
      UNI: "UNI",
      MATIC: "MATIC",
      BCH: "Ƀ",
      XLM: "XLM",
      FIL: "FIL",
      APT: "APT",
      VET: "VET",
      XMR: "XMR",
    };
    return iconMap[symbol] || symbol;
  };

  return (
    <div className="prices-container content-fade-in" data-active={true}>
      <div className="crypto-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCryptoCard key={i} />
            ))
          : filteredCryptoData.map((crypto, idx) => {
              const priceChange = getPriceChange(crypto.symbol, crypto.price);
              return (
                <div
                  key={crypto.id}
                  className="crypto-card"
                  style={{ cursor: "default", position: "relative" }}
                >
                  <div className="card-main-data">
                    <div className="card-header">
                      <div className="crypto-info">
                        <div className="crypto-icon">
                          {getCryptoIcon(crypto.symbol)}
                        </div>
                        <div className="crypto-details">
                          <h2>{crypto.name}</h2>
                          <span className="symbol">{crypto.symbol}</span>
                        </div>
                      </div>

                      {priceChange && (
                        <div
                          className={`price-change ${priceChange.direction}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            {priceChange.direction === "up" ? (
                              <path d="M18 15l-6-6-6 6" />
                            ) : (
                              <path d="M6 9l6 6 6-6" />
                            )}
                          </svg>
                          <span>{priceChange.percentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="price-display">
                      <div className="price-amount">
                        $
                        {(animatedPrices[idx] ?? crypto.price).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="last-updated">
                        <div className="status-dot"></div>
                        <span className="real-time-indicator">Live</span>
                        {new Date(crypto.lastUpdated).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="sparkline">
                    <svg width="100%" height="30" viewBox="0 0 100 30">
                      <path
                        d="M0,15 Q25,5 50,15 T100,15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="sparkline-path"
                      />
                    </svg>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      zIndex: 2,
                    }}
                  >
                    <button
                      className="arrow-btn"
                      style={{
                        background: "rgba(16,185,129,0.15)",
                        border: "none",
                        borderRadius: 8,
                        padding: 6,
                        marginBottom: 2,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
                        transition: "background 0.2s",
                      }}
                      title="Bet UP"
                      onClick={() => {
                        setSelectedCrypto(crypto.symbol);
                        setBetType && setBetType("UP");
                        navigate("/betting");
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent-success)"
                        strokeWidth="2"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      className="arrow-btn down"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        border: "none",
                        borderRadius: 8,
                        padding: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(239,68,68,0.08)",
                        transition: "background 0.2s",
                      }}
                      title="Bet DOWN"
                      onClick={() => {
                        setSelectedCrypto(crypto.symbol);
                        setBetType && setBetType("DOWN");
                        navigate("/betting");
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent-error)"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export default LiveMarketData;
