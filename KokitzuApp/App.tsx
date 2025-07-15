import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import { initializeApolloClient, getApolloClient } from "./src/graphql/client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LivePricesScreen from "./src/screens/LivePricesScreen";
import BinaryOptionsScreen from "./src/screens/BinaryOptionsScreen";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { TradingProvider } from "./src/contexts/TradingContext";
import { WalletProvider } from "./src/contexts/WalletContext";
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

  useEffect(() => {
    const initClient = async () => {
      try {
        console.log("🚀 Initializing app with dynamic IP detection...");
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

  if (initializing || !apolloClient) {
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
          Initializing network connection...
        </Text>
      </View>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <TradingProvider>
          <WalletProvider>
            <AppContent />
          </WalletProvider>
        </TradingProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
