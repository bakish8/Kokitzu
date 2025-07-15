import { Platform } from "react-native";

// Cache for the detected IP address
let cachedIP: string | null = null;
let lastDetectionTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Detects the local IP address dynamically
 * This will work across different networks and locations
 */
export const detectLocalIP = async (): Promise<string> => {
  const now = Date.now();

  // Return cached IP if it's still valid
  if (cachedIP && now - lastDetectionTime < CACHE_DURATION) {
    return cachedIP;
  }

  try {
    // Method 1: Try to get IP from network interface (most reliable)
    const ip = await getLocalIPFromNetwork();
    if (ip) {
      cachedIP = ip;
      lastDetectionTime = now;
      console.log("✅ Detected local IP:", ip);
      return ip;
    }

    // Method 2: Fallback to common local IPs
    const fallbackIPs = [
      "192.168.10.116", // Your current IP
      "192.168.1.100",
      "192.168.0.100",
      "10.0.0.100",
      "172.16.0.100",
    ];

    for (const fallbackIP of fallbackIPs) {
      const isReachable = await testIPReachability(fallbackIP);
      if (isReachable) {
        cachedIP = fallbackIP;
        lastDetectionTime = now;
        console.log("✅ Using fallback IP:", fallbackIP);
        return fallbackIP;
      }
    }

    // Method 3: Use localhost for simulator
    if (__DEV__ && Platform.OS !== "web") {
      cachedIP = "localhost";
      lastDetectionTime = now;
      console.log("✅ Using localhost for simulator");
      return "localhost";
    }

    throw new Error("Could not detect local IP address");
  } catch (error) {
    console.error("❌ Error detecting local IP:", error);
    // Return a default IP as last resort
    return "192.168.1.100";
  }
};

/**
 * Gets local IP from network interface using smart scanning
 */
const getLocalIPFromNetwork = async (): Promise<string | null> => {
  try {
    // Try to connect to common local IP ranges
    // Start with the most common ranges first
    const commonRanges = [
      "192.168.10", // Your current network
      "192.168.1",
      "192.168.0",
      "10.0.0",
      "172.16.0",
    ];

    // Test a smaller range first for faster detection
    for (const range of commonRanges) {
      // Test common router IPs first (usually .1)
      const routerIP = `${range}.1`;
      const isRouterReachable = await testIPReachability(routerIP);
      if (isRouterReachable) {
        console.log("✅ Found router at:", routerIP);
        // If router is reachable, try common development IPs
        const commonDevIPs = [
          100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
          114, 115, 116, 117, 118, 119, 120,
        ];
        for (const devIP of commonDevIPs) {
          const testIP = `${range}.${devIP}`;
          const isReachable = await testIPReachability(testIP);
          if (isReachable) {
            return testIP;
          }
        }
      }

      // If router not found, scan the range more thoroughly
      for (let i = 1; i <= 254; i++) {
        const testIP = `${range}.${i}`;
        const isReachable = await testIPReachability(testIP);
        if (isReachable) {
          return testIP;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting local IP from network:", error);
    return null;
  }
};

/**
 * Tests if an IP address is reachable
 */
const testIPReachability = async (ip: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800); // Shorter timeout for faster scanning

    const response = await fetch(`http://${ip}:4000/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Clears the cached IP address
 */
export const clearCachedIP = () => {
  cachedIP = null;
  lastDetectionTime = 0;
  console.log("🗑️ Cleared cached IP address");
};

/**
 * Gets the current cached IP address
 */
export const getCachedIP = (): string | null => {
  return cachedIP;
};

/**
 * Manually set the IP address (useful for testing)
 */
export const setManualIP = (ip: string) => {
  cachedIP = ip;
  lastDetectionTime = Date.now();
  console.log("🔧 Manually set IP address:", ip);
};

/**
 * Force refresh the IP address (ignores cache)
 */
export const forceRefreshIP = async (): Promise<string> => {
  clearCachedIP();
  return await detectLocalIP();
};

/**
 * Get a list of potential IPs for manual selection
 */
export const getPotentialIPs = async (): Promise<string[]> => {
  const potentialIPs: string[] = [];

  try {
    const commonRanges = [
      "192.168.10",
      "192.168.1",
      "192.168.0",
      "10.0.0",
      "172.16.0",
    ];

    for (const range of commonRanges) {
      // Test common development IPs
      const commonDevIPs = [
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
        114, 115, 116, 117, 118, 119, 120,
      ];
      for (const devIP of commonDevIPs) {
        const testIP = `${range}.${devIP}`;
        const isReachable = await testIPReachability(testIP);
        if (isReachable) {
          potentialIPs.push(testIP);
          if (potentialIPs.length >= 5) break; // Limit to 5 results
        }
      }
      if (potentialIPs.length >= 5) break;
    }
  } catch (error) {
    console.error("Error getting potential IPs:", error);
  }

  return potentialIPs;
};
