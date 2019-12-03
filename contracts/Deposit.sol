pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    address public owner;

    constructor (address[] ERC20Sweeps) public {
        owner = msg.sender;

        this.sweep();
        for(uint i = 0; i < ERC20Sweeps.length; i++) {
            this.sweepERC20(ERC20Sweeps[i]);
        }
    }

    modifier onlyOwner () {
        require(msg.sender == owner, "Deposit: only owner can call this function");
        _;
    }

    function ()
        external
        payable
    {
        owner.transfer(msg.value);
    }

    function sweepERC20(address ERC20Address) public {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer(owner, balance);
        require(success, "Deposit: ERC20 transfer failed");
    }

    function sweep () public {
        uint balance = address(this).balance;
        owner.transfer(balance);
    }
}
