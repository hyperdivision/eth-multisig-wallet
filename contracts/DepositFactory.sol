pragma solidity 0.5.12;

import "./CloneFactory.sol";
import "./Deposit.sol";

contract DepositFactory is CloneFactory {
    address public _templateAddress;

    constructor(address templateAddress) public {
        _templateAddress = templateAddress;
    }

    function create(address payable trustedOwner, uint256 salt) public returns(address) {
        address payable spawned = super.create2Clone(_templateAddress, salt);
        Deposit(spawned).init(trustedOwner);
        return spawned;
    }
}
