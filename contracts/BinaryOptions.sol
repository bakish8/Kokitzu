// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title BinaryOptions
 * @dev Smart contract for binary options trading on Ethereum
 * @author Kokitzu Team
 */
contract BinaryOptions is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;

    // Structs
    struct Option {
        uint256 id;
        address trader;
        string asset; // e.g., "BTC", "ETH"
        uint256 amount;
        uint256 strikePrice;
        uint256 expiryTime;
        bool isCall; // true for call (price goes up), false for put (price goes down)
        bool isExecuted;
        bool isWon;
        uint256 payout;
        uint256 timestamp;
    }

    struct AssetConfig {
        address priceFeed;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 feePercentage; // in basis points (100 = 1%)
        bool isActive;
    }

    // State variables
    Counters.Counter private _optionIds;
    
    mapping(uint256 => Option) public options;
    mapping(string => AssetConfig) public assetConfigs;
    mapping(address => uint256[]) public userOptions;
    
    uint256 public platformFee = 200; // 2% platform fee
    uint256 public minExpiryTime = 5 minutes;
    uint256 public maxExpiryTime = 24 hours;
    
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
        uint256 payout,
        uint256 finalPrice
    );
    
    event AssetConfigUpdated(string asset, address priceFeed, uint256 minAmount, uint256 maxAmount, uint256 feePercentage);
    event PlatformFeeUpdated(uint256 newFee);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // Modifiers
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

    constructor() {
        // Initialize with common assets
        _setupAsset("ETH", 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419, 0.01 ether, 10 ether, 150);
        _setupAsset("BTC", 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c, 0.001 ether, 5 ether, 150);
        _setupAsset("MATIC", 0x7bAC85A8a13A4BcD8abb3eB7d6b4ddecC6C5ca2a, 10 ether, 10000 ether, 150);
    }

    /**
     * @dev Create a new binary option
     * @param asset The asset to trade (e.g., "BTC", "ETH")
     * @param amount The amount to bet in ETH
     * @param expiryTime The expiry time in seconds from now
     * @param isCall True for call (price goes up), false for put (price goes down)
     */
    function createOption(
        string memory asset,
        uint256 amount,
        uint256 expiryTime,
        bool isCall
    ) external payable onlyValidAsset(asset) nonReentrant {
        require(msg.value == amount, "Incorrect amount sent");
        require(amount >= assetConfigs[asset].minAmount, "Amount too low");
        require(amount <= assetConfigs[asset].maxAmount, "Amount too high");
        require(expiryTime >= minExpiryTime, "Expiry time too short");
        require(expiryTime <= maxExpiryTime, "Expiry time too long");
        require(block.timestamp + expiryTime > block.timestamp, "Invalid expiry time");

        uint256 currentPrice = getCurrentPrice(asset);
        require(currentPrice > 0, "Invalid price feed");

        _optionIds.increment();
        uint256 optionId = _optionIds.current();

        options[optionId] = Option({
            id: optionId,
            trader: msg.sender,
            asset: asset,
            amount: amount,
            strikePrice: currentPrice,
            expiryTime: block.timestamp + expiryTime,
            isCall: isCall,
            isExecuted: false,
            isWon: false,
            payout: 0,
            timestamp: block.timestamp
        });

        userOptions[msg.sender].push(optionId);

        emit OptionCreated(optionId, msg.sender, asset, amount, currentPrice, block.timestamp + expiryTime, isCall);
    }

    /**
     * @dev Execute an expired option
     * @param optionId The ID of the option to execute
     */
    function executeOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        require(option.trader != address(0), "Option does not exist");
        require(!option.isExecuted, "Option already executed");
        require(block.timestamp >= option.expiryTime, "Option not expired yet");

        uint256 finalPrice = getCurrentPrice(option.asset);
        require(finalPrice > 0, "Invalid price feed");

        bool isWon = _calculateWin(option.strikePrice, finalPrice, option.isCall);
        uint256 payout = 0;

        if (isWon) {
            // Calculate payout: 80% of the bet amount (20% house edge)
            payout = (option.amount * 80) / 100;
            require(address(this).balance >= payout, "Insufficient contract balance");
            
            // Transfer winnings to trader
            (bool success, ) = option.trader.call{value: payout}("");
            require(success, "Transfer failed");
        }

        option.isExecuted = true;
        option.isWon = isWon;
        option.payout = payout;

        emit OptionExecuted(optionId, isWon, payout, finalPrice);
    }

    /**
     * @dev Get current price from Chainlink price feed
     * @param asset The asset symbol
     * @return The current price in USD with 8 decimals
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
     * @dev Calculate if the option is won based on strike price and final price
     */
    function _calculateWin(uint256 strikePrice, uint256 finalPrice, bool isCall) internal pure returns (bool) {
        if (isCall) {
            return finalPrice > strikePrice;
        } else {
            return finalPrice < strikePrice;
        }
    }

    /**
     * @dev Setup or update an asset configuration
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
     * @dev Update asset configuration (owner only)
     */
    function updateAssetConfig(
        string memory asset,
        address priceFeed,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 feePercentage
    ) external onlyOwner {
        assetConfigs[asset] = AssetConfig({
            priceFeed: priceFeed,
            minAmount: minAmount,
            maxAmount: maxAmount,
            feePercentage: feePercentage,
            isActive: true
        });
        
        emit AssetConfigUpdated(asset, priceFeed, minAmount, maxAmount, feePercentage);
    }

    /**
     * @dev Get user's options
     * @param user The user address
     * @return Array of option IDs
     */
    function getUserOptions(address user) external view returns (uint256[] memory) {
        return userOptions[user];
    }

    /**
     * @dev Get option details
     * @param optionId The option ID
     * @return Option struct
     */
    function getOption(uint256 optionId) external view returns (Option memory) {
        return options[optionId];
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalOptions,
        uint256 totalVolume,
        uint256 contractBalance
    ) {
        totalOptions = _optionIds.current();
        contractBalance = address(this).balance;
        
        // Calculate total volume
        for (uint256 i = 1; i <= totalOptions; i++) {
            totalVolume += options[i].amount;
        }
        
        return (totalOptions, totalVolume, contractBalance);
    }

    /**
     * @dev Update platform fee (owner only)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @dev Emergency pause (owner only)
     */
    function pauseAsset(string memory asset) external onlyOwner {
        assetConfigs[asset].isActive = false;
    }

    /**
     * @dev Resume asset (owner only)
     */
    function resumeAsset(string memory asset) external onlyOwner {
        assetConfigs[asset].isActive = true;
    }

    // Receive function to accept ETH
    receive() external payable {}
} 