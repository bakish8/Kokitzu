# 🚀 Quick Redeployment Guide

## Problem Fixed ✅

Your blockchain betting was failing because the smart contract was using **Mainnet price feeds** on **Sepolia testnet**. This has been fixed!

## What Changed

✅ **Smart Contract Updated**: Now uses correct Sepolia Chainlink price feeds  
✅ **Auto-Configuration**: BTC, ETH, LINK, MATIC configured automatically on deployment  
✅ **Ready to Use**: Assets active immediately after deployment

---

## Quick Redeploy Commands

### 1. Redeploy the Contract

```bash
cd contracts
npm run deploy:sepolia
```

### 2. Update Server Config

Copy the new contract address from deployment output and update:

```bash
# Update server/.env
CONTRACT_ADDRESS=0xYourNewContractAddress
```

### 3. Restart Server

```bash
cd server
npm run dev
```

### 4. Test Blockchain Betting

Your KokitzuApp should now work with blockchain betting!

---

## Expected Results

### ✅ During Deployment

```bash
🚀 Deploying BinaryOptions smart contract...
✅ BinaryOptions deployed to: 0xNewContractAddress
📋 Contract Details:
   - Network: sepolia
   - Address: 0xNewContractAddress
   - Owner: 0xYourWalletAddress
```

### ✅ Server Startup Logs

```bash
🔧 Checking asset configurations...
✅ BTC already configured: { isActive: true, priceFeed: "0x1b44..." }
✅ ETH already configured: { isActive: true, priceFeed: "0x694..." }
✅ LINK already configured: { isActive: true, priceFeed: "0xc59..." }
✅ MATIC already configured: { isActive: true, priceFeed: "0xd0D..." }
🎯 ContractService initialized successfully
```

### ✅ Blockchain Betting Success

```bash
🔗 BLOCKCHAIN PATH: Initiating blockchain bet...
🔍 Checking asset configuration for: BTC
✅ Asset config found for BTC: { minAmount: 0.0001, maxAmount: 1.0, isActive: true }
🎯 Placing bet: BTC UP 0.001 ETH for ONE_MINUTE
📝 Creating option on blockchain...
✅ Option created successfully!
```

---

## Pre-Configured Assets

| Asset     | Min Bet    | Max Bet | Fee  | Price Feed                  |
| --------- | ---------- | ------- | ---- | --------------------------- |
| **BTC**   | 0.0001 ETH | 1 ETH   | 2%   | Chainlink BTC/USD Sepolia   |
| **ETH**   | 0.001 ETH  | 2 ETH   | 1.5% | Chainlink ETH/USD Sepolia   |
| **LINK**  | 0.005 ETH  | 1.5 ETH | 2%   | Chainlink LINK/USD Sepolia  |
| **MATIC** | 0.01 ETH   | 2 ETH   | 2.5% | Chainlink MATIC/USD Sepolia |

---

## Troubleshooting

### If deployment fails:

```bash
# Check your .env file has:
PRIVATE_KEY=your_private_key_without_0x
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key

# Make sure you have Sepolia ETH for gas
```

### If server still shows asset errors:

1. Double-check you updated `CONTRACT_ADDRESS` in server/.env
2. Restart the server completely
3. The old contract had bad price feeds - the new one is fixed!

---

## Summary

🎯 **One command fix**: `npm run deploy:sepolia`  
🔄 **Update server config** with new contract address  
✅ **Assets work immediately** - no manual configuration needed  
🚀 **KokitzuApp ready** for blockchain betting!

The new contract will have all crypto assets properly configured with real Chainlink price feeds from the moment it's deployed. Your blockchain betting should work perfectly! 🎉
