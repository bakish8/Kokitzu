const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const OLD_CONTRACT_ADDRESS = "0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE";

  console.log("💰 Withdrawing funds from old contract...");
  console.log("📍 Old Contract:", OLD_CONTRACT_ADDRESS);
  console.log("👤 Owner:", deployer.address);

  // Get contract instance
  const BinaryOptions = await ethers.getContractFactory("BinaryOptions");
  const oldContract = BinaryOptions.attach(OLD_CONTRACT_ADDRESS);

  // Check old contract balance
  const oldBalance = await ethers.provider.getBalance(OLD_CONTRACT_ADDRESS);
  console.log(
    "💰 Old contract balance:",
    ethers.formatEther(oldBalance),
    "ETH"
  );

  if (oldBalance > 0) {
    // Withdraw funds from old contract
    const tx = await oldContract.withdrawFees();

    console.log("📤 Withdrawal transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Withdrawal confirmed in block:", receipt.blockNumber);

    // Check balances after withdrawal
    const newOldBalance = await ethers.provider.getBalance(
      OLD_CONTRACT_ADDRESS
    );
    console.log(
      "💰 Old contract balance after withdrawal:",
      ethers.formatEther(newOldBalance),
      "ETH"
    );
  } else {
    console.log("ℹ️  Old contract already has 0 balance");
  }

  console.log("🎉 Old contract cleanup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
