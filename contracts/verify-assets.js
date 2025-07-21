const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x10d9B9123833b42Edefd03dd43D7BA03cfA73951";

  console.log("🔍 Verifying asset configurations in deployed contract...");
  console.log(`📄 Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Network: ${hre.network.name}`);

  try {
    // Get contract instance
    const BinaryOptions = await hre.ethers.getContractFactory("BinaryOptions");
    const contract = BinaryOptions.attach(CONTRACT_ADDRESS);

    // Test basic contract connection
    const owner = await contract.owner();
    console.log(`👑 Contract Owner: ${owner}`);

    // Check each asset configuration
    const assets = ["BTC", "ETH", "LINK", "MATIC"];
    console.log("\n📊 Asset Configuration Results:");

    for (const asset of assets) {
      try {
        const config = await contract.assetConfigs(asset);
        console.log(`\n🔍 ${asset}:`);
        console.log(`   └─ isActive: ${config.isActive}`);
        console.log(`   └─ priceFeed: ${config.priceFeed}`);
        console.log(
          `   └─ minAmount: ${hre.ethers.formatEther(config.minAmount)} ETH`
        );
        console.log(
          `   └─ maxAmount: ${hre.ethers.formatEther(config.maxAmount)} ETH`
        );
        console.log(`   └─ feePercentage: ${config.feePercentage / 100}%`);

        if (config.isActive) {
          console.log(`   └─ Status: ✅ CONFIGURED`);
        } else {
          console.log(`   └─ Status: ❌ NOT CONFIGURED`);
        }
      } catch (error) {
        console.log(`\n❌ ${asset}: Failed to fetch config - ${error.message}`);
      }
    }

    // Test getCurrentPrice for BTC to see if price feeds work
    console.log("\n🧪 Testing price feed connectivity...");
    try {
      const btcPrice = await contract.getCurrentPrice("BTC");
      console.log(
        `✅ BTC Current Price: $${(Number(btcPrice) / 1e8).toFixed(2)}`
      );
    } catch (error) {
      console.log(`❌ BTC Price Feed Test Failed: ${error.message}`);
    }

    // Check contract stats
    try {
      const stats = await contract.getContractStats();
      console.log("\n📈 Contract Stats:");
      console.log(`   └─ Total Options: ${stats.totalOptions}`);
      console.log(
        `   └─ Contract Balance: ${hre.ethers.formatEther(
          stats.contractBalance
        )} ETH`
      );
    } catch (error) {
      console.log(`❌ Failed to get contract stats: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎯 Asset verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
