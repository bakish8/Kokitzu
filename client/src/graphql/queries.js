import { gql } from "@apollo/client";

export const GET_CRYPTO_PRICES = gql`
  query GetCryptoPrices {
    cryptoPrices {
      id
      symbol
      name
      price
      lastUpdated
    }
  }
`;

export const GET_COINS = gql`
  query GetCoins {
    coins {
      id
      symbol
      name
    }
  }
`;

export const GET_USER_STATS = gql`
  query GetUserStats($userId: String!) {
    userStats(userId: $userId) {
      totalBets
      wins
      losses
      winRate
      totalWagered
      totalWon
      netProfit
    }
  }
`;

export const GET_ACTIVE_BETS = gql`
  query GetActiveBets($userId: String!) {
    activeBets(userId: $userId) {
      id
      cryptoSymbol
      betType
      amount
      timeframe
      entryPrice
      exitPrice
      status
      createdAt
      expiresAt
      result
      payout
    }
  }
`;

export const GET_BET_HISTORY = gql`
  query GetBetHistory($userId: String!) {
    betHistory(userId: $userId) {
      id
      cryptoSymbol
      betType
      amount
      timeframe
      entryPrice
      exitPrice
      status
      createdAt
      expiresAt
      result
      payout
    }
  }
`;

export const PLACE_BET = gql`
  mutation PlaceBet($input: PlaceBetInput!) {
    placeBet(input: $input) {
      id
      cryptoSymbol
      betType
      amount
      timeframe
      entryPrice
      status
      createdAt
      expiresAt
      isBlockchainBet
      optionId
      transactionHash
      walletAddress
      blockchain {
        optionId
        transactionHash
        blockNumber
        gasUsed
      }
    }
  }
`;

export const RECORD_BLOCKCHAIN_BET = gql`
  mutation RecordBlockchainBet($input: BlockchainBetInput!) {
    recordBlockchainBet(input: $input) {
      id
      cryptoSymbol
      betType
      amount
      timeframe
      entryPrice
      status
      createdAt
      expiresAt
      isBlockchainBet
      optionId
      transactionHash
      blockNumber
      walletAddress
      blockchain {
        optionId
        transactionHash
        blockNumber
        gasUsed
      }
    }
  }
`;
