const { ethers } = require("hardhat");

async function main() {
  const OLD_CONTRACT_ADDRESS = "0x5656455F5d03b68C56d64f9A009ed0BB8c868a6b";
  const [signer] = await ethers.getSigners();
  console.log(`👤 Owner: ${signer.address}`);

  // Get contract instance
  const oldContract = await ethers.getContractAt(
    "BinaryOptions",
    OLD_CONTRACT_ADDRESS
  );

  // Withdraw funds
  const balanceBefore = await ethers.provider.getBalance(OLD_CONTRACT_ADDRESS);
  console.log(
    `💰 Old contract balance: ${ethers.formatEther(balanceBefore)} ETH`
  );
  if (balanceBefore > 0n) {
    console.log("📝 Calling withdrawFees()...");
    const tx = await oldContract.withdrawFees();
    await tx.wait();
    console.log("✅ Funds withdrawn to owner.");
  } else {
    console.log("❌ No funds to withdraw.");
  }

  // Try to selfdestruct (if function exists)
  if (typeof oldContract.selfDestruct === "function") {
    try {
      console.log("🧨 Calling selfDestruct()...");
      const tx2 = await oldContract.selfDestruct();
      await tx2.wait();
      console.log("✅ Contract selfdestructed.");
    } catch (e) {
      console.log("⚠️ selfDestruct() failed or not implemented.");
    }
  } else {
    console.log(
      "⚠️ No selfDestruct() function in contract. Manual removal not possible."
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
