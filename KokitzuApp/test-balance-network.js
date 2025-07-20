const { getWalletBalance } = require("./src/services/walletconnect");

// Test address (replace with your actual address)
const testAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";

async function testBalanceFetching() {
  console.log("🧪 Testing balance fetching for different networks...");

  try {
    // Test Sepolia balance
    console.log("\n📊 Testing Sepolia balance...");
    const sepoliaBalance = await getWalletBalance(
      testAddress,
      "11155111",
      "sepolia"
    );
    console.log(`Sepolia Balance: ${sepoliaBalance} ETH`);

    // Test Mainnet balance
    console.log("\n📊 Testing Mainnet balance...");
    const mainnetBalance = await getWalletBalance(testAddress, "1", "mainnet");
    console.log(`Mainnet Balance: ${mainnetBalance} ETH`);

    console.log("\n✅ Balance fetching test completed!");
  } catch (error) {
    console.error("❌ Error during balance testing:", error);
  }
}

testBalanceFetching();
