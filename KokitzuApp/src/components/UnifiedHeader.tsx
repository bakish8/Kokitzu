import React from "react";
import { View, Image, StyleSheet } from "react-native";
import WalletConnectButton from "./WalletConnectButton";

interface UnifiedHeaderProps {
  showLogo?: boolean;
}

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ showLogo = true }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showLogo && (
          <Image
            source={require("../../assets/Koketsu.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.headerRight}>
        <View style={styles.headerButtons}>
          <WalletConnectButton />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 120,
    height: 32,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

export default UnifiedHeader;
