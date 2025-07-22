interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface CoinGeckoResponse {
  prices: [number, number][];
}

export interface TimeframeConfig {
  days: number;
  interval: string;
  dataPoints: number;
  label: string;
}

class PriceDataService {
  private cache: Map<string, { data: number[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Timeframe configurations
  private readonly TIMEFRAME_CONFIGS: { [key: string]: TimeframeConfig } = {
    "1m": {
      days: 1 / 24,
      interval: "minute",
      dataPoints: 60,
      label: "Last Hour (1m intervals)",
    },
    "5m": {
      days: 1 / 4,
      interval: "5min",
      dataPoints: 12,
      label: "Last Hour (5m intervals)",
    },
    "15m": {
      days: 1 / 4,
      interval: "15min",
      dataPoints: 4,
      label: "Last Hour (15m intervals)",
    },
    "30m": {
      days: 1 / 2,
      interval: "30min",
      dataPoints: 2,
      label: "Last Hour (30m intervals)",
    },
    "1h": {
      days: 1,
      interval: "hour",
      dataPoints: 24,
      label: "Last 24 Hours (1h intervals)",
    },
    "4h": {
      days: 4,
      interval: "4hour",
      dataPoints: 6,
      label: "Last 24 Hours (4h intervals)",
    },
    "1d": {
      days: 7,
      interval: "day",
      dataPoints: 7,
      label: "Last 7 Days (1d intervals)",
    },
    "1w": {
      days: 30,
      interval: "week",
      dataPoints: 4,
      label: "Last 30 Days (1w intervals)",
    },
  };

  private getCoinId(symbol: string): string {
    const coinMap: { [key: string]: string } = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      ADA: "cardano",
      DOT: "polkadot",
      LINK: "chainlink",
      UNI: "uniswap",
      MATIC: "matic-network",
      AVAX: "avalanche-2",
      ATOM: "cosmos",
    };
    return coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  async getPriceHistory(
    symbol: string,
    timeframe: string = "1h"
  ): Promise<number[]> {
    // Map timeframe constants to service keys
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
    const config =
      this.TIMEFRAME_CONFIGS[serviceKey] || this.TIMEFRAME_CONFIGS["1h"];
    const cacheKey = `${symbol}-${serviceKey}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached!.data;
    }

    try {
      const coinId = this.getCoinId(symbol);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();

      // Extract prices
      const prices = data.prices.map(([timestamp, price]) => price);

      // Sample data points based on timeframe configuration
      const step = Math.max(1, Math.floor(prices.length / config.dataPoints));
      const chartData = prices
        .filter((_, index) => index % step === 0)
        .slice(0, config.dataPoints);

      // Cache the result
      this.cache.set(cacheKey, {
        data: chartData,
        timestamp: Date.now(),
      });

      return chartData;
    } catch (error) {
      console.error("Error fetching price history:", error);

      // Return mock data if API fails
      return this.generateMockData(symbol, timeframe);
    }
  }

  getTimeframeConfig(timeframe: string): TimeframeConfig {
    return this.TIMEFRAME_CONFIGS[timeframe] || this.TIMEFRAME_CONFIGS["1h"];
  }

  getTimeframeLabel(timeframe: string): string {
    // Map timeframe constants to service keys
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

  private generateMockData(symbol: string, timeframe: string): number[] {
    // Generate realistic mock data based on current price
    const basePrice = this.getBasePrice(symbol);

    // Map timeframe constants to service keys
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
    const data: number[] = [];

    for (let i = 0; i < config.dataPoints; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const price = basePrice * (1 + variation);
      data.push(price);
    }

    return data;
  }

  private getBasePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      BTC: 45000,
      ETH: 3000,
      SOL: 100,
      ADA: 0.5,
      DOT: 7,
      LINK: 15,
      UNI: 8,
      MATIC: 1,
      AVAX: 25,
      ATOM: 10,
    };
    return basePrices[symbol.toUpperCase()] || 100;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const priceDataService = new PriceDataService();
export default priceDataService;
