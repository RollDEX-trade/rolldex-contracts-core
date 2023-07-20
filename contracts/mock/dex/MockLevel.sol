// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Level.sol";

contract MockLevel is MockDEX, ILevelPool {
    constructor(address _market) MockDEX(_market) {}

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 /*_minOut*/,
        address _to,
        bytes calldata /*extradata*/
    ) external override {
        market.swap(_tokenIn, _tokenOut, ERC20(_tokenIn).balanceOf(address(this)), _to);
    }
}
