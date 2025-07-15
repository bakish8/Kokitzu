# Device Testing Guide for KokitzuApp

## 📱 **Quick Start (Expo Go)**

### **Step 1: Install Expo Go**

- **iOS:** App Store → Search "Expo Go"
- **Android:** Google Play Store → Search "Expo Go"

### **Step 2: Start Development Server**

```bash
cd /Users/omribakish/Desktop/CryptoGraphQL/KokitzuApp
npx expo start --clear
```

### **Step 3: Connect Your Device**

1. Make sure your phone and computer are on the same WiFi network
2. Scan the QR code:
   - **iOS:** Use Camera app
   - **Android:** Use Expo Go app

## 🔧 **Advanced Testing (Development Build)**

### **Option A: EAS Build (Recommended)**

1. **Install EAS CLI:**

```bash
npm install -g @expo/eas-cli
```

2. **Login to Expo:**

```bash
eas login
```

3. **Configure EAS:**

```bash
eas build:configure
```

4. **Build for Development:**

```bash
# For iOS
eas build --platform ios --profile development

# For Android
eas build --platform android --profile development
```

5. **Install on Device:**

- Download the build from the provided link
- Install on your device
- Use Expo Go to connect to development server

### **Option B: Local Build**

1. **Install Xcode (iOS) or Android Studio (Android)**

2. **Build Locally:**

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## 🧪 **Testing Checklist**

### **Basic Functionality**

- [ ] App launches without crashes
- [ ] Navigation between tabs works
- [ ] Live prices display correctly
- [ ] Binary options interface loads
- [ ] Portfolio screen shows data

### **Wallet Connection Testing**

- [ ] **MetaMask Connection:**

  - [ ] Tap "Connect Wallet" → "MetaMask"
  - [ ] App attempts to open MetaMask (if installed)
  - [ ] Shows download instructions (if not installed)
  - [ ] Connection completes successfully

- [ ] **WalletConnect Connection:**
  - [ ] Tap "Connect Wallet" → "WalletConnect"
  - [ ] QR code displays correctly
  - [ ] Connection URI is generated
  - [ ] Instructions are clear

### **Network Testing**

- [ ] App connects to Ethereum mainnet via Infura
- [ ] API calls work correctly
- [ ] No network timeouts
- [ ] Error handling works for network issues

### **Device-Specific Testing**

#### **iOS Testing**

- [ ] App works on iPhone (portrait)
- [ ] App works on iPad (if supported)
- [ ] Status bar displays correctly
- [ ] Safe area handling works
- [ ] Touch interactions are responsive

#### **Android Testing**

- [ ] App works on various screen sizes
- [ ] Edge-to-edge display works
- [ ] Back button navigation
- [ ] Touch interactions are responsive

## 🐛 **Common Issues & Solutions**

### **Issue: "Cannot connect to development server"**

**Solution:**

1. Check WiFi connection
2. Ensure phone and computer are on same network
3. Try using tunnel mode: `npx expo start --tunnel`

### **Issue: "Metro bundler not found"**

**Solution:**

```bash
npx expo start --clear
```

### **Issue: "Wallet connection fails"**

**Solution:**

1. Check API keys in `src/config/api.ts`
2. Verify network connectivity
3. Check console for specific error messages

### **Issue: "App crashes on launch"**

**Solution:**

1. Check for missing dependencies
2. Clear cache: `npx expo start --clear`
3. Check console for error logs

## 📊 **Performance Testing**

### **Load Testing**

- [ ] App launches in under 3 seconds
- [ ] Navigation is smooth (60fps)
- [ ] No memory leaks during extended use
- [ ] Battery usage is reasonable

### **Network Performance**

- [ ] API calls complete within 5 seconds
- [ ] Graceful handling of slow connections
- [ ] Offline mode works (if implemented)

## 🔒 **Security Testing**

### **Wallet Security**

- [ ] Private keys are never logged
- [ ] Sensitive data is not stored in plain text
- [ ] API keys are properly configured
- [ ] No sensitive data in console logs

## 📝 **Testing Report Template**

```
Device: [iPhone/Android Model]
OS Version: [iOS/Android Version]
App Version: [Your App Version]

✅ Working Features:
- [List working features]

❌ Issues Found:
- [List issues with steps to reproduce]

🔧 Performance:
- Launch time: [X seconds]
- Memory usage: [X MB]
- Battery impact: [Low/Medium/High]

📱 Device Compatibility:
- Screen size: [X x Y]
- Orientation: [Portrait/Landscape]
- Performance: [Good/Fair/Poor]

Recommendations:
- [List any recommendations for improvements]
```

## 🚀 **Production Testing**

Before releasing to production:

1. **Test on multiple devices:**

   - iPhone (various models)
   - Android (various brands)
   - Different screen sizes

2. **Test network conditions:**

   - WiFi
   - 4G/5G
   - Slow connections

3. **Test wallet integrations:**

   - Multiple wallet apps
   - Different connection methods

4. **Security audit:**
   - API key exposure
   - Data handling
   - Wallet security

## 📞 **Getting Help**

If you encounter issues:

1. **Check the console logs** in your terminal
2. **Check the device logs** in Expo Go
3. **Search the error message** online
4. **Check Expo documentation** at docs.expo.dev
5. **Ask in Expo Discord** or Stack Overflow

## 🎯 **Next Steps**

After successful testing:

1. **Fix any issues** found during testing
2. **Optimize performance** if needed
3. **Prepare for production** build
4. **Submit to app stores** (if applicable)
