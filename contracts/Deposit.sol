pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    address public owner;

    constructor () public {
        owner = msg.sender;
    }

    modifier onlyOwner () {
          require(msg.sender == owner, "Deposit: only owner can call this function");
          _;
    }

    function ()
        public
        payable
    {
        (bool success, ) = owner.call.value(msg.value)("");
        require(success, "Deposit: transfer failed");
    }

    function sweepERC20(address ERC20Address) public {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        (bool success, ) = erc20.transfer(owner, balance);
        require(success, "Deposit: ERC20 transfer failed");
    }

    function sweep () public {
        uint balance = address(this).balance
        (bool success, ) = owner.call.value(this.balance)("");
        require(success, "Deposit: tranfer failed");
    }
}
