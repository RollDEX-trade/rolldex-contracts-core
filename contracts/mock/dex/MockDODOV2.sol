// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/DODOV2.sol";

contract MockDODOV2 is MockDEX, IDODOV2Pool {
    address public base;
    address public quote;

    constructor(address _base, address _quote, address _market) MockDEX(_market) {
        base = _base;
        quote = _quote;
    }

    function sellBase(address to) external override returns (uint256) {
        return market.swap(base, quote, ERC20(base).balanceOf(address(this)), to);
    }

    function sellQuote(address to) external override returns (uint256) {
        return market.swap(quote, base, ERC20(quote).balanceOf(address(this)), to);
    }
}
