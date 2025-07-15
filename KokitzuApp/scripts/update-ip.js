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

// Function to update the network configuration file
function updateNetworkConfig(newIP) {
  try {
    let content = fs.readFileSync(networkConfigPath, "utf8");

    // Update the DEVELOPMENT configuration
    const updatedContent = content.replace(
      /DEVELOPMENT: \{[^}]*GRAPHQL_URL: "http:\/\/[^"]+",[^}]*WEBSOCKET_URL: "ws:\/\/[^"]+",[^}]*\}/s,
      `DEVELOPMENT: {
    GRAPHQL_URL: "http://${newIP}:4000/graphql",
    WEBSOCKET_URL: "ws://${newIP}:4000/graphql",
  }`
    );

    fs.writeFileSync(networkConfigPath, updatedContent);
    console.log(`✅ Successfully updated IP to: ${newIP}`);
    console.log(`📁 Updated file: ${networkConfigPath}`);
  } catch (error) {
    console.error("❌ Error updating network configuration:", error.message);
  }
}

// Main execution
function main() {
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
      /GRAPHQL_URL: "http:\/\/([^"]+):4000\/graphql"/
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

  // Ask for confirmation
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`\n🤔 Update IP to ${currentIP}? (y/N): `, (answer) => {
    rl.close();

    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      updateNetworkConfig(currentIP);
      console.log("\n🚀 You can now restart your app to use the new IP!");
    } else {
      console.log("❌ Update cancelled.");
    }
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { getCurrentIP, updateNetworkConfig };
