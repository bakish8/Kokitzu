#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Network configurations
const NETWORKS = {
  testnet: {
    name: "Arbitrum Sepolia (Testnet)",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    chainId: 421614,
    explorer: "https://sepolia.arbiscan.io",
    chainlink: {
      ETH: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165",
      BTC: "0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69",
      LINK: "0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298",
    },
    defaultNetwork: "arbitrumSepolia",
    nodeEnv: "development",
  },
  mainnet: {
    name: "Arbitrum One (Mainnet)",
    rpc: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    explorer: "https://arbiscan.io",
    chainlink: {
      ETH: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      BTC: "0x6ce185860a4963106506C203335A2910413708e9",
      LINK: "0x86E53CF1B870786351Da77A57575e79CB55812CB",
    },
    defaultNetwork: "arbitrumOne",
    nodeEnv: "production",
  },
};

function updateEnvFile(filePath, network) {
  const config = NETWORKS[network];

  // Read existing .env to preserve private key
  let existingPrivateKey =
    "2471f1bee6cdfb0d8bcb7a97e9c40c572959c39965207075ce55548d801f8434";
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, "utf8");
    const privateKeyMatch = existingContent.match(
      /PRIVATE_KEY=([a-fA-F0-9x]+)/
    );
    if (privateKeyMatch) {
      existingPrivateKey = privateKeyMatch[1];
    }
  }

  const envContent = `# Private key of the account that will deploy the contract
PRIVATE_KEY=${existingPrivateKey}

# RPC URLs for ${config.name}
MAINNET_RPC_URL=${config.rpc}
SEPOLIA_RPC_URL=${config.rpc}

# RPC URLs specific
ARBITRUM_ONE_RPC_URL=${NETWORKS.mainnet.rpc}
ARBITRUM_SEPOLIA_RPC_URL=${NETWORKS.testnet.rpc}

# API Keys for block explorers
ARBISCAN_API_KEY=JFXGDCYKFUEJ2JR7WUZFFZ66T29TWZRSVT
ETHERSCAN_API_KEY=JFXGDCYKFUEJ2JR7WUZFFZ66T29TWZRSVT
`;

  fs.writeFileSync(filePath, envContent);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function updateServerEnv(filePath, network) {
  const config = NETWORKS[network];

  // Read existing .env to preserve private key
  let existingPrivateKey =
    "2471f1bee6cdfb0d8bcb7a97e9c40c572959c39965207075ce55548d801f8434";
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, "utf8");
    const privateKeyMatch = existingContent.match(
      /PRIVATE_KEY=([a-fA-F0-9x]+)/
    );
    if (privateKeyMatch) {
      existingPrivateKey = privateKeyMatch[1];
    }
  }

  const envContent = `# Blockchain Configuration (${config.name})
SEPOLIA_RPC_URL=${config.rpc}
ARBITRUM_ONE_RPC_URL=${NETWORKS.mainnet.rpc}
ARBITRUM_SEPOLIA_RPC_URL=${NETWORKS.testnet.rpc}
PRIVATE_KEY=${existingPrivateKey}

# Contract Address (${config.name} - יתעדכן אחרי פריסה)
CONTRACT_ADDRESS=0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE

# Database
MONGO_URI=mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority

# Fetch interval in milliseconds (90 seconds for free tier)
COINGECKO_FETCH_INTERVAL=90000

# JWT Secret
JWT_SECRET=kokitzu_secret_key

# Server Configuration
PORT=4000
NODE_ENV=${config.nodeEnv}
`;

  fs.writeFileSync(filePath, envContent);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function updateServerApp(filePath, network) {
  const config = NETWORKS[network];

  let content = fs.readFileSync(filePath, "utf8");

  // Update Chainlink feeds
  const chainlinkFeedsRegex =
    /\/\/ Chainlink Price Feed Addresses \(.*?\)\nconst CHAINLINK_FEEDS = \{[\s\S]*?\};/;
  const newChainlinkFeeds = `// Chainlink Price Feed Addresses (${config.name})
const CHAINLINK_FEEDS = {
  ETH: "${config.chainlink.ETH}", // ETH/USD on ${config.name.split(" ")[0]}
  BTC: "${config.chainlink.BTC}", // BTC/USD on ${config.name.split(" ")[0]}
  LINK: "${config.chainlink.LINK}", // LINK/USD on ${config.name.split(" ")[0]}
};`;

  content = content.replace(chainlinkFeedsRegex, newChainlinkFeeds);

  // Update provider
  const providerRegex =
    /\/\/ Arbitrum .* provider\nconst provider = new ethers\.JsonRpcProvider\([\s\S]*?\);/;
  const newProvider = `// ${config.name.split(" ")[0]} provider
const provider = new ethers.JsonRpcProvider(
  process.env.${
    network === "mainnet" ? "ARBITRUM_ONE_RPC_URL" : "ARBITRUM_SEPOLIA_RPC_URL"
  } ||
    "${config.rpc}"
);`;

  content = content.replace(providerRegex, newProvider);

  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function updateNetworkContext(filePath, network) {
  const config = NETWORKS[network];

  let content = fs.readFileSync(filePath, "utf8");

  // Update default network
  const defaultNetworkRegex =
    /useState<NetworkType>\(".*?"\); \/\/ Default to .* for .*/;
  const newDefault = `useState<NetworkType>("${
    config.defaultNetwork
  }"); // Default to ${config.name.split(" ")[0]} for ${config.nodeEnv}`;

  content = content.replace(defaultNetworkRegex, newDefault);

  // Update AsyncStorage default
  const asyncStorageRegex =
    /await AsyncStorage\.setItem\("selectedNetwork", ".*?"\);\s*console\.log\("🌐 Set default network to .*?"\);/;
  const newAsyncStorage = `await AsyncStorage.setItem("selectedNetwork", "${
    config.defaultNetwork
  }");
        console.log("🌐 Set default network to ${config.name.split(" ")[0]}");`;

  content = content.replace(asyncStorageRegex, newAsyncStorage);

  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function updateEthPriceContext(filePath, network) {
  const config = NETWORKS[network];

  let content = fs.readFileSync(filePath, "utf8");

  // Update console log message
  const logRegex = /console\.log\("🔍 Fetching ETH price from .*?"\);/;
  const newLog = `console.log("🔍 Fetching ETH price from Chainlink (${config.name})...");`;
  content = content.replace(logRegex, newLog);

  // Update price log message
  const priceLogRegex =
    /console\.log\(\s*`💰 ETH price updated: \$\{ethData\.price\.toLocaleString\(\)\} \(.*?\)`/;
  const newPriceLog = `console.log(
          \`💰 ETH price updated: $\{ethData.price.toLocaleString()} (Chainlink - ${config.name})\``;
  content = content.replace(priceLogRegex, newPriceLog);

  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function updateWalletConnect(filePath, network) {
  const config = NETWORKS[network];

  let content = fs.readFileSync(filePath, "utf8");

  // Update default network
  const defaultNetworkRegex =
    /let currentNetwork: NetworkType = ".*?"; \/\/ Default to .*/;
  const newDefault = `let currentNetwork: NetworkType = "${config.defaultNetwork}"; // Default to ${config.name}`;

  content = content.replace(defaultNetworkRegex, newDefault);

  // Add Arbitrum Sepolia support to getWalletBalance if not exists
  if (!content.includes('case "421614": // Arbitrum Sepolia')) {
    const arbitrumOneRegex =
      /(case "42161": \/\/ Arbitrum One\s+rpcUrl = "https:\/\/arb1\.arbitrum\.io\/rpc";\s+break;)/;
    const arbitrumSepoliaCase = `$1
      case "421614": // Arbitrum Sepolia
        rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
        break;`;
    content = content.replace(arbitrumOneRegex, arbitrumSepoliaCase);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated ${filePath} for ${config.name}`);
}

function main() {
  const network = process.argv[2];

  if (!network || !NETWORKS[network]) {
    console.log("❌ Usage: node scripts/switch-network.js [testnet|mainnet]");
    console.log("Available networks:");
    Object.keys(NETWORKS).forEach((key) => {
      console.log(`  - ${key}: ${NETWORKS[key].name}`);
    });
    process.exit(1);
  }

  const config = NETWORKS[network];
  console.log(`🔄 Switching to ${config.name}...`);

  try {
    // Update contract .env
    updateEnvFile("contracts/.env", network);

    // Update server .env
    updateServerEnv("server/.env", network);

    // Update server app.js
    updateServerApp("server/app.js", network);

    // Update app NetworkContext
    updateNetworkContext("KokitzuApp/src/contexts/NetworkContext.tsx", network);

    // Update EthPriceContext
    updateEthPriceContext(
      "KokitzuApp/src/contexts/EthPriceContext.tsx",
      network
    );

    // Update WalletConnect service
    updateWalletConnect("KokitzuApp/src/services/walletconnect.ts", network);

    console.log(`\n🎉 Successfully switched to ${config.name}!`);
    console.log(`\n📋 Next steps:`);
    if (network === "mainnet") {
      console.log(`  1. Make sure you have ETH in Arbitrum One`);
      console.log(
        `  2. Deploy: npx hardhat run deploy.js --network arbitrumOne`
      );
    } else {
      console.log(`  1. Switch MetaMask to Arbitrum Sepolia`);
      console.log(`  2. Get testnet ETH from faucet`);
      console.log(
        `  3. Deploy: npx hardhat run deploy.js --network arbitrumSepolia`
      );
    }
    console.log(`  4. Update CONTRACT_ADDRESS in both .env files`);
  } catch (error) {
    console.error("❌ Error switching networks:", error.message);
    process.exit(1);
  }
}

main();
