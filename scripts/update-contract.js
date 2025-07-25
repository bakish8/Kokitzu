#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function updateContractAddress(contractAddress) {
  console.log("🔧 Updating contract address:", contractAddress);
  console.log("");

  // Update KokitzuApp contract address
  const contractPath = path.join(
    __dirname,
    "../KokitzuApp/src/services/binaryOptionsContract.ts"
  );

  if (fs.existsSync(contractPath)) {
    let content = fs.readFileSync(contractPath, "utf8");

    // Update contract address
    const addressRegex = /const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/;
    const newAddress = `const CONTRACT_ADDRESS = "${contractAddress}";`;

    if (addressRegex.test(content)) {
      content = content.replace(addressRegex, newAddress);
      fs.writeFileSync(contractPath, content);
      console.log(
        "✅ Updated KokitzuApp/src/services/binaryOptionsContract.ts"
      );
    } else {
      console.log(
        "⚠️  Could not find contract address in binaryOptionsContract.ts"
      );
    }
  }

  // Update server contract address
  const serverEnvPath = path.join(__dirname, "../server/.env");
  if (fs.existsSync(serverEnvPath)) {
    let content = fs.readFileSync(serverEnvPath, "utf8");

    const contractRegex = /CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/;
    const newContractLine = `CONTRACT_ADDRESS=${contractAddress}`;

    if (contractRegex.test(content)) {
      content = content.replace(contractRegex, newContractLine);
      fs.writeFileSync(serverEnvPath, content);
      console.log("✅ Updated server/.env");
    } else {
      console.log("⚠️  Could not find CONTRACT_ADDRESS in server/.env");
    }
  }

  console.log("");
  console.log("🎉 Contract address updated successfully!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Restart the server: npm run server");
  console.log("2. Test the app with the new contract");
}

function validateContractAddress(address) {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    throw new Error(
      "Invalid contract address format. Must be 0x followed by 40 hex characters."
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Contract address must be in hexadecimal format.");
  }

  return address;
}

function main() {
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.log("❌ Usage: npm run update-contract <CONTRACT_ADDRESS>");
    console.log("");
    console.log("📋 Example: npm run update-contract 0x1234567890abcdef...");
    console.log("");
    console.log("🔍 To get contract address after deployment:");
    console.log("1. Deploy contract: npm run deploy:testnet");
    console.log("2. Copy the contract address from the output");
    console.log("3. Run this command with the address");
    process.exit(1);
  }

  try {
    const validatedAddress = validateContractAddress(contractAddress);
    updateContractAddress(validatedAddress);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
