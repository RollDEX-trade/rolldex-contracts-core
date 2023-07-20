// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Saddle.sol";

contract MockSaddle is MockDEX, ISaddlePool {
    address public token0;
    address public token1;

    constructor(address _token0, address _token1, address _market) MockDEX(_market) {
        token0 = _token0;
        token1 = _token1;
    }

    function swap(
        uint8 tokenIndexFrom,
        uint8 tokenIndexTo,
        uint256 dx,
        uint256 /*minDy*/,
        uint256 /*deadline*/
    ) external override {
        market.swap(tokenIndexFrom == 0 ? token0 : token1, tokenIndexTo == 0 ? token0 : token1, dx, msg.sender);
    }
}
