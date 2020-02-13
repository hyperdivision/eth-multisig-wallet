pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    event DepositForwarded(address indexed from, uint256 amount);
    event DepositSweep(address indexed from, uint256 amount);
    event DepositSweepERC20(address indexed ERC20Address, address indexed from, uint256 amount);

    address public trustedOwner;
    address payable public recipient;

    constructor (address _trustedOwner, address payable _recipient) public {
        trustedOwner = _trustedOwner;
        recipient = _recipient;
    }

    function init (address _trustedOwner, address payable _recipient) external {
        require(address(0) == _trustedOwner, "Deposit: init trustedOwner cannot be set");
        require(address(0) == _recipient, "Deposit: init recipient cannot be set");

        trustedOwner = _trustedOwner;
        recipient = _recipient;
    }

    function replaceOwner (address newOwner) external {
        require(msg.sender == trustedOwner, "Deposit: Only trustedOwner can replace themselves");
        require(address(0) != newOwner, "Deposit: newOwner cannot be empty");

        trustedOwner = newOwner;
    }

    function replaceRecipient (address payable newRecipient) external {
        require(msg.sender == trustedOwner, "Deposit: Only trustedOwner can replace recipient");
        require(address(0) != newRecipient, "Deposit: newRecipient cannot be empty");

        recipient = newRecipient;
    }

    function ()
        external
        payable
    {
        require(msg.data.length == 0, "Deposit: fallback function does not take arguments");
        // Since we only forward to a trusted contract, and we want to forward
        // the gas stipend also
        // solium-disable-next-line security/no-call-value
        (bool success, ) = recipient.call.value(msg.value)("");
        require(success, "Deposit: Forward failed");
        emit DepositForwarded(address(this), msg.value);
    }

    function sweepERC20(address ERC20Address, uint256 gasLimit) external {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint256 balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer.gas(gasLimit)(recipient, balance);
        require(success, "Deposit: ERC20 sweep failed");
        emit DepositSweepERC20(ERC20Address, address(this), balance);
    }

    function sweep () external {
        uint256 balance = address(this).balance;
        (bool success, ) = recipient.call.value(balance)("");
        require(success, "Deposit: Sweep failed");
        emit DepositSweep(address(this), balance);
    }
}
