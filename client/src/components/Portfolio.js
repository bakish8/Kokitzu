import React, { useState, useEffect } from "react";
import { useEthPrice, formatUsd, ethToUsd } from "../utils/currencyUtils";
import PriceChart from "./PriceChart";
import priceDataService from "../services/priceDataService";

function Portfolio({
  userStats,
  betHistoryLoading,
  betHistoryData,
  getTimeLeft,
  currentPrice,
}) {
  // Get ETH price for USD conversion
  const ethPrice = useEthPrice();

  // Chart state for performance overview
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  // Generate performance data based on bet history
  useEffect(() => {
    const generatePerformanceData = () => {
      if (betHistoryData?.betHistory?.length > 0) {
        const data = betHistoryData.betHistory
          .slice(-20) // Last 20 bets
          .map((bet, index) => {
            const profit = bet.result === "WIN" ? bet.payout : -bet.amount;
            return profit;
          });
        setPerformanceData(data);
      } else {
        // Generate mock data if no bet history
        const mockData = Array.from(
          { length: 20 },
          () => (Math.random() - 0.4) * 100 // Slightly positive bias
        );
        setPerformanceData(mockData);
      }
      setIsLoadingPerformance(false);
    };

    setIsLoadingPerformance(true);
    generatePerformanceData();
  }, [betHistoryData]);
  return (
    <div className="portfolio-container content-fade-in" data-active={true}>
      <div className="portfolio-header">
        <h1>Trading Portfolio</h1>
        <p>Your trading performance and statistics</p>
      </div>

      <div className="portfolio-layout">
        {betHistoryLoading ? (
          <div className="data-loading">Loading statistics...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Total Bets</h3>
                <div className="stat-value">
                  {userStats?.userStats?.totalBets || 0}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Win Rate</h3>
                <div className="stat-value">
                  {(userStats?.userStats?.winRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Total Wagered</h3>
                <div className="stat-value">
                  {formatUsd(
                    ethToUsd(userStats?.userStats?.totalWagered || 0, ethPrice)
                  )}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  <path d="M7 14l3-3 2 2 3-3" />
                </svg>
              </div>
              <div className="stat-content">
                <h3>Net Profit</h3>
                <div
                  className={`stat-value ${
                    (userStats?.userStats?.netProfit || 0) >= 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {formatUsd(
                    ethToUsd(userStats?.userStats?.netProfit || 0, ethPrice)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="performance-chart">
          <div className="chart-header">
            <h3>Performance Overview</h3>
            <div className="chart-filters">
              <button className="filter-btn active">7D</button>
              <button className="filter-btn">30D</button>
              <button className="filter-btn">90D</button>
            </div>
          </div>
          <div className="chart-placeholder">
            {isLoadingPerformance ? (
              <div className="chart-loading">Loading performance data...</div>
            ) : (
              <div className="chart-container">
                <PriceChart
                  data={performanceData}
                  color="#3b82f6"
                  height={200}
                  width={400}
                  isMini={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bet-history-section" style={{ marginTop: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Bet History</h3>
        {betHistoryLoading ? (
          <div className="data-loading">Loading bet history...</div>
        ) : betHistoryData?.betHistory?.length > 0 ? (
          <table className="bet-history-table">
            <thead>
              <tr>
                <th>Crypto</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Timeframe</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Result</th>
                <th>Result Reason</th>
                <th>Payout</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {betHistoryData.betHistory.map((bet) => {
                // Determine win/loss display and color
                let resultDisplay = null;
                if (bet.result === "WIN") {
                  resultDisplay = (
                    <span
                      style={{
                        color: "var(--accent-success)", // green for Win
                        fontWeight: 600,
                      }}
                    >
                      Win
                    </span>
                  );
                } else if (bet.result === "LOSS") {
                  resultDisplay = (
                    <span
                      style={{
                        color: "var(--accent-error)", // red for Loss
                        fontWeight: 600,
                      }}
                    >
                      Loss
                    </span>
                  );
                } else {
                  resultDisplay = bet.result || bet.status;
                }

                // Entry and exit price with proper formatting
                const entryPrice = bet.entryPrice
                  ? `$${Number(bet.entryPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-";

                const exitPrice = bet.exitPrice
                  ? `$${Number(bet.exitPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "-";

                // Result reason with proper price formatting
                let reason = "";
                if (bet.result === "WIN" || bet.result === "LOSS") {
                  const entryFormatted = bet.entryPrice
                    ? Number(bet.entryPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "N/A";

                  const exitFormatted = bet.exitPrice
                    ? Number(bet.exitPrice).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "N/A";

                  if (bet.betType === "UP") {
                    reason = `Price went ${
                      bet.result === "WIN" ? "up" : "down"
                    } from $${entryFormatted} to $${exitFormatted}`;
                  } else if (bet.betType === "DOWN") {
                    reason = `Price went ${
                      bet.result === "WIN" ? "down" : "up"
                    } from $${entryFormatted} to $${exitFormatted}`;
                  }
                }
                return (
                  <tr
                    key={bet.id}
                    className={
                      bet.result === "WIN"
                        ? "win-row"
                        : bet.result === "LOSS"
                        ? "loss-row"
                        : ""
                    }
                  >
                    <td>{bet.cryptoSymbol}</td>
                    <td>{bet.betType}</td>
                    <td>${bet.amount}</td>
                    <td>{bet.timeframe.replace("_", " ")}</td>
                    <td>{entryPrice}</td>
                    <td>{exitPrice}</td>
                    <td>{resultDisplay}</td>
                    <td>{reason}</td>
                    <td>
                      {bet.payout !== null ? `$${bet.payout.toFixed(2)}` : "-"}
                    </td>
                    <td>{new Date(bet.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div>No bet history yet.</div>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
