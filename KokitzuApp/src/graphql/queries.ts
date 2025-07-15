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
    }
  }
`;

export const REGISTER = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      id
      username
      balance
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        balance
      }
    }
  }
`;
