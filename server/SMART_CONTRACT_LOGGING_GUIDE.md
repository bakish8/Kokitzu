# Smart Contract Logging Guide

## Overview

Comprehensive logging has been added to track all smart contract operations, helping you monitor whether blockchain functionality is working properly or encountering issues.

## Startup Logs

### System Banner

```
============================================================
🚀 CRYPTOGRAPHQL SERVER STARTING UP
============================================================
📊 Price Service: CoinGecko API (Free tier)
⏱️  Fetch Interval: 90s
🪙 Tracking 20 cryptocurrencies
============================================================
```

### Contract Initialization

```
🔗 Initializing Smart Contract Service...
✅ Smart Contract Service initialized successfully
🎯 Contract event listeners are active
🧪 Testing contract connectivity...
✅ Contract connectivity test passed
📊 Current stats - Options: 5, Balance: 2.5 ETH
```

**If contract fails:**

```
❌ Failed to initialize Smart Contract Service: Contract not deployed
⚠️  Blockchain betting features will not be available
💡 Falling back to in-memory betting only
```

## Contract Health Monitoring

### Periodic Health Checks (Every 5 minutes)

```
🔍 Performing contract health check...
💚 Contract health check passed
📈 Stats: 12 options, 5.2 ETH balance
```

**If health check fails:**

```
❤️‍🩹 Contract health check failed: Network connection timeout
⚠️  Contract may be experiencing connectivity issues
```

## Query Operations

### Contract Stats Query

```
📊 Fetching contract stats...
✅ Contract stats retrieved successfully: { totalOptions: 15, contractBalance: 3.8 }
```

### Blockchain Bets Query

```
🔍 Fetching blockchain bets for wallet: 0x1234...5678
✅ Retrieved 3 blockchain bets for user
```

**No wallet provided:**

```
⚠️  No wallet address provided for blockchain bets query
```

**Query fails:**

```
❌ Failed to get blockchain bets: Contract call reverted
🔍 Wallet may not have any bets or contract is inaccessible
```

## Betting Operations

### Blockchain Bet Placement

```
🔗 Initiating blockchain bet...
   └─ Wallet: 0x1234...5678
   └─ Asset: BTC | Direction: UP | Amount: 0.1 ETH
   └─ Timeframe: FIVE_MINUTES
📝 Calling smart contract placeBet function...
✅ Blockchain transaction successful!
   └─ Option ID: 123
   └─ Transaction Hash: 0xabcd...
   └─ Block Number: 18456789
   └─ Gas Used: 125000
💾 Blockchain bet saved to database: bet-uuid-123
🎯 Entry price recorded: $42,500
```

**If blockchain bet fails:**

```
❌ Blockchain bet failed:
   └─ Error: insufficient funds for intrinsic transaction cost
   └─ Stack: [error stack trace]
💰 Insufficient funds in wallet
```

**Error Types:**

- `💰 Insufficient funds in wallet`
- `⛽ Gas-related error - check gas limits`
- `🔄 Transaction reverted - check contract logic`
- `🌐 Network connection issue`

### Legacy Bet Placement

```
💾 Placing legacy (in-memory) bet...
✅ Legacy bet placed successfully:
   └─ Bet ID: bet-uuid-456
   └─ Asset: ETH | Direction: DOWN
   └─ Amount: $100 | Entry Price: $2,850
   └─ Timeframe: FIFTEEN_MINUTES | Expires: 2024-01-15T10:30:00.000Z
   └─ User balance after bet: $9,900
```

## Option Execution

### Successful Execution

```
⚡ Executing blockchain option: 123
📝 Calling smart contract executeOption function...
✅ Option execution transaction successful!
   └─ Transaction Hash: 0xef12...
   └─ Block Number: 18456790
   └─ Gas Used: 95000
🔍 Looking up bet in database...
📖 Found bet: bet-uuid-123
📊 Fetching updated option data from blockchain...
💾 Bet updated in database:
   └─ Status: WON
   └─ Result: WIN
   └─ Exit Price: $43,200
   └─ Payout: 0.08 ETH
🎯 Option execution completed successfully!
```

**If execution fails:**

```
❌ Failed to execute blockchain option:
   └─ Option ID: 123
   └─ Error: Option not ready for execution
   └─ Stack: [error stack trace]
⏰ Option not ready for execution yet
```

**Execution Error Types:**

- `⏰ Option not ready for execution yet`
- `🔄 Option already executed`
- `🔍 Option not found on blockchain`

**If bet not found in database:**

```
⚠️  No bet found in database for option 123
```

## Price Updates

### Successful Price Fetching

```
Fetching crypto prices from CoinGecko...
✅ Crypto prices updated successfully at 2024-01-15T10:15:30.000Z
```

### Rate Limited

```
Rate limited by CoinGecko (429). Consecutive errors: 1
CoinGecko suggests retrying after 60 seconds
```

## Common Log Patterns

### ✅ Everything Working

- Server starts with system banner
- Contract initializes successfully
- Health checks pass every 5 minutes
- Bets place successfully (blockchain or legacy)
- Price updates happen regularly

### ⚠️ Contract Issues

- Contract fails to initialize
- Health checks start failing
- Blockchain bets fail with contract errors
- Falls back to legacy betting

### ❌ Network/API Issues

- CoinGecko rate limiting
- Network connection timeouts
- Gas estimation failures

## Monitoring Recommendations

### 1. Startup Monitoring

Watch for the startup banner and contract initialization messages to ensure everything starts properly.

### 2. Health Check Monitoring

Monitor the 5-minute health checks to catch contract issues early:

```bash
# Monitor logs for health checks
tail -f server.log | grep "health check"
```

### 3. Error Pattern Monitoring

Set up alerts for critical error patterns:

```bash
# Monitor for contract failures
tail -f server.log | grep "❌.*contract\|❌.*blockchain"
```

### 4. Transaction Monitoring

Track successful blockchain transactions:

```bash
# Monitor successful blockchain operations
tail -f server.log | grep "✅.*transaction\|✅.*blockchain"
```

## Troubleshooting

### Contract Not Initializing

1. Check if contract is deployed on current network
2. Verify RPC connection in environment variables
3. Ensure wallet has sufficient funds for gas
4. Check contract address configuration

### Health Checks Failing

1. Monitor network connectivity
2. Check if blockchain node is responding
3. Verify contract hasn't been paused or upgraded
4. Check for network congestion

### Bet Placement Failing

1. Review specific error messages in logs
2. Check wallet balance for gas
3. Verify bet parameters are valid
4. Test with smaller amounts first

### No Logs Appearing

1. Ensure server is running with proper log level
2. Check if logs are being written to file vs console
3. Verify logging configuration in environment

The logging system provides comprehensive visibility into all smart contract operations, making it easy to identify and resolve issues quickly.
