# KokitzuApp (React Native)

A cross-platform cryptocurrency options trading app built with React Native and Expo.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/):
  ```sh
  npm install -g expo-cli
  ```
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) (optional, you can use npm)
- For iOS: Xcode (Mac only)
- For Android: Android Studio or a device/emulator

## Setup

1. Clone the repository and navigate to the project directory:
   ```sh
   cd KokitzuApp
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

## Running the App

### iOS

- Run on iOS simulator or device:
  ```sh
  npx expo start --ios
  ```
  Or open Expo Go on your iPhone and scan the QR code.

### Android

- Run on Android emulator or device:
  ```sh
  npx expo start --android
  ```
  Or open Expo Go on your Android device and scan the QR code.

### Web

- Run in your browser:
  ```sh
  npx expo start --web
  ```

## Deployment

### iOS (App Store)

1. Build the app for iOS:
   ```sh
   npx expo build:ios
   # or (new Expo EAS Build)
   npx eas build -p ios
   ```
2. Follow Expo's instructions to upload to the App Store.
   - See: https://docs.expo.dev/distribution/uploading-apps/

### Android (Google Play)

1. Build the app for Android:
   ```sh
   npx expo build:android
   # or (new Expo EAS Build)
   npx eas build -p android
   ```
2. Follow Expo's instructions to upload to Google Play.
   - See: https://docs.expo.dev/distribution/uploading-apps/

## Environment Variables

- Update the GraphQL endpoint in `src/graphql/client.ts` if your server is not running locally.
- Add your Infura API key in `src/contexts/WalletContext.tsx` for Ethereum network access.

## Wallet Integration Guide

### Overview

KokitzuApp integrates with blockchain wallets to enable secure cryptocurrency trading. Users can connect their wallets to place binary options trades directly on the blockchain.

### Supported Wallets

#### MetaMask

- **Mobile App**: Download MetaMask from App Store/Google Play
- **Browser Extension**: Works on web version
- **Features**:
  - Secure private key storage
  - Multi-chain support
  - Transaction history
  - Built-in DApp browser

#### WalletConnect

- **Universal Protocol**: Connect any wallet via QR code
- **Supported Wallets**:
  - Trust Wallet
  - Rainbow
  - Argent
  - Coinbase Wallet
  - And 100+ more
- **Features**:
  - Cross-platform compatibility
  - No app installation required
  - Secure peer-to-peer connection

### Wallet Setup Instructions

#### For Users

1. **Install a Wallet**:

   - **MetaMask**: Download from [metamask.io](https://metamask.io)
   - **Trust Wallet**: Download from App Store/Google Play
   - **Rainbow**: Download from App Store/Google Play

2. **Create or Import Wallet**:

   - Create new wallet (write down seed phrase securely)
   - Or import existing wallet using private key/seed phrase

3. **Add Funds**:

   - Purchase ETH/USDC from exchanges
   - Transfer to your wallet address
   - Ensure sufficient balance for trading + gas fees

4. **Connect to App**:
   - Open KokitzuApp
   - Tap "Connect Wallet" button
   - Choose connection method:
     - **MetaMask**: App will redirect to MetaMask
     - **WalletConnect**: Scan QR code with your wallet

#### For Developers

1. **Install Dependencies**:

   ```bash
   npm install ethers @walletconnect/react-native-compat
   ```

2. **Configure Network Settings**:
   Edit `src/contexts/WalletContext.tsx`:

   ```typescript
   const NETWORKS = {
     ethereum: {
       chainId: 1,
       name: "Ethereum Mainnet",
       rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
       blockExplorer: "https://etherscan.io",
     },
     polygon: {
       chainId: 137,
       name: "Polygon",
       rpcUrl: "https://polygon-rpc.com",
       blockExplorer: "https://polygonscan.com",
     },
   };
   ```

3. **Deploy Smart Contracts**:

   ```bash
   # Deploy to testnet first
   npx hardhat deploy --network sepolia

   # Deploy to mainnet
   npx hardhat deploy --network mainnet
   ```

### Using Wallets in the App

#### Connecting Your Wallet

1. **From Any Screen**:

   - Tap the "Connect Wallet" button
   - Choose your preferred wallet
   - Approve the connection in your wallet app

2. **Connection Status**:
   - Green indicator = Connected
   - Red indicator = Disconnected
   - Shows wallet address (shortened format)

#### Placing Trades

1. **Select Trading Pair**:

   - Choose cryptocurrency (BTC, ETH, etc.)
   - Select timeframe (1m, 5m, 15m, 1h)

2. **Set Bet Parameters**:

   - Enter bet amount (minimum $10)
   - Choose direction (UP/DOWN)
   - Review potential payout

3. **Confirm Transaction**:
   - Tap "Place Bet"
   - Review transaction details in wallet
   - Approve transaction
   - Wait for blockchain confirmation

#### Managing Active Bets

- **View Active Bets**: Portfolio screen shows all open positions
- **Track Performance**: Real-time updates on bet status
- **Claim Winnings**: Automatic payout when bet expires

### Security Best Practices

#### For Users

1. **Wallet Security**:

   - Never share private keys or seed phrases
   - Use hardware wallets for large amounts
   - Enable biometric authentication
   - Keep wallet apps updated

2. **Transaction Safety**:

   - Always review transaction details
   - Verify contract addresses
   - Check gas fees before confirming
   - Start with small amounts

3. **Network Security**:
   - Only connect to official app
   - Verify SSL certificates
   - Use secure networks (avoid public WiFi)

#### For Developers

1. **Smart Contract Security**:

   - Audit contracts before deployment
   - Use OpenZeppelin libraries
   - Implement access controls
   - Add emergency pause functions

2. **App Security**:
   - Secure API endpoints
   - Implement rate limiting
   - Use HTTPS everywhere
   - Regular security updates

### Troubleshooting

#### Common Issues

1. **Wallet Won't Connect**:

   - Check internet connection
   - Restart wallet app
   - Clear app cache
   - Try different wallet

2. **Transaction Fails**:

   - Insufficient gas fees
   - Network congestion
   - Insufficient balance
   - Contract interaction error

3. **Wrong Network**:
   - Switch to correct network in wallet
   - Add custom network if needed
   - Check RPC URL configuration

#### Error Messages

- **"User rejected transaction"**: User cancelled in wallet
- **"Insufficient funds"**: Add more ETH/USDC to wallet
- **"Network error"**: Check internet/RPC connection
- **"Contract not found"**: Verify contract deployment

### Advanced Features

#### Multi-Chain Support

- Ethereum Mainnet (default)
- Polygon (lower fees)
- Arbitrum (fast transactions)
- BSC (alternative)

#### Gas Optimization

- Automatic gas estimation
- Gas price recommendations
- Batch transactions
- EIP-1559 support

#### Analytics & Monitoring

- Transaction history
- Performance tracking
- Profit/loss analysis
- Risk management tools

### Support

- **Documentation**: Check this README first
- **Issues**: Report bugs on GitHub
- **Community**: Join Discord/Telegram
- **Security**: Report vulnerabilities privately

## Notes

- This app uses Expo, so you do **not** need to install or link native dependencies manually for most features.
- For advanced native features, consider [EAS Build](https://docs.expo.dev/build/introduction/).
- Wallet integration requires proper network configuration and smart contract deployment.
- Always test on testnets before using real funds.
