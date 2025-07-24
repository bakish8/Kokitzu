import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import COLORS from "../constants/colors";
import { FONTS } from "../constants/fonts";
import { apiService } from "../services/apiService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface CryptoOption {
  id: string;
  symbol: string;
  name: string;
  price: number;
  lastUpdated: string;
  source: string;
}

interface SimpleCryptoModalProps {
  visible: boolean;
  selectedCrypto: string;
  onCryptoSelect: (symbol: string) => void;
  onClose: () => void;
}

const SimpleCryptoModal: React.FC<SimpleCryptoModalProps> = ({
  visible,
  selectedCrypto,
  onCryptoSelect,
  onClose,
}) => {
  const [cryptos, setCryptos] = useState<CryptoOption[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch crypto prices
  const fetchCryptos = async () => {
    try {
      setLoading(true);
      await apiService.init();
      const prices = await apiService.getPrices();
      // Filter out any items with null/undefined prices to prevent errors
      const validPrices = prices.filter(
        (crypto: CryptoOption) => crypto && crypto.price != null
      );
      setCryptos(validPrices);
      setFilteredCryptos(validPrices);
      console.log(
        `✅ Loaded ${validPrices.length} cryptos for selector (filtered from ${prices.length})`
      );
    } catch (error) {
      console.error("❌ Error fetching cryptos for selector:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cryptos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCryptos(cryptos);
    } else {
      const filtered = cryptos.filter(
        (crypto) =>
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCryptos(filtered);
    }
  }, [searchQuery, cryptos]);

  // Fetch data when modal opens
  useEffect(() => {
    if (visible) {
      fetchCryptos();
      setSearchQuery("");
    }
  }, [visible]);

  const handleCryptoSelect = (symbol: string) => {
    onCryptoSelect(symbol);
    onClose();
  };

  const getCryptoIcon = (symbol: string) => {
    const iconMap: { [key: string]: string } = {
      BTC: "bitcoin",
      ETH: "ethereum",
      LINK: "link",
    };
    return iconMap[symbol] || "currency-usd";
  };

  const renderCryptoItem = ({ item }: { item: CryptoOption }) => {
    const isSelected = item.symbol === selectedCrypto;

    return (
      <TouchableOpacity
        style={[styles.cryptoItem, isSelected && styles.selectedItem]}
        onPress={() => handleCryptoSelect(item.symbol)}
      >
        <View style={styles.cryptoInfo}>
          <MaterialCommunityIcons
            name={getCryptoIcon(item.symbol) as any}
            size={32}
            color={isSelected ? COLORS.neonCardText : COLORS.accent}
            style={styles.cryptoIcon}
          />
          <View style={styles.cryptoDetails}>
            <Text
              style={[styles.cryptoSymbol, isSelected && styles.selectedText]}
            >
              {item.symbol}
            </Text>
            <Text
              style={[styles.cryptoName, isSelected && styles.selectedSubText]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.cryptoSource,
                isSelected && styles.selectedSubText,
              ]}
            >
              {item.source} • Live Price
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.cryptoPrice, isSelected && styles.selectedText]}>
            ${item.price ? item.price.toLocaleString() : "N/A"}
          </Text>
          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={COLORS.accent}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) {
    // console.log("🔍 SimpleCryptoModal: visible=false, not rendering");
    return null;
  }

  // console.log("🚀 SimpleCryptoModal: visible=true, rendering modal");
  // console.log(
  //   `📊 SimpleCryptoModal: ${filteredCryptos.length} cryptos available`
  // );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Cryptocurrency</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={COLORS.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cryptocurrencies..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>
                  Loading cryptocurrencies...
                </Text>
              </View>
            ) : filteredCryptos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={48}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyText}>No cryptocurrencies found</Text>
                <Text style={styles.emptySubText}>
                  Try adjusting your search terms
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredCryptos}
                renderItem={renderCryptoItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.list}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔗 Powered by Chainlink • Updated every 30s
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.REGULAR,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textMuted,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: FONTS.REGULAR,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  cryptoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    backgroundColor: COLORS.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedItem: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  cryptoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cryptoIcon: {
    marginRight: 12,
  },
  cryptoDetails: {
    flex: 1,
  },
  cryptoSymbol: {
    fontSize: 18,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  cryptoName: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cryptoSource: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.accent,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  cryptoPrice: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  selectedText: {
    color: COLORS.neonCardText,
  },
  selectedSubText: {
    color: COLORS.neonCardText,
    opacity: 0.8,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.REGULAR,
    color: COLORS.textMuted,
  },
});

export default SimpleCryptoModal;
