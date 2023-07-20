import {expect} from "chai";
import {AddressLike, ContractTransaction, ContractTransactionResponse, getBigInt} from "ethers";
import {ethers} from "hardhat";

import {
  IERC20,
  MockERC20,
  MockERC20__factory,
  MockReentrantDex__factory,
  RollDEXRouter,
  RollDEXRouter__factory,
} from "../types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";

describe("RollDEX Router Specification", () => {
  let RollDEX: RollDEXRouter;
  let admin: SignerWithAddress;
  let trader: SignerWithAddress;
  let treasury: SignerWithAddress;
  let WETH: MockERC20;
  let USDT: MockERC20;
  let USDC: MockERC20;
  let DAI: MockERC20;

  before(async () => {
    [admin, trader, treasury] = await ethers.getSigners();
  });

  beforeEach(async () => {
    WETH = await new MockERC20__factory(admin).deploy("ETH", "ETH", 18, 0);
    USDC = await new MockERC20__factory(admin).deploy("USDC", "USDC", 6, ethers.parseEther("1000000"));
    USDT = await new MockERC20__factory(admin).deploy("USDT", "USDT", 6, ethers.parseEther("1000000"));
    DAI = await new MockERC20__factory(admin).deploy("DAI", "DAI", 18, ethers.parseEther("1000000"));

    RollDEX = await new RollDEXRouter__factory(admin).deploy(WETH, treasury);
  });

  context("Swap", () => {
    it("Should return multiple tokens", async () => {
      const usdcAmount = ethers.parseUnits("1000", 6);
      const usdtAmount = ethers.parseUnits("500", 6);
      const daiAmount = ethers.parseUnits("250", 18);

      await USDC.transfer(RollDEX, usdcAmount);
      await USDT.transfer(RollDEX, usdtAmount);
      await DAI.transfer(RollDEX, daiAmount);

      const [usdcBalanceBefore, usdtBalanceBefore, daiBalanceBefore] = await getBalances(
        trader,
        USDC,
        USDT,
        DAI,
      );

      await RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC, USDT, DAI],
        slippage: [0, 0, 0],
        amountOutExpected: [usdcAmount, usdtAmount, daiAmount],
      });

      const [usdcBalanceAfter, usdtBalanceAfter, daiBalanceAfter] = await getBalances(
        trader,
        USDC,
        USDT,
        DAI,
      );

      expect(usdcBalanceAfter - usdcBalanceBefore).to.equal(usdcAmount);
      expect(usdtBalanceAfter - usdtBalanceBefore).to.equal(usdtAmount);
      expect(daiBalanceAfter - daiBalanceBefore).to.equal(daiAmount);
    });

    it("Should revert transaction having insufficient output amount", async () => {
      const usdcAmount = ethers.parseUnits("1000", 6);
      const usdtAmount = ethers.parseUnits("500", 6);
      const daiAmount = ethers.parseUnits("250", 18);

      await USDC.transfer(RollDEX, usdcAmount);
      await USDT.transfer(RollDEX, usdtAmount);
      await DAI.transfer(RollDEX, daiAmount);

      const usdcTx = RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC, USDT, DAI],
        slippage: [0, 0, 0],
        amountOutExpected: [usdcAmount + ethers.getBigInt(1), usdtAmount, usdcAmount],
      });

      const usdtTx = RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC, USDT, USDC],
        slippage: [0, 0, 0],
        amountOutExpected: [usdcAmount, usdtAmount + ethers.getBigInt(1), daiAmount],
      });

      const daiTx = RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC, USDT, USDC],
        slippage: [0, 0, 0],
        amountOutExpected: [usdcAmount, usdtAmount, daiAmount + ethers.getBigInt(1)],
      });

      await expect(usdcTx).to.be.revertedWith("RollDEX: Insufficient output amount");
      await expect(usdtTx).to.be.revertedWith("RollDEX: Insufficient output amount");
      await expect(daiTx).to.be.revertedWith("RollDEX: Insufficient output amount");
    });

    it("Should accept transaction having passed slippage parameters", async () => {
      const usdcAmount = ethers.parseEther("1000");

      await USDC.transfer(RollDEX, usdcAmount);

      const [usdcBalanceBefore] = await getBalances(trader, USDC);

      await RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC],
        slippage: [5000],
        amountOutExpected: [usdcAmount * ethers.getBigInt(2)],
      });

      const [usdcBalanceAfter] = await getBalances(trader, USDC);

      expect(usdcBalanceAfter - usdcBalanceBefore).to.equal(usdcAmount);
    });

    it("Should revert transaction not having passed slippage parameters", async () => {
      const usdcAmount = ethers.parseEther("1000");

      await USDC.transfer(RollDEX, usdcAmount);

      const tx = RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC],
        slippage: [4999],
        amountOutExpected: [usdcAmount * ethers.getBigInt(2)],
      });

      await expect(tx).to.be.revertedWith("RollDEX: Insufficient output amount");
    });

    it("Should send extra tokens to treasury", async () => {
      const usdcAmount = ethers.parseEther("1000");
      const extraAmount = ethers.parseEther("42");

      await USDC.transfer(RollDEX, usdcAmount + extraAmount);

      const [usdcBalanceBefore] = await getBalances(trader, USDC);
      const [treasuryBalanceBefore] = await getBalances(treasury, USDC);

      await RollDEX.connect(trader).swap({
        amountIn: 0,
        from: WETH,
        exchangeRoutes: [],
        to: [USDC],
        slippage: [5000],
        amountOutExpected: [usdcAmount],
      });

      const [usdcBalanceAfter] = await getBalances(trader, USDC);
      const [treasuryBalanceAfter] = await getBalances(treasury, USDC);

      expect(usdcBalanceAfter - usdcBalanceBefore).to.equal(usdcAmount);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(extraAmount);
    });

    it("Should wrap native token", async () => {
      const amountIn = ethers.parseEther("100");
      const balanceBefore = await WETH.balanceOf(RollDEX);
      await RollDEX.connect(trader).swap(
        {
          amountIn: 0,
          from: ethers.ZeroAddress,
          exchangeRoutes: [],
          to: [USDC],
          slippage: [0],
          amountOutExpected: [0],
        },
        {value: amountIn},
      );
      const balanceAfter = await WETH.balanceOf(RollDEX);
      expect(balanceAfter - balanceBefore).to.equal(amountIn);
    });

    it("Should unwrap native token", async () => {
      const amountIn = ethers.parseEther("100");
      await WETH.connect(trader).deposit({value: amountIn});
      const balanceBefore = await ethers.provider.getBalance(trader);
      const approveTx = await WETH.connect(trader).approve(RollDEX, amountIn);
      const swapTx = await RollDEX.connect(trader).swap({
        amountIn: amountIn,
        from: WETH,
        exchangeRoutes: [],
        to: [WETH],
        slippage: [0],
        amountOutExpected: [amountIn],
      });
      const gasCost = await getGasCost(approveTx, swapTx);
      const balanceAfter = await ethers.provider.getBalance(trader);
      expect(balanceAfter - balanceBefore).to.equal(amountIn - gasCost);
    });

    it("Should transfer tokens from trader to router", async () => {
      const amountIn = ethers.parseEther("1");
      await USDC.transfer(trader, ethers.parseEther("42"));
      await USDC.connect(trader).approve(RollDEX, amountIn);
      await USDT.transfer(RollDEX, amountIn);

      const balanceBefore = await USDC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        amountIn,
        from: USDC,
        exchangeRoutes: [],
        to: [USDT],
        slippage: [0],
        amountOutExpected: [amountIn],
      });
      const balanceAfter = await USDC.balanceOf(trader);

      expect(balanceBefore - balanceAfter).to.equal(amountIn); // transferred
      expect(await USDC.balanceOf(RollDEX)).to.equal(amountIn); // received
    });
  });

  context("Invalid transactions", () => {
    it("Should revert direct Native Token transfer", async () => {
      await expect(trader.sendTransaction({to: RollDEX, value: 1})).to.be.revertedWith(
        "RollDEX: Forbidden token transfer",
      );
    });

    it("Should not allow to deploy router with zero wrapped token address", async () => {
      await expect(
        new RollDEXRouter__factory(admin).deploy(ethers.ZeroAddress, treasury),
      ).to.be.revertedWith("RollDEX: Wrong WETH address");
    });

    it("Should not allow to deploy router with zero treasury address", async () => {
      await expect(
        new RollDEXRouter__factory(admin).deploy(WETH, ethers.ZeroAddress),
      ).to.be.revertedWith("RollDEX: Wrong treasury address");
    });

    it("Should revert swap with unknown DEX family", async () => {
      const tx = RollDEX.connect(trader).swap(
        {
          amountIn: 0,
          from: ethers.ZeroAddress,
          exchangeRoutes: [
            {
              from: USDC,
              parts: 10000,
              swaps: [
                {
                  to: USDT,
                  part: 10000,
                  addr: ethers.ZeroAddress,
                  family: ethers.encodeBytes32String("UNKNOWN_DEX_FAMILY_NAME"),
                  data: "0x",
                },
              ],
            },
          ],
          to: [USDT],
          slippage: [0],
          amountOutExpected: [ethers.parseEther("1")],
        },
        {value: ethers.parseEther("1")},
      );
      await expect(tx).to.be.revertedWith("RollDEX: Unknown DEX family");
    });

    it("Should revert transaction with swap reentrancy", async () => {
      const reentrantDex = await new MockReentrantDex__factory(admin).deploy(RollDEX);
      await USDC.approve(RollDEX, ethers.parseEther("1000"));
      const tx = RollDEX.connect(admin).swap({
        from: USDC,
        to: [USDT],
        amountIn: ethers.parseEther("1000"),
        amountOutExpected: [ethers.parseEther("3000")],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: reentrantDex,
                family: ethers.encodeBytes32String("FULCROM"),
                data: "0x",
              },
            ],
          },
        ],
      });
      await expect(tx).to.be.revertedWith("RollDEX: reentrant swap not allowed");
    });

    it("Should revert callback called outside of swap", async () => {
      await expect(RollDEX.uniswapV3SwapCallback(0, 0, "0x")).to.be.revertedWith("RollDEX: not allowed outside of swap");
      await expect(RollDEX.pancakeV3SwapCallback(0, 0, "0x")).to.be.revertedWith("RollDEX: not allowed outside of swap");
    });
  });

  context("Withdrawing", () => {
    it("Should withdraw tokens from router to treasury", async () => {
      await USDC.transfer(RollDEX, ethers.parseEther("1000"));
      const balanceBefore = await USDC.balanceOf(treasury);
      await RollDEX.connect(admin).withdraw(USDC, ethers.parseEther("1000"));
      const balanceAfter = await USDC.balanceOf(treasury);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1000"));
    });

    it("Should withdraw native tokens from router to treasury", async () => {
      await RollDEX.connect(trader).swap(
        {
          amountIn: 0,
          from: USDT,
          exchangeRoutes: [],
          to: [USDT],
          slippage: [0],
          amountOutExpected: [0],
        },
        {value: ethers.parseEther("42")},
      );

      const balanceBefore = await ethers.provider.getBalance(treasury);
      await RollDEX.connect(admin).withdrawETH(ethers.parseEther("40"));
      const balanceAfter = await ethers.provider.getBalance(treasury);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("40"));

      const tx = RollDEX.connect(admin).withdrawETH(ethers.parseEther("3"));
      await expect(tx).to.be.revertedWithoutReason();
    });

    it("Should not allow to non owner to withdraw tokens", async () => {
      const tx1 = RollDEX.connect(trader).withdraw(USDC, ethers.parseEther("1000"));
      const tx2 = RollDEX.connect(trader).withdrawETH(ethers.parseEther("1"));
      await expect(tx1).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(tx2).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  const getBalances = async (address: AddressLike, ...tokens: IERC20[]) => {
    const result: bigint[] = [];
    for (const token of tokens) {
      result.push(await token.balanceOf(address));
    }
    return result;
  };

  const getGasCost = async (...tx: ContractTransactionResponse[]) => {
    return (await Promise.all(tx.map(tx => tx.wait()))).reduce(
      (sum, receipt) => receipt === null ? sum : (sum + receipt.gasUsed * receipt.gasPrice),
      ethers.getBigInt(0)
    );
  };
});
