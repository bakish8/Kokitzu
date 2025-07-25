# KokitzuApp - Crypto Binary Options Trading

A modern React Native app for crypto binary options trading with WalletConnect v2 integration.

## Features

- **Modern WalletConnect v2 Integration**: Clean, reliable wallet connections with proper disconnect handling
- **Single Signature Trading**: Connect once, trade multiple times without repeated signatures using allowance system
- **Real-time Price Data**: Live crypto price feeds with interactive charts
- **Binary Options Trading**: Place CALL/PUT options on various cryptocurrencies
- **Multi-Network Support**: Arbitrum One and Arbitrum Sepolia networks
- **Portfolio Tracking**: Monitor your active bets and trading history

## Installation

```bash
npm install
# or
yarn install
```

## Configuration

1. **WalletConnect Project ID**: Update `App.tsx` with your WalletConnect Project ID
2. **API Keys**: Configure required API keys in your `.env` file:
   - `WALLETCONNECT_PROJECT_ID`
   - `INFURA_PROJECT_ID`
   - Other service API keys

## Running the App

### Development

```bash
# Start the Expo development server
npm start
# or
yarn start

# For iOS
npm run ios
# or
yarn ios

# For Android
npm run android
# or
yarn android
```

### Deployment

#### iOS Deployment

1. Build using Expo EAS Build
2. Submit to App Store Connect
3. Configure provisioning profiles and certificates

#### Android Deployment

1. Build APK/AAB using Expo EAS Build
2. Upload to Google Play Console
3. Configure signing keys and release management

## WalletConnect Integration

### Modern Connection Flow

1. **Connect**: Tap "Connect Wallet" to open WalletConnect modal
2. **Scan QR**: Use your wallet app to scan the QR code
3. **Approve**: Confirm connection in your wallet

### Single Signature Trading

The app implements an allowance-based trading system for seamless trading:

1. **Initial Setup** (One-time signature):

   ```typescript
   // Set allowance for trading (requires user signature)
   await binaryOptionsContract.setAllowance("0.1"); // 0.1 ETH allowance
   ```

2. **Subsequent Trades** (No signature required):

   ```typescript
   // Trade using allowance (no signature needed)
   await binaryOptionsContract.createOptionWithAllowance(
     "BTC", // asset
     "0.01", // amount in ETH
     50000, // strike price
     300, // expiry in seconds
     true // isCall (true for UP, false for DOWN)
   );
   ```

3. **Withdraw Unused Allowance**:
   ```typescript
   await binaryOptionsContract.withdrawAllowance("0.05"); // Withdraw 0.05 ETH
   ```

### Proper Disconnection

The app ensures complete cleanup on disconnect:

- Clears all WalletConnect sessions
- Removes stored connection data
- Resets contract instances
- Clears both web localStorage and React Native AsyncStorage

## Trading Features

### Binary Options

- **Asset Selection**: Choose from supported cryptocurrencies
- **Direction**: CALL (price goes up) or PUT (price goes down)
- **Amount**: Set your bet amount in ETH
- **Timeframe**: Select expiry time (1-60 minutes)
- **Real-time Execution**: Automatic settlement at expiry

### Smart Contract Integration

- **Arbitrum Networks**: Low fees, fast transactions
- **Decentralized**: All bets stored on-chain
- **Transparent**: Open source smart contracts
- **Secure**: Non-custodial, funds remain in your wallet

## Network Support

- **Arbitrum One** (Mainnet): Production trading
- **Arbitrum Sepolia** (Testnet): Development and testing

## Architecture

### Contexts

- `WalletContext`: Manages wallet connections and state
- `NetworkContext`: Handles network switching
- `TradingContext`: Trading parameters and state
- `EthPriceContext`: Real-time ETH price data

### Services

- `walletconnect.ts`: Modern WalletConnect v2 integration
- `binaryOptionsContract.ts`: Smart contract interactions
- `priceDataService.ts`: Real-time price feeds
- `apiService.ts`: Backend API communication

### Components

- `WalletConnectButton`: Connection UI with status display
- `BinaryOptionsTrading`: Main trading interface
- `PriceChart`: Real-time price visualization
- `TradeSummaryModal`: Trade confirmation and details

## Design System

- **Font**: Space Grotesk throughout the app
- **Colors**: Dark theme with neon accent colors
- **Animations**: Smooth React Native Reanimated animations
- **Layout**: Mobile-first responsive design

## Troubleshooting

### WalletConnect Issues

- Ensure your wallet app supports WalletConnect v2
- Check network connection
- Try clearing app data and reconnecting
- Verify WalletConnect Project ID is configured

### Trading Issues

- Ensure sufficient ETH balance for gas fees
- Check network connection to RPC endpoints
- Verify smart contract address is correct
- Monitor transaction status on block explorer

## Development

### Adding New Features

1. Create components in `src/components/`
2. Add contexts in `src/contexts/`
3. Implement services in `src/services/`
4. Update navigation in `App.tsx`

### Testing

- Use Arbitrum Sepolia testnet for development
- Get testnet ETH from faucets
- Test all wallet connection flows
- Verify trading functionality end-to-end

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review console logs for errors
3. Test on Arbitrum Sepolia first
4. Verify all API keys are configured

---

Built with React Native, Expo, WalletConnect v2, and Arbitrum smart contracts.
