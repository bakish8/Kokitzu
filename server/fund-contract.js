import contractService from "./contractService.js";
import dotenv from "dotenv";

dotenv.config();

async function fundContract() {
  try {
    console.log("🚀 Starting contract funding process...");

    // Initialize contract service
    await contractService.init();

    // Fund contract with 0.05 ETH (adjust as needed)
    const fundAmount = 0.05; // ETH - reduced due to wallet balance

    console.log(`💰 Funding contract with ${fundAmount} ETH...`);
    console.log(
      `📍 Contract Address: ${
        process.env.CONTRACT_ADDRESS ||
        "0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE"
      }`
    );

    const result = await contractService.fundContract(fundAmount);

    console.log("✅ Contract funding successful!");
    console.log(`   └─ Transaction Hash: ${result.transactionHash}`);
    console.log(`   └─ Block Number: ${result.blockNumber}`);
    console.log(`   └─ Gas Used: ${result.gasUsed}`);
    console.log(`   └─ Amount Funded: ${result.amountFunded} ETH`);

    // Check contract balance
    const stats = await contractService.getContractStats();
    console.log(`💰 New contract balance: ${stats.contractBalance} ETH`);
  } catch (error) {
    console.error("❌ Contract funding failed:", error.message);
    process.exit(1);
  }
}

fundContract();
