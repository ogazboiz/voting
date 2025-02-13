// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AkpoloToken is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 1000 * (10 ** 18); // 1000 tokens with 18 decimals

    constructor() ERC20("Akpolo Token", "AKP") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
