#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
const NEW_WALLET_ADDRESS = "0x55bd5862DEa6311d0ac3853B5b451426B42F9236";

function updateContractsEnv(privateKey) {
  const envPath = path.join(__dirname, "../contracts/.env");

  const envContent = `# Private key of the account that will deploy the contract
PRIVATE_KEY=${privateKey}

# RPC URLs for Arbitrum Sepolia (Testnet)
MAINNET_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# RPC URLs specific
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# API Keys for block explorers
ARBISCAN_API_KEY=JFXGDCYKFUEJ2JR7WUZFFZ66T29TWZRSVT
ETHERSCAN_API_KEY=JFXGDCYKFUEJ2JR7WUZFFZ66T29TWZRSVT
`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated contracts/.env");
}

function updateServerEnv() {
  const envPath = path.join(__dirname, "../server/.env");

  const envContent = `# Blockchain Configuration (Arbitrum Sepolia Testnet)
SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_ONE_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=${process.argv[2]}

# Contract Address (Arbitrum Sepolia Testnet - יתעדכן אחרי פריסה)
CONTRACT_ADDRESS=0x569b1c7dA5ec9E57A33BBe99CC2E2Bfbb1b819C4

# Database
MONGO_URI=mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority

# Fetch interval in milliseconds (90 seconds for free tier)
COINGECKO_FETCH_INTERVAL=90000

# JWT Secret
JWT_SECRET=kokitzu_secret_key

# Server Configuration
PORT=4000
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated server/.env");
}

function updateContractAddress(contractAddress) {
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
      console.log("✅ Updated KokitzuApp contract address");
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
      console.log("✅ Updated server contract address");
    }
  }
}

function validatePrivateKey(privateKey) {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith("0x")
      ? privateKey.slice(2)
      : privateKey;

    if (cleanKey.length !== 64) {
      throw new Error("Private key must be 64 characters long (32 bytes)");
    }

    // Validate hex format
    if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
      throw new Error("Private key must be in hexadecimal format");
    }

    // Basic validation - we'll trust the user that it matches the address
    console.log(
      "⚠️  Note: Private key format validated. Please ensure it matches wallet address:",
      NEW_WALLET_ADDRESS
    );

    return `0x${cleanKey}`;
  } catch (error) {
    throw new Error(`Invalid private key: ${error.message}`);
  }
}

function main() {
  const privateKey = process.argv[2];

  if (!privateKey) {
    console.log("❌ Usage: npm run update-wallet <PRIVATE_KEY>");
    console.log("");
    console.log("📱 To get your private key:");
    console.log("1. Open MetaMask");
    console.log("2. Go to Account Details");
    console.log('3. Click "Export Private Key"');
    console.log("4. Enter your password");
    console.log("5. Copy the private key");
    console.log("");
    console.log("🔐 Example: npm run update-wallet 0x1234567890abcdef...");
    process.exit(1);
  }

  try {
    console.log("🔧 Updating wallet configuration...");
    console.log("📍 New Wallet Address:", NEW_WALLET_ADDRESS);
    console.log("");

    // Validate private key
    const validatedKey = validatePrivateKey(privateKey);
    console.log("✅ Private key validated successfully");

    // Update all files
    updateContractsEnv(validatedKey);
    updateServerEnv();

    console.log("");
    console.log("🎉 Wallet configuration updated successfully!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Make sure you have ETH in the new wallet");
    console.log("2. Deploy contract: npm run deploy:testnet");
    console.log(
      "3. Update contract address: npm run update-contract <NEW_CONTRACT_ADDRESS>"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
