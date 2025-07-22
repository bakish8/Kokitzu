# Smart Contract Setup Guide

## 🚨 **IMPORTANT: Contract Needs Redeployment!**

The smart contract was deployed with **Mainnet price feeds** but is running on **Sepolia testnet**, causing all asset configurations to fail.

**✅ SOLUTION**: The contract has been fixed and needs to be redeployed.

## 🚀 **Quick Fix (Recommended)**

```bash
# 1. Redeploy the fixed contract
cd contracts
npm run deploy:sepolia

# 2. Update server config with new address
# Copy the deployed address and update server/.env:
CONTRACT_ADDRESS=0xYourNewContractAddress

# 3. Restart server
cd server
npm run dev
```

**The new contract will have BTC, ETH, LINK, and MATIC pre-configured and ready to use!**

---

## 📋 **Alternative: Environment Variables Setup**

If you can't redeploy, here's the manual setup (more complex):

## 📋 **Required Environment Variables**

Create a `.env` file in the `/server` directory with these variables:

```bash
# =============================================================================
# SMART CONTRACT CONFIGURATION (Required for blockchain betting)
# =============================================================================

# Your wallet's private key (WITHOUT the 0x prefix)
# Get this from MetaMask > Account Details > Export Private Key
PRIVATE_KEY=your_private_key_here_without_0x

# Sepolia testnet RPC URL - Get from Alchemy, Infura, or other provider
# Free tier available at: https://www.alchemy.com/ or https://infura.io/
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key_here

# Contract address (already deployed for testing)
CONTRACT_ADDRESS=0x0F93acd0ea7b9919C902695185B189C2630a73Df

# =============================================================================
# COINGECKO API CONFIGURATION (Optional)
# =============================================================================

# Optional: CoinGecko Pro API key
COINGECKO_API_KEY=your_pro_api_key_here

# Fetch interval in milliseconds (90 seconds for free tier)
COINGECKO_FETCH_INTERVAL=90000

# =============================================================================
# DATABASE & SERVER (Already configured)
# =============================================================================

MONGO_URI=mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority
PORT=4000
JWT_SECRET=kokitzu_secret_key
```

## 🔧 **Step-by-Step Setup**

### 1. **Get a Sepolia RPC URL**

- Go to [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- Create a free account
- Create a new app for "Ethereum Sepolia"
- Copy the HTTP URL

### 2. **Get Your Wallet Private Key**

- Open MetaMask
- Click your account name → Account Details
- Click "Export Private Key"
- Enter your password
- Copy the private key (without the 0x prefix)

### 3. **Get Sepolia Test ETH**

- Go to [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Request test ETH
- Wait for confirmation

### 4. **Create .env File**

```bash
cd server
touch .env
# Then add the environment variables above
```

### 5. **Restart Server**

```bash
npm run dev
# OR
node index.js
```

## ✅ **What You Should See After Setup**

```bash
============================================================
🚀 CRYPTOGRAPHQL SERVICES STARTING
============================================================
📊 Price Service: CoinGecko API (Free tier)
⏱️  Fetch Interval: 90s
🪙 Tracking 20 cryptocurrencies
============================================================
🔗 Initializing Smart Contract Service...
🔍 ContractService imported: YES
🔍 ContractService type: object
🔧 Calling contractService.init()...
🔧 Initializing Contract Service...
🌐 Connecting to Sepolia network...
✅ Connected to network: sepolia (chainId: 11155111)
🔑 Wallet connected: 0x1234...5678
💰 Wallet balance: 0.05 ETH
📄 Connecting to contract: 0x0F93acd0ea7b9919C902695185B189C2630a73Df
👑 Contract owner: 0xabcd...efgh
✅ Contract connection successful
🎯 ContractService initialized successfully
✅ contractService.init() completed
🎯 Setting up contract event listeners...
✅ Contract event listeners active
✅ Smart Contract Service initialized successfully
🧪 Testing contract connectivity...
✅ Contract connectivity test passed
📊 Current stats - Options: 5, Balance: 2.5 ETH
============================================================
🎯 ALL SERVICES INITIALIZED
============================================================
```

## ❌ **If You See Errors**

### "RPC URL not configured"

- Your `SEPOLIA_RPC_URL` contains "YOUR_API_KEY"
- Replace it with a real Alchemy/Infura URL

### "Contract not deployed or wrong network"

- You're connected to mainnet instead of Sepolia
- Check your RPC URL points to Sepolia testnet

### "insufficient funds for gas"

- Your wallet needs Sepolia ETH
- Get some from the faucet link above

### "No private key provided - read-only mode"

- Your `PRIVATE_KEY` is not set in .env
- Add your private key without the 0x prefix

## 🚀 **Testing Blockchain Betting**

Once setup is complete, you can test blockchain betting by:

1. **Query contract stats**:

```graphql
query {
  contractStats {
    totalOptions
    contractBalance
  }
}
```

2. **Place a blockchain bet**:

```graphql
mutation {
  placeBet(
    input: {
      cryptoSymbol: "BTC"
      betType: "UP"
      amount: 0.001
      timeframe: "FIVE_MINUTES"
      useBlockchain: true
      walletAddress: "your_wallet_address"
    }
  ) {
    id
    blockchain {
      transactionHash
      optionId
    }
  }
}
```

## 🔄 **Troubleshooting**

If contract logs still don't appear:

1. **Check .env file location**: Must be in `/server/.env`
2. **Restart server completely**: Kill process and start again
3. **Check network**: Ensure you're on Sepolia testnet
4. **Verify balance**: Need >0.01 ETH for gas fees
5. **Check logs**: Look for specific error messages

The detailed logging will show you exactly what's failing!
