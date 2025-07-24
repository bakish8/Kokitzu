import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { FONTS } from "../constants/fonts";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface TradeSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onPlaceBet: () => void;
  betAmount: string;
  betAmountValue: number;
  betType: "UP" | "DOWN";
  selectedTimeframe: string;
  selectedCrypto: string;
  ethPrice: number;
  getPayoutMultiplier: (timeframe: string) => number;
  usdToEth: (usd: number, ethPrice: number) => number;
  formatUsd: (amount: number) => string;
  TIMEFRAMES: any[];
}

const TradeSummaryModal: React.FC<TradeSummaryModalProps> = ({
  visible,
  onClose,
  onPlaceBet,
  betAmount,
  betAmountValue,
  betType,
  selectedTimeframe,
  selectedCrypto,
  ethPrice,
  getPayoutMultiplier,
  usdToEth,
  formatUsd,
  TIMEFRAMES,
}) => {
  if (!visible) return null;

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
            <Text style={styles.title}>Trade Summary</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Investment:</Text>
              <View style={styles.valueCol}>
                <Text style={styles.amount}>{formatUsd(betAmountValue)}</Text>
                <Text style={styles.equivalent}>
                  Ξ {usdToEth(betAmountValue, ethPrice).toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Direction:</Text>
              <View
                style={[
                  styles.directionBadge,
                  betType === "UP"
                    ? styles.upDirectionBadge
                    : styles.downDirectionBadge,
                ]}
              >
                <MaterialCommunityIcons
                  name={betType === "UP" ? "trending-up" : "trending-down"}
                  size={16}
                  color={COLORS.textPrimary}
                />
                <Text style={styles.directionText}>{betType}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Timeframe:</Text>
              <Text style={styles.valueText}>
                {TIMEFRAMES.find((tf) => tf.value === selectedTimeframe)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Asset:</Text>
              <Text style={styles.valueText}>{selectedCrypto}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Potential Profit:</Text>
              <View style={styles.valueCol}>
                <Text style={styles.profit}>
                  +
                  {formatUsd(
                    betAmountValue *
                      (getPayoutMultiplier(selectedTimeframe) - 1)
                  )}
                </Text>
                <Text style={styles.profitEquivalent}>
                  +Ξ
                  {(
                    usdToEth(betAmountValue, ethPrice) *
                    (getPayoutMultiplier(selectedTimeframe) - 1)
                  ).toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Potential Loss:</Text>
              <View style={styles.valueCol}>
                <Text style={styles.loss}>-{formatUsd(betAmountValue)}</Text>
                <Text style={styles.lossEquivalent}>
                  -Ξ {usdToEth(betAmountValue, ethPrice).toFixed(4)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer - Place Bet Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.placeBetButton}
              onPress={onPlaceBet}
            >
              <Text style={styles.placeBetButtonText}>Place Bet</Text>
            </TouchableOpacity>
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
  content: {
    paddingHorizontal: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textSecondary,
  },
  valueCol: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.textPrimary,
  },
  equivalent: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  upDirectionBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  downDirectionBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  directionText: {
    fontSize: 12,
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  profit: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.success,
  },
  profitEquivalent: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  loss: {
    fontSize: 16,
    fontFamily: FONTS.BOLD,
    color: COLORS.error,
  },
  lossEquivalent: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 2,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  placeBetButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  placeBetButtonText: {
    color: COLORS.neonCardText,
    fontSize: 18,
    fontFamily: FONTS.BOLD,
  },
});

export default TradeSummaryModal;
