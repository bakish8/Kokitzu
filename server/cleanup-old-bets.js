import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Enhanced bet schema to support both in-memory and blockchain bets
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
  result: {
    type: String,
    enum: ["WIN", "LOSS", "PUSH", "DRAW", null],
    default: null,
  },
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

async function cleanupOldBets() {
  console.log("🧹 Cleaning up old blockchain bets...");

  try {
    // Connect to MongoDB
    const MONGO_URI =
      process.env.MONGO_URI ||
      "mongodb+srv://BAKISH:HbLErnUQnbKppcPI@kokitzu.rqazpbf.mongodb.net/?retryWrites=true&w=majority";

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Find all old active blockchain bets (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oldBets = await Bet.find({
      isBlockchainBet: true,
      status: "ACTIVE",
      createdAt: { $lt: today }, // Created before today
    });

    console.log(`📋 Found ${oldBets.length} old active blockchain bets`);

    if (oldBets.length === 0) {
      console.log("✅ No old bets to clean up!");
      return;
    }

    // Mark all old bets as expired
    const result = await Bet.updateMany(
      {
        isBlockchainBet: true,
        status: "ACTIVE",
        createdAt: { $lt: today },
      },
      {
        status: "EXPIRED",
        result: "DRAW",
        exitPrice: null,
        payout: 0,
      }
    );

    console.log(`✅ Cleaned up ${result.modifiedCount} old blockchain bets`);
    console.log("🎉 Database cleanup completed!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

cleanupOldBets();
