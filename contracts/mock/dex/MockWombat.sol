// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Wombat.sol";

contract MockWombat is MockDEX, IWombatPool {
    constructor(address _market) MockDEX(_market) {}

    function swap(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        uint256 /*minimumToAmount*/,
        address to,
        uint256 /*deadline*/
    ) external override returns (uint256 actualToAmount, uint256 haircut) {
        haircut = 0;
        actualToAmount = market.swap(fromToken, toToken, fromAmount, to);
    }
}
