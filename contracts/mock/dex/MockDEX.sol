// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";

contract MockDEX {
    MockMarket internal market;

    constructor(address _market) {
        market = MockMarket(_market);
    }
}
