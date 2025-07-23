import contractService from "./contractService.js";
import dotenv from "dotenv";

dotenv.config();

async function testContract() {
  console.log("🧪 Testing new contract deployment...\n");

  try {
    // Initialize contract service
    await contractService.ensureInitialized();
    console.log("✅ Contract service initialized");

    // Test 1: Get contract stats
    console.log("\n📊 Test 1: Contract Stats");
    const stats = await contractService.getContractStats();
    console.log(`   └─ Total Options: ${stats.totalOptions}`);
    console.log(`   └─ Contract Balance: ${stats.contractBalance} ETH`);

    // Test 2: Check asset configurations
    console.log("\n🔧 Test 2: Asset Configurations");
    const contract = contractService.contract;

    const assets = ["BTC", "ETH", "LINK", "MATIC"];
    for (const asset of assets) {
      try {
        const config = await contract.assetConfigs(asset);
        console.log(
          `   └─ ${asset}: Active=${
            config.isActive
          }, MinAmount=${config.minAmount.toString()}`
        );
      } catch (error) {
        console.log(`   └─ ${asset}: Not configured`);
      }
    }

    // Test 3: Current prices
    console.log("\n💰 Test 3: Price Feeds");
    for (const asset of ["BTC", "ETH"]) {
      try {
        const price = await contractService.getCurrentPrice(asset);
        console.log(
          `   └─ ${asset}: $${(price / 1e8).toLocaleString()} (${price} raw)`
        );
      } catch (error) {
        console.log(`   └─ ${asset}: Price feed error - ${error.message}`);
      }
    }

    // Test 4: Test option creation (small amount)
    console.log("\n🎯 Test 4: Test Bet Creation");
    console.log("   └─ This will create a REAL bet with 0.001 ETH");
    console.log(
      "   └─ Cancel with Ctrl+C if you don't want to spend testnet ETH"
    );

    // Wait 3 seconds for user to cancel
    await new Promise((resolve) => {
      let countdown = 3;
      const interval = setInterval(() => {
        console.log(`   └─ Creating bet in ${countdown}s...`);
        countdown--;
        if (countdown < 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });

    try {
      const result = await contractService.placeBet(
        "BTC",
        "UP",
        0.001,
        "ONE_MINUTE"
      );
      console.log("   ✅ Test bet created successfully!");
      console.log(`   └─ Option ID: ${result.optionId}`);
      console.log(`   └─ Transaction: ${result.transactionHash}`);
      console.log(`   └─ This bet will expire in 30 seconds and auto-execute`);
    } catch (betError) {
      console.log(`   ❌ Test bet failed: ${betError.message}`);
    }

    console.log("\n🎉 Contract testing completed!");
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    console.error(
      "🔍 Make sure the contract is deployed and environment is configured"
    );
  }
}

// Run the test
testContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Test crashed:", error);
    process.exit(1);
  });
