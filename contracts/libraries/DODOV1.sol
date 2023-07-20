// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IRollDEXRouter.sol";

// @title DODO v1 pool interface
interface IDODOV1Pool {
    function sellBaseToken(uint256 amount, uint256 minReceiveQuote, bytes calldata data) external returns (uint256);

    function buyBaseToken(uint256 amount, uint256 maxPayQuote, bytes calldata data) external returns (uint256);
}

// @title DODO v1 library
// @notice Functions to swap tokens on DODO v1 protocol
library DODOV1 {
    using SafeERC20 for IERC20;

    function swap(
        address from,
        uint256 amountIn,
        IRollDEXRouter.Swap memory swapData
    ) internal returns (uint256 amountOut) {
        //slither-disable-next-line unused-return //it's safe to ignore
        IERC20(from).approve(swapData.addr, amountIn);
        amountOut = IDODOV1Pool(swapData.addr).sellBaseToken(amountIn, 0, "");
    }
}
