# 📱 Mobile Wallet Integration Guide

## 🎯 **Two Available Approaches**

You now have **TWO ways** to handle mobile wallet integration while keeping the **Mobile App → Server → Smart Contract** architecture:

---

## **Option 1: Server Pays (CURRENT - WORKING)**

_Server pays gas & bet, user gets credited as trader_

### **Flow:**

```
📱 Mobile App → 🖥️ Server (pays ETH) → 📋 Smart Contract (credits user)
```

### **Mobile App Code:**

```typescript
// Use existing placeBet mutation
const [placeBet] = useMutation(PLACE_BET);

await placeBet({
  variables: {
    input: {
      cryptoSymbol: "BTC",
      betType: "UP",
      amount: 0.01,
      timeframe: "ONE_MINUTE",
      useBlockchain: true,
      walletAddress: "0x840b1F3A7B8cAf98A44fB60aDaE934AEf2d4364b", // Your wallet
    },
  },
});
```

### **What Happens:**

1. 🖥️ **Server wallet** pays 0.01 ETH + gas
2. 📋 **Smart contract** records YOU as trader
3. 💰 **Winnings go to YOUR wallet**
4. 🔄 **Server covers all costs**

**Pros**: ✅ Simple, works immediately, no user gas needed  
**Cons**: ❌ Server needs funding, user doesn't "risk" their ETH

---

## **Option 2: User Pays (NEW - WHAT YOU WANTED)**

_Server prepares transaction, user's wallet pays_

### **Flow:**

```
📱 Mobile App → 🖥️ Server (prepares TX) → 📱 Mobile App (signs TX) → 📋 Smart Contract
```

### **Mobile App Code:**

```typescript
// Step 1: Get transaction data from server
const PREPARE_TRANSACTION = gql`
  mutation PrepareBlockchainTransaction($input: PlaceBetInput!) {
    prepareBlockchainTransaction(input: $input) {
      success
      transactionData {
        to
        data
        value
        gasLimit
      }
      message
    }
  }
`;

const [prepareTransaction] = useMutation(PREPARE_TRANSACTION);

// Step 2: Get transaction data
const { data } = await prepareTransaction({
  variables: {
    input: {
      cryptoSymbol: "BTC",
      betType: "UP",
      amount: 0.01,
      timeframe: "ONE_MINUTE",
      walletAddress: userWalletAddress,
    },
  },
});

// Step 3: User's wallet signs and sends transaction
const txData = data.prepareBlockchainTransaction.transactionData;
const tx = await userSigner.sendTransaction({
  to: txData.to,
  data: txData.data,
  value: txData.value,
  gasLimit: txData.gasLimit,
});

// Step 4: Wait for confirmation
const receipt = await tx.wait();
console.log("✅ Bet placed by user's wallet:", receipt.hash);

// Step 5: Record the bet in database
await recordBlockchainBet({
  variables: {
    input: {
      cryptoSymbol: "BTC",
      betType: "UP",
      amount: 0.01,
      timeframe: "ONE_MINUTE",
      walletAddress: userWalletAddress,
      optionId: "extracted_from_receipt",
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      entryPrice: currentBTCPrice,
    },
  },
});
```

### **What Happens:**

1. 🖥️ **Server prepares** transaction data
2. 📱 **User's wallet pays** 0.01 ETH + gas
3. 📋 **Smart contract** records user as trader
4. 💰 **Winnings go to user's wallet**
5. 🎯 **User "risks" their own ETH**

**Pros**: ✅ User pays their own gas, true wallet risk  
**Cons**: ❌ More complex, requires WalletConnect integration

---

## 🔧 **Implementation Status**

### **Current Contract**: `0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE`

- ✅ **Both approaches supported**
- ✅ **Server-paid betting** (Option 1) works now
- ✅ **User-paid betting** (Option 2) ready for implementation

### **What's Ready:**

- ✅ Smart contract deployed with both functions
- ✅ Server has both `placeBet()` and `prepareTransaction()`
- ✅ GraphQL mutations available
- ✅ Transaction preparation working

### **What You Need to Add:**

- 📱 **Mobile app**: WalletConnect transaction signing
- 📱 **Mobile app**: Switch between Option 1 and Option 2
- 🎛️ **Settings**: Let user choose payment method

---

## 🎯 **Recommendation**

### **For Testing**: Use **Option 1** (server pays)

- Immediate testing possible
- No additional mobile app changes needed
- Server covers all costs

### **For Production**: Implement **Option 2** (user pays)

- True user wallet experience
- User controls their own funds
- Aligns with your requirements

---

## 📊 **Comparison Table**

| Aspect             | Option 1 (Server Pays) | Option 2 (User Pays) |
| ------------------ | ---------------------- | -------------------- |
| **User Gas**       | ❌ None                | ✅ User pays         |
| **ETH Risk**       | ❌ Server risk         | ✅ User risk         |
| **Complexity**     | ✅ Simple              | ⚠️ Complex           |
| **Server Cost**    | ❌ High                | ✅ Low               |
| **Mobile Changes** | ✅ None                | ⚠️ Required          |
| **WalletConnect**  | ✅ Display only        | ✅ Full integration  |

---

## 🚀 **Next Steps**

1. **Test Option 1**: Use current mobile app (should work immediately)
2. **Implement Option 2**: Add WalletConnect transaction signing
3. **Add Toggle**: Let users choose between server-paid vs user-paid
4. **Monitor Costs**: Track server wallet balance vs user satisfaction

**The architecture you wanted is now possible!** 🎉

Choose the approach that best fits your needs. Both maintain the **Mobile App → Server → Smart Contract** flow while giving you control over who pays the costs.
