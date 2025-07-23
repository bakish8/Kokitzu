// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title BinaryOptions
 * @dev Smart contract for binary options trading on Ethereum
 * @author Kokitzu Team
 */
contract BinaryOptions is ReentrancyGuard, Ownable {

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
        uint256 finalPrice; // Add final price field for proper push/tie detection
    }

    struct AssetConfig {
        address priceFeed;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 feePercentage; // in basis points (100 = 1%)
        bool isActive;
    }

    // State variables
    uint256 private _optionIds;
    
    mapping(uint256 => Option) public options;
    mapping(string => AssetConfig) public assetConfigs;
    mapping(address => uint256[]) public userOptions;
    
    uint256 public platformFee = 200; // 2% platform fee
    uint256 public minExpiryTime = 30 seconds; // Reduced from 5 minutes to 30 seconds
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
        bool isPush,
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

    constructor(address initialOwner) Ownable(initialOwner) {
        // Chainlink Price Feeds for Sepolia Testnet
        // Source: https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum#Sepolia%20Testnet
        _setupAsset("ETH", 0x694AA1769357215DE4FAC081bf1f309aDC325306, 0.001 ether, 2 ether, 150);  // ETH/USD
        _setupAsset("BTC", 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43, 0.0001 ether, 1 ether, 200); // BTC/USD
        _setupAsset("LINK", 0xc59E3633BAAC79493d908e63626716e204A45EdF, 0.005 ether, 1.5 ether, 200); // LINK/USD
        
        // Note: Many assets don't have Sepolia feeds, so we'll use a smaller set for testing
        // For production mainnet deployment, we'll add back all the other assets
    }

    /**
     * @dev Create a new binary option (deprecated - use createOptionFor with strike price)
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
        
        // Convert Chainlink price to 2 decimal format for consistency
        uint256 strikePrice = currentPrice / 1e6;

        _optionIds++;
        uint256 optionId = _optionIds;

        options[optionId] = Option({
            id: optionId,
            trader: msg.sender,
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

        userOptions[msg.sender].push(optionId);

        emit OptionCreated(optionId, msg.sender, asset, amount, strikePrice, block.timestamp + expiryTime, isCall);
    }

    /**
     * @dev Create an option on behalf of another user (for server-side integration)
     * @param beneficiary The user who will receive the payout (for mobile apps)
     * @param asset The asset to trade
     * @param amount The amount to bet
     * @param strikePrice The entry price from the server (in USD with 2 decimals, e.g. 365684 = $3656.84)
     * @param expiryTime The expiry time in seconds
     * @param isCall True for call, false for put
     */
    function createOptionFor(
        address beneficiary,
        string memory asset,
        uint256 amount,
        uint256 strikePrice, // Accept strike price from server
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
            strikePrice: strikePrice, // Use server-provided strike price
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
     * @dev Execute an expired option
     * @param optionId The ID of the option to execute
     */
    function executeOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        require(option.trader != address(0), "Option does not exist");
        require(!option.isExecuted, "Option already executed");
        require(block.timestamp >= option.expiryTime, "Option not expired yet");

        uint256 chainlinkPrice = getCurrentPrice(option.asset);
        require(chainlinkPrice > 0, "Invalid price feed");

        // Convert Chainlink price to same format as strike price (USD * 100)
        // Server sends: $118348 -> 11834800 (USD * 100)  
        // Chainlink: 11834880000000 (8 decimals) -> 11834800 (USD * 100)
        uint256 finalPrice = chainlinkPrice / 1e6; // Convert 8 decimals to USD*100 format

        // Allow for small price differences due to timing/precision
        // Only treat as push if prices are within 0.01% (very tight threshold)
        bool isWon;
        bool isPush;
        
        // Calculate 0.01% threshold for push detection
        uint256 pushThreshold = (option.strikePrice * 1) / 10000; // 0.01% = 1/10000
        uint256 priceDifference = option.strikePrice > finalPrice ? 
            option.strikePrice - finalPrice : 
            finalPrice - option.strikePrice;
        
        if (priceDifference <= pushThreshold) {
            // Prices are too close to call - push/refund
            isWon = false;
            isPush = true;
        } else {
            // Clear price difference - determine winner
            if (option.isCall) {
                isWon = finalPrice > option.strikePrice; // UP bet wins if price increased
            } else {
                isWon = finalPrice < option.strikePrice; // DOWN bet wins if price decreased
            }
            isPush = false;
        }
        
        uint256 payout = 0;

        if (isPush) {
            // PUSH/TIE: Refund the original bet amount
            payout = option.amount;
            require(address(this).balance >= payout, "Insufficient contract balance");
            
            // Refund original bet to trader
            (bool success, ) = option.trader.call{value: payout}("");
            require(success, "Refund failed");
        } else if (isWon) {
            // WIN: Return original bet + 80% profit (1.8x total payout)
            payout = option.amount + (option.amount * 80) / 100;
            require(address(this).balance >= payout, "Insufficient contract balance");
            
            // Transfer winnings to trader
            (bool success, ) = option.trader.call{value: payout}("");
            require(success, "Transfer failed");
        }
        // LOSS: No payout, keep the money

        option.isExecuted = true;
        option.isWon = isWon;
        option.payout = payout;
        option.finalPrice = finalPrice; // Store final price in same format as strike price

        emit OptionExecuted(optionId, isWon, isPush, payout, finalPrice);
    }

    /**
     * @dev Get current price from Chainlink price feed
     * @param asset The asset symbol
     * @return The current price in USD with 8 decimals (raw Chainlink format)
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
     * @dev Get individual option fields (for easier decoding)
     */
    function getOptionId(uint256 optionId) external view returns (uint256) {
        return options[optionId].id;
    }

    function getOptionTrader(uint256 optionId) external view returns (address) {
        return options[optionId].trader;
    }

    function getOptionAsset(uint256 optionId) external view returns (string memory) {
        return options[optionId].asset;
    }

    function getOptionAmount(uint256 optionId) external view returns (uint256) {
        return options[optionId].amount;
    }

    function getOptionStrikePrice(uint256 optionId) external view returns (uint256) {
        return options[optionId].strikePrice;
    }

    function getOptionExpiryTime(uint256 optionId) external view returns (uint256) {
        return options[optionId].expiryTime;
    }

    function getOptionIsCall(uint256 optionId) external view returns (bool) {
        return options[optionId].isCall;
    }

    function getOptionIsExecuted(uint256 optionId) external view returns (bool) {
        return options[optionId].isExecuted;
    }

    function getOptionIsWon(uint256 optionId) external view returns (bool) {
        return options[optionId].isWon;
    }

    function getOptionPayout(uint256 optionId) external view returns (uint256) {
        return options[optionId].payout;
    }

    function getOptionTimestamp(uint256 optionId) external view returns (uint256) {
        return options[optionId].timestamp;
    }

    function getOptionFinalPrice(uint256 optionId) external view returns (uint256) {
        return options[optionId].finalPrice;
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalOptions,
        uint256 totalVolume,
        uint256 contractBalance
    ) {
        totalOptions = _optionIds;
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
     * @dev Owner can deposit ETH to fund payouts
     */
    function fundContract() external payable onlyOwner {
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    event FundsDeposited(address indexed owner, uint256 amount);

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