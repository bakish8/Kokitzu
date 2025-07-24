import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

// Global cache for ETH price to prevent multiple API calls
let ethPriceCache = {
  price: 0,
  lastUpdated: 0,
  isFetching: false,
};

// Hook to get ETH price for conversion from Chainlink (treats Sepolia ETH as regular ETH)
export const useEthPrice = () => {
  const [ethPrice, setEthPrice] = useState(0);

  useEffect(() => {
    const fetchEthPrice = async () => {
      // Prevent multiple simultaneous requests
      if (ethPriceCache.isFetching) {
        console.log("⏳ ETH price fetch already in progress, skipping...");
        return;
      }

      // Use cached price if it's less than 5 minutes old
      const now = Date.now();
      const cacheAge = now - ethPriceCache.lastUpdated;
      if (ethPriceCache.price > 0 && cacheAge < 300000) {
        // 5 minutes
        console.log(
          `💰 Using cached ETH price: $${ethPriceCache.price.toLocaleString()} (age: ${Math.round(
            cacheAge / 1000
          )}s)`
        );
        setEthPrice(ethPriceCache.price);
        return;
      }

      try {
        ethPriceCache.isFetching = true;
        console.log("🔍 Fetching ETH price from Chainlink REST API...");
        await apiService.init();
        const prices = await apiService.getPrices();
        console.log(`📊 Received ${prices.length} prices from API`);

        const ethData = prices.find((crypto: any) => crypto.symbol === "ETH");

        if (ethData && ethData.price && ethData.price > 0) {
          ethPriceCache.price = ethData.price;
          ethPriceCache.lastUpdated = now;
          setEthPrice(ethData.price);
          console.log(
            `💰 ETH price updated: $${ethData.price.toLocaleString()} (Chainlink)`
          );
        } else {
          console.warn("⚠️ ETH price not found or invalid in API response");
          console.warn("ETH data received:", ethData);
          console.log(
            "Available symbols:",
            prices.map((p: any) => p.symbol)
          );
          console.warn("Setting ETH price to 0 to prevent crashes");
          setEthPrice(0);
        }
      } catch (error) {
        console.error("❌ Error fetching ETH price for USD conversion:", error);
        console.error("❌ This will cause $0 to show in wallet balance");

        // If we have a cached price, use it as fallback
        if (ethPriceCache.price > 0) {
          console.log(
            `🔄 Using cached ETH price as fallback: $${ethPriceCache.price.toLocaleString()}`
          );
          setEthPrice(ethPriceCache.price);
        }
      } finally {
        ethPriceCache.isFetching = false;
      }
    };

    fetchEthPrice();

    // Update ETH price every 5 minutes (increased from 2 minutes to reduce API calls)
    const interval = setInterval(fetchEthPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  return ethPrice;
};

// Convert ETH to USD (Sepolia ETH treated as regular ETH)
export const ethToUsd = (ethAmount: number, ethPrice: number): number => {
  if (!ethPrice || ethPrice <= 0) {
    console.warn(
      `⚠️ Invalid ETH price for conversion: ${ethPrice}, returning 0`
    );
    return 0;
  }

  const usdValue = ethAmount * ethPrice;
  // console.log(
  //   `💱 ETH→USD: Ξ ${ethAmount.toFixed(
  //     4
  //   )} × $${ethPrice.toLocaleString()} = $${usdValue.toLocaleString()}`
  // );
  return usdValue;
};

// Convert USD to ETH (Sepolia ETH treated as regular ETH)
export const usdToEth = (usdAmount: number, ethPrice: number): number => {
  return ethPrice > 0 ? usdAmount / ethPrice : 0;
};

// Format USD amount
export const formatUsd = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format ETH amount
export const formatEth = (amount: number): string => {
  return `${amount.toFixed(4)} ETH`;
};

// Format combined ETH and USD display
export const formatEthWithUsd = (
  ethAmount: number,
  ethPrice: number,
  showEthSymbol: boolean = true
): string => {
  const usdAmount = ethToUsd(ethAmount, ethPrice);
  const ethSymbol = showEthSymbol ? "Ξ " : "";
  const result = `${ethSymbol}${ethAmount.toFixed(4)} (${formatUsd(
    usdAmount
  )})`;
  // console.log(`📱 Wallet Display: ${result}`);
  return result;
};

// Format USD with ETH equivalent
export const formatUsdWithEth = (
  usdAmount: number,
  ethPrice: number
): string => {
  const ethAmount = usdToEth(usdAmount, ethPrice);
  return `${formatUsd(usdAmount)} (Ξ ${ethAmount.toFixed(4)})`;
};
