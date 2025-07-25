// API Configuration for Wallet Connections
// Replace these values with your actual API keys

export const API_CONFIG = {
  // Infura Project ID - Get from https://infura.io/
  INFURA_PROJECT_ID: "357501fadbb54b0592b60d419e62f10c",

  // WalletConnect Project ID - Get from https://cloud.walletconnect.com/
  WALLETCONNECT_PROJECT_ID: "7f511967202c5d90747168fd9f2e8c3c",

  // Default Network
  DEFAULT_NETWORK: "arbitrumSepolia", // Default to Arbitrum Sepolia for development

  // Network URLs
  NETWORK_URLS: {
    // Ethereum Networks
    mainnet: "https://mainnet.infura.io/v3/357501fadbb54b0592b60d419e62f10c",
    sepolia: "https://sepolia.infura.io/v3/357501fadbb54b0592b60d419e62f10c",

    // Arbitrum Networks
    arbitrumOne: "https://arb1.arbitrum.io/rpc",
    arbitrumSepolia: "https://sepolia-rollup.arbitrum.io/rpc",
  },
};

// Helper function to get the correct Network URL
export const getInfuraUrl = (network: string = "arbitrumSepolia") => {
  return (
    API_CONFIG.NETWORK_URLS[network as keyof typeof API_CONFIG.NETWORK_URLS] ||
    API_CONFIG.NETWORK_URLS.arbitrumSepolia
  );
};

// Validation function to check if API keys are set
export const validateApiKeys = () => {
  const errors = [];

  if (API_CONFIG.INFURA_PROJECT_ID === "YOUR_INFURA_PROJECT_ID") {
    errors.push("Infura Project ID not set. Get one from https://infura.io/");
  }

  if (API_CONFIG.WALLETCONNECT_PROJECT_ID === "YOUR_WALLETCONNECT_PROJECT_ID") {
    errors.push(
      "WalletConnect Project ID not set. Get one from https://cloud.walletconnect.com/"
    );
  }

  return errors;
};
