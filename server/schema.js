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
    targetPrice: Float!
    status: BetStatus!
    createdAt: String!
    expiresAt: String!
    result: BetResult
    payout: Float
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
  }

  type Mutation {
    placeBet(input: PlaceBetInput!): Bet!
    cancelBet(betId: String!): Boolean!
    updateBetResult(
      betId: String!
      result: BetResult!
      finalPrice: Float!
    ): Bet!
    register(username: String!, password: String!): User!
    login(username: String!, password: String!): AuthPayload!
  }

  type Subscription {
    priceUpdated: CryptoPrice!
    betResultUpdated: Bet!
  }
`;
