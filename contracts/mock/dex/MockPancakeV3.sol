// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/UniswapV3.sol";

interface IPancakeV3Callback {
    function pancakeV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata _data) external;
}

contract MockPancakeV3 is MockDEX, IUniswapV3Pool {
    address public override token0;
    address public override token1;

    constructor(address _token0, address _token1, address _market) MockDEX(_market) {
        token0 = _token0;
        token1 = _token1;
    }

    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 /*sqrtPriceLimitX96*/,
        bytes calldata data
    ) external override returns (int256 amount0, int256 amount1) {
        uint256 amountOut = market.swap(
            zeroForOne ? token0 : token1,
            zeroForOne ? token1 : token0,
            uint256(amountSpecified),
            recipient
        );

        if (zeroForOne) {
            (amount0, amount1) = (0, int256(amountOut));
        } else {
            (amount0, amount1) = (int256(amountOut), 0);
        }

        if (zeroForOne) {
            IPancakeV3Callback(msg.sender).pancakeV3SwapCallback(amountSpecified, -int256(amountOut), data);
        } else {
            IPancakeV3Callback(msg.sender).pancakeV3SwapCallback(-int256(amountOut), amountSpecified, data);
        }
    }
}
