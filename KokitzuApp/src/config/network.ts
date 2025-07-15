// Network Configuration for different environments
export const NETWORK_CONFIG = {
  // Production - Your actual server URL
  PRODUCTION: {
    GRAPHQL_URL: "https://your-production-server.com/graphql",
    WEBSOCKET_URL: "wss://your-production-server.com/graphql",
  },

  // Local development (simulator)
  LOCAL: {
    GRAPHQL_URL: "http://localhost:4000/graphql",
    WEBSOCKET_URL: "ws://localhost:4000/graphql",
  },

  // Development with constant IP (update this IP when needed)
  DEVELOPMENT: {
    GRAPHQL_URL: "http://192.168.1.173:4000/graphql",
    WEBSOCKET_URL: "ws://192.168.1.173:4000/graphql",
  },
};

// Simple URL getters without dynamic IP detection
export const getGraphQLUrl = async (): Promise<string> => {
  if (!__DEV__) {
    return NETWORK_CONFIG.PRODUCTION.GRAPHQL_URL;
  }

  // Use constant development IP
  return NETWORK_CONFIG.DEVELOPMENT.GRAPHQL_URL;
};

export const getWebSocketUrl = async (): Promise<string> => {
  if (!__DEV__) {
    return NETWORK_CONFIG.PRODUCTION.WEBSOCKET_URL;
  }

  // Use constant development IP
  return NETWORK_CONFIG.DEVELOPMENT.WEBSOCKET_URL;
};

// Simplified refresh function (no longer needed but kept for compatibility)
export const refreshNetworkUrls = async () => {
  console.log("🔄 Network URLs refreshed (using constant IP)");
};

// Network troubleshooting helpers
export const NETWORK_TROUBLESHOOTING = {
  // Check if your computer's IP is correct
  CHECK_IP: "Update the IP in NETWORK_CONFIG.DEVELOPMENT if your IP changes",

  // Check if server is running
  CHECK_SERVER: "Make sure your GraphQL server is running on port 4000",

  // Check firewall
  CHECK_FIREWALL: "Make sure port 4000 is not blocked by firewall",

  // Check network
  CHECK_NETWORK: "Ensure phone and computer are on same WiFi network",
};
