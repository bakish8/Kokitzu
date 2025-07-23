import dotenv from "dotenv";
import { ethers } from "ethers";
import contractService from "./contractService.js";

dotenv.config();

async function debugOption() {
  console.log("🔍 DEBUG: Analyzing Option ID 5...");

  try {
    // Initialize contract service
    await contractService.init();
    console.log("✅ Contract service initialized\n");

    const optionId = "5";

    // Get option details
    console.log(`📋 Fetching option ${optionId} details...`);
    const option = await contractService.getOption(optionId);

    console.log(`\n📊 OPTION ${optionId} STATUS:`);
    console.log(`   └─ Trader: ${option.trader}`);
    console.log(`   └─ Asset: ${option.asset}`);
    console.log(
      `   └─ Amount: ${option.amount} wei (${
        parseFloat(option.amount) / 1e18
      } ETH)`
    );
    console.log(
      `   └─ Strike Price: ${option.strikePrice} (${
        parseFloat(option.strikePrice) / 1e8
      })`
    );
    console.log(
      `   └─ Entry Price: ${option.entryPrice} (${
        parseFloat(option.entryPrice) / 1e8
      })`
    );
    console.log(
      `   └─ Exit Price: ${option.exitPrice} (${
        parseFloat(option.exitPrice) / 1e8
      })`
    );
    console.log(
      `   └─ Expiry: ${option.expiry} (${new Date(
        parseInt(option.expiry) * 1000
      ).toISOString()})`
    );
    console.log(`   └─ Is Call: ${option.isCall}`);
    console.log(`   └─ Executed: ${option.executed}`);
    console.log(`   └─ Won: ${option.won}`);

    // Check if ready for execution
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = parseInt(option.expiry);
    const isExpired = now >= expiryTime;

    console.log(`\n⏰ TIMING ANALYSIS:`);
    console.log(
      `   └─ Current time: ${now} (${new Date(now * 1000).toISOString()})`
    );
    console.log(
      `   └─ Expiry time: ${expiryTime} (${new Date(
        expiryTime * 1000
      ).toISOString()})`
    );
    console.log(`   └─ Is expired: ${isExpired ? "✅ YES" : "❌ NO"}`);
    console.log(
      `   └─ Time since expiry: ${
        isExpired ? `${now - expiryTime} seconds` : "Not expired"
      }`
    );

    if (option.executed) {
      console.log(`\n✅ Option ${optionId} is already executed!`);

      const finalPrice = parseFloat(option.exitPrice) / 1e8;
      const entryPrice = parseFloat(option.entryPrice) / 1e8;
      const isPush = option.strikePrice === option.exitPrice;

      if (isPush) {
        console.log(`🔄 RESULT: TIE/PUSH (Same price)`);
        console.log(
          `   └─ You get your money back: ${
            parseFloat(option.amount) / 1e18
          } ETH`
        );
      } else if (option.won) {
        console.log(`🎉 RESULT: WIN!`);
        console.log(
          `   └─ You won! Payout: ~${
            (parseFloat(option.amount) / 1e18) * 0.8
          } ETH`
        );
      } else {
        console.log(`❌ RESULT: LOSS`);
        console.log(`   └─ You lost. No payout.`);
      }

      console.log(`\n📈 PRICE MOVEMENT:`);
      console.log(`   └─ Entry: $${entryPrice.toLocaleString()}`);
      console.log(`   └─ Final: $${finalPrice.toLocaleString()}`);
      console.log(
        `   └─ Change: ${finalPrice > entryPrice ? "+" : ""}$${(
          finalPrice - entryPrice
        ).toFixed(2)}`
      );
      console.log(
        `   └─ Your bet: ${option.isCall ? "BUY (UP)" : "SELL (DOWN)"}`
      );
      console.log(
        `   └─ Correct direction: ${
          option.isCall
            ? finalPrice > entryPrice
              ? "✅ YES"
              : "❌ NO"
            : finalPrice < entryPrice
            ? "✅ YES"
            : "❌ NO"
        }`
      );
    } else if (!isExpired) {
      console.log(`⏰ Option ${optionId} is not ready for execution yet`);
      console.log(`   └─ Wait ${expiryTime - now} more seconds`);
    } else {
      console.log(`⚠️ Option ${optionId} is expired but not executed`);

      // Try to understand why execution might fail
      console.log(`\n🔍 EXECUTION READINESS CHECK:`);

      // Check contract balance
      const stats = await contractService.getContractStats();
      console.log(`   └─ Contract balance: ${stats.contractBalance} ETH`);

      // Check if the option exists and is valid
      if (option.trader === "0x0000000000000000000000000000000000000000") {
        console.log(`   └─ ❌ Option doesn't exist`);
      } else {
        console.log(`   └─ ✅ Option exists`);
      }

      console.log(
        `   └─ Ready for execution: ${
          isExpired && !option.executed ? "✅ YES" : "❌ NO"
        }`
      );

      // Try to simulate execution with different gas limits
      console.log(`\n🧪 TESTING EXECUTION WITH DIFFERENT PARAMETERS...`);

      try {
        // Test with higher gas limit
        console.log(`📝 Attempting execution with gas limit 300,000...`);
        const result = await contractService.contract.executeOption(optionId, {
          gasLimit: 500000,
          maxFeePerGas: ethers.parseUnits("30", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),
        });
        console.log(`✅ Execution successful! Transaction: ${result.hash}`);
        await result.wait();
        console.log(`✅ Transaction confirmed`);
      } catch (execError) {
        console.error(`❌ Execution failed: ${execError.message}`);

        // Try to get more specific error info
        if (execError.message.includes("revert")) {
          console.log(`🔍 Trying to decode revert reason...`);

          try {
            // Try calling the function to get revert reason
            await contractService.contract.executeOption.staticCall(optionId);
          } catch (staticError) {
            console.error(`🔍 Static call error: ${staticError.message}`);
          }
        }
      }
    }

    console.log(`\n🎯 Analysis complete for Option ${optionId}`);
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

debugOption();
