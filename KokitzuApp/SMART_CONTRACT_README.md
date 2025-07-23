# Smart Contract Integration Guide

## What is the Contract ABI?

The ABI (Application Binary Interface) is a JSON file that describes the interface of your smart contract. It allows applications (like your server or frontend) to interact with the contract on the blockchain, regardless of the network (Ethereum mainnet, Sepolia, etc.).

## Why do you need the ABI?

- The ABI tells your app how to encode/decode function calls and events for the contract.
- It is required for both reading from and writing to the contract using libraries like ethers.js or web3.js.

## How to Get the ABI (for both Ethereum and Sepolia)

1. **Compile the Contract:**
   - In your `/contracts` directory, run:
     ```
     npx hardhat compile
     ```
2. **Locate the ABI:**
   - After compiling, find the ABI in the generated artifact:
     - Path: `artifacts/contracts/BinaryOptions.sol/BinaryOptions.json`
   - The ABI is the value of the `abi` key in this JSON file.
3. **Deploy the Contract:**
   - Deploy to your desired network (mainnet or Sepolia):
     ```
     npx hardhat run scripts/deploy.js --network sepolia
     npx hardhat run scripts/deploy.js --network mainnet
     ```
   - The deployment script will print the contract address. Save this address for your server/frontend config.
4. **Note:**
   - The ABI is the same for both networks if the contract code is unchanged. Only the contract address will differ between networks.

## Example Usage

- Use the ABI and the correct contract address in your server or frontend to interact with the contract on the selected network.

---

# 🚀 Kokitzu Binary Options Trading System

A complete decentralized binary options trading platform built on Ethereum with React Native integration.

## 📋 Overview

This system allows users to trade binary options on cryptocurrency prices using real ETH on the Ethereum blockchain. The platform features:

- **Smart Contract**: Secure, auditable binary options trading
- **Chainlink Integration**: Real-time price feeds from trusted sources
- **React Native App**: Mobile-first trading interface
- **WalletConnect Support**: Seamless wallet integration
- **Real ETH Trading**: Actual blockchain transactions

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Smart Contract│    │   Chainlink     │
│      App        │◄──►│   (Ethereum)    │◄──►│   Price Feeds   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WalletConnect  │    │   User Wallets  │    │   Real-time     │
│   Integration   │    │   (MetaMask)    │    │   Market Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Features

### Smart Contract Features

- ✅ **Binary Options Trading**: Call/Put options on crypto prices
- ✅ **Real-time Price Feeds**: Chainlink integration for accurate pricing
- ✅ **Secure Execution**: Reentrancy protection and access controls
- ✅ **Flexible Expiry Times**: 5 minutes to 24 hours
- ✅ **Multiple Assets**: ETH, BTC, MATIC (expandable)
- ✅ **Admin Controls**: Asset management and fee collection
- ✅ **Event Logging**: Complete transaction history

### React Native Features

- ✅ **Wallet Integration**: MetaMask and WalletConnect support
- ✅ **Real-time Trading**: Live price updates and option management
- ✅ **User-friendly UI**: Intuitive trading interface
- ✅ **Transaction Management**: Option creation and execution
- ✅ **Portfolio Tracking**: Active and completed options
- ✅ **Cross-platform**: iOS and Android support

## 🚀 Quick Start

### 1. Smart Contract Deployment

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your private key and API keys

# Compile contracts
npm run compile

# Deploy to testnet (Sepolia)
npm run deploy:sepolia

# Verify contract
npm run verify:sepolia
```

### 2. React Native Integration

```bash
# Navigate to app directory
cd ..

# Install dependencies
npm install

# Update contract address in binaryOptionsContract.ts
# Add your deployed contract address

# Start the app
npm start
```

## 📱 How to Trade

### 1. Connect Wallet

- Open the Kokitzu app
- Click "Connect Wallet"
- Choose MetaMask or WalletConnect
- Approve connection

### 2. Select Asset

- Choose from available assets (ETH, BTC, MATIC)
- View current market price
- Monitor price movements

### 3. Create Option

- Click "Trade Binary Options"
- Select amount (0.01 - 10 ETH)
- Choose expiry time (5 min - 24 hours)
- Select option type:
  - **Call**: Bet price will go up
  - **Put**: Bet price will go down

### 4. Execute Option

- Wait for expiry time
- Click "Execute" on expired options
- Receive payout if you win (80% of bet)

## 💰 Economic Model

### Payout Structure

- **Win**: 80% of bet amount
- **Loss**: 0% (lose entire bet)
- **House Edge**: 20%

### Example Trade

```
Bet Amount: 0.1 ETH
Option Type: Call (price up)
Strike Price: $2,000
Final Price: $2,100
Result: WIN
Payout: 0.08 ETH
```

## 🔒 Security Features

### Smart Contract Security

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Access control for admin functions
- **Input Validation**: All parameters validated
- **Price Feed Validation**: Ensures accurate pricing
- **Amount Limits**: Prevents excessive risk

### User Protection

- **Minimum/Maximum Amounts**: Per-asset limits
- **Expiry Time Limits**: 5 minutes to 24 hours
- **Owner Controls**: Emergency pause functionality
- **Event Logging**: Transparent transaction history

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npm test
```

Tests cover:

- ✅ Contract deployment
- ✅ Option creation and execution
- ✅ Price feed integration
- ✅ Admin functions
- ✅ Security measures
- ✅ Edge cases

### React Native Tests

```bash
# Run app tests
npm test

# Test wallet integration
npm run test:wallet

# Test contract integration
npm run test:contract
```

## 📊 Monitoring

### Key Metrics

- **Total Options**: Number of options created
- **Total Volume**: ETH volume traded
- **Contract Balance**: ETH held by contract
- **Win/Loss Ratio**: User performance

### Events to Monitor

- `OptionCreated`: New option created
- `OptionExecuted`: Option executed
- `AssetConfigUpdated`: Asset configuration changed

## 🔧 Configuration

### Asset Configuration

```javascript
// Add new asset
await contract.updateAssetConfig(
  "SOL",
  "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46", // Price feed
  ethers.utils.parseEther("0.01"), // Min amount
  ethers.utils.parseEther("10"), // Max amount
  150 // Fee percentage (1.5%)
);
```

### Platform Settings

```javascript
// Update platform fee
await contract.updatePlatformFee(150); // 1.5%

// Pause asset
await contract.pauseAsset("BTC");

// Resume asset
await contract.resumeAsset("BTC");
```

## 🚨 Emergency Procedures

### Pause Trading

```javascript
// Pause specific asset
await contract.pauseAsset("ETH");

// Resume trading
await contract.resumeAsset("ETH");
```

### Withdraw Fees

```javascript
// Withdraw accumulated fees
await contract.withdrawFees();
```

## 📈 Future Enhancements

### Planned Features

- **More Assets**: Add SOL, ADA, DOT, etc.
- **Advanced Options**: Spreads, straddles
- **Liquidity Pool**: Automated market making
- **Governance**: DAO for platform decisions
- **Mobile App**: Native iOS/Android apps
- **Analytics**: Advanced trading analytics

### Technical Improvements

- **Layer 2**: Optimistic rollups for lower fees
- **Cross-chain**: Multi-chain support
- **API**: Public API for third-party integration
- **SDK**: Developer SDK for integrations

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards

- **Solidity**: Follow OpenZeppelin standards
- **React Native**: Follow React Native best practices
- **Testing**: Maintain >90% test coverage
- **Documentation**: Update docs for all changes

## 📞 Support

### Getting Help

- **Documentation**: Check this README and deployment guide
- **Issues**: Report bugs on GitHub
- **Discussions**: Join community discussions
- **Email**: Contact support@kokitzu.app

### Common Issues

1. **Transaction Fails**: Check gas limits and ETH balance
2. **Price Feed Issues**: Verify Chainlink price feed status
3. **Wallet Connection**: Ensure wallet is connected to correct network
4. **Contract Not Found**: Verify contract address and network

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and entertainment purposes. Trading binary options involves significant risk of loss. Never invest more than you can afford to lose. The developers are not responsible for any financial losses incurred through the use of this software.

---

**🚀 Ready to start trading? Deploy the contract and integrate with your app!**

## What does it mean for the server to sign transactions?

- When your server interacts with the smart contract to write data (e.g., placing a bet), it must sign the transaction with a private key. This proves ownership and authorizes the action on-chain.
- The private key should belong to a dedicated server wallet (never a user wallet).
- **Security Best Practices:**
  - Never hardcode the private key in your codebase.
  - Store it in environment variables or a secure secrets manager.
  - Restrict access to the key and use a separate wallet for production and testing.

---

הטרנזקציה ששלחת (0xf564003ea9383e6d145c2cb1292c4060dd7474a44500dc6f16042c6c065f3653) **התקבלה בהצלחה** בבלוקצ'יין (Status: Success), והועברה לכתובת החוזה שלך.  
היא כוללת קריאה לפונקציה (כנראה `createOptionFor`) עם הפרמטרים הנכונים, והכסף (0.0028 ETH) נכנס לחוזה.

### מה זה אומר?

- **הפקדה:** הכסף נכנס לחוזה החכם.
- **הטרנזקציה הצליחה:** אין שגיאת גז, אין revert, אין בעיה בכניסה.
- **הבעיה שלך היא לא בהפקדה, אלא ב-execution/settlement** (כלומר, שלב סיום ההימור).

---

## מה לבדוק עכשיו?

### 1. **האם נוצרה אופציה בחוזה?**

- בדוק ב-Etherscan בלשונית **Events** של החוזה, האם יש `OptionCreated` עם הכתובת שלך.
- בדוק שה-`optionId` שנשמר אצלך תואם למה שנוצר באירוע.

### 2. **האם מתבצע settlement (executeOption)?**

- האם יש קריאה ל-`executeOption` עבור ה-`optionId` שלך?
- האם יש אירוע `OptionExecuted`?
- האם יש Internal Txn מהחוזה לארנק שלך (אם ניצחת)?

### 3. **מה קורה בשרת?**

- לפי הלוגים, השרת מנסה לבצע settlement, אבל נכשל כי הוא לא מצליח לקרוא את כתובת ה-trader מהחוזה (היא חוזרת null/undefined).
- זה נובע מבעיה ב-ABI או בפרסינג של התשובה מהחוזה.

---

## מה לעשות עכשיו?

### **שלב 1: בדוק את ה-ABI**

ודא שה-ABI של הפונקציה `getOption` הוא בדיוק:

```js
"function getOption(uint256 optionId) external view returns (uint256 id, address trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall, bool isExecuted, bool isWon, uint256 payout, uint256 timestamp, uint256 finalPrice)";
```

**לא tuple!**  
אם יש לך tuple ב-ABI, ethers.js לא ידע לפרש את זה נכון ויחזיר undefined/null.

### **שלב 2: בדוק מה חוזר מ-getOption**

- קרא ל-`getOption(optionId)` ידנית (ב-hardhat console או ethers.js REPL) ותראה מה חוזר.
- ודא שכתובת ה-trader היא הכתובת שלך.

### **שלב 3: בדוק את הלוגים החדשים**

- אחרי כל התיקונים שהוספנו, תפעיל את השרת מחדש ותשלח לי את הלוגים של:
  - הקריאה ל-getOption (מה חוזר)
  - כל שורה שמתחילה ב-`❌` או `⚠️`
  - כל שורה שמתחילה ב-`📊 Raw option data`

### **שלב 4: בדוק Internal Txns**

- אם settlement מצליח, אמור להופיע Internal Txn מהחוזה לארנק שלך (אם ניצחת).

---

## סיכום

- **הפקדה עובדת** (הטרנזקציה הצליחה).
- **הבעיה היא בשליפת נתוני האופציה מהחוזה** (כנראה בגלל ABI לא נכון או פרסינג לא נכון).
- **המשך לבדוק את הלוגים** אחרי התיקונים האחרונים, ותוודא שה-ABI תואם בדיוק למה שהחוזה מחזיר.

אם תשלח לי את הלוגים של הקריאה ל-getOption (כולל typeof, אורך, ערכים), אוכל לעזור לך לפתור את זה סופית!  
**אם תעדכן את ה-ABI כמו שצריך, הבעיה תיפתר.**
