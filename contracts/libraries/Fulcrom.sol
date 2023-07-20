// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IRollDEXRouter.sol";

// @title Fulcrom pool interface
interface IFulcromPool {
    function swap(address _tokenIn, address _tokenOut, address _receiver) external returns (uint256);
}

// @title Fulcrom library
// @notice Functions to swap tokens on Fulcrom protocol
library Fulcrom {
    using SafeERC20 for IERC20;

    function swap(
        address from,
        uint256 amountIn,
        IRollDEXRouter.Swap memory swapData
    ) internal returns (uint256 amountOut) {
        IERC20(from).safeTransfer(swapData.addr, amountIn);
        amountOut = IFulcromPool(swapData.addr).swap(from, swapData.to, address(this));
    }
}
