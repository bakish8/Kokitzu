const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BinaryOptions", function () {
  let BinaryOptions;
  let binaryOptions;
  let owner;
  let trader1;
  let trader2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, trader1, trader2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    BinaryOptions = await ethers.getContractFactory("BinaryOptions");
    binaryOptions = await BinaryOptions.deploy();
    await binaryOptions.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await binaryOptions.owner()).to.equal(owner.address);
    });

    it("Should have correct initial configuration", async function () {
      expect(await binaryOptions.platformFee()).to.equal(200); // 2%
      expect(await binaryOptions.minExpiryTime()).to.equal(5 * 60); // 5 minutes
      expect(await binaryOptions.maxExpiryTime()).to.equal(24 * 60 * 60); // 24 hours
    });

    it("Should have ETH asset configured", async function () {
      const ethConfig = await binaryOptions.assetConfigs("ETH");
      expect(ethConfig.isActive).to.be.true;
      expect(ethConfig.priceFeed).to.equal(
        "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
      );
    });
  });

  describe("Asset Configuration", function () {
    it("Should allow owner to update asset config", async function () {
      await binaryOptions.updateAssetConfig(
        "SOL",
        "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46",
        ethers.utils.parseEther("0.01"),
        ethers.utils.parseEther("10"),
        150
      );

      const solConfig = await binaryOptions.assetConfigs("SOL");
      expect(solConfig.isActive).to.be.true;
      expect(solConfig.priceFeed).to.equal(
        "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"
      );
    });

    it("Should not allow non-owner to update asset config", async function () {
      await expect(
        binaryOptions
          .connect(trader1)
          .updateAssetConfig(
            "SOL",
            "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46",
            ethers.utils.parseEther("0.01"),
            ethers.utils.parseEther("10"),
            150
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Option Creation", function () {
    it("Should create a call option successfully", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60; // 10 minutes

      await expect(
        binaryOptions.connect(trader1).createOption(
          "ETH",
          amount,
          expiryTime,
          true, // isCall
          { value: amount }
        )
      ).to.emit(binaryOptions, "OptionCreated");

      const option = await binaryOptions.getOption(1);
      expect(option.trader).to.equal(trader1.address);
      expect(option.asset).to.equal("ETH");
      expect(option.amount).to.equal(amount);
      expect(option.isCall).to.be.true;
      expect(option.isExecuted).to.be.false;
    });

    it("Should create a put option successfully", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60; // 10 minutes

      await expect(
        binaryOptions.connect(trader1).createOption(
          "ETH",
          amount,
          expiryTime,
          false, // isPut
          { value: amount }
        )
      ).to.emit(binaryOptions, "OptionCreated");

      const option = await binaryOptions.getOption(1);
      expect(option.isCall).to.be.false;
    });

    it("Should fail if amount is too low", async function () {
      const amount = ethers.utils.parseEther("0.001"); // Below minimum
      const expiryTime = 10 * 60;

      await expect(
        binaryOptions
          .connect(trader1)
          .createOption("ETH", amount, expiryTime, true, { value: amount })
      ).to.be.revertedWith("Amount too low");
    });

    it("Should fail if amount is too high", async function () {
      const amount = ethers.utils.parseEther("20"); // Above maximum
      const expiryTime = 10 * 60;

      await expect(
        binaryOptions
          .connect(trader1)
          .createOption("ETH", amount, expiryTime, true, { value: amount })
      ).to.be.revertedWith("Amount too high");
    });

    it("Should fail if expiry time is too short", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 2 * 60; // 2 minutes (below minimum)

      await expect(
        binaryOptions
          .connect(trader1)
          .createOption("ETH", amount, expiryTime, true, { value: amount })
      ).to.be.revertedWith("Expiry time too short");
    });

    it("Should fail if expiry time is too long", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 48 * 60 * 60; // 48 hours (above maximum)

      await expect(
        binaryOptions
          .connect(trader1)
          .createOption("ETH", amount, expiryTime, true, { value: amount })
      ).to.be.revertedWith("Expiry time too long");
    });

    it("Should fail if asset is not supported", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60;

      await expect(
        binaryOptions
          .connect(trader1)
          .createOption("INVALID", amount, expiryTime, true, { value: amount })
      ).to.be.revertedWith("Asset not supported");
    });

    it("Should fail if incorrect ETH amount is sent", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60;

      await expect(
        binaryOptions.connect(trader1).createOption(
          "ETH",
          amount,
          expiryTime,
          true,
          { value: ethers.utils.parseEther("0.05") } // Wrong amount
        )
      ).to.be.revertedWith("Incorrect amount sent");
    });
  });

  describe("Option Execution", function () {
    let optionId;
    let amount;
    let expiryTime;

    beforeEach(async function () {
      amount = ethers.utils.parseEther("0.1");
      expiryTime = 10 * 60; // 10 minutes

      await binaryOptions.connect(trader1).createOption(
        "ETH",
        amount,
        expiryTime,
        true, // isCall
        { value: amount }
      );

      optionId = 1;
    });

    it("Should fail if option is not expired", async function () {
      await expect(
        binaryOptions.connect(trader1).executeOption(optionId)
      ).to.be.revertedWith("Option not expired yet");
    });

    it("Should execute option after expiry", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [expiryTime + 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        binaryOptions.connect(trader1).executeOption(optionId)
      ).to.emit(binaryOptions, "OptionExecuted");

      const option = await binaryOptions.getOption(optionId);
      expect(option.isExecuted).to.be.true;
    });

    it("Should fail if option is already executed", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [expiryTime + 60]);
      await ethers.provider.send("evm_mine");

      await binaryOptions.connect(trader1).executeOption(optionId);

      await expect(
        binaryOptions.connect(trader1).executeOption(optionId)
      ).to.be.revertedWith("Option already executed");
    });

    it("Should fail if option does not exist", async function () {
      await expect(
        binaryOptions.connect(trader1).executeOption(999)
      ).to.be.revertedWith("Option does not exist");
    });
  });

  describe("User Options", function () {
    it("Should return user's options", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60;

      // Create multiple options
      await binaryOptions
        .connect(trader1)
        .createOption("ETH", amount, expiryTime, true, { value: amount });

      await binaryOptions
        .connect(trader1)
        .createOption("BTC", amount, expiryTime, false, { value: amount });

      const userOptions = await binaryOptions.getUserOptions(trader1.address);
      expect(userOptions.length).to.equal(2);
      expect(userOptions[0]).to.equal(1);
      expect(userOptions[1]).to.equal(2);
    });

    it("Should return empty array for user with no options", async function () {
      const userOptions = await binaryOptions.getUserOptions(trader1.address);
      expect(userOptions.length).to.equal(0);
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct statistics", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60;

      await binaryOptions
        .connect(trader1)
        .createOption("ETH", amount, expiryTime, true, { value: amount });

      await binaryOptions
        .connect(trader2)
        .createOption("BTC", amount, expiryTime, false, { value: amount });

      const stats = await binaryOptions.getContractStats();
      expect(stats.totalOptions).to.equal(2);
      expect(stats.totalVolume).to.equal(amount.mul(2));
      expect(stats.contractBalance).to.equal(amount.mul(2));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await binaryOptions.updatePlatformFee(150); // 1.5%
      expect(await binaryOptions.platformFee()).to.equal(150);
    });

    it("Should not allow non-owner to update platform fee", async function () {
      await expect(
        binaryOptions.connect(trader1).updatePlatformFee(150)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow fee above 10%", async function () {
      await expect(
        binaryOptions.updatePlatformFee(1100) // 11%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to pause asset", async function () {
      await binaryOptions.pauseAsset("ETH");
      const ethConfig = await binaryOptions.assetConfigs("ETH");
      expect(ethConfig.isActive).to.be.false;
    });

    it("Should allow owner to resume asset", async function () {
      await binaryOptions.pauseAsset("ETH");
      await binaryOptions.resumeAsset("ETH");
      const ethConfig = await binaryOptions.assetConfigs("ETH");
      expect(ethConfig.isActive).to.be.true;
    });

    it("Should allow owner to withdraw fees", async function () {
      const amount = ethers.utils.parseEther("0.1");
      const expiryTime = 10 * 60;

      // Create option to add funds to contract
      await binaryOptions
        .connect(trader1)
        .createOption("ETH", amount, expiryTime, true, { value: amount });

      const initialBalance = await owner.getBalance();
      await binaryOptions.withdrawFees();
      const finalBalance = await owner.getBalance();

      expect(finalBalance.gt(initialBalance)).to.be.true;
    });
  });

  describe("Price Feed Integration", function () {
    it("Should get current price for ETH", async function () {
      const price = await binaryOptions.getCurrentPrice("ETH");
      expect(price.gt(0)).to.be.true;
    });

    it("Should get current price for BTC", async function () {
      const price = await binaryOptions.getCurrentPrice("BTC");
      expect(price.gt(0)).to.be.true;
    });

    it("Should fail for unsupported asset", async function () {
      await expect(binaryOptions.getCurrentPrice("INVALID")).to.be.revertedWith(
        "Asset not supported"
      );
    });
  });

  describe("Win/Loss Calculation", function () {
    it("Should calculate call option win correctly", async function () {
      const strikePrice = ethers.utils.parseUnits("1000", 8); // $1000
      const finalPrice = ethers.utils.parseUnits("1100", 8); // $1100
      const isCall = true;

      const isWon = await binaryOptions._calculateWin(
        strikePrice,
        finalPrice,
        isCall
      );
      expect(isWon).to.be.true;
    });

    it("Should calculate call option loss correctly", async function () {
      const strikePrice = ethers.utils.parseUnits("1000", 8); // $1000
      const finalPrice = ethers.utils.parseUnits("900", 8); // $900
      const isCall = true;

      const isWon = await binaryOptions._calculateWin(
        strikePrice,
        finalPrice,
        isCall
      );
      expect(isWon).to.be.false;
    });

    it("Should calculate put option win correctly", async function () {
      const strikePrice = ethers.utils.parseUnits("1000", 8); // $1000
      const finalPrice = ethers.utils.parseUnits("900", 8); // $900
      const isCall = false;

      const isWon = await binaryOptions._calculateWin(
        strikePrice,
        finalPrice,
        isCall
      );
      expect(isWon).to.be.true;
    });

    it("Should calculate put option loss correctly", async function () {
      const strikePrice = ethers.utils.parseUnits("1000", 8); // $1000
      const finalPrice = ethers.utils.parseUnits("1100", 8); // $1100
      const isCall = false;

      const isWon = await binaryOptions._calculateWin(
        strikePrice,
        finalPrice,
        isCall
      );
      expect(isWon).to.be.false;
    });
  });
});
