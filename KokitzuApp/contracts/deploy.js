const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BinaryOptions smart contract...");

  // Get the contract factory
  const BinaryOptions = await hre.ethers.getContractFactory("BinaryOptions");

  // Deploy the contract
  const binaryOptions = await BinaryOptions.deploy();

  // Wait for deployment to complete
  await binaryOptions.deployed();

  console.log("✅ BinaryOptions deployed to:", binaryOptions.address);
  console.log("📋 Contract Details:");
  console.log("   - Network:", hre.network.name);
  console.log("   - Address:", binaryOptions.address);
  console.log("   - Owner:", await binaryOptions.owner());

  // Verify the contract on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: binaryOptions.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: binaryOptions.address,
    deployer: await binaryOptions.signer.getAddress(),
    timestamp: new Date().toISOString(),
  };

  console.log("📄 Deployment info saved to deployment-info.json");

  return binaryOptions;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
