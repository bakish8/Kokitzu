# Smart Contract Asset Configuration Guide

## 🎯 **The Issue**

The blockchain betting was failing with this error:

```
❌ Bet placement failed: Error: execution reverted (no data present; likely require(false) occurred
```

**Root Cause**: The smart contract doesn't have "BTC" (or other crypto assets) configured as valid betting assets. The contract needs price feeds and betting parameters set up for each asset.

---

## ✅ **Solution Implemented**

### **1. Enhanced Error Handling**

- Better error messages when assets aren't configured
- Automatic fallback to ETH if available
- Detailed logging for debugging

### **2. Automatic Asset Configuration**

- Contract service now checks and configures common assets on startup
- Configures BTC, ETH, LINK, and MATIC with Chainlink price feeds
- Only works if you're the contract owner

### **3. Manual Configuration Tools**

- Standalone script: `configure-assets.js`
- GraphQL mutation: `configureAsset`
- Easy-to-use npm script

---

## 🚀 **How to Fix**

### **Option 1: Run the Configuration Script (Recommended)**

```bash
cd server
npm run configure-assets
```

**What it does:**

- Connects to your smart contract
- Verifies you're the owner
- Configures BTC, ETH, LINK, MATIC with proper price feeds
- Sets reasonable min/max amounts and fees
- Shows final status of all assets

### **Option 2: Use GraphQL Mutation**

```graphql
mutation {
  configureAsset(
    symbol: "BTC"
    priceFeed: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"
    minAmount: 0.0001
    maxAmount: 1.0
    feePercentage: 200
  )
}
```

### **Option 3: Automatic Configuration**

The server now tries to configure assets automatically when it starts up (if you're the owner).

---

## 📊 **Configured Assets**

| Asset     | Price Feed (Sepolia)                       | Min Amount | Max Amount | Fee  |
| --------- | ------------------------------------------ | ---------- | ---------- | ---- |
| **BTC**   | 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43 | 0.0001 ETH | 1.0 ETH    | 2.0% |
| **ETH**   | 0x694AA1769357215DE4FAC081bf1f309aDC325306 | 0.001 ETH  | 2.0 ETH    | 1.5% |
| **LINK**  | 0xc59E3633BAAC79493d908e63626716e204A45EdF | 0.005 ETH  | 1.5 ETH    | 2.0% |
| **MATIC** | 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada | 0.01 ETH   | 2.0 ETH    | 2.5% |

_All price feeds are official Chainlink oracles on Sepolia testnet_

---

## 🔐 **Owner Requirements**

**Important**: Only the contract owner can configure assets!

### **Check if you're the owner:**

```bash
# Your wallet address should match the contract owner
node -e "
import('ethers').then(async ({ethers}) => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const contract = new ethers.Contract('0x0F93acd0ea7b9919C902695185B189C2630a73Df', ['function owner() view returns (address)'], provider);
  console.log('Contract owner:', await contract.owner());
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('Your address:', await signer.getAddress());
});
"
```

### **If you're not the owner:**

- You'll see: `"❌ You are not the contract owner!"`
- Contact the contract owner to configure assets
- Or deploy your own contract instance

---

## 🔍 **Testing the Fix**

### **1. Check Current Asset Status**

```bash
cd server
npm run configure-assets
# Will show current status of all assets
```

### **2. Test Blockchain Betting**

1. Start your server: `npm run dev`
2. Look for these logs:

   ```bash
   🔧 Checking asset configurations...
   ✅ BTC already configured: { isActive: true, priceFeed: "0x1b44..." }
   ✅ ETH already configured: { isActive: true, priceFeed: "0x694..." }
   ```

3. Try placing a bet - you should see:
   ```bash
   🔍 Checking asset configuration for: BTC
   ✅ Asset config found for BTC: { ... }
   🎯 Placing bet: BTC UP 0.001 ETH for ONE_MINUTE
   ```

### **3. Expected Success Flow**

```bash
🔗 BLOCKCHAIN PATH: Initiating blockchain bet...
🔍 Checking asset configuration for: BTC
✅ Asset config found for BTC
🎯 Placing bet: BTC UP 0.001 ETH for ONE_MINUTE
📝 Creating option on blockchain...
✅ Option created successfully!
```

---

## ⚠️ **Common Issues & Solutions**

### **"You are not the contract owner"**

- Only the deployer can configure assets
- Use a different wallet or deploy your own contract

### **"SEPOLIA_RPC_URL not properly configured"**

- Set your Alchemy/Infura RPC URL in `.env`
- Example: `SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key`

### **"insufficient funds for gas"**

- You need Sepolia ETH for gas fees
- Get some from: https://sepoliafaucet.com/

### **"Asset BTC not configured" (after running script)**

- Check if the configuration transaction succeeded
- Verify you have enough gas
- Try configuring one asset at a time

---

## 📈 **Price Feed Details**

All price feeds are **Chainlink oracles** providing real-time price data:

- **Decentralized**: Multiple independent nodes
- **High availability**: 99.9% uptime
- **Secure**: Cryptographically verified
- **Real-time**: Updated every ~60 seconds

**Sepolia Testnet Feeds**: https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&search=sepolia

---

## 🎯 **After Configuration**

Once assets are configured, your blockchain betting will work perfectly:

✅ **KokitzuApp**: Always uses blockchain betting  
✅ **Server**: Properly validates and processes blockchain bets  
✅ **Smart Contract**: Has all crypto assets configured  
✅ **Price Feeds**: Real-time Chainlink price data

Your users can now place blockchain bets on BTC, ETH, LINK, and MATIC! 🚀

---

## 🔄 **Adding New Assets**

To add new crypto assets:

1. **Find the Chainlink price feed** for Sepolia testnet
2. **Run the configuration**:
   ```bash
   # Via GraphQL
   mutation {
     configureAsset(
       symbol: "USDC"
       priceFeed: "0x..." # Chainlink USDC/USD feed
       minAmount: 0.01
       maxAmount: 5.0
       feePercentage: 100
     )
   }
   ```
3. **Update the mapping** in `contractService.js` if needed
4. **Test with the new asset**

Your binary options platform now supports fully decentralized, blockchain-based betting! 🎉
