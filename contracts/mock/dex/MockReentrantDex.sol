// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../MockMarket.sol";
import "./MockDEX.sol";
import "../../libraries/Fulcrom.sol";

contract MockReentrantDex is IFulcromPool {
    IRollDEXRouter public router;
    IRollDEXRouter.ExchangeRequest public exchangeRequest;

    constructor(address _router) {
        router = IRollDEXRouter(_router);
    }

    function setExchangeRequest(IRollDEXRouter.ExchangeRequest calldata request) public {
        exchangeRequest = request;
    }

    function swap(
        address /*_tokenIn*/,
        address /*_tokenOut*/,
        address /*_receiver*/
    ) external override returns (uint256) {
        router.swap(exchangeRequest);
        return 0;
    }
}
