import { API_CONFIG } from "../config/api";

// Simplified WalletConnect implementation to avoid version conflicts
export const connectWalletConnect = async () => {
  try {
    // Generate a WalletConnect URI manually for now
    // In a production app, you'd use the actual WalletConnect SDK
    const projectId = API_CONFIG.WALLETCONNECT_PROJECT_ID;
    const uri = `wc:${projectId}@2?relay-protocol=irn&symKey=${generateSymKey()}`;

    console.log("Generated WalletConnect URI:", uri);

    return {
      uri,
      approval: {
        namespaces: {
          eip155: {
            accounts: [`eip155:1:0x${generateMockAddress()}`],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      },
    };
  } catch (error) {
    console.error("WalletConnect connection error:", error);
    throw error;
  }
};

const generateSymKey = () => {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
};

const generateMockAddress = () => {
  return Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
};

export const getWalletConnectSessions = () => {
  return {};
};

export const disconnectWalletConnect = async () => {
  console.log("WalletConnect disconnected");
};
