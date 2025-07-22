# Blockchain Integration Setup Guide

Your server has been updated to integrate with the deployed BinaryOptions smart contract at `0x0F93acd0ea7b9919C902695185B189C2630a73Df` on Sepolia testnet.

## 🚀 Quick Start

### 1. Create Environment File

Create a `.env` file in the `server` directory with:

```env
# Blockchain Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here

# Contract Address (Sepolia Testnet)
CONTRACT_ADDRESS=0x0F93acd0ea7b9919C902695185B189C2630a73Df

# Database
MONGO_URI=mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=kokitzu_secret_key

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 2. Get Required API Keys

**Alchemy API Key:**

1. Go to [Alchemy](https://www.alchemy.com/)
2. Create an account and new app
3. Select "Ethereum" and "Sepolia" network
4. Copy your API key and replace `YOUR_API_KEY` in the RPC URL

**Private Key:**

1. Export your wallet's private key (the same one used to deploy the contract)
2. Add it to the `.env` file (without the 0x prefix)
3. **⚠️ SECURITY WARNING**: Never commit this to version control!

### 3. Install Dependencies (if needed)

The server already has `ethers` v6.15.0 installed, but make sure all dependencies are up to date:

```bash
cd server
npm install
```

### 4. Start the Server

```bash
npm run dev
# or
npm start
```

## 📊 New API Features

### GraphQL Mutations

#### 1. Place Blockchain Bet

```graphql
mutation PlaceBlockchainBet($input: PlaceBetInput!) {
  placeBet(input: $input) {
    id
    cryptoSymbol
    betType
    amount
    timeframe
    status
    isBlockchainBet
    optionId
    transactionHash
    blockchain {
      optionId
      transactionHash
      blockNumber
      gasUsed
    }
  }
}
```

**Variables:**

```json
{
  "input": {
    "cryptoSymbol": "BTC",
    "betType": "UP",
    "amount": 0.01,
    "timeframe": "FIVE_MINUTES",
    "walletAddress": "0x...",
    "useBlockchain": true
  }
}
```

#### 2. Execute Blockchain Option

```graphql
mutation ExecuteOption($optionId: String!) {
  executeBlockchainOption(optionId: $optionId) {
    success
    transactionHash
    blockNumber
    gasUsed
  }
}
```

### GraphQL Queries

#### 1. Get Contract Statistics

```graphql
query GetContractStats {
  contractStats {
    totalOptions
    contractBalance
  }
}
```

#### 2. Get User's Blockchain Bets

```graphql
query GetBlockchainBets($walletAddress: String!) {
  blockchainBets(walletAddress: $walletAddress) {
    id
    trader
    asset
    amount
    expiry
    isCall
    executed
    entryPrice
    exitPrice
    won
  }
}
```

## 🔄 How It Works

### Dual Mode Operation

The server now supports both **legacy in-memory bets** and **blockchain bets**:

1. **Legacy Mode** (default): Bets stored in memory/database, settled by server
2. **Blockchain Mode**: Bets created on-chain, settled by smart contract using Chainlink price feeds

### Blockchain Bet Flow

1. **Client** calls `placeBet` mutation with `useBlockchain: true`
2. **Server** calls smart contract's `createOption` function
3. **Smart contract** creates option and emits `OptionCreated` event
4. **Server** saves bet details to database with blockchain metadata
5. **Client** can track bet status via transaction hash
6. **After expiry**, anyone can call `executeBlockchainOption` to settle the bet
7. **Smart contract** uses Chainlink price feeds to determine win/loss

### Supported Assets

The contract currently supports:

- **ETH/USD**: Minimum 0.01 ETH, Maximum 10 ETH
- **BTC/USD**: Minimum 0.001 ETH, Maximum 5 ETH
- **MATIC/USD**: Minimum 10 ETH, Maximum 10,000 ETH

## 🧪 Testing

### Test with GraphQL Playground

1. Start your server: `npm run dev`
2. Open http://localhost:4000/graphql
3. Try the example queries and mutations above

### Test Contract Connection

Check the health endpoint to verify contract connection:

```bash
curl http://localhost:4000/health
```

Should return:

```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "service": "CryptoGraphQL Server",
  "blockchain": {
    "contractAddress": "0x0F93acd0ea7b9919C902695185B189C2630a73Df",
    "network": "Sepolia Testnet"
  }
}
```

## 🔧 Configuration Options

### Environment Variables

| Variable           | Description                                 | Required                          |
| ------------------ | ------------------------------------------- | --------------------------------- |
| `SEPOLIA_RPC_URL`  | Alchemy or Infura RPC endpoint              | Yes                               |
| `PRIVATE_KEY`      | Wallet private key for signing transactions | Yes (for placing bets)            |
| `CONTRACT_ADDRESS` | Smart contract address                      | No (defaults to deployed address) |
| `MONGO_URI`        | MongoDB connection string                   | Yes                               |
| `JWT_SECRET`       | JWT signing secret                          | Yes                               |
| `PORT`             | Server port                                 | No (defaults to 4000)             |

### Contract Configuration

The contract is pre-configured with:

- **Platform Fee**: 2%
- **Payout Ratio**: 80% (20% house edge)
- **Chainlink Price Feeds**: ETH, BTC, MATIC

## 🚨 Important Notes

### Security

- Never commit your `.env` file to version control
- Use a dedicated wallet for server operations (not your personal wallet)
- Consider using a multi-sig wallet for production

### Gas Costs

- **Creating Option**: ~150,000 gas (~$3-10 on mainnet)
- **Executing Option**: ~100,000 gas (~$2-7 on mainnet)
- **Sepolia Testnet**: Gas is free (get test ETH from faucet)

### Limitations

- Only ETH, BTC, and MATIC are supported initially
- Minimum bet amounts are enforced by the contract
- Options must be executed manually after expiry

## 🔄 Migration from Legacy

Your existing in-memory betting system continues to work. Users can choose between:

1. **Legacy bets**: Instant, no gas fees, settled by server
2. **Blockchain bets**: Decentralized, transparent, settled by smart contract

## 📞 Troubleshooting

### Common Issues

**"No signer available"**

- Check that `PRIVATE_KEY` is set in `.env`
- Ensure private key doesn't have `0x` prefix

**"Invalid RPC URL"**

- Verify `SEPOLIA_RPC_URL` is correct
- Check Alchemy/Infura API key is valid

**"Asset not active"**

- Only BTC, ETH, MATIC are supported
- Check contract configuration

**"Insufficient balance"**

- Ensure server wallet has enough Sepolia ETH
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### Logs to Monitor

The server will log:

- `🔑 Wallet connected: 0x...` - Wallet initialization
- `📄 Contract connected at: 0x...` - Contract connection
- `🎯 Placing bet: BTC UP 0.01 ETH` - Bet placement
- `🎲 Option created with ID: 123` - Successful bet creation
- `⚡ Option executed: 123` - Bet settlement

---

Your blockchain integration is now complete! 🎉
