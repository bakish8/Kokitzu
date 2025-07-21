import { useQuery } from "@apollo/client";
import { GET_CRYPTO_PRICES } from "../graphql/queries";

// Hook to get ETH price for conversion
export const useEthPrice = () => {
  const { data } = useQuery(GET_CRYPTO_PRICES);
  const ethPrice =
    data?.cryptoPrices?.find((crypto) => crypto.symbol === "ETH")?.price || 0;
  return ethPrice;
};

// Convert ETH to USD
export const ethToUsd = (ethAmount, ethPrice) => {
  return ethAmount * ethPrice;
};

// Convert USD to ETH
export const usdToEth = (usdAmount, ethPrice) => {
  return ethPrice > 0 ? usdAmount / ethPrice : 0;
};

// Format USD amount
export const formatUsd = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format ETH amount
export const formatEth = (amount) => {
  return `${amount.toFixed(4)} ETH`;
};

// Format combined ETH and USD display
export const formatEthWithUsd = (ethAmount, ethPrice, showEthSymbol = true) => {
  const usdAmount = ethToUsd(ethAmount, ethPrice);
  const ethSymbol = showEthSymbol ? "Ξ " : "";
  return `${ethSymbol}${ethAmount.toFixed(4)} (${formatUsd(usdAmount)})`;
};

// Format USD with ETH equivalent
export const formatUsdWithEth = (usdAmount, ethPrice) => {
  const ethAmount = usdToEth(usdAmount, ethPrice);
  return `${formatUsd(usdAmount)} (Ξ ${ethAmount.toFixed(4)})`;
};
