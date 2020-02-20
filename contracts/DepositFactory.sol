pragma solidity 0.5.12;

import "./CloneFactory.sol";
import "./Deposit.sol";

contract DepositFactory is CloneFactory {
    event Deployed(address payable at);
    address public templateAddress;

    constructor (address _templateAddress) public {
        templateAddress = _templateAddress;
    }

    function create(address trustedOwner, address recipient, uint256 salt) public returns(address) {
        address payable spawned = super.create2Clone(templateAddress, salt);
        Deposit(spawned).init(trustedOwner, recipient);
        emit Deployed(spawned);
    }
}
