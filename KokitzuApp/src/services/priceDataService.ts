interface PriceDataPoint {
  timestamp: number;
  price: number;
}

interface CoinGeckoResponse {
  prices: [number, number][];
}

class PriceDataService {
  private cache: Map<string, { data: number[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

  async getPriceHistory(symbol: string, days: number = 1): Promise<number[]> {
    const cacheKey = `${symbol}-${days}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached!.data;
    }

    try {
      const coinId = this.getCoinId(symbol);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();

      // Extract prices and normalize to hourly data points for 24h
      const prices = data.prices.map(([timestamp, price]) => price);

      // For mini charts, take every 4th point to get ~24 data points
      const step = Math.max(1, Math.floor(prices.length / 24));
      const chartData = prices
        .filter((_, index) => index % step === 0)
        .slice(0, 24);

      // Cache the result
      this.cache.set(cacheKey, {
        data: chartData,
        timestamp: Date.now(),
      });

      return chartData;
    } catch (error) {
      console.error("Error fetching price history:", error);

      // Return mock data if API fails
      return this.generateMockData(symbol, days);
    }
  }

  private generateMockData(symbol: string, days: number): number[] {
    // Generate realistic mock data based on current price
    const basePrice = this.getBasePrice(symbol);
    const dataPoints = days === 1 ? 24 : 7;
    const data: number[] = [];

    for (let i = 0; i < dataPoints; i++) {
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
