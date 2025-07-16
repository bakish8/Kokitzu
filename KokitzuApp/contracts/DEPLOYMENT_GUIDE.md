# BinaryOptions Smart Contract Deployment Guide

This guide will help you deploy the BinaryOptions smart contract to Ethereum networks and integrate it with your React Native app.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Environment Setup

Create a `.env` file in the `contracts` directory:

```env
# Private key of the account that will deploy the contract
PRIVATE_KEY=your_private_key_here

# RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
GOERLI_RPC_URL=https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Deploy to Testnet (Recommended First)

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Or deploy to Goerli testnet
npm run deploy:goerli
```

### 5. Deploy to Mainnet

```bash
npm run deploy:mainnet
```

## 📋 Deployment Steps

### Step 1: Get Test ETH

For testnet deployment, you'll need test ETH:

- **Sepolia**: Get from [Sepolia Faucet](https://sepoliafaucet.com/)
- **Goerli**: Get from [Goerli Faucet](https://goerlifaucet.com/)

### Step 2: Configure Network

The contract is pre-configured with Chainlink price feeds for:

- ETH/USD: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- BTC/USD: `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`
- MATIC/USD: `0x7bAC85A8a13A4BcD8abb3eB7d6b4ddecC6C5ca2a`

### Step 3: Deploy Contract

```bash
# For local development
npm run deploy:local

# For testnet
npm run deploy:sepolia

# For mainnet (BE CAREFUL!)
npm run deploy:mainnet
```

### Step 4: Verify Contract

After deployment, verify the contract on Etherscan:

```bash
# For Sepolia
npm run verify:sepolia

# For Goerli
npm run verify:goerli

# For Mainnet
npm run verify:mainnet
```

## 🔧 Contract Configuration

### Asset Configuration

The contract supports multiple assets. You can add new assets after deployment:

```javascript
// Example: Add SOL/USD
await contract.updateAssetConfig(
  "SOL",
  "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46", // SOL/USD price feed
  ethers.utils.parseEther("0.01"), // min amount
  ethers.utils.parseEther("10"), // max amount
  150 // fee percentage (1.5%)
);
```

### Platform Fee

The platform fee is set to 2% by default. You can update it:

```javascript
await contract.updatePlatformFee(150); // 1.5%
```

## 📱 React Native Integration

### 1. Update Contract Address

After deployment, update the contract address in your React Native app:

```typescript
// src/services/binaryOptionsContract.ts
const CONTRACT_ADDRESSES = {
  mainnet: "0x...", // Your deployed mainnet address
  sepolia: "0x...", // Your deployed sepolia address
  goerli: "0x...", // Your deployed goerli address
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};
```

### 2. Add Trading Component

Import and use the BinaryOptionsTrading component:

```typescript
import BinaryOptionsTrading from "../components/BinaryOptionsTrading";

// In your screen
<BinaryOptionsTrading asset="BTC" currentPrice="45000" />;
```

### 3. Test Integration

1. Connect your wallet
2. Click "Trade Binary Options"
3. Select amount, expiry time, and option type
4. Create the option
5. Wait for expiry and execute

## 🔒 Security Considerations

### 1. Access Control

- Only the contract owner can update asset configurations
- Only the contract owner can withdraw platform fees
- Users can only execute their own options

### 2. Reentrancy Protection

The contract uses OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks.

### 3. Price Feed Validation

- All price feeds are validated before use
- Invalid prices will revert the transaction

### 4. Amount Limits

- Minimum and maximum amounts are enforced per asset
- Prevents dust attacks and excessive risk

## 💰 Economic Model

### Payout Structure

- **Win**: 80% of bet amount (20% house edge)
- **Loss**: 0% (lose entire bet)

### Example

- Bet: 0.1 ETH
- Win payout: 0.08 ETH
- House edge: 0.02 ETH

## 🧪 Testing

### Local Testing

```bash
# Start local node
npm run node

# Deploy to local network
npm run deploy:local

# Run tests
npm test
```

### Test Scenarios

1. **Create Option**: Test option creation with different parameters
2. **Execute Option**: Test option execution after expiry
3. **Price Movement**: Test both call and put scenarios
4. **Edge Cases**: Test minimum/maximum amounts, expiry times

## 📊 Monitoring

### Events to Monitor

- `OptionCreated`: When a new option is created
- `OptionExecuted`: When an option is executed
- `AssetConfigUpdated`: When asset configuration changes

### Key Metrics

- Total options created
- Total volume traded
- Contract balance
- Win/loss ratio

## 🚨 Emergency Procedures

### Pause Asset

If an asset needs to be paused:

```javascript
await contract.pauseAsset("BTC");
```

### Resume Asset

To resume trading:

```javascript
await contract.resumeAsset("BTC");
```

### Withdraw Fees

To withdraw accumulated platform fees:

```javascript
await contract.withdrawFees();
```

## 📞 Support

If you encounter issues:

1. Check the deployment logs
2. Verify contract on Etherscan
3. Test with small amounts first
4. Ensure sufficient gas for transactions

## 🔄 Updates

To update the contract:

1. Deploy new version
2. Update address in React Native app
3. Migrate user data if necessary
4. Update documentation

---

**⚠️ Important**: Always test thoroughly on testnets before deploying to mainnet. Never deploy with real funds without proper testing.
