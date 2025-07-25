import React, { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../services/apiService";

interface EthPriceContextType {
  ethPrice: number;
  isLoading: boolean;
  error: string | null;
  refreshPrice: () => Promise<void>;
}

const EthPriceContext = createContext<EthPriceContextType | undefined>(
  undefined
);

export const useEthPrice = () => {
  const context = useContext(EthPriceContext);
  if (context === undefined) {
    throw new Error("useEthPrice must be used within an EthPriceProvider");
  }
  return context;
};

interface EthPriceProviderProps {
  children: React.ReactNode;
}

export const EthPriceProvider: React.FC<EthPriceProviderProps> = ({
  children,
}) => {
  const [ethPrice, setEthPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchEthPrice = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(
        "🔍 Fetching ETH price from Chainlink (Arbitrum Sepolia (Testnet))..."
      );
      await apiService.init();
      const prices = await apiService.getPrices();

      const ethData = prices.find((crypto: any) => crypto.symbol === "ETH");

      if (ethData && ethData.price && ethData.price > 0) {
        setEthPrice(ethData.price);
        setLastFetch(Date.now());
        console.log(
          `💰 ETH price updated: $${ethData.price.toLocaleString()} (Chainlink - Arbitrum Sepolia)`
        );
      } else {
        console.warn("⚠️ ETH price not found or invalid in API response");
        setError("Failed to get ETH price");
      }
    } catch (error) {
      console.error("❌ Error fetching ETH price:", error);
      setError("Failed to fetch ETH price");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrice = async () => {
    await fetchEthPrice();
  };

  useEffect(() => {
    fetchEthPrice();

    // Update ETH price every 5 minutes
    const interval = setInterval(fetchEthPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EthPriceContext.Provider
      value={{ ethPrice, isLoading, error, refreshPrice }}
    >
      {children}
    </EthPriceContext.Provider>
  );
};
