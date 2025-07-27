# 🔒 Security Setup Guide

## ⚠️ CRITICAL SECURITY NOTICE

This project has been updated to remove all hardcoded sensitive information and properly configure version control. **NEVER commit `.env` files or private keys to version control!**

## 🔒 RECENT SECURITY CLEANUP

**CRITICAL ISSUE RESOLVED**: The git repository was previously tracking sensitive files that have now been removed:

- ❌ Removed `.env` backup files containing private keys
- ❌ Removed thousands of `node_modules` files from version control
- ✅ Added comprehensive `.gitignore` to prevent future security issues

## 🎯 Quick Setup

### 1. Environment Files Required

Each part of the project needs its own `.env` file:

```
📁 Project Root/
├── 📁 client/
│   └── 📄 .env              # React app config
├── 📁 server/
│   └── 📄 .env              # Server config
├── 📁 KokitzuApp/
│   └── 📄 .env              # Expo app config
└── 📁 contracts/
    └── 📄 .env              # Contract deployment config
```

### 2. Create .env Files

Create the following `.env` files and fill them with your actual values (see sections below).

## 🔑 Environment Variable Prefixes

Different parts of the project use different prefixes:

| Component        | Prefix         | Example                        |
| ---------------- | -------------- | ------------------------------ |
| React Client     | `REACT_APP_`   | `REACT_APP_CONTRACT_ADDRESS`   |
| Expo Mobile      | `EXPO_PUBLIC_` | `EXPO_PUBLIC_CONTRACT_ADDRESS` |
| Server/Contracts | No prefix      | `CONTRACT_ADDRESS`             |

## 📋 Required Variables by Component

### Client (React App)

```env
# client/.env
REACT_APP_CONTRACT_ADDRESS=0xYourContractAddress
REACT_APP_NETWORK_NAME=sepolia
REACT_APP_CHAIN_ID=11155111
REACT_APP_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
REACT_APP_SERVER_URL=http://localhost:4000
REACT_APP_TEST_WALLET_ADDRESS=0xYourTestWallet
```

### Mobile App (Expo)

```env
# KokitzuApp/.env
EXPO_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
EXPO_PUBLIC_NETWORK_NAME=arbitrum-sepolia
EXPO_PUBLIC_CHAIN_ID=421614
EXPO_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
EXPO_PUBLIC_SERVER_URL=http://localhost:4000
EXPO_PUBLIC_TEST_WALLET_ADDRESS=0xYourTestWallet
```

### Server

```env
# server/.env
CONTRACT_ADDRESS=0xYourContractAddress
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PORT=4000
TEST_WALLET_ADDRESS=0xYourTestWallet
SERVER_WALLET_ADDRESS=0xYourServerWallet
```

### Contracts

```env
# contracts/.env
CONTRACT_ADDRESS=0xYourContractAddress
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
TEST_WALLET_ADDRESS=0xYourTestWallet
```

## 🛡️ Security Best Practices

### ✅ DO:

- Use different private keys for development vs production
- Use different contract addresses for different networks
- Keep test wallet addresses in environment variables
- Use API keys from reputable providers (Alchemy, Infura)
- Regularly rotate API keys and private keys
- Use hardware wallets for production deployments

### ❌ DON'T:

- Never commit `.env` files to git
- Never share private keys in chat/email
- Never use production keys in development
- Never hardcode sensitive addresses in source code
- Never use the same private key across multiple projects

## 🔍 What Was Fixed

This security update addressed the following vulnerabilities:

### Fixed Files:

- `client/src/components/BetConfirmationModal.js` - Contract address
- `client/debug-wallet-check.html` - Wallet and contract addresses
- `client/test-blockchain-betting.html` - Test wallet address
- `KokitzuApp/src/services/binaryOptionsContract.ts` - Contract address
- `KokitzuApp/src/components/SmartContractInfo.tsx` - Contract address
- `KokitzuApp/test-*.js` - Test wallet addresses
- `server/configure-assets.js` - Contract address
- `contracts/verify-assets.js` - Contract address
- `contracts/withdraw-*-contract.js` - Contract addresses
- `scripts/update-wallet.js` - Wallet address
- `scripts/switch-network.js` - Contract address

### Security Improvements:

- ✅ All hardcoded addresses moved to environment variables
- ✅ Updated `.gitignore` files to prevent `.env` commits
- ✅ Debug logs sanitized to hide sensitive addresses
- ✅ Created security documentation with environment variable templates

## 🚀 Getting Started After Setup

1. **Create .env files**: Use the configuration templates above
2. **Get API keys**: Sign up for Alchemy/Infura
3. **Get test ETH**: Use Sepolia faucet for testing
4. **Deploy contracts**: Follow deployment guides
5. **Update addresses**: Put deployed contract addresses in `.env` files
6. **Test**: Run tests to ensure everything works

## 🆘 Troubleshooting

### Error: "Contract not found"

- Check `CONTRACT_ADDRESS` in relevant `.env` file
- Ensure you're on the correct network
- Verify contract is deployed

### Error: "Missing environment variable"

- Check the `.env` file exists in the correct directory
- Verify variable names match the prefix requirements
- Restart the application after adding variables

### Error: "Insufficient funds"

- Check `PRIVATE_KEY` wallet has test ETH
- Use faucets to get test tokens
- Verify you're using the right network

## 📞 Support

If you encounter issues:

1. Check all `.env` files are properly configured
2. Verify network connectivity
3. Check console logs for specific errors
4. Ensure all required dependencies are installed

## 🔄 Regular Maintenance

- Rotate API keys every 3-6 months
- Update contract addresses when redeploying
- Review and update test wallet addresses
- Keep backup of configuration (without private keys!)

---

**Remember: Security is ongoing! Regularly review and update your configuration.**
