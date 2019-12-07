pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    event Deposit(address from, uint amount);
    address payable public trustedOwner;

    constructor (address payable _trustedOwner) public {
        trustedOwner = _trustedOwner;
    }

    function init (address payable _trustedOwner) external {
        require(address(0) == trustedOwner, "Deposit: init trustedOwner cannot be set");

        trustedOwner = _trustedOwner;
    }

    function ()
        external
        payable
    {
        require(msg.data.length == 0, "Wallet: fallback function does not take arguments");
        (bool success, ) = trustedOwner.call.value(msg.value)();
        require(success);
        emit Deposit(msg.sender, msg.value);
    }

    function sweepERC20(address ERC20Address) external {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer(trustedOwner, balance);
        require(success, "Deposit: ERC20 transfer failed");
    }

    function sweep () external {
        uint balance = address(this).balance;
        trustedOwner.transfer(balance);
    }
}
