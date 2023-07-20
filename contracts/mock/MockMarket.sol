// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMarket {
    struct Rate {
        uint256 numerator;
        uint256 denominator;
    }

    mapping(address => mapping(address => Rate)) internal rates;

    function setRate(address from, address to, uint256 numerator, uint256 denominator) public {
        uint8 fromDecimals = ERC20(from).decimals();
        uint8 toDecimals = ERC20(to).decimals();

        rates[from][to] = Rate(numerator * 10**toDecimals, denominator * 10**fromDecimals);
        rates[to][from] = Rate(denominator * 10**fromDecimals, numerator * 10**toDecimals);
    }

    function swap(address from, address to, uint256 amount, address receiver) public returns (uint256 amountOut) {
        Rate memory rate = rates[from][to];
        amountOut = (amount * rate.numerator) / rate.denominator;
        ERC20(to).transfer(receiver, amountOut);
    }

    function transfer(address token, address to, uint256 amount) public {
        ERC20(token).transfer(to, amount);
    }
}
