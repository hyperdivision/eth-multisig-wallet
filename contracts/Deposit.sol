pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    event DepositForwarded(address indexed from, uint amount);
    event DepositSweep(address indexed from, uint amount);
    event DepositSweepERC20(address indexed ERC20Address, address indexed from, uint amount);

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
        // Since we only forward to a trusted contract, and we want to forward
        // the gas stipend also
        // solium-disable-next-line security/no-call-value
        (bool success, ) = trustedOwner.call.value(msg.value)("");
        require(success, "Deposit: Forward failed");
        emit DepositForwarded(address(this), msg.value);
    }

    function sweepERC20(address ERC20Address, uint gasLimit) external {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer.gas(gasLimit)(trustedOwner, balance);
        require(success, "Deposit: ERC20 transfer failed");
        emit DepositSweepERC20(ERC20Address, address(this), balance);
    }

    function sweep () external {
        uint balance = address(this).balance;
        trustedOwner.transfer(balance);
        emit DepositSweep(address(this), balance);
    }
}
