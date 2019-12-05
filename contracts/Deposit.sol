pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    address payable public owner;

    constructor (address payable _owner) public {
        owner = _owner;
    }

    function init (address payable _owner) external {
        require(address(0) == owner, "Deposit: init owner cannot be set");

        owner = _owner;
    }

    function ()
        external
        payable
    {
        owner.transfer(msg.value);
    }

    function sweepERC20(address ERC20Address) external {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer(owner, balance);
        require(success, "Deposit: ERC20 transfer failed");
    }

    function sweep () external {
        uint balance = address(this).balance;
        owner.transfer(balance);
    }
}
