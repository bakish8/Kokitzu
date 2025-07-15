# CryptoGraphQL Server

A GraphQL server that provides real-time cryptocurrency prices for Bitcoin (BTC) and Ethereum (ETH).

## Features

- Real-time crypto price fetching from CoinGecko API
- GraphQL API with Apollo Server
- Automatic price updates every 30 seconds
- Health check endpoint
- CORS enabled for frontend integration

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

## API Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`
- **GraphQL Playground**: `http://localhost:4000/graphql`

## GraphQL Queries

### Get all crypto prices:

```graphql
query {
  cryptoPrices {
    id
    symbol
    name
    price
    lastUpdated
  }
}
```

### Get specific crypto price:

```graphql
query {
  cryptoPrice(symbol: "BTC") {
    id
    symbol
    name
    price
    lastUpdated
  }
}
```

## Environment Variables

- `PORT`: Server port (default: 4000)
