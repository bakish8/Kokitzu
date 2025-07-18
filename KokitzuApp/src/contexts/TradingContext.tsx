import React, { createContext, useContext, useState } from "react";
import { CryptoPrice } from "../types";

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
  };

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  );
};
