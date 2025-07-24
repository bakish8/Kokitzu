import React, { createContext, useContext, useState, useEffect } from "react";
import { CryptoPrice } from "../types";
import { useNetwork } from "./NetworkContext";
import { useWallet } from "./WalletContext";
import { useEthPrice } from "../utils/currencyUtils";
import { ethToUsd } from "../utils/currencyUtils";

interface TradingContextType {
  selectedCrypto: string;
  setSelectedCrypto: (symbol: string) => void;
  selectedTimeframe: string;
  setSelectedTimeframe: (timeframe: string) => void;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  betType: "UP" | "DOWN";
  setBetType: (type: "UP" | "DOWN") => void;
  setDefaultBet: (cryptoSymbol: string) => void;
  updateBetAmountToMaxSafe: (balance: number) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return context;
};

interface TradingProviderProps {
  children: React.ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({
  children,
}) => {
  const { currentNetwork } = useNetwork();
  const { balance, isConnected } = useWallet();
  const ethPrice = useEthPrice();

  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("ONE_MINUTE");
  const [betAmount, setBetAmount] = useState("0");
  const [betType, setBetType] = useState<"UP" | "DOWN">("UP");

  const setDefaultBet = (cryptoSymbol: string) => {
    setSelectedCrypto(cryptoSymbol);
    setSelectedTimeframe("ONE_MINUTE");
    setBetAmount("0");
    setBetType("UP");
  };

  const updateBetAmountToMaxSafe = (balance: number) => {
    if (balance > 0) {
      const maxBet = balance; // Full balance
      const maxBetUsd = ethToUsd(maxBet, ethPrice);
      setBetAmount(maxBetUsd.toFixed(2));
    }
  };

  // Effect to reset bet amount to 0 when wallet connects (but don't auto-update)
  useEffect(() => {
    if (isConnected && balance) {
      const currentBalance = parseFloat(balance);
      if (currentBalance > 0 && betAmount === "100") {
        // Only reset to 0 if it's still the old default
        setBetAmount("0");
        console.log(
          "🔄 TradingContext: Reset bet amount to 0 for",
          currentNetwork
        );
      }
    }
  }, [currentNetwork, balance, isConnected, betAmount]);

  const value: TradingContextType = {
    selectedCrypto,
    setSelectedCrypto,
    selectedTimeframe,
    setSelectedTimeframe,
    betAmount,
    setBetAmount,
    betType,
    setBetType,
    setDefaultBet,
    updateBetAmountToMaxSafe,
  };

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  );
};
