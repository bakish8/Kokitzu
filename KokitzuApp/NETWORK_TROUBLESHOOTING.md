# Network Troubleshooting Guide

## 🚨 **"Network request has failed" Error on Real Device**

### **Root Cause**

The issue occurs because your app is trying to connect to `localhost:4000`, but on a real device, `localhost` refers to the device itself, not your computer where the server is running.

### **✅ Solution Applied**

I've updated your configuration to use your computer's IP address (`192.168.10.116`) instead of `localhost`.

## 🔧 **Configuration Changes Made**

### **1. Updated GraphQL Client**

- **File:** `src/graphql/client.ts`
- **Change:** Now uses `192.168.10.116:4000` for real devices
- **Result:** Real devices can now connect to your server

### **2. Created Network Configuration**

- **File:** `src/config/network.ts`
- **Purpose:** Manage different URLs for development/production
- **Benefit:** Easy to switch between environments

## 🧪 **Testing Steps**

### **Step 1: Verify Server is Running**

```bash
# Check if your GraphQL server is running
lsof -i :4000

# Should show your server process
```

### **Step 2: Test Network Connectivity**

```bash
# From your phone, try to access:
http://192.168.10.116:4000/graphql

# You should see a GraphQL endpoint response
```

### **Step 3: Test App Connection**

1. **Start Expo server:** `npx expo start --clear`
2. **Scan QR code** with Expo Go
3. **Try to login** - should now work

## 🔍 **Troubleshooting Checklist**

### **If Still Not Working:**

#### **1. Check IP Address**

```bash
# Get your current IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update src/config/network.ts if IP changed
```

#### **2. Check Server Accessibility**

```bash
# Test if server is accessible from network
curl http://192.168.10.116:4000/graphql

# Should return GraphQL response
```

#### **3. Check Firewall**

```bash
# Allow port 4000 through firewall
sudo ufw allow 4000

# Or check macOS firewall settings
```

#### **4. Check Network**

- Ensure phone and computer are on same WiFi
- Try different WiFi network
- Check router settings

#### **5. Test with Different Port**

If port 4000 is blocked, try a different port:

```bash
# Update server to use port 3000
# Update src/config/network.ts accordingly
```

## 🛠 **Alternative Solutions**

### **Option 1: Use Expo Tunnel**

```bash
# Start with tunnel mode
npx expo start --tunnel

# This creates a public URL that works from anywhere
```

### **Option 2: Use ngrok**

```bash
# Install ngrok
npm install -g ngrok

# Create tunnel to your server
ngrok http 4000

# Use the ngrok URL in your app
```

### **Option 3: Use Local Network Discovery**

```bash
# Install local network discovery
npm install react-native-local-network-permission

# Automatically find server on local network
```

## 📱 **Device-Specific Issues**

### **iOS Issues**

- **Problem:** iOS blocks non-HTTPS connections
- **Solution:** Use HTTP for development, HTTPS for production
- **Workaround:** Add network security exceptions

### **Android Issues**

- **Problem:** Android blocks cleartext traffic
- **Solution:** Add `android:usesCleartextTraffic="true"` to AndroidManifest.xml

## 🔒 **Security Considerations**

### **Development vs Production**

- **Development:** Use local IP (192.168.10.116)
- **Production:** Use HTTPS with proper domain
- **Never:** Commit production URLs to version control

### **Environment Variables**

```bash
# Create .env file
GRAPHQL_URL_DEV=http://192.168.10.116:4000/graphql
GRAPHQL_URL_PROD=https://your-server.com/graphql
```

## 📊 **Monitoring Network Requests**

### **Add Network Logging**

```typescript
// In your GraphQL client
const httpLink = createHttpLink({
  uri: getGraphQLUrl(),
  fetch: (uri, options) => {
    console.log("GraphQL Request:", uri);
    return fetch(uri, options);
  },
});
```

### **Check Network Tab**

- Use browser dev tools to monitor requests
- Check for CORS errors
- Verify request/response format

## 🎯 **Quick Fix Commands**

```bash
# 1. Get your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Test server
curl http://YOUR_IP:4000/graphql

# 3. Start Expo
npx expo start --clear

# 4. Test on device
# Scan QR code and try login
```

## 📞 **Still Having Issues?**

1. **Check console logs** in Expo Go
2. **Check server logs** in your terminal
3. **Try tunnel mode:** `npx expo start --tunnel`
4. **Test with Postman** or browser
5. **Check network permissions** on device

## 🚀 **Next Steps**

After fixing network issues:

1. **Test all features** on real device
2. **Test on different devices** (iOS/Android)
3. **Test on different networks** (WiFi/4G)
4. **Prepare for production** deployment
