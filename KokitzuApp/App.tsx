import "react-native-get-random-values";
import "react-native-reanimated";
import React, { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WalletConnectModal } from "@walletconnect/modal-react-native";
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";

import { initializeApolloClient, getApolloClient } from "./src/graphql/client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LivePricesScreen from "./src/screens/LivePricesScreen";
import BinaryOptionsScreen from "./src/screens/BinaryOptionsScreen";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { TradingProvider } from "./src/contexts/TradingContext";
import { WalletProvider } from "./src/contexts/WalletContext";
import { NetworkProvider } from "./src/contexts/NetworkContext";
import AuthModal from "./src/components/AuthModal";
import usePerformanceMonitor from "./src/hooks/usePerformanceMonitor";

// Simple crypto polyfill for React Native
if (typeof global.crypto === "undefined") {
  // @ts-ignore
  global.crypto = {
    getRandomValues: (arr: any) => {
      const bytes = new Uint8Array(arr.length);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      arr.set(bytes);
      return arr;
    },
  };
}

const Tab = createBottomTabNavigator();

// WalletConnect configuration
const projectId = "7f511967202c5d90747168fd9f2e8c3c";
const providerMetadata = {
  name: "KokitzuApp",
  description: "Crypto Binary Options Trading App",
  url: "https://kokitzu.app",
  icons: ["https://kokitzu.app/icon.png"],
  redirect: {
    native: "kokitzuapp://",
    universal: "https://kokitzu.app",
  },
};

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Performance monitoring
  usePerformanceMonitor();

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0f23",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="LivePrices"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
                "home";
              if (route.name === "LivePrices") iconName = "chart-line";
              else if (route.name === "BinaryOptions")
                iconName = "swap-horizontal";
              else if (route.name === "Portfolio") iconName = "wallet";
              return (
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={color}
                />
              );
            },
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#1a1a2e",
              borderTopColor: "#333",
            },
            tabBarActiveTintColor: "#3b82f6",
            tabBarInactiveTintColor: "#666",
          })}
        >
          <Tab.Screen
            name="LivePrices"
            component={LivePricesScreen}
            options={{ title: "Live Prices" }}
          />
          <Tab.Screen
            name="BinaryOptions"
            component={BinaryOptionsScreen}
            options={{ title: "Binary Options" }}
          />
          <Tab.Screen
            name="Portfolio"
            component={PortfolioScreen}
            options={{ title: "Portfolio" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default function App() {
  const [apolloClient, setApolloClient] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  // Load Space Grotesk fonts
  const [fontsLoaded] = useFonts({
    "SpaceGrotesk-Light": SpaceGrotesk_300Light,
    "SpaceGrotesk-Regular": SpaceGrotesk_400Regular,
    "SpaceGrotesk-Medium": SpaceGrotesk_500Medium,
    "SpaceGrotesk-SemiBold": SpaceGrotesk_600SemiBold,
    "SpaceGrotesk-Bold": SpaceGrotesk_700Bold,
  });

  // Prevent splash screen from hiding until fonts are loaded
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    const initClient = async () => {
      try {
        console.log("🚀 Initializing app with constant IP configuration...");
        const client = await initializeApolloClient();
        setApolloClient(client);
      } catch (error) {
        console.error("❌ Failed to initialize Apollo Client:", error);
      } finally {
        setInitializing(false);
      }
    };

    initClient();
  }, []);

  // Hide splash screen when fonts and Apollo client are loaded
  useEffect(() => {
    if (fontsLoaded && !initializing) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initializing]);

  if (initializing || !apolloClient || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f0f23",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 18 }}>
          Initializing app...
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ApolloProvider client={apolloClient}>
        <NetworkProvider>
          <AuthProvider>
            <WalletProvider>
              <TradingProvider>
                <AppContent />
                <WalletConnectModal
                  projectId={projectId}
                  providerMetadata={providerMetadata}
                />
              </TradingProvider>
            </WalletProvider>
          </AuthProvider>
        </NetworkProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
