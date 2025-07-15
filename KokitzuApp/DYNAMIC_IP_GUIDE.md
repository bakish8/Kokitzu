# Dynamic IP Address System

This system automatically detects and updates your local IP address, so you don't need to manually change it every time you move to a different network.

## 🚀 Quick Start

### Option 1: Automatic (Recommended)

```bash
npm run dev
```

This will automatically detect your IP and start the development server.

### Option 2: Manual IP Update

```bash
npm run update-ip
```

This will detect your current IP and update the configuration files.

### Option 3: In-App Refresh

Use the "Refresh" button in the NetworkStatus component (visible in development mode).

## 🔧 How It Works

### 1. IP Detection Methods (in order of preference)

1. **Native Network Info** (Most Reliable)

   - Uses `react-native-network-info` to get the actual device IP
   - Works on both WiFi and cellular networks

2. **Network Scanning**

   - Scans common local IP ranges (192.168.x.x, 10.0.x.x, etc.)
   - Tests connectivity to find the correct IP

3. **Fallback IPs**

   - Uses a list of previously detected IPs
   - Automatically updated when new IPs are found

4. **Localhost for Simulator**
   - Falls back to localhost when running in simulator

### 2. Caching System

- IP addresses are cached for 5 minutes to avoid repeated detection
- Cache is automatically cleared when network changes
- Manual refresh available through the NetworkStatus component

### 3. Dynamic Apollo Client

- Apollo Client is initialized with the detected IP
- Automatically reconnects when IP changes
- Handles network errors gracefully

## 📱 NetworkStatus Component

The NetworkStatus component shows:

- Current IP address
- Last update time
- Refresh button for manual updates

**Only visible in development mode** (`__DEV__` is true).

## 🛠️ Configuration Files

### `src/utils/networkUtils.ts`

Contains the core IP detection logic:

- `detectLocalIP()` - Main detection function
- `forceRefreshIP()` - Force refresh ignoring cache
- `clearCachedIP()` - Clear the IP cache
- `setManualIP()` - Manually set IP for testing

### `src/config/network.ts`

Network configuration with dynamic URL generation:

- `getGraphQLUrl()` - Returns dynamic GraphQL URL
- `getWebSocketUrl()` - Returns dynamic WebSocket URL
- `refreshNetworkUrls()` - Force refresh all URLs

### `src/graphql/client.ts`

Apollo Client with dynamic initialization:

- `initializeApolloClient()` - Initialize with detected IP
- `refreshApolloClient()` - Refresh with new IP
- `getApolloClient()` - Get the current client instance

## 🔄 Automatic Updates

### When IP Detection Happens

1. **App Startup** - Detects IP when app launches
2. **Network Changes** - Automatically detects new IP
3. **Manual Refresh** - User taps refresh button
4. **Cache Expiry** - Every 5 minutes

### IP Update Script

The `scripts/update-ip.js` script:

- Detects your computer's current IP
- Tests GraphQL server connectivity
- Updates fallback IP list
- Provides helpful feedback

## 🧪 Testing

### Test Network Connectivity

```bash
# Test if your server is accessible
curl http://YOUR_IP:4000/graphql
```

### Test IP Detection

```bash
# Run the IP update script
npm run update-ip
```

### Test In-App

1. Open the app in development mode
2. Look for the NetworkStatus bar at the top
3. Tap "Refresh" to test manual update

## 🚨 Troubleshooting

### Common Issues

1. **"Could not detect local IP address"**

   - Make sure you're connected to WiFi
   - Check if `react-native-network-info` is installed
   - Try manual refresh in the app

2. **"GraphQL server not accessible"**

   - Ensure your server is running on port 4000
   - Check firewall settings
   - Verify both devices are on the same network

3. **"Network refresh failed"**
   - Check internet connection
   - Restart the development server
   - Clear the app cache

### Debug Commands

```bash
# Check your current IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test server connectivity
curl -v http://YOUR_IP:4000/graphql

# Clear all caches and restart
npm run update-ip && npx expo start --clear
```

## 🔒 Security Notes

- IP detection only works on local networks
- No external IP addresses are used
- All network requests are local only
- Production builds use configured server URLs

## 📋 Environment Variables

No environment variables needed - the system is fully automatic.

## 🎯 Best Practices

1. **Always use `npm run dev`** for development
2. **Check NetworkStatus** when switching networks
3. **Use manual refresh** if automatic detection fails
4. **Keep your server running** on port 4000
5. **Test on real devices** regularly

## 🔄 Migration from Static IP

If you were previously using a static IP:

1. Remove hardcoded IP addresses from your code
2. Use the dynamic functions instead:

   ```typescript
   // Old way
   const url = "http://192.168.1.100:4000/graphql";

   // New way
   const url = await getGraphQLUrl();
   ```

3. Update your Apollo Client initialization:

   ```typescript
   // Old way
   const client = new ApolloClient({...});

   // New way
   const client = await initializeApolloClient();
   ```

## 📞 Support

If you encounter issues:

1. Check the console logs for error messages
2. Try the troubleshooting steps above
3. Use the NetworkStatus component to debug
4. Run `npm run update-ip` to verify IP detection

The system is designed to be robust and self-healing, so most issues resolve automatically!
