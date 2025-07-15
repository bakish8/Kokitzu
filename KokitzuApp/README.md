# 🚀 KokitzuApp - Crypto Binary Options Trading

A React Native (Expo) cryptocurrency binary options trading app with real wallet connections.

## ✨ Features

- **Real Wallet Connections**: Connect with MetaMask and WalletConnect (no mock wallets)
- **Live Crypto Prices**: Real-time cryptocurrency prices from CoinGecko API
- **Binary Options Trading**: Bet on price direction (UP/DOWN) with multiple timeframes
- **Real Wallet Integration**: Sign messages and send transactions with actual wallets
- **Modern UI**: Futuristic design with glassmorphism and smooth animations
- **GraphQL API**: Modern GraphQL server with Apollo Server
- **Responsive Design**: Beautiful interface optimized for mobile devices

## 🔐 Wallet Integration

### Supported Wallets

- **MetaMask**: Direct connection via WalletConnect
- **WalletConnect**: QR code connection for any WalletConnect-compatible wallet

### Real Wallet Features

- ✅ Real wallet addresses (no mock addresses)
- ✅ Real ETH balance from Infura
- ✅ Real message signing
- ✅ Real transaction sending
- ✅ Session management and persistence
- ✅ Automatic reconnection

### API Keys Required

1. **Infura Project ID**: Get from [https://infura.io/](https://infura.io/)
2. **WalletConnect Project ID**: Get from [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)

Update these in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  INFURA_PROJECT_ID: "your_infura_project_id",
  WALLETCONNECT_PROJECT_ID: "your_walletconnect_project_id",
  // ...
};
```

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Expo CLI
- MetaMask mobile app or WalletConnect-compatible wallet

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd KokitzuApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API keys**

   - Edit `src/config/api.ts`
   - Add your Infura and WalletConnect project IDs

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Run on device/simulator**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

## 📱 Testing Real Wallet Connections

### MetaMask Connection

1. **Install MetaMask mobile app** on your device
2. **Open KokitzuApp** and tap "Connect Wallet"
3. **Select MetaMask** from the options
4. **Approve connection** in MetaMask
5. **Verify real address and balance** are displayed

### WalletConnect Connection

1. **Open KokitzuApp** and tap "Connect Wallet"
2. **Select WalletConnect** from the options
3. **Scan QR code** with any WalletConnect-compatible wallet
4. **Approve connection** in your wallet
5. **Verify real address and balance** are displayed

### Testing Real Transactions

1. **Connect a wallet** with some test ETH
2. **Try signing a message** (if implemented in UI)
3. **Try sending a transaction** (if implemented in UI)
4. **Verify transactions** appear in your wallet history

## 🏗️ Architecture

```
KokitzuApp/
├── src/
│   ├── components/          # React Native components
│   ├── contexts/           # React contexts (WalletContext)
│   ├── services/           # Wallet connection services
│   ├── config/             # API configuration
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── server/                 # GraphQL backend
└── package.json
```

## 🔧 Wallet Service Architecture

### Real Wallet Implementation

- **WalletConnect v2**: Uses `@walletconnect/sign-client`
- **Infura Integration**: Real balance fetching
- **Session Management**: Persistent wallet connections
- **Error Handling**: Proper error handling for real wallet operations

### Key Files

- `src/services/walletconnect.ts`: Real wallet connection logic
- `src/contexts/WalletContext.tsx`: Wallet state management
- `src/components/WalletConnectButton.tsx`: UI for wallet connections
- `src/config/api.ts`: API key configuration

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

## 🔍 Troubleshooting

### Wallet Connection Issues

1. **"API Keys not configured"**

   - Check `src/config/api.ts`
   - Ensure Infura and WalletConnect project IDs are set

2. **"MetaMask not found"**

   - Install MetaMask mobile app
   - Ensure app is up to date

3. **"Connection failed"**

   - Check internet connection
   - Verify API keys are valid
   - Try reconnecting

4. **"Balance fetch failed"**
   - Check Infura project ID
   - Verify wallet has transactions on mainnet

### Network Issues

1. **GraphQL connection errors**

   - Ensure server is running
   - Check network configuration

2. **Price data not loading**
   - Check CoinGecko API status
   - Verify internet connection

## 🚀 Deployment

### Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
expo build:web
```

### Environment Variables

- `EXPO_PUBLIC_INFURA_PROJECT_ID`: Infura project ID
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID

## ⚠️ Security Notes

- **Real Wallets**: This app connects to real wallets with real funds
- **Test First**: Always test with small amounts first
- **Secure Keys**: Keep your API keys secure and never commit them to version control
- **Backup**: Always backup your wallet seed phrases

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with real wallets
5. Submit a pull request

---

**Experience real crypto trading with KokitzuApp! 🚀**

_Remember: This app connects to real wallets with real funds. Always trade responsibly and never risk more than you can afford to lose._
