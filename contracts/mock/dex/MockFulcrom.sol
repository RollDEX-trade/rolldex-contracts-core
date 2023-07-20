// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Fulcrom.sol";

contract MockFulcrom is MockDEX, IFulcromPool {
    constructor(address _market) MockDEX(_market) {}

    function swap(address _tokenIn, address _tokenOut, address _receiver) external override returns (uint256) {
        uint256 amountIn = ERC20(_tokenIn).balanceOf(address(this));
        return market.swap(_tokenIn, _tokenOut, amountIn, _receiver);
    }
}
