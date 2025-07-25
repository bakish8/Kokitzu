import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";

const CONTRACT_ABI = [
  "function getOption(uint256 optionId) external view returns (uint256, address, string, uint256, uint256, uint256, bool, bool, bool, uint256, uint256, uint256)",
  "function getContractStats() external view returns (uint256 totalOptions, uint256 totalVolume, uint256 contractBalance)",
];

async function testContractOptions() {
  try {
    console.log("🔧 Testing contract options...");

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // Get contract stats
    const stats = await contract.getContractStats();
    console.log("📊 Contract stats:", {
      totalOptions: stats[0].toString(),
      totalVolume: ethers.formatEther(stats[1]),
      contractBalance: ethers.formatEther(stats[2]),
    });

    // Test option IDs 0-50 to see which ones exist
    console.log("🔍 Testing option IDs 0-50...");

    for (let i = 0; i <= 50; i++) {
      try {
        const option = await contract.getOption(i);
        const trader = option[1];

        if (trader !== "0x0000000000000000000000000000000000000000") {
          console.log(`✅ Option ${i} exists:`, {
            trader: trader,
            asset: option[2],
            amount: ethers.formatEther(option[3]),
            isExecuted: option[7],
            isWon: option[8],
          });
        }
      } catch (error) {
        // Option doesn't exist or other error
        if (i <= 10) {
          // Only log first few errors
          console.log(`❌ Option ${i} error:`, error.message);
        }
      }
    }

    // Specifically test the option IDs from the logs
    console.log("🎯 Testing specific option IDs from logs...");
    const testIds = [37, 38];

    for (const id of testIds) {
      try {
        const option = await contract.getOption(id);
        const trader = option[1];

        console.log(`🔍 Option ${id}:`, {
          trader: trader,
          isZeroAddress:
            trader === "0x0000000000000000000000000000000000000000",
          asset: option[2],
          amount: ethers.formatEther(option[3]),
          isExecuted: option[7],
          isWon: option[8],
        });
      } catch (error) {
        console.log(`❌ Option ${id} error:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testContractOptions();
