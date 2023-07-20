// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/WooFi.sol";

contract MockWoofi is MockDEX, IWooFiPool {
    constructor(address _market) MockDEX(_market) {}

    function swap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 /*minToAmount*/,
        address to,
        address /*rebateTo*/
    ) external override returns (uint256 realToAmount) {
        realToAmount = market.swap(fromToken, toToken, fromAmount, to);
    }
}
