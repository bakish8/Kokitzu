# 🚀 Kokitzu - Crypto Binary Options Trading

A sleek, futuristic cryptocurrency binary options trading platform built with **GraphQL** and **React**. Kokitzu allows users to bet on Bitcoin and Ethereum price movements within specific timeframes, combining real-time market data with an elegant trading interface.

## ✨ Features

- **Real-time Data**: Live cryptocurrency prices for Bitcoin (BTC) and Ethereum (ETH)
- **Binary Options Trading**: Bet on price direction (UP/DOWN) with multiple timeframes
- **Multiple Timeframes**: 1 minute to 1 day with varying payout multipliers
- **Modern UI**: Futuristic design with glassmorphism, dark/light mode, and smooth animations
- **GraphQL API**: Modern GraphQL server with Apollo Server
- **Responsive Design**: Beautiful interface that works on all devices
- **Auto-refresh**: Prices update automatically every 30 seconds
- **Portfolio Tracking**: Real-time statistics and bet history
- **Interactive Elements**: Hover effects, loading states, and smooth transitions

## 🎨 Design Philosophy

Kokitzu embodies a **Tesla meets crypto** aesthetic with:

- **Minimalistic yet futuristic** design language
- **Dark mode default** with soft glowing elements
- **Glassmorphism cards** with backdrop blur effects
- **Neon cyan/purple accents** for a modern tech feel
- **Sleek typography** using Inter and Space Grotesk fonts

## 🏗️ Architecture

```
Kokitzu/
├── server/          # GraphQL backend
│   ├── index.js     # Express + Apollo Server setup
│   ├── schema.js    # GraphQL schema with betting types
│   └── resolvers.js # GraphQL resolvers with betting logic
├── client/          # React frontend
│   ├── src/
│   │   ├── App.js   # Main React component with betting UI
│   │   ├── App.css  # Modern design system with CSS variables
│   │   └── index.js # React entry point
│   └── public/
└── package.json     # Root package with scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

   ```bash
   cd CryptoGraphQL
   ```

2. **Install all dependencies** (root, server, and client)

   ```bash
   npm run install-all
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

This will start both the GraphQL server and React client simultaneously.

## 📡 Available Endpoints

- **Kokitzu Trading Platform**: http://localhost:3000
- **GraphQL API**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/health
- **GraphQL Playground**: http://localhost:4000/graphql

## 🎯 Trading Features

### Binary Options Trading

- **Bet Direction**: Choose UP or DOWN for price movement
- **Timeframes**: 1 min, 5 min, 15 min, 30 min, 1 hour, 4 hours, 1 day
- **Payout Multipliers**: 1.8x to 3.0x based on timeframe
- **Real-time Settlement**: Automatic bet resolution at expiry

### Available Timeframes & Payouts

| Timeframe  | Duration | Payout Multiplier |
| ---------- | -------- | ----------------- |
| 1 Minute   | 60s      | 1.8x              |
| 5 Minutes  | 5m       | 1.9x              |
| 15 Minutes | 15m      | 2.0x              |
| 30 Minutes | 30m      | 2.1x              |
| 1 Hour     | 1h       | 2.2x              |
| 4 Hours    | 4h       | 2.5x              |
| 1 Day      | 24h      | 3.0x              |

## 🔍 GraphQL Queries & Mutations

### Get cryptocurrency prices:

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

### Place a bet:

```graphql
mutation {
  placeBet(
    input: {
      cryptoSymbol: "BTC"
      betType: UP
      amount: 100
      timeframe: FIVE_MINUTES
    }
  ) {
    id
    cryptoSymbol
    betType
    amount
    timeframe
    entryPrice
    status
  }
}
```

### Get user statistics:

```graphql
query {
  userStats(userId: "user-1") {
    totalBets
    wins
    losses
    winRate
    totalWagered
    totalWon
    netProfit
  }
}
```

### Get active bets:

```graphql
query {
  activeBets(userId: "user-1") {
    id
    cryptoSymbol
    betType
    amount
    timeframe
    entryPrice
    status
    expiresAt
  }
}
```

## 🛠️ Development Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start both server and client in development mode |
| `npm run server`      | Start only the GraphQL server                    |
| `npm run client`      | Start only the React client                      |
| `npm run install-all` | Install dependencies for all packages            |
| `npm run build`       | Build the React client for production            |

## 🎨 Design System

### Color Palette

- **Primary**: Deep navy (#0a0a0f) with cool gray accents
- **Accents**: Neon cyan (#00d4ff) and purple (#7c3aed)
- **Success**: Emerald green (#10b981)
- **Error**: Red (#ef4444)

### Typography

- **Primary Font**: Inter (clean, modern)
- **Display Font**: Space Grotesk (futuristic headings)

### Components

- **Glassmorphism Cards**: Semi-transparent with backdrop blur
- **Glowing Elements**: Subtle neon effects for interactive elements
- **Smooth Animations**: 300ms transitions for all interactions

## 🔧 Manual Setup (Alternative)

If you prefer to run components separately:

### Backend (GraphQL Server)

```bash
cd server
npm install
npm run dev
```

### Frontend (React Client)

```bash
cd client
npm install
npm start
```

## 📊 Data Source

The application fetches real-time cryptocurrency data from the **CoinGecko API**:

- **Bitcoin (BTC)**: Current price in USD
- **Ethereum (ETH)**: Current price in USD
- **Update Frequency**: Every 30 seconds
- **API Endpoint**: `https://api.coingecko.com/api/v3/simple/price`

## 🎯 UI Features

- **Three Main Tabs**: Live Prices, Binary Options Trading, Portfolio
- **Real-time Price Updates**: Automatic refresh with visual indicators
- **Interactive Betting Interface**: Easy bet placement with confirmation modals
- **Portfolio Statistics**: Win rate, total bets, profit/loss tracking
- **Active Bets Display**: Real-time status of ongoing bets
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Loading States**: Elegant loading animations and error handling
- **Status Indicators**: Live connection status and API health

## 💰 Trading Mechanics

### How Binary Options Work

1. **Select Cryptocurrency**: Choose BTC or ETH
2. **Choose Direction**: Bet on UP or DOWN price movement
3. **Select Timeframe**: Pick from 1 minute to 1 day
4. **Set Amount**: Enter your bet amount (min $10, max $10,000)
5. **Place Bet**: Confirm and wait for expiry
6. **Automatic Settlement**: Win or lose based on price movement

### Bet Resolution

- **WIN**: Price moved in your predicted direction
- **LOSS**: Price moved against your prediction
- **Payout**: Win amount = Bet amount × Payout multiplier

## 🔒 Environment Variables

The server supports the following environment variables:

- `PORT`: Server port (default: 4000)

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**

   - Kill existing processes: `lsof -ti:3000 | xargs kill -9`
   - Or change ports in the respective package.json files

2. **GraphQL connection errors**

   - Ensure the server is running on port 4000
   - Check CORS settings in server/index.js

3. **API rate limiting**

   - The CoinGecko API has rate limits
   - The app includes error handling for API failures

4. **Bet placement errors**
   - Ensure sufficient balance
   - Check that cryptocurrency is supported (BTC/ETH)

### Health Check

Test if the server is running:

```bash
curl http://localhost:4000/health
```

Test GraphQL endpoint:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ cryptoPrices { symbol price } }"}' \
  http://localhost:4000/graphql
```

## 🚀 Performance Features

- **CSS Variables**: Efficient theming system
- **Optimized Animations**: Hardware-accelerated transitions
- **Responsive Images**: Optimized for all screen sizes
- **Lazy Loading**: Efficient data fetching with Apollo Client
- **Real-time Updates**: WebSocket-like polling for live data

## ⚠️ Disclaimer

This is a **demo application** for educational purposes. The betting functionality is simulated and does not involve real money. In a production environment, you would need to:

- Implement proper user authentication
- Add real payment processing
- Include regulatory compliance
- Add proper security measures
- Implement real-time price feeds
- Add proper error handling and validation

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Experience the future of crypto trading with Kokitzu! 🚀**
