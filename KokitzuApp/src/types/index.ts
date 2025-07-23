export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  lastUpdated: string;
  priceChange?: number;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
}

export interface UserStats {
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
}

export interface Bet {
  id: string;
  cryptoSymbol: string;
  betType: "UP" | "DOWN";
  amount: number;
  timeframe: string;
  entryPrice: number;
  exitPrice?: number;
  status: "ACTIVE" | "WON" | "LOST" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  expiresAt: string;
  result?: "WIN" | "LOSS";
  payout?: number;
  // Blockchain-specific fields
  isBlockchainBet?: boolean;
  optionId?: string;
  transactionHash?: string;
  blockNumber?: number;
  walletAddress?: string;
  blockchain?: {
    optionId: string;
    transactionHash: string;
    blockNumber: number;
    gasUsed: string;
  };
}

export interface User {
  id: string;
  username: string;
  balance: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Timeframe {
  value: string;
  label: string;
  payout: string;
}

export interface PriceChange {
  direction: "up" | "down";
  percentage: string;
}

export interface PlaceBetInput {
  cryptoSymbol: string;
  betType: "UP" | "DOWN";
  amount: number;
  timeframe: string;
}
