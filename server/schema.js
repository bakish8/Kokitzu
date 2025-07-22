import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type CryptoPrice {
    id: String!
    symbol: String!
    name: String!
    price: Float!
    lastUpdated: String!
  }

  type Coin {
    id: String!
    symbol: String!
    name: String!
  }

  type Bet {
    id: String!
    userId: String!
    cryptoSymbol: String!
    betType: BetType!
    amount: Float!
    timeframe: Timeframe!
    entryPrice: Float!
    exitPrice: Float
    targetPrice: Float
    status: BetStatus!
    createdAt: String!
    expiresAt: String!
    result: BetResult
    payout: Float
    isBlockchainBet: Boolean!
    optionId: String
    transactionHash: String
    blockNumber: Int
    walletAddress: String
    blockchain: BlockchainInfo
  }

  type BlockchainInfo {
    optionId: String!
    transactionHash: String!
    blockNumber: Int!
    gasUsed: String
  }

  type BlockchainOption {
    id: String!
    trader: String!
    asset: String!
    amount: String!
    expiry: String!
    isCall: Boolean!
    executed: Boolean!
    entryPrice: String!
    exitPrice: String!
    won: Boolean!
  }

  type ContractStats {
    totalOptions: String!
    contractBalance: String!
  }

  type ExecutionResult {
    success: Boolean!
    transactionHash: String!
    blockNumber: Int!
    gasUsed: String!
  }

  enum BetType {
    UP
    DOWN
  }

  enum Timeframe {
    ONE_MINUTE
    FIVE_MINUTES
    FIFTEEN_MINUTES
    THIRTY_MINUTES
    ONE_HOUR
    FOUR_HOURS
    ONE_DAY
  }

  enum BetStatus {
    ACTIVE
    WON
    LOST
    EXPIRED
  }

  enum BetResult {
    WIN
    LOSS
    DRAW
  }

  type User {
    id: String!
    username: String!
    balance: Float!
    totalBets: Int!
    wins: Int!
    losses: Int!
    winRate: Float!
    walletAddress: String
  }

  type BetStats {
    totalBets: Int!
    wins: Int!
    losses: Int!
    winRate: Float!
    totalWagered: Float!
    totalWon: Float!
    netProfit: Float!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input PlaceBetInput {
    cryptoSymbol: String!
    betType: BetType!
    amount: Float!
    timeframe: Timeframe!
    walletAddress: String
    useBlockchain: Boolean = false
  }

  type Query {
    cryptoPrices: [CryptoPrice!]!
    cryptoPrice(symbol: String!): CryptoPrice
    coins: [Coin!]!
    userBets(userId: String!): [Bet!]!
    userStats(userId: String!): BetStats
    activeBets(userId: String!): [Bet!]!
    betHistory(userId: String!): [Bet!]!
    leaderboard: [User!]!

    # Blockchain-specific queries
    contractStats: ContractStats!
    blockchainBets(walletAddress: String!): [BlockchainOption!]!
  }

  type Mutation {
    placeBet(input: PlaceBetInput!): Bet!
    executeBlockchainOption(optionId: String!): ExecutionResult!
    configureAsset(
      symbol: String!
      priceFeed: String!
      minAmount: Float!
      maxAmount: Float!
      feePercentage: Int!
    ): Boolean!
    cancelBet(betId: String!): Boolean!
    updateBetResult(
      betId: String!
      result: BetResult!
      finalPrice: Float!
    ): Bet!
    register(username: String!, password: String!, walletAddress: String): User!
    login(username: String!, password: String!): AuthPayload!
  }

  type Subscription {
    priceUpdated: CryptoPrice!
    betResultUpdated: Bet!
  }
`;
