// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../libraries/UniswapV2.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";

contract MockUniswapV2 is MockDEX, IUniswapV2Pair {
    address public override token0;
    address public override token1;

    uint112 public reserve0;
    uint112 public reserve1;

    constructor(address _token0, address _token1, address _market) MockDEX(_market) {
        token0 = _token0;
        token1 = _token1;
    }

    function setReserves(uint112 _reserve0, uint112 _reserve1) public {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function getReserves()
        external
        view
        override
        returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)
    {
        return (reserve0, reserve1, 0);
    }

    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata /*data*/) external override {
        if (amount0Out > 0) {
            market.transfer(token0, to, amount0Out);
        } else if (amount1Out > 0) {
            market.transfer(token1, to, amount1Out);
        }
    }

    function router() external pure override returns (address) {
        revert("Not implemented");
    }
}
