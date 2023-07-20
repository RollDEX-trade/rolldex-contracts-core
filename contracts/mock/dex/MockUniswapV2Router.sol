// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../libraries/UniswapV2.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";

contract MockUniswapV2Router is MockDEX, IUniswapV2Router {
    constructor(address _market) MockDEX(_market) {}

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 /*amountOutMin*/,
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external override returns (uint256[] memory amounts) {
        require(path.length == 2, "MockUniswapV2Router: INVALID_PATH");
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = market.swap(path[0], path[1], amountIn, to);
    }

    function router() external view returns (address) {
        return address(this);
    }
}
