import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PriceChart from "./PriceChart";
import priceDataService from "../services/priceDataService";
import { TIMEFRAMES } from "../constants/timeframes";

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

  // Chart data state
  const [chartData, setChartData] = useState({});
  const [loadingCharts, setLoadingCharts] = useState({});
  const [selectedTimeframes, setSelectedTimeframes] = useState({});

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

  // Initialize default timeframes for new cryptos
  useEffect(() => {
    const newTimeframes = {};
    filteredCryptoData.forEach((crypto) => {
      if (!selectedTimeframes[crypto.symbol]) {
        newTimeframes[crypto.symbol] = "ONE_HOUR";
      }
    });
    if (Object.keys(newTimeframes).length > 0) {
      setSelectedTimeframes((prev) => ({ ...prev, ...newTimeframes }));
    }
  }, [filteredCryptoData, selectedTimeframes]);

  // Fetch chart data for crypto cards
  useEffect(() => {
    const fetchChartData = async () => {
      const newChartData = {};
      const newLoadingCharts = {};

      for (const crypto of filteredCryptoData) {
        const timeframe = selectedTimeframes[crypto.symbol] || "ONE_HOUR";
        newLoadingCharts[crypto.symbol] = true;
        try {
          const data = await priceDataService.getPriceHistory(
            crypto.symbol,
            timeframe
          );
          newChartData[crypto.symbol] = data;
        } catch (error) {
          console.error(
            `Error fetching chart data for ${crypto.symbol}:`,
            error
          );
          newChartData[crypto.symbol] = [];
        } finally {
          newLoadingCharts[crypto.symbol] = false;
        }
      }

      setChartData(newChartData);
      setLoadingCharts(newLoadingCharts);
    };

    if (filteredCryptoData.length > 0) {
      fetchChartData();
    }
  }, [filteredCryptoData, selectedTimeframes]);

  // Handle timeframe change for a specific crypto
  const handleTimeframeChange = async (symbol, newTimeframe) => {
    setSelectedTimeframes((prev) => ({ ...prev, [symbol]: newTimeframe }));

    // Fetch new chart data for this crypto
    setLoadingCharts((prev) => ({ ...prev, [symbol]: true }));
    try {
      const data = await priceDataService.getPriceHistory(symbol, newTimeframe);
      setChartData((prev) => ({ ...prev, [symbol]: data }));
    } catch (error) {
      console.error(`Error fetching chart data for ${symbol}:`, error);
      setChartData((prev) => ({ ...prev, [symbol]: [] }));
    } finally {
      setLoadingCharts((prev) => ({ ...prev, [symbol]: false }));
    }
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
                    {loadingCharts[crypto.symbol] ? (
                      <div className="mini-chart-loading">...</div>
                    ) : (
                      <PriceChart
                        data={
                          Array.isArray(chartData[crypto.symbol]) &&
                          chartData[crypto.symbol].length > 0
                            ? chartData[crypto.symbol]
                            : [
                                1, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8,
                                10, 9, 8, 7, 6, 5, 4, 3,
                              ]
                        }
                        color={
                          Array.isArray(chartData[crypto.symbol]) &&
                          chartData[crypto.symbol].length > 0
                            ? priceChange?.direction === "up"
                              ? "#10b981"
                              : "#ef4444"
                            : "#888"
                        }
                        height={40}
                        width={120}
                        isMini={true}
                      />
                    )}
                  </div>

                  {/* Individual Timeframe Selection */}
                  <div className="crypto-timeframe-selector">
                    <div className="timeframe-scroll">
                      <div className="timeframe-selector">
                        {TIMEFRAMES.map((timeframe) => (
                          <button
                            key={timeframe.value}
                            className={`timeframe-option ${
                              selectedTimeframes[crypto.symbol] ===
                              timeframe.value
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleTimeframeChange(
                                crypto.symbol,
                                timeframe.value
                              )
                            }
                          >
                            <span className="timeframe-label">
                              {timeframe.label}
                            </span>
                            <span className="timeframe-payout">
                              {timeframe.payout}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
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
