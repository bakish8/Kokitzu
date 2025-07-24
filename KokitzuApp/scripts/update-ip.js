#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Path to the network configuration file
const networkConfigPath = path.join(__dirname, "../src/config/network.ts");

// Function to get the current IP address
function getCurrentIP() {
  try {
    // Get IP address using ifconfig (macOS/Linux)
    const ifconfigOutput = execSync(
      'ifconfig | grep "inet " | grep -v 127.0.0.1'
    ).toString();
    const ipMatch = ifconfigOutput.match(/inet (\d+\.\d+\.\d+\.\d+)/);

    if (ipMatch) {
      return ipMatch[1];
    }
  } catch (error) {
    console.log(
      "Could not get IP using ifconfig, trying alternative method..."
    );
  }

  try {
    // Alternative method using ipconfig (Windows) or network interface
    const ipconfigOutput = execSync('ipconfig | findstr "IPv4"').toString();
    const ipMatch = ipconfigOutput.match(/(\d+\.\d+\.\d+\.\d+)/);

    if (ipMatch) {
      return ipMatch[1];
    }
  } catch (error) {
    console.log("Could not get IP using ipconfig...");
  }

  return null;
}

// Function to test server connectivity
async function testServerConnectivity(ip) {
  try {
    const response = await fetch(`http://${ip}:4000/api/prices`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to update the network configuration file
function updateNetworkConfig(newIP) {
  try {
    let content = fs.readFileSync(networkConfigPath, "utf8");

    // Update the DEVELOPMENT configuration for REST API
    const updatedContent = content.replace(
      /DEVELOPMENT: \{[^}]*API_URL: "http:\/\/[^"]+",[^}]*GRAPHQL_URL: "http:\/\/[^"]+",[^}]*\}/s,
      `DEVELOPMENT: {
    API_URL: "http://${newIP}:4000",
    GRAPHQL_URL: "http://${newIP}:4000", // Backward compatibility
  }`
    );

    fs.writeFileSync(networkConfigPath, updatedContent);
    console.log(`✅ Successfully updated IP to: ${newIP}`);
    console.log(`📁 Updated file: ${networkConfigPath}`);
    return true;
  } catch (error) {
    console.error("❌ Error updating network configuration:", error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log("🔍 Detecting current IP address...");

  const currentIP = getCurrentIP();

  if (!currentIP) {
    console.log("❌ Could not detect IP address automatically.");
    console.log(
      "💡 Please run: ifconfig | grep inet (macOS/Linux) or ipconfig (Windows)"
    );
    console.log("📝 Then manually update the IP in: src/config/network.ts");
    return;
  }

  console.log(`🌐 Current IP detected: ${currentIP}`);

  // Read current configuration to show what will be changed
  try {
    const content = fs.readFileSync(networkConfigPath, "utf8");
    const currentIPMatch = content.match(
      /DEVELOPMENT: \{[^}]*API_URL: "http:\/\/([^"]+):4000"/
    );

    if (currentIPMatch) {
      const configuredIP = currentIPMatch[1];
      console.log(`📋 Currently configured IP: ${configuredIP}`);

      if (configuredIP === currentIP) {
        console.log("✅ IP is already up to date!");
        return;
      }
    }
  } catch (error) {
    console.log("⚠️ Could not read current configuration");
  }

  // Test server connectivity
  console.log("🔍 Testing server connectivity...");
  const isServerReachable = await testServerConnectivity(currentIP);

  if (isServerReachable) {
    console.log("✅ Server is reachable at the new IP!");
  } else {
    console.log("⚠️ Warning: Server might not be reachable at the new IP");
    console.log("💡 Make sure your server is running: cd server && npm start");
  }

  // Automatically update without asking for confirmation
  console.log(`\n🔄 Automatically updating IP to ${currentIP}...`);
  const success = updateNetworkConfig(currentIP);

  if (success) {
    console.log("\n🎉 IP updated successfully!");
    console.log("🚀 You can now restart your app to use the new IP!");
    console.log("📱 The live prices should now work correctly.");
  } else {
    console.log("\n❌ Failed to update IP configuration.");
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getCurrentIP, updateNetworkConfig };
