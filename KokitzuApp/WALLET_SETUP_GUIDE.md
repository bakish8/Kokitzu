# Wallet Connection Setup Guide

## Overview

This guide will help you set up real wallet connections for your KokitzuApp. You'll need to get API keys from several services to enable actual wallet functionality.

## Required API Keys

### 1. Infura API Key (Required for Ethereum Network Access)

**What it is:** Infura provides access to Ethereum networks
**Where to get it:** https://infura.io/
**Cost:** Free tier available (100,000 requests/day)

**Steps:**

1. Go to https://infura.io/
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID
5. Replace `YOUR_INFURA_PROJECT_ID` in `src/contexts/WalletContext.tsx`

### 2. WalletConnect Project ID (Required for WalletConnect)

**What it is:** WalletConnect allows mobile wallets to connect to your app
**Where to get it:** https://cloud.walletconnect.com/
**Cost:** Free tier available

**Steps:**

1. Go to https://cloud.walletconnect.com/
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID
5. Replace `YOUR_WALLETCONNECT_PROJECT_ID` in `src/contexts/WalletContext.tsx`

## Implementation Steps

### Step 1: Update WalletContext with Your API Keys

Replace the placeholder values in `src/contexts/WalletContext.tsx`:

```typescript
// Line ~50: Replace with your Infura Project ID
const infuraUrl = "https://mainnet.infura.io/v3/YOUR_ACTUAL_INFURA_PROJECT_ID";

// Line ~95: Replace with your WalletConnect Project ID
const projectId = "YOUR_ACTUAL_WALLETCONNECT_PROJECT_ID";
```

### Step 2: Install Required Dependencies

```bash
# For MetaMask integration (when compatible)
npm install @metamask/react-native-sdk --legacy-peer-deps

# For WalletConnect v2
npm install @walletconnect/web3wallet @walletconnect/modal-react-native --legacy-peer-deps
```

### Step 3: Configure WalletConnect v2

Create a new file `src/config/walletconnect.ts`:

```typescript
import { Web3Wallet } from "@walletconnect/web3wallet";
import { Core } from "@walletconnect/core";

export const core = new Core({
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
});

export const web3wallet = await Web3Wallet.init({
  core,
  metadata: {
    name: "KokitzuApp",
    description: "Cryptocurrency Binary Options Trading App",
    url: "https://your-app-url.com",
    icons: ["https://your-app-url.com/icon.png"],
  },
});
```

### Step 4: Update WalletContext Implementation

Replace the placeholder implementations in `WalletContext.tsx` with actual wallet connections.

## Testing Your Setup

### Test WalletConnect Connection:

1. Install a wallet app that supports WalletConnect (MetaMask Mobile, Trust Wallet, etc.)
2. Try connecting via WalletConnect in your app
3. Scan the QR code with your wallet app

### Test MetaMask Connection:

1. Install MetaMask browser extension
2. Try connecting via MetaMask in your app
3. Approve the connection in MetaMask

## Troubleshooting

### Common Issues:

1. **"Project ID not found" error:**

   - Make sure you've replaced the placeholder Project IDs
   - Verify your API keys are correct

2. **"Network error" when connecting:**

   - Check your internet connection
   - Verify your Infura endpoint is working

3. **"Wallet not found" error:**

   - Make sure you have a compatible wallet installed
   - For WalletConnect, ensure your wallet supports WalletConnect v2

4. **"Permission denied" error:**
   - Check that your wallet app has the necessary permissions
   - Try reconnecting the wallet

## Security Best Practices

1. **Never commit API keys to version control**

   - Use environment variables
   - Add `.env` files to `.gitignore`

2. **Use environment variables:**

   ```bash
   # Create .env file
   INFURA_PROJECT_ID=your_infura_project_id
   WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

3. **Validate user inputs**
   - Always validate wallet addresses
   - Check transaction parameters

## Next Steps

Once you have the basic wallet connections working:

1. **Add transaction signing** for placing bets
2. **Implement smart contract interactions** for on-chain betting
3. **Add balance checking** and transaction history
4. **Implement proper error handling** for failed transactions

## Support

If you encounter issues:

1. Check the official documentation for each service
2. Verify your API keys are active and have sufficient quota
3. Test with a small amount first
4. Check the console for detailed error messages

## Cost Estimation

- **Infura:** Free tier (100K requests/day) should be sufficient for testing
- **WalletConnect:** Free tier available
- **Total cost for development:** $0 (with free tiers)

For production use, consider paid plans based on your expected usage.
