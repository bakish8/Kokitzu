# 🌐 Network Switching Guide

מדריך מלא למעבר בין רשתות Testnet ו-Mainnet בפרויקט CryptoGraphQL.

## 🚀 Quick Commands

### מעבר לרשת טסט (Arbitrum Sepolia):

```bash
npm run switch:testnet
```

### מעבר לרשת ייצור (Arbitrum One):

```bash
npm run switch:mainnet
```

### פריסה מלאה עם החלפת רשת:

```bash
# טסט
npm run deploy:testnet

# ייצור
npm run deploy:mainnet
```

## 📋 מה הסקריפט עושה

הסקריפט `scripts/switch-network.js` מעדכן אוטומטית:

### 1. **קובץ `contracts/.env`:**

- `MAINNET_RPC_URL` - URL של RPC
- `SEPOLIA_RPC_URL` - URL של RPC
- משאיר את ה-`PRIVATE_KEY` ללא שינוי

### 2. **קובץ `server/.env`:**

- `SEPOLIA_RPC_URL` - URL של השרת
- `NODE_ENV` - development/production
- משאיר את כל שאר ההגדרות ללא שינוי

### 3. **קובץ `server/app.js`:**

- `CHAINLINK_FEEDS` - כתובות Chainlink Price Feeds
- `provider` - ספק הבלוקצ'יין

### 4. **קובץ `KokitzuApp/src/contexts/NetworkContext.tsx`:**

- `defaultNetwork` - רשת ברירת מחדל באפליקציה
- `AsyncStorage` default - הגדרת רשת ברירת מחדל

### 5. **קובץ `KokitzuApp/src/contexts/EthPriceContext.tsx`:**

- הודעות לוג - מעדכן את המקור של מחירי ETH
- תיאור רשת - מציין מאיזו רשת המחירים מגיעים

### 6. **קובץ `KokitzuApp/src/services/walletconnect.ts`:**

- `currentNetwork` - רשת ברירת מחדל לשירות WalletConnect
- `getWalletBalance` - הוספת תמיכה ב-Arbitrum Sepolia (Chain ID: 421614)

## 🔧 Manual Usage

### שימוש ישיר בסקריפט:

```bash
# מעבר לטסט
node scripts/switch-network.js testnet

# מעבר לייצור
node scripts/switch-network.js mainnet
```

### בדיקת רשתות זמינות:

```bash
node scripts/switch-network.js
```

## 📊 Network Configurations

### Arbitrum Sepolia (Testnet):

- **RPC:** `https://sepolia-rollup.arbitrum.io/rpc`
- **Chain ID:** `421614`
- **Explorer:** `https://sepolia.arbiscan.io`
- **Environment:** `development`
- **Chainlink Feeds:**
  - ETH/USD: `0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165`
  - BTC/USD: `0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69`
  - LINK/USD: `0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298`

### Arbitrum One (Mainnet):

- **RPC:** `https://arb1.arbitrum.io/rpc`
- **Chain ID:** `42161`
- **Explorer:** `https://arbiscan.io`
- **Environment:** `production`
- **Chainlink Feeds:**
  - ETH/USD: `0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612`
  - BTC/USD: `0x6ce185860a4963106506C203335A2910413708e9`
  - LINK/USD: `0x86E53CF1B870786351Da77A57575e79CB55812CB`

## 🔄 Workflow Example

### פיתוח ובדיקות (Testnet):

```bash
# 1. החלף לטסט
npm run switch:testnet

# 2. החלף MetaMask לרשת Arbitrum Sepolia
# 3. קבל ETH טסט מפאוסט

# 4. פרוס חוזה
cd contracts
npx hardhat run deploy.js --network arbitrumSepolia

# 5. עדכן CONTRACT_ADDRESS בקבצי .env
```

### העלאה לייצור (Mainnet):

```bash
# 1. החלף לייצור
npm run switch:mainnet

# 2. ודא שיש ETH אמיתי ב-Arbitrum One
# 3. פרוס חוזה
cd contracts
npx hardhat run deploy.js --network arbitrumOne

# 4. עדכן CONTRACT_ADDRESS בקבצי .env
```

## ⚠️ Important Notes

### לפני פריסה ב-Mainnet:

1. **בדוק יתרה:** ודא שיש לך מספיק ETH (לפחות 0.003 ETH)
2. **בדוק רשת:** ודא שאתה מחובר לרשת הנכונה ב-MetaMask
3. **גיבוי:** שמור גיבוי של הקונפיגורציה הקודמת

### אחרי פריסה:

1. **עדכן כתובת חוזה:** העתק את כתובת החוזה החדש לקבצי `.env`
2. **בדוק שרת:** ודא שהשרת מתחבר לרשת הנכונה
3. **בדוק אפליקציה:** ודא שהאפליקציה עובדת עם הרשת החדשה

## 🔍 Troubleshooting

### שגיאות נפוצות:

#### "File not found":

```bash
# ודא שאתה ברוט של הפרויקט
ls scripts/switch-network.js
```

#### "Network not supported":

```bash
# בדוק שמות רשתות זמינות
node scripts/switch-network.js
```

#### "Permission denied":

```bash
# הוסף הרשאות הפעלה
chmod +x scripts/switch-network.js
```

## 📝 Adding New Networks

לשינוי או הוספת רשתות חדשות, ערוך את `scripts/switch-network.js`:

```javascript
const NETWORKS = {
  // הוסף רשת חדשה כאן
  newNetwork: {
    name: "New Network",
    rpc: "https://new-network-rpc.com",
    chainId: 12345,
    explorer: "https://new-explorer.com",
    chainlink: {
      ETH: "0x...",
      BTC: "0x...",
      LINK: "0x...",
    },
    defaultNetwork: "newNetwork",
    nodeEnv: "development",
  },
};
```

## 🎯 Best Practices

1. **תמיד בדוק** את הרשת לפני פריסה
2. **שמור גיבויים** של קבצי `.env`
3. **בדוק מחירי גז** לפני פריסה ב-mainnet
4. **השתמש בטסט** לפני העלאה לייצור
5. **עדכן תיעוד** אחרי שינויים

---

**Created by:** CryptoGraphQL Team  
**Last Updated:** $(date)  
**Version:** 1.0.0
