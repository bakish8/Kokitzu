#!/usr/bin/env node

const os = require("os");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Get the local IP address of the machine
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  // Look for the first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return null;
}

/**
 * Test if a GraphQL server is running on the given IP
 */
function testGraphQLServer(ip) {
  return new Promise((resolve) => {
    const testUrl = `http://${ip}:4000/graphql`;

    // Use curl to test the connection
    exec(
      `curl -s -o /dev/null -w "%{http_code}" ${testUrl}`,
      (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          // Check if we got a 200 or 400 response (both indicate server is running)
          const statusCode = parseInt(stdout.trim());
          resolve(statusCode === 200 || statusCode === 400);
        }
      }
    );
  });
}

/**
 * Update the network configuration file
 */
function updateNetworkConfig(ip) {
  const configPath = path.join(__dirname, "..", "src", "config", "network.ts");

  if (!fs.existsSync(configPath)) {
    console.log("❌ Network config file not found");
    return false;
  }

  try {
    let content = fs.readFileSync(configPath, "utf8");

    // Update the fallback IP in the networkUtils
    const utilsPath = path.join(
      __dirname,
      "..",
      "src",
      "utils",
      "networkUtils.ts"
    );
    if (fs.existsSync(utilsPath)) {
      let utilsContent = fs.readFileSync(utilsPath, "utf8");

      // Update the fallback IPs array to include the current IP first
      const fallbackIPsRegex = /fallbackIPs\s*=\s*\[([^\]]+)\]/;
      const match = utilsContent.match(fallbackIPsRegex);

      if (match) {
        const currentIPs = match[1]
          .split(",")
          .map((ip) => ip.trim().replace(/['"]/g, ""));

        // Add the new IP to the beginning if it's not already there
        if (!currentIPs.includes(ip)) {
          currentIPs.unshift(`'${ip}'`);

          // Keep only the first 5 IPs to avoid the array getting too long
          const updatedIPs = currentIPs.slice(0, 5);

          utilsContent = utilsContent.replace(
            fallbackIPsRegex,
            `fallbackIPs = [${updatedIPs.join(", ")}]`
          );

          fs.writeFileSync(utilsPath, utilsContent, "utf8");
          console.log(`✅ Updated networkUtils.ts with IP: ${ip}`);
        }
      }
    }

    console.log(`✅ IP address updated to: ${ip}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating network config:", error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🔍 Detecting local IP address...");

  const ip = getLocalIP();
  if (!ip) {
    console.log("❌ Could not detect local IP address");
    process.exit(1);
  }

  console.log(`📍 Detected IP: ${ip}`);

  // Test if the GraphQL server is running
  console.log("🔗 Testing GraphQL server connection...");
  const isServerRunning = await testGraphQLServer(ip);

  if (isServerRunning) {
    console.log("✅ GraphQL server is running and accessible");
  } else {
    console.log("⚠️  GraphQL server not accessible on this IP");
    console.log("   Make sure your server is running on port 4000");
  }

  // Update the configuration
  const success = updateNetworkConfig(ip);

  if (success) {
    console.log("\n🎉 IP address update completed!");
    console.log(`📱 Your app will now use: ${ip}`);
    console.log("\n💡 Tips:");
    console.log(
      "   - Make sure your phone and computer are on the same network"
    );
    console.log("   - Restart the Expo development server if needed");
    console.log(
      '   - Use the "Refresh" button in the app to test the connection'
    );
  } else {
    console.log("\n❌ Failed to update IP address");
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getLocalIP, testGraphQLServer, updateNetworkConfig };
