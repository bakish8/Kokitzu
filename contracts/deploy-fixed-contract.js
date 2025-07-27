const { ethers } = require("hardhat");
require("dotenv").config();

async function deployFixedContract() {
  console.log("🚀 DEPLOYING FIXED BINARY OPTIONS CONTRACT");
  console.log("==========================================");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deploying from: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

    // Deploy the fixed contract
    console.log("\n📄 Deploying BinaryOptionsFixed...");
    const BinaryOptionsFixed = await ethers.getContractFactory(
      "BinaryOptionsFixed"
    );

    // Deploy with the deployer as initial owner
    const contract = await BinaryOptionsFixed.deploy(deployer.address);

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}`);

    // Fund the contract with some ETH for payouts
    const fundAmount = ethers.parseEther("0.01"); // 0.01 ETH
    console.log(
      `\n💸 Funding contract with ${ethers.formatEther(fundAmount)} ETH...`
    );

    const fundTx = await contract.fundContract({ value: fundAmount });
    await fundTx.wait();
    console.log("✅ Contract funded successfully");

    // Verify contract balance
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(
      `💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`
    );

    // Get contract stats
    const stats = await contract.getContractStats();
    console.log(`\n📊 Contract Statistics:`);
    console.log(`   Total Options: ${stats.totalOptions}`);
    console.log(
      `   Total Volume: ${ethers.formatEther(stats.totalVolume)} ETH`
    );
    console.log(
      `   Contract Balance: ${ethers.formatEther(stats.contractBalance)} ETH`
    );
    console.log(
      `   Claimable Payouts: ${ethers.formatEther(
        stats.totalClaimablePayouts
      )} ETH`
    );

    console.log(`\n🎯 DEPLOYMENT SUMMARY:`);
    console.log(`==========================================`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Initial Balance: ${ethers.formatEther(contractBalance)} ETH`);

    console.log(`\n🔧 NEXT STEPS:`);
    console.log(`1. Update your .env files with new contract address:`);
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   EXPO_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   REACT_APP_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`   `);
    console.log(`2. Update server/contractService.js to use new contract`);
    console.log(`3. Test the fixed payout system!`);

    console.log(`\n✅ FIXED CONTRACT FEATURES:`);
    console.log(`🚀 Proper gas limits (50,000 gas)`);
    console.log(`🚀 Direct payout with fallback to claimable`);
    console.log(`🚀 Emergency rescue functions`);
    console.log(`🚀 Better balance checking`);
    console.log(`🚀 Comprehensive event logging`);

    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { deployFixedContract };

// Run if called directly
if (require.main === module) {
  deployFixedContract()
    .then((address) => {
      console.log(`\n🎉 SUCCESS! New contract deployed at: ${address}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}
