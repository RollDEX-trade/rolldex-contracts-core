// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IRollDEXRouter.sol";

// @title Curve pool interface
interface ICurvePool {
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external;
}

// @title Curve library
// @notice Functions to swap tokens on Curve like protocols
library Curve {
    using SafeERC20 for IERC20;

    function swap(
        address from,
        uint256 amountIn,
        IRollDEXRouter.Swap memory swapData
    ) internal returns (uint256 amountOut) {
        (int128 i, int128 j) = abi.decode(swapData.data, (int128, int128));
        uint256 balanceBefore = IERC20(swapData.to).balanceOf(address(this));
        //slither-disable-next-line unused-return //it's safe to ignore
        IERC20(from).approve(swapData.addr, amountIn);
        ICurvePool(swapData.addr).exchange(i, j, amountIn, 0);
        amountOut = IERC20(swapData.to).balanceOf(address(this)) - balanceBefore;
    }
}
