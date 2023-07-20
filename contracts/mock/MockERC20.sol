// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    bool public allowZeroTransfer;
    uint8 _dec;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 dec,
        uint256 supply
    ) ERC20(tokenName, tokenSymbol) {
        _dec = dec;
        if (supply > 0) {
            _mint(msg.sender, supply * (10 ** dec));
        }
    }

    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 wad) public {
        require(balanceOf(msg.sender) >= wad, "Not enough balance");
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
    }

    function _beforeTokenTransfer(address /*from*/, address /*to*/, uint256 amount) internal virtual override {
        require(allowZeroTransfer || amount > 0, "Invalid amount to transfer");
    }

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }

    function setAllowZeroTransfer(bool value) public {
        allowZeroTransfer = value;
    }

    function decimals() public view override returns (uint8) {
        return _dec;
    }
}
