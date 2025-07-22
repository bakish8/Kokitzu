import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

async function verifyTransaction() {
  console.log(
    "🔍 VERIFYING TRANSACTION: 0xd3845645a4d488389d6381e7d0aaed7d9f5df586120c64e655b7f0903e09c80a"
  );

  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const txHash =
      "0xd3845645a4d488389d6381e7d0aaed7d9f5df586120c64e655b7f0903e09c80a";

    // Get transaction details
    console.log(`📋 Fetching transaction details...`);
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      console.log("❌ Transaction not found!");
      process.exit(1);
    }

    console.log(`\n📊 TRANSACTION DETAILS:`);
    console.log(`   └─ Hash: ${tx.hash}`);
    console.log(`   └─ From: ${tx.from}`);
    console.log(`   └─ To: ${tx.to}`);
    console.log(`   └─ Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`   └─ Gas Limit: ${tx.gasLimit.toString()}`);
    console.log(
      `   └─ Gas Price: ${tx.gasPrice ? tx.gasPrice.toString() : "N/A"}`
    );
    console.log(
      `   └─ Data: ${tx.data.substring(0, 66)}... (${tx.data.length} chars)`
    );

    // Get transaction receipt
    console.log(`\n📄 Fetching transaction receipt...`);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      console.log("❌ Transaction receipt not found!");
      process.exit(1);
    }

    console.log(`\n📊 TRANSACTION RECEIPT:`);
    console.log(
      `   └─ Status: ${receipt.status === 1 ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    console.log(`   └─ Block Number: ${receipt.blockNumber}`);
    console.log(`   └─ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   └─ Contract Address: ${receipt.contractAddress || "N/A"}`);
    console.log(`   └─ Logs Count: ${receipt.logs.length}`);

    if (receipt.status === 0) {
      console.log(
        `\n❌ TRANSACTION FAILED! This is why no option was created.`
      );
      process.exit(0);
    }

    // Analyze logs for events
    console.log(`\n🔍 ANALYZING LOGS FOR EVENTS...`);

    // Contract ABI for event decoding
    const contractABI = [
      "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
      "event AssetConfigUpdated(string indexed asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage)",
    ];

    const contractInterface = new ethers.Interface(contractABI);

    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`\n   📝 Log ${i}:`);
      console.log(`      └─ Address: ${log.address}`);
      console.log(`      └─ Topics: [${log.topics.join(", ")}]`);
      console.log(`      └─ Data: ${log.data}`);

      try {
        const decoded = contractInterface.parseLog({
          topics: log.topics,
          data: log.data,
        });

        if (decoded) {
          console.log(`      └─ Decoded Event: ${decoded.name}`);
          console.log(`      └─ Args:`, decoded.args);

          if (decoded.name === "OptionCreated") {
            console.log(`      └─ 🎯 OPTION CREATED!`);
            console.log(
              `         └─ Option ID: ${decoded.args.optionId.toString()}`
            );
            console.log(`         └─ Trader: ${decoded.args.trader}`);
            console.log(`         └─ Asset: ${decoded.args.asset}`);
            console.log(
              `         └─ Amount: ${ethers.formatEther(
                decoded.args.amount
              )} ETH`
            );
            console.log(
              `         └─ Strike Price: ${decoded.args.strikePrice.toString()}`
            );
            console.log(
              `         └─ Expiry: ${new Date(
                Number(decoded.args.expiryTime) * 1000
              ).toISOString()}`
            );
            console.log(`         └─ Is Call: ${decoded.args.isCall}`);
          }
        }
      } catch (decodeError) {
        console.log(`      └─ Decode failed: ${decodeError.message}`);
      }
    }

    // Check if the transaction was to the correct contract
    const expectedContract =
      process.env.CONTRACT_ADDRESS ||
      "0x192e65C1EaCfbE5d7A2f3C2CD287513713B283C6";
    if (tx.to.toLowerCase() !== expectedContract.toLowerCase()) {
      console.log(
        `\n⚠️ WARNING: Transaction was sent to ${tx.to} but expected ${expectedContract}`
      );
    }

    console.log(`\n🎯 ANALYSIS COMPLETE`);
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

verifyTransaction();
