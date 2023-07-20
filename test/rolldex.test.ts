import {expect} from "chai";
import {ethers} from "hardhat";

import {
  MockCurve,
  MockCurve__factory,
  MockDODOV1,
  MockDODOV1__factory,
  MockDODOV2,
  MockDODOV2__factory,
  MockERC20,
  MockERC20__factory,
  MockFulcrom,
  MockFulcrom__factory,
  MockHashflow,
  MockHashflow__factory,
  MockLevel,
  MockLevel__factory,
  MockMarket,
  MockMarket__factory,
  MockPancakeSwapStable,
  MockPancakeSwapStable__factory,
  MockPancakeV3,
  MockPancakeV3__factory,
  MockSaddle,
  MockSaddle__factory,
  MockUniswapV2,
  MockUniswapV2__factory,
  MockUniswapV2Router,
  MockUniswapV2Router__factory,
  MockUniswapV3,
  MockUniswapV3__factory,
  MockWombat,
  MockWombat__factory,
  MockWoofi,
  MockWoofi__factory,
  RollDEXRouter,
  RollDEXRouter__factory,
} from "../types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {AbiCoder} from "ethers";

describe("RollDEX", () => {
  let WETH: MockERC20;
  let USDT: MockERC20;
  let WBTC: MockERC20;
  let RollDEX: RollDEXRouter;
  let market: MockMarket;
  let admin: SignerWithAddress;
  let trader: SignerWithAddress;

  before(async () => {
    [admin, trader] = await ethers.getSigners();
  });

  beforeEach(async () => {
    WETH = await new MockERC20__factory(admin).deploy("WETH", "WETH", 18, 1_000_000);
    USDT = await new MockERC20__factory(admin).deploy("USDT", "USDT", 6, 1_000_000);
    WBTC = await new MockERC20__factory(admin).deploy("WBTC", "WBTC", 8, 1_000_000);
    market = await new MockMarket__factory(admin).deploy();
    RollDEX = await new RollDEXRouter__factory(admin).deploy(WETH, admin);

    await USDT.transfer(market, ethers.parseUnits("300000", 6));
    await WBTC.transfer(market, ethers.parseUnits("10", 8));
    await market.setRate(WBTC, USDT, 30000, 1);

    await WBTC.transfer(trader, ethers.parseUnits("1000", 8));
    await USDT.transfer(trader, ethers.parseUnits("10000", 6));

    await WBTC.connect(trader).approve(RollDEX, ethers.parseUnits("1000", 8));
    await USDT.connect(trader).approve(RollDEX, ethers.parseUnits("10000", 6));

  });

  context("Uniswap V3", () => {
    let uniswapV3: MockUniswapV3;
    const family = ethers.encodeBytes32String("UNISWAP_V3");

    beforeEach(async () => {
      uniswapV3 = await new MockUniswapV3__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: uniswapV3,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["bool"], [true]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: uniswapV3,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["bool"], [false]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });

    it("Should revert transaction with invalid invariant", async () => {
      await WBTC.setAllowZeroTransfer(true);
      const tx = RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("0"),
        amountOutExpected: [ethers.parseUnits("0")],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: uniswapV3,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["bool"], [false]),
              },
            ],
          },
        ],
      });
      await expect(tx).to.be.revertedWith("RollDEX: Uniswap v3 invariant violation");
    });
  });

  context("Pancake V3", () => {
    let pancakeV3: MockPancakeV3;
    const family = ethers.encodeBytes32String("UNISWAP_V3");

    beforeEach(async () => {
      pancakeV3 = await new MockPancakeV3__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: pancakeV3,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["bool"], [true]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: pancakeV3,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["bool"], [false]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Uniswap V2", () => {
    let uniswapV2: MockUniswapV2;
    const family = ethers.encodeBytes32String("UNISWAP_V2");

    beforeEach(async () => {
      uniswapV2 = await new MockUniswapV2__factory(admin).deploy(WBTC, USDT, market);
      await uniswapV2.setReserves(ethers.parseUnits("1000000", 8), ethers.parseUnits("30000000000", 6));
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [100],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: uniswapV2,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["uint256", "uint256"], [0, 10000]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(Number(ethers.formatUnits(balanceAfter - balanceBefore, 6))).to.be.approximately(45000, 0.1);
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [100],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: uniswapV2,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["uint256", "uint256"], [0, 10000]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(Number(ethers.formatUnits(balanceAfter - balanceBefore, 8))).to.be.approximately(0.05, 0.001);
    });

    it("Should not swap having 0 output amount", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await uniswapV2.setReserves(1, 0);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("0.001", 8),
        amountOutExpected: [ethers.parseUnits("0")],
        slippage: [10000],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: uniswapV2,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["uint256", "uint256"], [0, 10000]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(0);
    });
  });

  context("Curve", () => {
    let curve: MockCurve;
    const family = ethers.encodeBytes32String("CURVE");

    beforeEach(async () => {
      curve = await new MockCurve__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: curve,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [0, 1]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: curve,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [1, 0]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Fulcrom", () => {
    let fulcrom: MockFulcrom;
    const family = ethers.encodeBytes32String("FULCROM");

    beforeEach(async () => {
      fulcrom = await new MockFulcrom__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: fulcrom,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: fulcrom,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("WOOFi", () => {
    let woofi: MockWoofi;
    const family = ethers.encodeBytes32String("WOOFI");

    beforeEach(async () => {
      woofi = await new MockWoofi__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: woofi,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: woofi,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Wombat", () => {
    let wombat: MockWombat;
    const family = ethers.encodeBytes32String("WOMBAT");

    beforeEach(async () => {
      wombat = await new MockWombat__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: wombat,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: wombat,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Saddle", () => {
    let saddle: MockSaddle;
    const family = ethers.encodeBytes32String("SADDLE");

    beforeEach(async () => {
      saddle = await new MockSaddle__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: saddle,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [0, 1]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: saddle,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [1, 0]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Pancake Stable", () => {
    let pancakeStable: MockPancakeSwapStable;
    const family = ethers.encodeBytes32String("PANCAKESWAP_STABLE");

    beforeEach(async () => {
      pancakeStable = await new MockPancakeSwapStable__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: pancakeStable,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [0, 1]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: pancakeStable,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["int128", "int128"], [1, 0]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Level", () => {
    let level: MockLevel;
    const family = ethers.encodeBytes32String("LEVEL");

    beforeEach(async () => {
      level = await new MockLevel__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: level,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: level,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("Hashflow", () => {
    let hashflow: MockHashflow;
    const family = ethers.encodeBytes32String("HASHFLOW");

    beforeEach(async () => {
      hashflow = await new MockHashflow__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      const data = AbiCoder.defaultAbiCoder().encode(
        [
          "(address,address,address,address,address,address,uint256,uint256,uint256,uint256,uint256,bytes32,bytes)",
        ],
        [[
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          RollDEX.target,
          RollDEX.target,
          WBTC.target,
          USDT.target,
          ethers.parseUnits("1.5", 8),
          ethers.parseUnits("1.5", 8),
          ethers.parseUnits("45000", 6),
          ethers.getBigInt(0),
          ethers.getBigInt(0),
          ethers.encodeBytes32String("test"),
          "0x",
        ]])
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: hashflow,
                family: family,
                data: data
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      const data = AbiCoder.defaultAbiCoder().encode(
        [
          "(address,address,address,address,address,address,uint256,uint256,uint256,uint256,uint256,bytes32,bytes)",
        ],
        [
          [
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            RollDEX.target,
            RollDEX.target,
            USDT.target,
            WBTC.target,
            ethers.parseUnits("1500", 6),
            ethers.parseUnits("1500", 6),
            ethers.parseUnits("0.05", 8),
            ethers.getBigInt(0),
            ethers.getBigInt(0),
            ethers.encodeBytes32String("test"),
            "0x",
          ],
        ],
      )
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: hashflow,
                family: family,
                data: data
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });

    it("Should swap USDT to WBTC having less amount than expected", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1350", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [1000], // 10%
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: hashflow,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(
                  [
                    "(address,address,address,address,address,address,uint256,uint256,uint256,uint256,uint256,bytes32,bytes)",
                  ],
                  [
                    [
                      ethers.ZeroAddress,
                      ethers.ZeroAddress,
                      RollDEX.target,
                      RollDEX.target,
                      USDT.target,
                      WBTC.target,
                      ethers.parseUnits("1500", 6),
                      ethers.parseUnits("1500", 6),
                      ethers.parseUnits("0.05", 8),
                      ethers.getBigInt(0),
                      ethers.getBigInt(0),
                      ethers.encodeBytes32String("test"),
                      "0x",
                    ],
                  ],
                ),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.045", 8));
    });
  });

  context("DODO v2", () => {
    let dodoV2: MockDODOV2;
    const family = ethers.encodeBytes32String("DODO_V2");

    beforeEach(async () => {
      dodoV2 = await new MockDODOV2__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: dodoV2,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["uint8"], [0]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: dodoV2,
                family: family,
                data: AbiCoder.defaultAbiCoder().encode(["uint8"], [1]),
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });

  context("DODO v1", () => {
    let dodoV1: MockDODOV1;
    const family = ethers.encodeBytes32String("DODO_V1");

    beforeEach(async () => {
      dodoV1 = await new MockDODOV1__factory(admin).deploy(WBTC, USDT, market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: dodoV1,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });
  });

  context("Uniswap V2 Router", () => {
    let uniswapV2: MockUniswapV2Router;
    const family = ethers.encodeBytes32String("UNISWAP_V2_ROUTER");

    beforeEach(async () => {
      uniswapV2 = await new MockUniswapV2Router__factory(admin).deploy(market);
    });

    it("Should swap WBTC to USDT", async () => {
      const balanceBefore = await USDT.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: WBTC,
        to: [USDT],
        amountIn: ethers.parseUnits("1.5", 8),
        amountOutExpected: [ethers.parseUnits("45000", 6)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: WBTC,
            swaps: [
              {
                to: USDT,
                part: 10000,
                addr: uniswapV2,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await USDT.balanceOf(trader);

      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("45000", 6));
    });

    it("Should swap USDT to WBTC", async () => {
      const balanceBefore = await WBTC.balanceOf(trader);
      await RollDEX.connect(trader).swap({
        from: USDT,
        to: [WBTC],
        amountIn: ethers.parseUnits("1500", 6),
        amountOutExpected: [ethers.parseUnits("0.05", 8)],
        slippage: [0],
        exchangeRoutes: [
          {
            parts: 10000,
            from: USDT,
            swaps: [
              {
                to: WBTC,
                part: 10000,
                addr: uniswapV2,
                family: family,
                data: "0x",
              },
            ],
          },
        ],
      });
      const balanceAfter = await WBTC.balanceOf(trader);
      expect(balanceAfter - balanceBefore).to.eq(ethers.parseUnits("0.05", 8));
    });
  });
});
