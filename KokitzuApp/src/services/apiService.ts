import { getApiUrl } from "../config/network";

// 🔥 PURE REST API SERVICE - NO GRAPHQL, NO COINGECKO
export class DecentralizedApiService {
  private baseUrl: string = "";

  async init() {
    // Get the REST API base URL
    this.baseUrl = await getApiUrl();
    console.log(`🔗 API Base URL: ${this.baseUrl}`);
  }

  // 📊 Get all crypto prices from Chainlink
  async getPrices() {
    try {
      console.log("🔍 Fetching all prices from Chainlink...");
      console.log(`🌐 Request URL: ${this.baseUrl}/api/prices`);

      const response = await fetch(`${this.baseUrl}/api/prices`);
      console.log(
        `📡 Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("📦 Raw response:", result);

      // Debug: Check raw data specifically
      if (result.data && Array.isArray(result.data)) {
        const rawEthData = result.data.find(
          (item: any) => item.symbol === "ETH"
        );
        if (rawEthData) {
          console.log("🔍 Raw ETH data from server:", rawEthData);
          console.log(
            "🔍 Raw ETH price:",
            rawEthData.price,
            typeof rawEthData.price
          );
        } else {
          console.warn("⚠️ No ETH in raw server response!");
        }
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch prices");
      }

      console.log(`✅ Received ${result.data.length} prices from Chainlink`);
      const mappedData = result.data.map((item: any) => ({
        id: item.symbol.toLowerCase(),
        symbol: item.symbol,
        name: item.symbol, // We'll use symbol as name for simplicity
        price: item.price,
        lastUpdated: item.lastUpdated,
        source: "Chainlink",
      }));

      console.log("🔄 Mapped data:", mappedData);

      // Debug: Check specifically for ETH data
      const ethData = mappedData.find((item: any) => item.symbol === "ETH");
      if (ethData) {
        console.log("🔍 ETH data specifically:", ethData);
        console.log("🔍 ETH price type:", typeof ethData.price);
        console.log("🔍 ETH price value:", ethData.price);
      } else {
        console.warn("⚠️ No ETH data found in mapped data!");
      }

      return mappedData;
    } catch (error) {
      console.error("❌ Error fetching prices:", error);
      console.error("❌ Error details:", {
        message: (error as any).message,
        baseUrl: this.baseUrl,
        fullUrl: `${this.baseUrl}/api/prices`,
      });
      throw error;
    }
  }

  // 📊 Get specific crypto price
  async getPrice(symbol: string) {
    try {
      console.log(`🔍 Fetching ${symbol} price from Chainlink...`);
      const response = await fetch(`${this.baseUrl}/api/prices/${symbol}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || `Failed to fetch ${symbol} price`);
      }

      console.log(
        `✅ ${symbol}: $${result.data.price.toLocaleString()} (Chainlink)`
      );
      return {
        id: symbol.toLowerCase(),
        symbol: result.data.symbol,
        name: result.data.symbol,
        price: result.data.price,
        lastUpdated: result.data.lastUpdated,
        source: "Chainlink",
      };
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} price:`, error);
      throw error;
    }
  }

  // 🚀 Prepare blockchain transaction
  async prepareTransaction(input: {
    cryptoSymbol: string;
    betType: string;
    amount: number;
    timeframe: string;
    walletAddress: string;
  }) {
    try {
      console.log("🔍 Preparing transaction with Chainlink price...");
      const response = await fetch(`${this.baseUrl}/api/prepare-transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to prepare transaction");
      }

      console.log(
        `✅ Transaction prepared with Chainlink price: $${result.data.entryPrice.toLocaleString()}`
      );
      return {
        success: true,
        transactionData: result.data.transactionData,
        entryPrice: result.data.entryPrice,
        message: result.data.message,
      };
    } catch (error) {
      console.error("❌ Error preparing transaction:", error);
      throw error;
    }
  }

  // 📝 Record blockchain bet
  async recordBet(input: {
    cryptoSymbol: string;
    betType: string;
    amount: number;
    timeframe: string;
    walletAddress: string;
    transactionHash: string;
    entryPrice: number;
  }) {
    try {
      console.log("📝 Recording blockchain bet...");
      const response = await fetch(`${this.baseUrl}/api/record-bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to record bet");
      }

      console.log(`✅ Bet recorded: ${result.data.id}`);
      return result.data;
    } catch (error) {
      console.error("❌ Error recording bet:", error);
      throw error;
    }
  }

  // 📋 Get user bets
  async getUserBets(userId: string) {
    try {
      console.log(`🔍 Fetching bets for user: ${userId}`);
      const response = await fetch(`${this.baseUrl}/api/bets/${userId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch bets");
      }

      console.log(`✅ Retrieved ${result.data.length} bets`);
      return result.data;
    } catch (error) {
      console.error("❌ Error fetching bets:", error);
      throw error;
    }
  }

  // 📋 Get active bets
  async getActiveBets(userId: string) {
    try {
      console.log(`🔍 Fetching active bets for user: ${userId}`);
      const response = await fetch(`${this.baseUrl}/api/bets/${userId}/active`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch active bets");
      }

      console.log(`✅ Retrieved ${result.data.length} active bets`);
      return result.data;
    } catch (error) {
      console.error("❌ Error fetching active bets:", error);
      throw error;
    }
  }

  // 📊 Get contract stats
  async getContractStats() {
    try {
      console.log("🔍 Fetching contract stats...");
      const response = await fetch(`${this.baseUrl}/api/contract/stats`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch contract stats");
      }

      console.log("✅ Contract stats retrieved");
      return result.data;
    } catch (error) {
      console.error("❌ Error fetching contract stats:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const apiService = new DecentralizedApiService();
