import mongoose from "mongoose";
import dotenv from "dotenv";
import contractService from "./contractService.js";

// Load environment variables
dotenv.config();

// Bet schema (same as in resolvers.js)
const betSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  userId: { type: String, required: true },
  cryptoSymbol: { type: String, required: true },
  betType: { type: String, enum: ["UP", "DOWN"], required: true },
  amount: { type: Number, required: true },
  timeframe: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  targetPrice: { type: Number },
  status: {
    type: String,
    enum: ["ACTIVE", "WON", "LOST", "EXPIRED"],
    default: "ACTIVE",
  },
  result: { type: String, enum: ["WIN", "LOSS", "DRAW", null], default: null },
  exitPrice: { type: Number, default: null },
  payout: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },

  // Blockchain-specific fields
  isBlockchainBet: { type: Boolean, default: false },
  optionId: { type: String }, // Blockchain option ID
  transactionHash: { type: String }, // Transaction hash
  blockNumber: { type: Number }, // Block number
  walletAddress: { type: String }, // User's wallet address
});

const Bet = mongoose.models.Bet || mongoose.model("Bet", betSchema);

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority";

async function executeExpiredBets() {
  console.log(
    "🔥 IMMEDIATE EXECUTION: Checking for expired blockchain bets..."
  );

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Initialize contract service
    await contractService.init();
    console.log("✅ Contract service initialized");

    const now = new Date();

    // Find all active blockchain bets that have expired
    const expiredBets = await Bet.find({
      isBlockchainBet: true,
      status: "ACTIVE",
      expiresAt: { $lte: now },
    });

    console.log(`\n📋 Found ${expiredBets.length} expired blockchain bets`);

    if (expiredBets.length === 0) {
      console.log("✅ No expired bets to process");
      process.exit(0);
    }

    // Process each expired bet
    for (const bet of expiredBets) {
      console.log(`\n⚡ Processing expired bet: ${bet.id}`);
      console.log(`   └─ Option ID: ${bet.optionId}`);
      console.log(`   └─ Asset: ${bet.cryptoSymbol} ${bet.betType}`);
      console.log(`   └─ Amount: ${bet.amount} ETH`);
      console.log(`   └─ Entry Price: $${bet.entryPrice.toLocaleString()}`);
      console.log(`   └─ Expired at: ${bet.expiresAt.toISOString()}`);
      console.log(
        `   └─ Expired ${Math.round((now - bet.expiresAt) / 60000)} minutes ago`
      );

      try {
        // First check if already executed
        console.log(`🔍 Checking current option status...`);
        const currentOption = await contractService.getOption(bet.optionId);

        if (currentOption.executed) {
          console.log(
            `✅ Option ${bet.optionId} already executed on blockchain!`
          );

          const isWon = currentOption.won;
          const isPush = currentOption.strikePrice === currentOption.exitPrice;
          const exitPrice = parseFloat(currentOption.exitPrice) / 1e8;

          let payout = 0;
          let result = "";
          let status = "";

          if (isPush) {
            result = "DRAW";
            status = "EXPIRED";
            payout = bet.amount; // Full refund
            console.log(
              `🔄 RESULT: TIE/PUSH - Same price! Full refund: ${payout} ETH`
            );
          } else if (isWon) {
            result = "WIN";
            status = "WON";
            payout = bet.amount * 0.8; // 80% payout after fees
            console.log(`🎉 RESULT: WIN - You won! Payout: ${payout} ETH`);
          } else {
            result = "LOSS";
            status = "LOST";
            payout = 0;
            console.log(`❌ RESULT: LOSS - You lost. No payout.`);
          }

          // Update bet in database
          bet.status = status;
          bet.result = result;
          bet.exitPrice = exitPrice;
          bet.payout = payout;
          await bet.save();

          console.log(`💾 Database updated:`);
          console.log(`   └─ Status: ${status}`);
          console.log(`   └─ Result: ${result}`);
          console.log(`   └─ Exit Price: $${exitPrice.toLocaleString()}`);
          console.log(`   └─ Payout: ${payout} ETH`);

          // Show detailed price analysis
          const priceChange = exitPrice - bet.entryPrice;
          const priceChangePercent = (
            (priceChange / bet.entryPrice) *
            100
          ).toFixed(4);

          if (isPush) {
            console.log(
              `🎲 PRICE ANALYSIS: Entry=$${bet.entryPrice.toLocaleString()} = Exit=$${exitPrice.toLocaleString()}`
            );
            console.log(
              `   └─ SAME PRICE = TIE (Push) - You get your money back!`
            );
          } else {
            console.log(`📈 PRICE ANALYSIS:`);
            console.log(`   └─ Entry: $${bet.entryPrice.toLocaleString()}`);
            console.log(`   └─ Exit:  $${exitPrice.toLocaleString()}`);
            console.log(
              `   └─ Change: ${
                priceChange > 0 ? "+" : ""
              }$${priceChange.toFixed(2)} (${priceChangePercent}%)`
            );

            if (bet.betType === "UP") {
              console.log(`   └─ Your bet: BUY (price should go UP)`);
              console.log(
                `   └─ Actual: Price went ${
                  priceChange > 0 ? "UP ✅" : "DOWN ❌"
                }`
              );
            } else {
              console.log(`   └─ Your bet: SELL (price should go DOWN)`);
              console.log(
                `   └─ Actual: Price went ${
                  priceChange < 0 ? "DOWN ✅" : "UP ❌"
                }`
              );
            }
          }
        } else {
          // Execute the option on blockchain
          console.log(
            `📝 Executing option ${bet.optionId} on smart contract...`
          );
          const executionResult = await contractService.executeOption(
            bet.optionId
          );

          console.log(`✅ Option ${bet.optionId} executed successfully!`);
          console.log(
            `   └─ Transaction Hash: ${executionResult.transactionHash}`
          );
          console.log(`   └─ Gas Used: ${executionResult.gasUsed}`);

          // Get the updated option data from blockchain
          console.log(`📊 Fetching final results...`);
          const option = await contractService.getOption(bet.optionId);

          const isWon = option.won;
          const isPush = option.strikePrice === option.exitPrice;
          const exitPrice = parseFloat(option.exitPrice) / 1e8;

          let payout = 0;
          let result = "";
          let status = "";

          if (isPush) {
            result = "DRAW";
            status = "EXPIRED";
            payout = bet.amount;
            console.log(
              `🔄 RESULT: TIE/PUSH - Same price! Full refund: ${payout} ETH`
            );
          } else if (isWon) {
            result = "WIN";
            status = "WON";
            payout = bet.amount * 0.8;
            console.log(`🎉 RESULT: WIN - You won! Payout: ${payout} ETH`);
          } else {
            result = "LOSS";
            status = "LOST";
            payout = 0;
            console.log(`❌ RESULT: LOSS - You lost. No payout.`);
          }

          // Update bet in database
          bet.status = status;
          bet.result = result;
          bet.exitPrice = exitPrice;
          bet.payout = payout;
          await bet.save();

          console.log(`💾 Database updated:`);
          console.log(`   └─ Status: ${status}`);
          console.log(`   └─ Result: ${result}`);
          console.log(`   └─ Exit Price: $${exitPrice.toLocaleString()}`);
          console.log(`   └─ Payout: ${payout} ETH`);
        }
      } catch (error) {
        console.error(`❌ Failed to process bet ${bet.id}:`, error.message);
      }
    }

    console.log(
      `\n🎯 EXECUTION COMPLETE! Processed ${expiredBets.length} expired bets.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Run the execution
executeExpiredBets();
