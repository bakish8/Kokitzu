const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying BinaryOptions smart contract...");

  // Get the contract factory
  const BinaryOptions = await hre.ethers.getContractFactory("BinaryOptions");

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();

  // Deploy the contract with optimized gas settings for limited balance
  console.log(
    `💰 Deployer balance: ${hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    )} ETH`
  );

  // Add some randomization and higher gas price to avoid "already known" error
  const randomNonce = await hre.ethers.provider.getTransactionCount(
    deployer.address,
    "pending"
  );
  console.log(`🔄 Using nonce: ${randomNonce}`);

  const binaryOptions = await BinaryOptions.deploy(deployer.address, {
    gasLimit: 3500000, // Increased gas limit
    gasPrice: hre.ethers.parseUnits("10", "gwei"), // Higher gas price for faster processing
    nonce: randomNonce, // Explicit nonce to avoid conflicts
  });

  // Wait for deployment to complete
  await binaryOptions.waitForDeployment();

  console.log(
    "✅ BinaryOptions deployed to:",
    await binaryOptions.getAddress()
  );
  console.log("📋 Contract Details:");
  console.log("   - Network:", hre.network.name);
  console.log("   - Address:", await binaryOptions.getAddress());
  console.log("   - Owner:", await binaryOptions.owner());

  // Verify that assets were configured properly during deployment
  console.log("\n🔍 Verifying pre-configured assets...");
  try {
    const btcConfig = await binaryOptions.assetConfigs("BTC");
    const ethConfig = await binaryOptions.assetConfigs("ETH");
    const linkConfig = await binaryOptions.assetConfigs("LINK");
    const maticConfig = await binaryOptions.assetConfigs("MATIC");

    console.log("📊 Asset Configuration Status:");
    console.log(
      `   - BTC:   isActive=${btcConfig.isActive}, priceFeed=${btcConfig.priceFeed}`
    );
    console.log(
      `   - ETH:   isActive=${ethConfig.isActive}, priceFeed=${ethConfig.priceFeed}`
    );
    console.log(
      `   - LINK:  isActive=${linkConfig.isActive}, priceFeed=${linkConfig.priceFeed}`
    );
    console.log(
      `   - MATIC: isActive=${maticConfig.isActive}, priceFeed=${maticConfig.priceFeed}`
    );

    if (
      btcConfig.isActive &&
      ethConfig.isActive &&
      linkConfig.isActive &&
      maticConfig.isActive
    ) {
      console.log("✅ All assets pre-configured successfully!");
    } else {
      console.log("⚠️  Some assets may not be configured properly!");
    }
  } catch (error) {
    console.log("❌ Failed to verify asset configurations:", error.message);
  }

  // Verify the contract on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: await binaryOptions.getAddress(),
        constructorArguments: [deployer.address],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: await binaryOptions.getAddress(),
    deployer: deployer.address,
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
