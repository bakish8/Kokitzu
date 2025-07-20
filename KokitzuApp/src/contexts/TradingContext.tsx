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
  const [betAmount, setBetAmount] = useState("100");
  const [betType, setBetType] = useState<"UP" | "DOWN">("UP");

  const setDefaultBet = (cryptoSymbol: string) => {
    setSelectedCrypto(cryptoSymbol);
    setSelectedTimeframe("ONE_MINUTE");
    setBetAmount("100");
    setBetType("UP");
  };

  const updateBetAmountToMaxSafe = (balance: number) => {
    if (balance > 0) {
      const maxSafeBet = balance * 0.9; // 90% of balance for safety
      const newBetAmount = Math.max(0.0001, maxSafeBet); // Minimum 0.0001
      setBetAmount(newBetAmount.toFixed(4));
    }
  };

  // Effect to automatically update bet amount when network or balance changes
  useEffect(() => {
    if (isConnected && balance) {
      const currentBalance = parseFloat(balance);
      if (currentBalance > 0) {
        // Calculate max safe bet in USD (90% of ETH balance converted to USD)
        const maxSafeBetEth = currentBalance * 0.9;
        const maxSafeBetUsd = ethToUsd(maxSafeBetEth, ethPrice);

        // Update bet amount to max safe bet
        const formattedMaxBet = maxSafeBetUsd.toFixed(2);
        setBetAmount(formattedMaxBet);

        console.log(
          "🔄 TradingContext: Updated bet amount to max safe bet for",
          currentNetwork,
          "in USD:",
          formattedMaxBet
        );
      }
    }
  }, [currentNetwork, balance, isConnected, ethPrice]);

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
