pragma solidity ^0.5.12;

import "../MultiOwner.sol";

contract MultiOwnerConcrete is MultiOwner {
    function allOwners() public view returns (address[] memory) {
        return owners;
    }

    function addOwnerT(address owner) public returns (uint) {
        return super.addOwner(owner);
    }
    function removeOwnerT(address owner) public {
        return super.removeOwner(owner);
    }
    function replaceOwnerT(address oldOwner, address newOwner) public {
        return super.replaceOwner(oldOwner, newOwner);
    }
    function outOfBounds (uint index) public view returns (address) {
        address res;

        assembly {
            // 0x00 is scratch space for hash functions
            mstore(0x00, add(owners_slot, mul(index, 32)))
            let ptr := keccak256(0x00, 32)
            res := sload(ptr)
        }

        return res;
    }
}
