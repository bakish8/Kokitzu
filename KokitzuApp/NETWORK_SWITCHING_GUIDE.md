# Network Switching Guide

## Overview

The KokitzuApp now supports dynamic network switching between Ethereum Mainnet, Sepolia Testnet, and Goerli Testnet. This allows developers to easily switch between networks during development and testing.

## Features

### 🌐 Supported Networks

1. **Ethereum Mainnet**

   - Chain ID: 1
   - RPC URL: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
   - Explorer: `https://etherscan.io`
   - Currency: ETH
   - **⚠️ Uses real ETH - be careful!**

2. **Sepolia Testnet** (Recommended for Development)

   - Chain ID: 11155111
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - Explorer: `https://sepolia.etherscan.io`
   - Currency: Sepolia ETH
   - **✅ Safe for testing**

## How to Use

### 1. Network Selector in Header

The network selector is available in the header of all screens:

- **Live Prices Screen**
- **Binary Options Screen**
- **Portfolio Screen**

### 2. Switching Networks

1. **Tap the network selector** in the header
2. **Choose your desired network** from the modal
3. **Confirm the switch** (mainnet requires confirmation)
4. **Wait for the switch** to complete

### 3. Visual Indicators

- **Network Icon**: Different icons for each network
- **Network Color**:
  - 🟢 Green for Mainnet
  - 🔵 Blue for Sepolia
- **Testnet Badge**: Clear indication for test networks

## Technical Implementation

### Network Context

The network state is managed by `NetworkContext`:

```typescript
import { useNetwork } from "../contexts/NetworkContext";

const { currentNetwork, networkConfig, switchNetwork } = useNetwork();
```

### Key Components

1. **NetworkContext** (`src/contexts/NetworkContext.tsx`)

   - Manages network state
   - Provides network switching functionality
   - Stores network configuration

2. **NetworkSelector** (`src/components/NetworkSelector.tsx`)

   - UI component for network selection
   - Compact and full-size variants
   - Modal-based selection interface

3. **Updated Services**:
   - `binaryOptionsContract.ts` - Uses current network
   - `walletconnect.ts` - Connects to correct network
   - `api.ts` - Provides network-specific URLs

### Network Configuration

```typescript
export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    name: "Ethereum Mainnet",
    chainId: "1",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
    explorerUrl: "https://etherscan.io",
    isTestnet: false,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  // ... other networks
};
```

## Development Workflow

### 1. Start with Sepolia (Recommended)

```typescript
// Default network is set to Sepolia for development
const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("sepolia");
```

### 2. Test on Different Networks

1. **Connect wallet** to your preferred wallet app
2. **Switch to Sepolia** using the network selector
3. **Get test ETH** from Sepolia faucet
4. **Test your features**
5. **Switch to Mainnet** only when ready for production

### 3. Smart Contract Deployment

Before using the app, deploy your smart contracts to each network:

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Goerli
npx hardhat run scripts/deploy.js --network goerli

# Deploy to Mainnet (when ready)
npx hardhat run scripts/deploy.js --network mainnet
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in `src/services/binaryOptionsContract.ts`:

```typescript
const CONTRACT_ADDRESSES: Record<NetworkType, string> = {
  mainnet: "0x...", // Your mainnet contract address
  sepolia: "0x...", // Your sepolia contract address
  goerli: "0x...", // Your goerli contract address
};
```

## Safety Features

### 1. Mainnet Confirmation

When switching to mainnet, the app shows a confirmation dialog:

```
"Switch to Mainnet"
"You are about to switch to Ethereum Mainnet.
This will use real ETH for transactions. Are you sure?"
```

### 2. Network Persistence

The selected network is stored in AsyncStorage and persists across app restarts.

### 3. Balance Verification

The app automatically fetches the correct balance for the current network.

## Testing

### 1. Network Switching Test

Run the test file to verify network configurations:

```bash
node test-network-switching.js
```

### 2. Manual Testing

1. **Start the app** with Expo
2. **Connect your wallet**
3. **Switch between networks** using the selector
4. **Verify balance updates** for each network
5. **Test transactions** on testnets first

### 3. Testnet Faucets

Get test ETH for development:

- **Sepolia**: https://sepoliafaucet.com/
- **Goerli**: https://goerlifaucet.com/

## Troubleshooting

### Common Issues

1. **"Contract not deployed" Error**

   - Deploy contracts to the selected network
   - Update contract addresses in the code

2. **"RPC Error"**

   - Check your Infura Project ID
   - Verify network connectivity
   - Ensure RPC URL is correct

3. **"Wallet not connected"**

   - Connect wallet first
   - Ensure wallet supports the selected network

4. **"Insufficient balance"**
   - Get test ETH from faucet (for testnets)
   - Check if you're on the correct network

### Debug Information

The app logs network-related information:

```
🌐 Network changed to sepolia
🌐 WalletContext: Network changed to sepolia
🌐 WalletContext: Provider reinitialized for sepolia
💰 Fetching balance for address 0x... on chain 11155111 (sepolia)
```

## Best Practices

### 1. Development Workflow

1. **Always start with testnets** (Sepolia/Goerli)
2. **Test thoroughly** before switching to mainnet
3. **Use small amounts** for testing
4. **Keep testnet ETH** handy for development

### 2. Network Selection

1. **Use Sepolia** for most development
2. **Use Goerli** for additional testing
3. **Use Mainnet** only for production

### 3. Contract Management

1. **Deploy to all networks** you plan to use
2. **Keep contract addresses** updated
3. **Test contracts** on testnets first
4. **Verify contracts** on mainnet before use

## Future Enhancements

### Planned Features

1. **Additional Networks**

   - Polygon
   - BSC
   - Arbitrum
   - Optimism

2. **Network Detection**

   - Auto-detect wallet network
   - Suggest network switching

3. **Network Statistics**

   - Gas price display
   - Network status indicators

4. **Custom RPC URLs**
   - Support for custom RPC endpoints
   - Local network support

## Support

If you encounter issues with network switching:

1. **Check the console logs** for error messages
2. **Verify your Infura configuration**
3. **Ensure wallet compatibility**
4. **Test with different networks**

## Conclusion

The network switching feature provides a seamless development experience across multiple Ethereum networks. Start with Sepolia for development, test thoroughly, and only use mainnet when ready for production.

Happy coding! 🚀
