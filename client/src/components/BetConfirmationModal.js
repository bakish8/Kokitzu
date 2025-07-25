import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMutation } from "@apollo/client";
import { RECORD_BLOCKCHAIN_BET } from "../graphql/queries";

// Contract configuration
const CONTRACT_ADDRESS = "0xd7230Aa2524AF5863F3FA45C3a21280E5E1970AE";
const CONTRACT_ABI = [
  "function createOption(string memory asset, uint256 amount, uint256 expiryTime, bool isCall) external payable",
  "function getCurrentPrice(string memory asset) external view returns (uint256)",
  "function assetConfigs(string) external view returns (address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage, bool isActive)",
  "event OptionCreated(uint256 indexed optionId, address indexed trader, string asset, uint256 amount, uint256 strikePrice, uint256 expiryTime, bool isCall)",
];

// Timeframe mappings
const TIMEFRAME_SECONDS = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  FOUR_HOURS: 14400,
  ONE_DAY: 86400,
};

function BetConfirmationModal({
  showBetModal,
  setShowBetModal,
  selectedCrypto,
  betType,
  betAmount,
  getSelectedTimeframeInfo,
  handlePlaceBet,
}) {
  const [bettingMode, setBettingMode] = useState("blockchain"); // Default to blockchain
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // GraphQL mutation to record blockchain bet in database
  const [recordBlockchainBet] = useMutation(RECORD_BLOCKCHAIN_BET, {
    onError: (error) => {
      console.error("Failed to record blockchain bet in database:", error);
    },
  });

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed! Please install MetaMask.");
      return;
    }

    try {
      setIsConnecting(true);

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setWalletAddress(address);

      // Get balance
      const balance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));

      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        // Sepolia chain ID
        alert("Please switch to Sepolia testnet in MetaMask");
        return;
      }

      console.log("✅ Wallet connected:", address);
      console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Place blockchain bet directly from user's wallet
  const placeBlockchainBet = async () => {
    if (!signer) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsPlacingBet(true);

      // Convert bet amount from USD to ETH (simplified - in production you'd use a price oracle)
      const ethAmount = (betAmount / 3000).toString(); // Assuming ETH ≈ $3000
      const amountWei = ethers.parseEther(ethAmount);

      // Get timeframe info
      const timeframeInfo = getSelectedTimeframeInfo();
      const timeframeKey =
        Object.keys(TIMEFRAME_SECONDS).find((key) =>
          timeframeInfo.label.includes(key.replace("_", " ").toLowerCase())
        ) || "ONE_MINUTE";
      const expirySeconds = TIMEFRAME_SECONDS[timeframeKey];

      // Create contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Map crypto symbol to contract asset
      const assetMap = {
        BTC: "BTC",
        ETH: "ETH",
        LINK: "LINK",
        MATIC: "MATIC",
      };
      const asset = assetMap[selectedCrypto] || selectedCrypto;
      const isCall = betType === "UP";

      console.log("🔗 Placing bet directly from YOUR wallet:", {
        walletAddress: walletAddress,
        asset,
        amount: ethAmount + " ETH",
        expiry: expirySeconds + " seconds",
        isCall: isCall,
        contractAddress: CONTRACT_ADDRESS,
      });
      console.log("💰 YOUR WALLET WILL BE CHARGED:", ethAmount, "ETH");
      console.log("🎯 CONTRACT WILL RECOGNIZE YOU AS TRADER:", walletAddress);

      // Send transaction FROM YOUR WALLET
      const tx = await contract.createOption(
        asset,
        amountWei,
        expirySeconds,
        isCall,
        {
          value: amountWei,
          gasLimit: 500000,
          maxFeePerGas: ethers.parseUnits("2", "gwei"), // Low gas for Sepolia testnet
          maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        }
      );

      console.log("⏳ Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.hash);

      // Update balance
      const newBalance = await provider.getBalance(walletAddress);
      setWalletBalance(ethers.formatEther(newBalance));

      // Parse events to get option ID
      const optionCreatedEvent = receipt.logs.find((log) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "OptionCreated";
        } catch {
          return false;
        }
      });

      let optionId = null;
      let entryPrice = 0;
      if (optionCreatedEvent) {
        const parsed = contract.interface.parseLog(optionCreatedEvent);
        optionId = parsed.args.optionId.toString();
        entryPrice = Number(parsed.args.strikePrice) / 1e8; // Convert from price feed format to USD
        console.log("🎲 Option created with ID:", optionId);
        console.log("💰 Entry price:", entryPrice);
      }

      // Record the bet in database
      try {
        console.log("📝 Recording bet in database...");
        await recordBlockchainBet({
          variables: {
            input: {
              cryptoSymbol: selectedCrypto,
              betType: betType,
              amount: parseFloat(ethAmount),
              timeframe: timeframeKey,
              walletAddress: walletAddress,
              optionId: optionId,
              transactionHash: tx.hash,
              blockNumber: receipt.blockNumber,
              entryPrice: entryPrice,
            },
          },
        });
        console.log("✅ Bet recorded in database");
      } catch (dbError) {
        console.error("❌ Failed to record bet in database:", dbError);
        // Don't fail the whole transaction, just warn user
        alert(
          "Bet placed on blockchain successfully, but failed to record in database. The bet will still be executed properly."
        );
      }

      // Close modal
      setShowBetModal(false);

      alert(
        `Bet placed successfully! Transaction: ${tx.hash}\nOption ID: ${optionId}`
      );
    } catch (error) {
      console.error("Failed to place bet:", error);

      let errorMessage = "Failed to place bet: ";

      if (error.code === 4001) {
        errorMessage = "Transaction cancelled by user.";
      } else if (error.code === -32603) {
        errorMessage =
          "Internal error. Please check your wallet balance and network.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds in your wallet.";
      } else if (error.message.includes("gas")) {
        errorMessage =
          "Gas estimation failed. Please check your wallet balance.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected in MetaMask.";
      } else {
        errorMessage =
          "Failed to place bet: " + (error.message || "Unknown error");
      }

      alert(errorMessage);
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Handle bet confirmation
  const handleConfirmBet = () => {
    if (bettingMode === "blockchain") {
      if (!walletAddress) {
        alert("Please connect your wallet first!");
        return;
      }
      console.log(
        "🔗 Placing BLOCKCHAIN bet directly from YOUR wallet:",
        walletAddress
      );
      console.log("💰 Your wallet will be debited and credited directly!");
      placeBlockchainBet();
    } else {
      console.log("💾 Placing LEGACY bet via server");
      handlePlaceBet(false, null);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletBalance("0");
    setProvider(null);
    setSigner(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  if (!showBetModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowBetModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Confirm Your Bet</h3>
        <div className="bet-confirmation">
          <div className="confirmation-item">
            <span>Cryptocurrency:</span>
            <span>{selectedCrypto}</span>
          </div>
          <div className="confirmation-item">
            <span>Direction:</span>
            <span className={`direction ${betType.toLowerCase()}`}>
              {betType}
            </span>
          </div>
          <div className="confirmation-item">
            <span>Timeframe:</span>
            <span>{getSelectedTimeframeInfo()?.label}</span>
          </div>
          <div className="confirmation-item">
            <span>Amount:</span>
            <span>${betAmount}</span>
          </div>
          <div className="confirmation-item">
            <span>Potential Payout:</span>
            <span>
              $
              {(
                betAmount *
                parseFloat(getSelectedTimeframeInfo()?.payout.replace("x", ""))
              ).toFixed(2)}
            </span>
          </div>

          {/* Betting Mode Selection */}
          <div className="confirmation-item">
            <span>Betting Mode:</span>
            <div className="betting-mode-selection">
              <label
                className={`mode-option ${
                  bettingMode === "legacy" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  value="legacy"
                  checked={bettingMode === "legacy"}
                  onChange={(e) => setBettingMode(e.target.value)}
                />
                💾 Legacy (In-Memory)
              </label>
              <label
                className={`mode-option ${
                  bettingMode === "blockchain" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  value="blockchain"
                  checked={bettingMode === "blockchain"}
                  onChange={(e) => setBettingMode(e.target.value)}
                />
                🔗 Blockchain (Real ETH)
              </label>
            </div>
          </div>

          {/* Wallet Connection (only show for blockchain mode) */}
          {bettingMode === "blockchain" && (
            <div className="confirmation-item">
              <span>Wallet:</span>
              <div className="wallet-section">
                {!walletAddress ? (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="connect-wallet-btn"
                  >
                    {isConnecting ? "Connecting..." : "🦊 Connect MetaMask"}
                  </button>
                ) : (
                  <div className="wallet-info">
                    <div className="wallet-address">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                    <div className="wallet-balance">
                      Balance: {parseFloat(walletBalance).toFixed(4)} ETH
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="disconnect-btn"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
              <small style={{ color: "#666", fontSize: "10px" }}>
                ⚠️ Make sure you have Sepolia ETH for gas fees
              </small>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowBetModal(false)}>
            Cancel
          </button>
          <button
            className="confirm-btn"
            onClick={handleConfirmBet}
            disabled={
              isPlacingBet || (bettingMode === "blockchain" && !walletAddress)
            }
          >
            {isPlacingBet
              ? "Placing Bet..."
              : bettingMode === "blockchain"
              ? "🔗 Place Real ETH Bet"
              : "💾 Place Demo Bet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BetConfirmationModal;
