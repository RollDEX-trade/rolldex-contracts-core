// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Hashflow.sol";

contract MockHashflow is MockDEX, IHashflowRouter {
    constructor(address _market) MockDEX(_market) {}

    function tradeSingleHop(RFQTQuote calldata quote) external payable override {
        market.swap(quote.baseToken, quote.quoteToken, quote.effectiveBaseTokenAmount, quote.effectiveTrader);
    }
}
