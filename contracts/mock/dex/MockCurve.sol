// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Curve.sol";

contract MockCurve is MockDEX, ICurvePool {
    address public token0;
    address public token1;

    constructor(address _token0, address _token1, address _market) MockDEX(_market) {
        token0 = _token0;
        token1 = _token1;
    }

    function exchange(int128 i, int128 j, uint256 dx, uint256 /*min_dy*/) external override {
        market.swap(i == 0 ? token0 : token1, j == 0 ? token0 : token1, dx, msg.sender);
    }
}
