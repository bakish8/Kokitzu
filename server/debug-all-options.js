import dotenv from "dotenv";
import { ethers } from "ethers";
import contractService from "./contractService.js";

dotenv.config();

async function debugAllOptions() {
  console.log("🔍 DEBUG: Checking all options on the contract...");

  try {
    // Initialize contract service
    await contractService.init();
    console.log("✅ Contract service initialized\n");

    // Get contract stats first
    const stats = await contractService.getContractStats();
    console.log(`📊 CONTRACT STATS:`);
    console.log(`   └─ Total options: ${stats.totalOptions}`);
    console.log(`   └─ Contract balance: ${stats.contractBalance} ETH\n`);

    const totalOptions = parseInt(stats.totalOptions);

    if (totalOptions === 0) {
      console.log("❌ No options found on contract!");
      process.exit(0);
    }

    // Check each option from 0 to totalOptions-1 (0-indexed)
    for (let i = 0; i < totalOptions; i++) {
      console.log(`\n📋 Checking Option ID ${i}:`);

      try {
        const option = await contractService.getOption(i.toString());

        const isValidOption =
          option.trader !== "0x0000000000000000000000000000000000000000";

        if (isValidOption) {
          const amount = parseFloat(option.amount) / 1e18;
          const entryPrice = parseFloat(option.entryPrice) / 1e8;
          const exitPrice = parseFloat(option.exitPrice) / 1e8;
          const expiryTime = new Date(parseInt(option.expiry) * 1000);
          const now = new Date();
          const isExpired = now >= expiryTime;

          console.log(`   ✅ VALID OPTION:`);
          console.log(`      └─ Trader: ${option.trader}`);
          console.log(`      └─ Asset: ${option.asset}`);
          console.log(`      └─ Amount: ${amount} ETH`);
          console.log(
            `      └─ Type: ${option.isCall ? "BUY (UP)" : "SELL (DOWN)"}`
          );
          console.log(`      └─ Entry Price: $${entryPrice.toLocaleString()}`);
          console.log(`      └─ Exit Price: $${exitPrice.toLocaleString()}`);
          console.log(`      └─ Expiry: ${expiryTime.toISOString()}`);
          console.log(
            `      └─ Status: ${
              option.executed
                ? "🎯 EXECUTED"
                : isExpired
                ? "⏰ EXPIRED"
                : "🔄 ACTIVE"
            }`
          );

          if (option.executed) {
            const isPush = option.strikePrice === option.exitPrice;

            if (isPush) {
              console.log(
                `      └─ Result: 🔄 TIE/PUSH (Same price) - Refund ${amount} ETH`
              );
            } else if (option.won) {
              console.log(
                `      └─ Result: 🎉 WIN - Payout ~${(amount * 0.8).toFixed(
                  6
                )} ETH`
              );
            } else {
              console.log(`      └─ Result: ❌ LOSS - No payout`);
            }

            const priceChange = exitPrice - entryPrice;
            console.log(
              `      └─ Price Change: ${
                priceChange >= 0 ? "+" : ""
              }$${priceChange.toFixed(2)}`
            );
          } else if (isExpired) {
            console.log(`      └─ 🚨 READY FOR EXECUTION!`);
          }
        } else {
          console.log(`   ❌ EMPTY OPTION (ID ${i})`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR reading option ${i}: ${error.message}`);
      }
    }

    // Also check higher option IDs just in case
    console.log(
      `\n🔍 Checking higher option IDs (in case of indexing issues)...`
    );

    for (let i = totalOptions; i < totalOptions + 10; i++) {
      try {
        const option = await contractService.getOption(i.toString());
        const isValidOption =
          option.trader !== "0x0000000000000000000000000000000000000000";

        if (isValidOption) {
          console.log(
            `   ✅ Found valid option at ID ${i} (beyond totalOptions!)`
          );
          console.log(`      └─ Trader: ${option.trader}`);
          console.log(`      └─ Asset: ${option.asset}`);
          console.log(
            `      └─ Amount: ${parseFloat(option.amount) / 1e18} ETH`
          );
        }
      } catch (error) {
        // Expected for non-existent options
        break;
      }
    }

    console.log(`\n🎯 Analysis complete!`);
    console.log(`📊 Summary:`);
    console.log(`   └─ Contract says ${totalOptions} total options`);
    console.log(`   └─ Use the valid option IDs above for execution`);
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

debugAllOptions();
