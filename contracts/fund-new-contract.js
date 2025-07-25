const hre = require("hardhat");

async function main() {
  console.log("💰 Funding new contract from old contract...");

  // Contract addresses
  const OLD_CONTRACT_ADDRESS = "0xDa542310B4F1547998096a9AeB274773f41CB963";
  const NEW_CONTRACT_ADDRESS = "0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE";
  const PARENT_WALLET = "0x55bd5862DEa6311d0ac3853B5b451426B42F9236";

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log(`🔑 Using deployer: ${deployer.address}`);

  // Check deployer balance
  const deployerBalance = await hre.ethers.provider.getBalance(
    deployer.address
  );
  console.log(
    `💰 Deployer balance: ${hre.ethers.formatEther(deployerBalance)} ETH`
  );

  // Step 1: Withdraw funds from old contract to parent wallet
  console.log("\n📤 Step 1: Withdrawing funds from old contract...");

  try {
    const oldContract = await hre.ethers.getContractAt(
      "BinaryOptions",
      OLD_CONTRACT_ADDRESS
    );

    // Check if deployer is owner of old contract
    const oldContractOwner = await oldContract.owner();
    console.log(`👑 Old contract owner: ${oldContractOwner}`);

    if (oldContractOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log(
        "✅ Deployer is owner of old contract, proceeding with withdrawal..."
      );

      // Get old contract balance
      const oldContractBalance = await hre.ethers.provider.getBalance(
        OLD_CONTRACT_ADDRESS
      );
      console.log(
        `💰 Old contract balance: ${hre.ethers.formatEther(
          oldContractBalance
        )} ETH`
      );

      if (oldContractBalance > 0) {
        // Withdraw funds to parent wallet
        const withdrawTx = await oldContract.withdrawFees({
          gasLimit: 100000,
        });

        console.log("⏳ Withdrawal transaction sent:", withdrawTx.hash);
        const withdrawReceipt = await withdrawTx.wait();
        console.log("✅ Withdrawal completed!");
        console.log(`⛽ Gas used: ${withdrawReceipt.gasUsed.toString()}`);
      } else {
        console.log("⚠️ Old contract has no balance to withdraw");
      }
    } else {
      console.log("❌ Deployer is not owner of old contract");
      console.log("🔑 You need to use the wallet that owns the old contract");
      return;
    }
  } catch (error) {
    console.error("❌ Error withdrawing from old contract:", error.message);
    return;
  }

  // Step 2: Fund new contract with 0.5 ETH
  console.log("\n📥 Step 2: Funding new contract with 0.1 ETH...");

  try {
    const newContract = await hre.ethers.getContractAt(
      "BinaryOptions",
      NEW_CONTRACT_ADDRESS
    );

    // Check if deployer is owner of new contract
    const newContractOwner = await newContract.owner();
    console.log(`👑 New contract owner: ${newContractOwner}`);

    if (newContractOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log(
        "✅ Deployer is owner of new contract, proceeding with funding..."
      );

      // Fund the new contract with 0.1 ETH
      const fundAmount = hre.ethers.parseEther("0.1");
      const fundTx = await newContract.fundContract({
        value: fundAmount,
        gasLimit: 100000,
      });

      console.log("⏳ Funding transaction sent:", fundTx.hash);
      const fundReceipt = await fundTx.wait();
      console.log("✅ New contract funded successfully!");
      console.log(`💰 Amount funded: 0.1 ETH`);
      console.log(`⛽ Gas used: ${fundReceipt.gasUsed.toString()}`);

      // Check new contract balance
      const newContractBalance = await hre.ethers.provider.getBalance(
        NEW_CONTRACT_ADDRESS
      );
      console.log(
        `💰 New contract balance: ${hre.ethers.formatEther(
          newContractBalance
        )} ETH`
      );
    } else {
      console.log("❌ Deployer is not owner of new contract");
      console.log("🔑 You need to use the wallet that owns the new contract");
      return;
    }
  } catch (error) {
    console.error("❌ Error funding new contract:", error.message);
    return;
  }

  console.log("\n🎯 Funding process completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
