// Network Configuration for different environments (REST API ONLY)
export const NETWORK_CONFIG = {
  // Production - Your actual server URL
  PRODUCTION: {
    API_URL: "https://your-production-server.com",
    GRAPHQL_URL: "https://your-production-server.com", // Backward compatibility
  },

  // Local development (simulator)
  LOCAL: {
    API_URL: "http://localhost:4000",
    GRAPHQL_URL: "http://localhost:4000", // Backward compatibility
  },

  // Development with constant IP (update this IP when needed)
  DEVELOPMENT: {
    API_URL: "http://192.168.1.173:4000",
    GRAPHQL_URL: "http://192.168.1.173:4000", // Backward compatibility
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
  // WebSocket not used in REST API, return empty string
  return "";
};

// 🚀 NEW: Get REST API URL
export const getApiUrl = async (): Promise<string> => {
  if (!__DEV__) {
    return NETWORK_CONFIG.PRODUCTION.API_URL;
  }

  // Use constant development IP
  return NETWORK_CONFIG.DEVELOPMENT.API_URL;
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
