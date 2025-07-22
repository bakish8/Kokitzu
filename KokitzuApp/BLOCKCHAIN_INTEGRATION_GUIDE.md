# KokitzuApp Blockchain Integration Guide

## ✅ **Changes Made**

The KokitzuApp has been updated to **always use blockchain betting** with proper smart contract integration. Legacy/in-memory betting has been removed.

### **🔧 Code Changes**

1. **GraphQL Mutation Updated** (`src/graphql/queries.ts`)

   - Added blockchain fields: `isBlockchainBet`, `optionId`, `transactionHash`, `blockNumber`, `walletAddress`
   - Added nested `blockchain` object with detailed transaction info

2. **BinaryOptionsScreen Enhanced** (`src/screens/BinaryOptionsScreen.tsx`)

   - Always sends `useBlockchain: true` and `walletAddress` to server
   - Converts USD amounts to ETH for blockchain transactions
   - Enhanced error handling for blockchain-specific issues
   - Added blockchain status indicator UI
   - Improved logging for debugging

3. **Wallet Integration**
   - Proper wallet address extraction from `WalletContext`
   - Wallet connection verification before betting
   - Smart contract info component enabled

### **🎯 New Features**

#### **Blockchain Status Badge**

- Green badge showing "Blockchain Mode" when wallet is connected
- Displays truncated wallet address
- Shows "Bets placed on smart contract" info

#### **Enhanced Place Bet Button**

- Now shows "🔗 Place Blockchain Bet" when ready
- "Connect Wallet for Blockchain Betting" when not connected
- Clear status indicators

#### **Improved Error Handling**

- Specific error messages for insufficient funds, gas issues, network problems
- User-friendly alerts with blockchain context

#### **Transaction Details**

- Success alerts show transaction hash and option ID
- Full blockchain transaction info logged to console

---

## 🚀 **Testing Instructions**

### **Prerequisites**

1. ✅ Server properly configured with `.env` file:

   ```bash
   PRIVATE_KEY=your_private_key_without_0x
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_api_key
   CONTRACT_ADDRESS=0x0F93acd0ea7b9919C902695185B189C2630a73Df
   ```

2. ✅ Wallet with Sepolia ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

3. ✅ Server running with smart contract logs visible

### **Test Steps**

#### **1. Start the App**

```bash
cd KokitzuApp
npm start
# or
expo start
```

#### **2. Connect Wallet**

- Tap "Connect Wallet"
- Use WalletConnect to connect your wallet
- Verify the blockchain status badge appears

#### **3. Test Blockchain Betting**

- Select a cryptocurrency (e.g., BTC)
- Choose bet direction (UP/DOWN)
- Enter bet amount in USD (will be converted to ETH)
- Verify you see "🔗 Place Blockchain Bet" button
- Place the bet

#### **4. Expected Results**

**✅ In the App:**

- Blockchain status badge shows wallet address
- Success alert with transaction hash and option ID
- Bet appears in "Active Bets" with blockchain data

**✅ In Server Logs:**

```bash
🔍 PlaceBet called with input: { cryptoSymbol: "BTC", betType: "UP", amount: 0.001, useBlockchain: true, walletAddress: "0x742d...4C6" }
🤔 Blockchain condition check: useBlockchain=true, walletAddress=PROVIDED
🔗 BLOCKCHAIN PATH: Initiating blockchain bet...
   └─ Wallet: 0x742d...4C6
   └─ Asset: BTC | Direction: UP | Amount: 0.001 ETH
📝 Calling smart contract placeBet function...
✅ Blockchain transaction successful!
   └─ Option ID: 123
   └─ Transaction Hash: 0xabcd...
```

**✅ In App Console:**

```bash
🔗 KokitzuApp: Placing BLOCKCHAIN bet...
   └─ Wallet: 0x742d...4C6
   └─ Asset: BTC UP
   └─ Amount: 0.001000 ETH
   └─ Timeframe: FIVE_MINUTES
✅ KokitzuApp: Blockchain bet placed successfully!
```

### **5. Test Error Scenarios**

#### **No Wallet Connected**

- Should show "Connect Wallet for Blockchain Betting"
- Alert: "Please connect your wallet to place blockchain bets"

#### **Insufficient Balance**

- Should show "Insufficient Balance" button
- Alert with specific balance and network info

#### **Transaction Failure**

- Enhanced error messages based on failure type
- Specific guidance for each error type

---

## 🔍 **Debugging Guide**

### **If Blockchain Bets Fail:**

1. **Check Server Logs First**

   - Look for "🔗 BLOCKCHAIN PATH" messages
   - Check for contract initialization errors
   - Verify environment variables are set

2. **Check App Console**

   - Look for "🔗 KokitzuApp: Placing BLOCKCHAIN bet" messages
   - Verify wallet address is being sent
   - Check amount conversion (USD → ETH)

3. **Verify Wallet Setup**

   - Ensure wallet is connected to Sepolia testnet
   - Check Sepolia ETH balance (need > 0.001 ETH)
   - Verify wallet address matches what's shown in app

4. **Network Issues**
   - Check Sepolia RPC endpoint is working
   - Verify smart contract is deployed at specified address
   - Test with smaller amounts first

### **Common Error Solutions:**

| Error                   | Solution                        |
| ----------------------- | ------------------------------- |
| "insufficient funds"    | Add more Sepolia ETH to wallet  |
| "user rejected"         | Approve transaction in wallet   |
| "network error"         | Check internet and RPC endpoint |
| "contract not deployed" | Verify CONTRACT_ADDRESS in .env |
| "gas too low"           | Increase gas limit in wallet    |

---

## ⚡ **Performance Notes**

- **USD to ETH Conversion**: Happens client-side using real-time ETH price
- **Transaction Monitoring**: Full blockchain transaction details tracked
- **Error Recovery**: Smart error handling with specific user guidance
- **Real-time Updates**: Active bets update with blockchain status

---

## 🔄 **What Changed from Legacy**

| Before                  | Now                                |
| ----------------------- | ---------------------------------- |
| `useBlockchain: false`  | `useBlockchain: true` (always)     |
| No wallet address sent  | Always sends `walletAddress`       |
| USD betting amounts     | ETH amounts for blockchain         |
| Generic error messages  | Blockchain-specific error handling |
| No transaction tracking | Full transaction hash and details  |
| Legacy in-memory bets   | Smart contract bets only           |

---

## 🎯 **Next Steps**

1. **Test thoroughly** with different bet amounts and timeframes
2. **Monitor gas usage** and optimize if needed
3. **Test error scenarios** to ensure good UX
4. **Consider adding** transaction status tracking
5. **Add analytics** for blockchain bet success rates

The app now provides a complete blockchain betting experience with proper smart contract integration! 🚀
