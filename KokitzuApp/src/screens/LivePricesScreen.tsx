import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { GET_CRYPTO_PRICES, GET_COINS } from "../graphql/queries";
import { CryptoPrice, Coin } from "../types";
import CryptoCard from "../components/CryptoCard";
import SkeletonCryptoCard from "../components/SkeletonCryptoCard";
import { useTrading } from "../contexts/TradingContext";
import WalletConnectButton from "../components/WalletConnectButton";

const LivePricesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { setDefaultBet } = useTrading();

  const { loading, error, data, refetch } = useQuery(GET_CRYPTO_PRICES, {
    pollInterval: 30000,
    notifyOnNetworkStatusChange: true,
    errorPolicy: "all",
  });

  const { data: coinsData } = useQuery(GET_COINS, {
    errorPolicy: "all",
  });

  const filteredCryptoData = useMemo(() => {
    if (!data?.cryptoPrices) return [];
    return data.cryptoPrices.filter(
      (crypto: CryptoPrice) =>
        searchQuery === "" ||
        crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.cryptoPrices, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const handleCryptoPress = (crypto: CryptoPrice) => {
    setDefaultBet(crypto.symbol);
    (navigation as any).navigate("BinaryOptions");
  };

  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Prices</Text>
        <View style={styles.headerButtons}>
          <WalletConnectButton />
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cryptocurrencies..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && !data ? (
          // Loading skeleton
          <View style={styles.cardsContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCryptoCard key={i} />
            ))}
          </View>
        ) : (
          // Crypto cards
          <View style={styles.cardsContainer}>
            {filteredCryptoData.map((crypto: CryptoPrice) => (
              <CryptoCard
                key={crypto.id}
                crypto={crypto}
                onPress={() => handleCryptoPress(crypto)}
              />
            ))}
            {filteredCryptoData.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No cryptocurrencies found
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a2e",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  refreshButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchInput: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
  },
});

export default LivePricesScreen;
