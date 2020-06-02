pragma solidity ^0.5.12;

import "./CloneFactory.sol";
import "./Deposit.sol";

contract DepositFactory is CloneFactory {
    event Deployed(address payable indexed at);
    address public templateAddress;

    address public trustedOwner;
    address public recipient;

    constructor (address _templateAddress, address _trustedOwner, address _recipient) public {
        templateAddress = _templateAddress;
        trustedOwner = _trustedOwner;
        recipient = _recipient;
    }

    function replaceOwner (address newOwner) external {
        require(msg.sender == trustedOwner, "Deposit: Only trustedOwner can replace themselves");
        require(address(0) != newOwner, "Deposit: newOwner cannot be empty");

        trustedOwner = newOwner;
    }

    function replaceRecipient (address newRecipient) external {
        require(msg.sender == trustedOwner, "Deposit: Only trustedOwner can replace recipient");
        require(address(0) != newRecipient, "Deposit: newRecipient cannot be empty");

        recipient = newRecipient;
    }

    function create(uint256 salt) external returns(address) {
        address payable spawned = super.create2Clone(templateAddress, salt);
        Deposit c = Deposit(spawned);
        c.init(trustedOwner, recipient);
        c.sweep();
        emit Deployed(spawned);
    }
}
