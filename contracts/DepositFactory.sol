pragma solidity 0.5.12;

import "./CloneFactory.sol";
import "./Deposit.sol";

contract DepositFactory is CloneFactory {
    address public libraryAddress;

    constructor(address _libraryAddress) public {
        libraryAddress = _libraryAddress;
    }

    function create(address payable owner, uint256 salt) public returns(address) {
        address payable spawned = super.create2Clone(libraryAddress, salt);
        Deposit(spawned).init(owner);
        return spawned;
    }
}
