// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title BinaryOptionsFixed
 * @dev FIXED version of BinaryOptions with reliable ETH transfers
 * @author Kokitzu Team
 * 
 * FIXES APPLIED:
 * 1. ✅ Proper gas limits for ETH transfers
 * 2. ✅ Better balance checking
 * 3. ✅ Pull payment pattern for safety
 * 4. ✅ Emergency withdrawal mechanisms
 */
contract BinaryOptionsFixed is ReentrancyGuard, Ownable {

    // Structs (same as original)
    struct Option {
        uint256 id;
        address trader;
        string asset;
        uint256 amount;
        uint256 strikePrice;
        uint256 expiryTime;
        bool isCall;
        bool isExecuted;
        bool isWon;
        uint256 payout;
        uint256 timestamp;
        uint256 finalPrice;
    }

    struct AssetConfig {
        address priceFeed;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 feePercentage;
        bool isActive;
    }

    // State variables
    uint256 private _optionIds;
    
    mapping(uint256 => Option) public options;
    mapping(string => AssetConfig) public assetConfigs;
    mapping(address => uint256[]) public userOptions;
    
    // NEW: Claimable payouts for users
    mapping(address => uint256) public claimablePayouts;
    
    uint256 public platformFee = 200; // 2% platform fee
    uint256 public minExpiryTime = 30 seconds;
    uint256 public maxExpiryTime = 24 hours;
    
    // NEW: Gas limit for transfers
    uint256 public constant TRANSFER_GAS_LIMIT = 50000;
    
    // Events
    event OptionCreated(
        uint256 indexed optionId,
        address indexed trader,
        string asset,
        uint256 amount,
        uint256 strikePrice,
        uint256 expiryTime,
        bool isCall
    );
    
    event OptionExecuted(
        uint256 indexed optionId,
        bool isWon,
        bool isPush,
        uint256 payout,
        uint256 finalPrice
    );
    
    // NEW: Payout events
    event PayoutMadeClaimable(address indexed trader, uint256 amount);
    event PayoutClaimed(address indexed trader, uint256 amount);
    event DirectPayoutSucceeded(address indexed trader, uint256 amount);
    event DirectPayoutFailed(address indexed trader, uint256 amount);
    
    event AssetConfigUpdated(string asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage);
    event PlatformFeeUpdated(uint256 newFee);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    event FundsDeposited(address indexed owner, uint256 amount);

    // Modifiers (same as original)
    modifier onlyValidAsset(string memory asset) {
        require(assetConfigs[asset].isActive, "Asset not supported");
        _;
    }
    
    modifier onlyOptionOwner(uint256 optionId) {
        require(options[optionId].trader == msg.sender, "Not option owner");
        _;
    }
    
    modifier onlyUnexecutedOption(uint256 optionId) {
        require(!options[optionId].isExecuted, "Option already executed");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // Setup assets for Arbitrum Sepolia
        _setupAsset("ETH", 0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165, 0.001 ether, 2 ether, 150);
        _setupAsset("BTC", 0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69, 0.0001 ether, 1 ether, 200);
    }

    /**
     * @dev Create option for another user (same as original)
     */
    function createOptionFor(
        address beneficiary,
        string memory asset,
        uint256 amount,
        uint256 strikePrice,
        uint256 expiryTime,
        bool isCall
    ) external payable onlyValidAsset(asset) nonReentrant {
        require(msg.value == amount, "Incorrect amount sent");
        require(amount >= assetConfigs[asset].minAmount, "Amount too low");
        require(amount <= assetConfigs[asset].maxAmount, "Amount too high");
        require(expiryTime >= minExpiryTime, "Expiry time too short");
        require(expiryTime <= maxExpiryTime, "Expiry time too long");
        require(block.timestamp + expiryTime > block.timestamp, "Invalid expiry time");
        require(strikePrice > 0, "Invalid strike price");

        _optionIds++;
        uint256 optionId = _optionIds;

        options[optionId] = Option({
            id: optionId,
            trader: beneficiary,
            asset: asset,
            amount: amount,
            strikePrice: strikePrice,
            expiryTime: block.timestamp + expiryTime,
            isCall: isCall,
            isExecuted: false,
            isWon: false,
            payout: 0,
            timestamp: block.timestamp,
            finalPrice: 0
        });

        userOptions[beneficiary].push(optionId);

        emit OptionCreated(optionId, beneficiary, asset, amount, strikePrice, block.timestamp + expiryTime, isCall);
    }

    /**
     * @dev FIXED executeOption with reliable ETH transfers
     */
    function executeOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        require(option.trader != address(0), "Option does not exist");
        require(!option.isExecuted, "Option already executed");
        require(block.timestamp >= option.expiryTime, "Option not expired yet");

        uint256 chainlinkPrice = getCurrentPrice(option.asset);
        require(chainlinkPrice > 0, "Invalid price feed");

        uint256 finalPrice = chainlinkPrice / 1e6;

        // Calculate win/loss/push (same logic as original)
        bool isWon;
        bool isPush;
        
        uint256 pushThreshold = (option.strikePrice * 1) / 100000;
        uint256 priceDifference = option.strikePrice > finalPrice ? 
            option.strikePrice - finalPrice : 
            finalPrice - option.strikePrice;
        
        if (priceDifference <= pushThreshold) {
            isWon = false;
            isPush = true;
        } else {
            if (option.isCall) {
                isWon = finalPrice > option.strikePrice;
            } else {
                isWon = finalPrice < option.strikePrice;
            }
            isPush = false;
        }
        
        uint256 payout = 0;

        if (isPush) {
            // PUSH: Refund original bet
            payout = option.amount;
        } else if (isWon) {
            // WIN: 1.8x payout
            payout = option.amount + (option.amount * 80) / 100;
        }
        // LOSS: No payout

        // Mark as executed first
        option.isExecuted = true;
        option.isWon = isWon;
        option.payout = payout;
        option.finalPrice = finalPrice;

        // Emit event
        emit OptionExecuted(optionId, isWon, isPush, payout, finalPrice);

        // 🚀 FIXED PAYOUT LOGIC
        if (payout > 0) {
            _handlePayout(option.trader, payout);
        }
    }

    /**
     * @dev FIXED payout handling with multiple fallback strategies
     */
    function _handlePayout(address trader, uint256 amount) internal {
        require(address(this).balance >= amount, "Insufficient contract balance");

        // Strategy 1: Try direct transfer with proper gas limit
        (bool success, ) = trader.call{value: amount, gas: TRANSFER_GAS_LIMIT}("");
        
        if (success) {
            emit DirectPayoutSucceeded(trader, amount);
            return;
        }

        // Strategy 2: If direct transfer fails, make it claimable
        emit DirectPayoutFailed(trader, amount);
        claimablePayouts[trader] += amount;
        emit PayoutMadeClaimable(trader, amount);
    }

    /**
     * @dev Users can claim their payouts manually if direct transfer failed
     */
    function claimPayout() external nonReentrant {
        uint256 amount = claimablePayouts[msg.sender];
        require(amount > 0, "No claimable payout");
        require(address(this).balance >= amount, "Insufficient contract balance");

        claimablePayouts[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount, gas: TRANSFER_GAS_LIMIT}("");
        require(success, "Claim transfer failed");

        emit PayoutClaimed(msg.sender, amount);
    }

    /**
     * @dev Check claimable payout for a user
     */
    function getClaimablePayout(address user) external view returns (uint256) {
        return claimablePayouts[user];
    }

    /**
     * @dev Get current price (same as original)
     */
    function getCurrentPrice(string memory asset) public view returns (uint256) {
        AssetConfig memory config = assetConfigs[asset];
        require(config.isActive, "Asset not supported");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(config.priceFeed);
        (, int256 price,,,) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    /**
     * @dev Setup asset (same as original)
     */
    function _setupAsset(
        string memory asset,
        address priceFeed,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 feePercentage
    ) internal {
        assetConfigs[asset] = AssetConfig({
            priceFeed: priceFeed,
            minAmount: minAmount,
            maxAmount: maxAmount,
            feePercentage: feePercentage,
            isActive: true
        });
    }

    /**
     * @dev Get option details (same as original)
     */
    function getOption(uint256 optionId) external view returns (Option memory) {
        return options[optionId];
    }

    /**
     * @dev Get user options (same as original)
     */
    function getUserOptions(address user) external view returns (uint256[] memory) {
        return userOptions[user];
    }

    /**
     * @dev Owner can fund the contract
     */
    function fundContract() external payable onlyOwner {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Owner can withdraw fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance, gas: TRANSFER_GAS_LIMIT}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @dev Emergency rescue for stuck payouts
     */
    function emergencyRescuePayout(address trader, uint256 amount) external onlyOwner {
        require(claimablePayouts[trader] >= amount, "Invalid rescue amount");
        require(address(this).balance >= amount, "Insufficient balance");
        
        claimablePayouts[trader] -= amount;
        
        (bool success, ) = trader.call{value: amount, gas: TRANSFER_GAS_LIMIT}("");
        require(success, "Emergency rescue failed");
        
        emit PayoutClaimed(trader, amount);
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalOptions,
        uint256 totalVolume,
        uint256 contractBalance,
        uint256 totalClaimablePayouts
    ) {
        totalOptions = _optionIds;
        contractBalance = address(this).balance;
        
        for (uint256 i = 1; i <= totalOptions; i++) {
            totalVolume += options[i].amount;
        }
        
        // Calculate total claimable payouts (would need to iterate through all users in real implementation)
        totalClaimablePayouts = 0; // Simplified for this example
        
        return (totalOptions, totalVolume, contractBalance, totalClaimablePayouts);
    }

    // Receive function
    receive() external payable {}
} 