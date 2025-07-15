# IP Configuration Guide

This app now uses a **constant IP address** instead of dynamic IP detection for faster development and more reliable connections.

## Current Configuration

The app is configured to use the IP address: `192.168.10.116`

## How to Update the IP Address

### Option 1: Use the Update Script (Recommended)

Run the update script from the project root:

```bash
node scripts/update-ip.js
```

This script will:

1. Automatically detect your current IP address
2. Show you the current configuration
3. Ask for confirmation before updating
4. Update the configuration file automatically

### Option 2: Manual Update

1. Find your current IP address:

   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Open `src/config/network.ts`

3. Update the `DEVELOPMENT` configuration:
   ```typescript
   DEVELOPMENT: {
     GRAPHQL_URL: "http://YOUR_NEW_IP:4000/graphql",
     WEBSOCKET_URL: "ws://YOUR_NEW_IP:4000/graphql",
   },
   ```

## When to Update the IP

Update the IP address when:

- You change networks (different WiFi)
- Your computer gets a new IP from DHCP
- You're developing on a different machine

## Benefits of Constant IP

✅ **Faster app startup** - No IP detection delay  
✅ **More reliable** - No network scanning issues  
✅ **Simpler debugging** - Clear, predictable configuration  
✅ **Better performance** - No dynamic detection overhead

## Troubleshooting

### App won't connect to server

1. Make sure your GraphQL server is running on port 4000
2. Check that the IP in `src/config/network.ts` matches your computer's IP
3. Ensure your phone and computer are on the same network
4. Check if port 4000 is blocked by firewall

### IP detection fails

If the update script can't detect your IP:

1. Run `ifconfig | grep inet` (macOS/Linux) or `ipconfig` (Windows)
2. Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)
3. Manually update the configuration file

## File Structure

- `src/config/network.ts` - Main network configuration
- `scripts/update-ip.js` - IP update utility
- `src/graphql/client.ts` - Apollo client configuration

## Development vs Production

- **Development**: Uses constant IP from `NETWORK_CONFIG.DEVELOPMENT`
- **Production**: Uses production URLs from `NETWORK_CONFIG.PRODUCTION`
- **Local**: Uses localhost for simulator testing
