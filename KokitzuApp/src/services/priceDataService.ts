import { apiService } from "./apiService";

export interface TimeframeConfig {
  days: number;
  interval: string;
  dataPoints: number;
  label: string;
}

// 🔥 PURE CHAINLINK PRICE SERVICE - NO COINGECKO
class PriceDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 120 * 1000; // 2 minutes cache
  private isInitialized = false;

  // Supported assets (only those with Chainlink feeds on Sepolia)
  private readonly SUPPORTED_ASSETS = {
    sepolia: ["ETH", "BTC", "LINK"], // Only Sepolia testnet feeds
    mainnet: ["ETH", "BTC", "LINK"], // Could add more for mainnet
  };

  // Timeframe configurations (simplified for Chainlink)
  private readonly TIMEFRAME_CONFIGS: { [key: string]: TimeframeConfig } = {
    "1m": {
      days: 1 / 24,
      interval: "minute",
      dataPoints: 60,
      label: "Real-time (Chainlink)",
    },
    "5m": {
      days: 1 / 4,
      interval: "5min",
      dataPoints: 12,
      label: "Real-time (Chainlink)",
    },
    "15m": {
      days: 1 / 4,
      interval: "15min",
      dataPoints: 4,
      label: "Real-time (Chainlink)",
    },
    "30m": {
      days: 1 / 2,
      interval: "30min",
      dataPoints: 2,
      label: "Real-time (Chainlink)",
    },
    "1h": {
      days: 1,
      interval: "hour",
      dataPoints: 24,
      label: "Real-time (Chainlink)",
    },
    "4h": {
      days: 4,
      interval: "4hour",
      dataPoints: 24,
      label: "Real-time (Chainlink)",
    },
    "1d": {
      days: 30,
      interval: "day",
      dataPoints: 30,
      label: "Real-time (Chainlink)",
    },
  };

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("🔗 Initializing Chainlink price service...");
      await apiService.init();
      this.isInitialized = true;
      console.log("✅ PriceDataService initialized (Chainlink only)");
    } catch (error) {
      console.error("❌ Failed to initialize PriceDataService:", error);
      throw error;
    }
  }

  // Get supported assets for the current network
  getSupportedAssets(network: "sepolia" | "mainnet" = "sepolia"): string[] {
    // console.log(
    //   `📋 Supported assets on ${network}:`,
    //   this.SUPPORTED_ASSETS[network]
    // );
    return this.SUPPORTED_ASSETS[network];
  }

  // Get all crypto prices from Chainlink
  async getAllPrices() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = "all_prices";
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("📦 Using cached prices");
      return cached.data;
    }

    try {
      console.log("🔍 Fetching all crypto prices from Chainlink...");
      const prices = await apiService.getPrices();

      // Cache the result
      this.cache.set(cacheKey, {
        data: prices,
        timestamp: Date.now(),
      });

      console.log(`✅ Retrieved ${prices.length} crypto prices from Chainlink`);
      return prices;
    } catch (error) {
      console.error("❌ Error fetching crypto prices:", error);

      // Return cached data if available, even if expired
      if (cached) {
        console.log("⚠️ Using expired cached data due to error");
        return cached.data;
      }

      throw error;
    }
  }

  // Get specific crypto price from Chainlink
  async getPrice(symbol: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = `price_${symbol}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Using cached ${symbol} price`);
      return cached.data;
    }

    try {
      console.log(`🔍 Fetching ${symbol} price from Chainlink...`);
      const price = await apiService.getPrice(symbol);

      // Cache the result
      this.cache.set(cacheKey, {
        data: price,
        timestamp: Date.now(),
      });

      console.log(`✅ ${symbol}: $${price.price.toLocaleString()} (Chainlink)`);
      return price;
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} price:`, error);

      // Return cached data if available, even if expired
      if (cached) {
        console.log(`⚠️ Using expired cached ${symbol} data due to error`);
        return cached.data;
      }

      throw error;
    }
  }

  // Get price chart data (simplified for Chainlink - returns current price as flat line)
  async getPriceData(
    coinId: string,
    timeframe: string = "1h"
  ): Promise<number[]> {
    console.log(`📊 Getting price chart for ${coinId} (${timeframe})`);

    try {
      // For Chainlink, we can only get current price, so we'll create a flat line
      const currentPrice = await this.getPrice(coinId.toUpperCase());
      const config = this.TIMEFRAME_CONFIGS[timeframe];

      if (!config) {
        throw new Error(`Unsupported timeframe: ${timeframe}`);
      }

      // Create array of current price repeated for chart points
      const priceArray = new Array(config.dataPoints).fill(currentPrice.price);

      console.log(
        `✅ Generated ${priceArray.length} data points for ${coinId}`
      );
      return priceArray;
    } catch (error) {
      console.error(`❌ Error getting price data for ${coinId}:`, error);
      throw error;
    }
  }

  // Get timeframe configurations
  getTimeframeConfigs(): { [key: string]: TimeframeConfig } {
    return this.TIMEFRAME_CONFIGS;
  }

  // Clear cache
  clearCache(): void {
    console.log("🧹 Clearing price cache");
    this.cache.clear();
  }

  // Get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // 🔧 LEGACY COMPATIBILITY: getPriceHistory (maps to getPriceData)
  async getPriceHistory(
    symbol: string,
    timeframe: string = "1h"
  ): Promise<number[]> {
    console.log(
      `📊 Legacy getPriceHistory called for ${symbol} (${timeframe})`
    );

    // Map old timeframe constants to new ones
    const timeframeMap: { [key: string]: string } = {
      ONE_MINUTE: "1m",
      FIVE_MINUTES: "5m",
      FIFTEEN_MINUTES: "15m",
      THIRTY_MINUTES: "30m",
      ONE_HOUR: "1h",
      FOUR_HOURS: "4h",
      ONE_DAY: "1d",
    };

    const mappedTimeframe = timeframeMap[timeframe] || timeframe;
    return this.getPriceData(symbol, mappedTimeframe);
  }

  // 🔧 LEGACY COMPATIBILITY: getTimeframeConfig
  getTimeframeConfig(timeframe: string): TimeframeConfig {
    return this.TIMEFRAME_CONFIGS[timeframe] || this.TIMEFRAME_CONFIGS["1h"];
  }

  // 🔧 LEGACY COMPATIBILITY: getTimeframeLabel
  getTimeframeLabel(timeframe: string): string {
    const timeframeMap: { [key: string]: string } = {
      ONE_MINUTE: "1m",
      FIVE_MINUTES: "5m",
      FIFTEEN_MINUTES: "15m",
      THIRTY_MINUTES: "30m",
      ONE_HOUR: "1h",
      FOUR_HOURS: "4h",
      ONE_DAY: "1d",
    };

    const serviceKey = timeframeMap[timeframe] || timeframe;
    const config = this.getTimeframeConfig(serviceKey);
    return config.label;
  }
}

// Export singleton instance
export const priceDataService = new PriceDataService();
export default priceDataService;

// 🔧 EXPORT LEGACY FUNCTIONS FOR COMPATIBILITY
export function getSupportedAssets(network: string = "sepolia"): string[] {
  return priceDataService.getSupportedAssets(network as "sepolia" | "mainnet");
}

// Supported assets per network (for backward compatibility)
export const SUPPORTED_ASSETS: { [network: string]: string[] } = {
  mainnet: ["ETH", "BTC", "LINK"],
  sepolia: ["ETH", "BTC", "LINK"], // Only these assets have Chainlink feeds on Sepolia
};
