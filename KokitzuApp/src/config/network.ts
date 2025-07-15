import { detectLocalIP, forceRefreshIP } from "../utils/networkUtils";

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
};

// Dynamic URL generation based on detected IP
let dynamicGraphQLUrl: string | null = null;
let dynamicWebSocketUrl: string | null = null;

// Helper function to get the correct URL based on environment
export const getGraphQLUrl = async (): Promise<string> => {
  if (!__DEV__) {
    return NETWORK_CONFIG.PRODUCTION.GRAPHQL_URL;
  }

  // Use cached dynamic URL if available
  if (dynamicGraphQLUrl) {
    return dynamicGraphQLUrl;
  }

  try {
    // Detect local IP address dynamically
    const localIP = await detectLocalIP();
    dynamicGraphQLUrl = `http://${localIP}:4000/graphql`;
    console.log("🌐 Dynamic GraphQL URL:", dynamicGraphQLUrl);
    return dynamicGraphQLUrl;
  } catch (error) {
    console.error("Error getting dynamic GraphQL URL:", error);
    // Fallback to localhost
    return NETWORK_CONFIG.LOCAL.GRAPHQL_URL;
  }
};

export const getWebSocketUrl = async (): Promise<string> => {
  if (!__DEV__) {
    return NETWORK_CONFIG.PRODUCTION.WEBSOCKET_URL;
  }

  // Use cached dynamic URL if available
  if (dynamicWebSocketUrl) {
    return dynamicWebSocketUrl;
  }

  try {
    // Detect local IP address dynamically
    const localIP = await detectLocalIP();
    dynamicWebSocketUrl = `ws://${localIP}:4000/graphql`;
    console.log("🌐 Dynamic WebSocket URL:", dynamicWebSocketUrl);
    return dynamicWebSocketUrl;
  } catch (error) {
    console.error("Error getting dynamic WebSocket URL:", error);
    // Fallback to localhost
    return NETWORK_CONFIG.LOCAL.WEBSOCKET_URL;
  }
};

// Force refresh the dynamic URLs
export const refreshNetworkUrls = async () => {
  dynamicGraphQLUrl = null;
  dynamicWebSocketUrl = null;
  await forceRefreshIP();
  await getGraphQLUrl();
  await getWebSocketUrl();
};

// Network troubleshooting helpers
export const NETWORK_TROUBLESHOOTING = {
  // Check if your computer's IP is correct
  CHECK_IP: "Run 'ifconfig | grep inet' in terminal to get your IP",

  // Check if server is running
  CHECK_SERVER: "Make sure your GraphQL server is running on port 4000",

  // Check firewall
  CHECK_FIREWALL: "Make sure port 4000 is not blocked by firewall",

  // Check network
  CHECK_NETWORK: "Ensure phone and computer are on same WiFi network",
};
