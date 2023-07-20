// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/DODOV1.sol";

contract MockDODOV1 is MockDEX, IDODOV1Pool {
    address public base;
    address public quote;

    constructor(address _base, address _quote, address _market) MockDEX(_market) {
        base = _base;
        quote = _quote;
    }

    function sellBaseToken(
        uint256 amount,
        uint256 /*minReceiveQuote*/,
        bytes calldata /*data*/
    ) external override returns (uint256) {
        return market.swap(base, quote, amount, msg.sender);
    }

    function buyBaseToken(
        uint256 /*amount*/,
        uint256 /*maxPayQuote*/,
        bytes calldata /*data*/
    ) external pure override returns (uint256) {
        revert("Not implemented");
    }
}
