pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;
pragma experimental SMTChecker;

import "./Quorum2.sol";
import "./CodeHash.sol";

contract QuorumOwners is Quorum2 {
    constructor (
        address[] memory initialOwners,
        uint32 setQuorumQuorum,
        uint32 addOwnerQuorum,
        uint32 removeOwnerQuorum,
        uint32 replaceOwnerQuorum
    ) public {
        require(initialOwners.length > 0, "Wallet: initialOwners must be given");

        for(uint256 i = 0; i < initialOwners.length; i++) {
            super.addOwner(initialOwners[i]);
        }

        super.setQuorum(abi.encodePacked(address(this), "setQuorum"), setQuorumQuorum);
        super.setQuorum(abi.encodePacked(address(this), "addOwner"), addOwnerQuorum);
        super.setQuorum(abi.encodePacked(address(this), "removeOwner"), removeOwnerQuorum);
        super.setQuorum(abi.encodePacked(address(this), "replaceOwner"), replaceOwnerQuorum);
    }

    function setQuorum (bytes[] memory signatures, bytes memory operation, uint32 minQuroum)
        public
        hasQuorum(
            abi.encodePacked(address(this), "setQuorum"),
            signatures,
            // there counld be a potential confusion here since operation is
            // variable length but as long as there are methods that share the
            // prefix setQuorum, it is safe
            abi.encodePacked(address(this), "setQuorum", operation, minQuroum)
        )
    {
        super.setQuorum(operation, minQuroum);
    }

    function addOwner (bytes[] memory signatures, address owner)
        public
        hasQuorum(
            abi.encodePacked(address(this), "addOwner"),
            signatures,
            abi.encodePacked(address(this), "addOwner", owner)
        )
        returns (uint256)
    {
        return super.addOwner(owner);
    }

    function removeOwner (bytes[] memory signatures, address owner)
        public
        hasQuorum(
            abi.encodePacked(address(this), "removeOwner"),
            signatures,
            abi.encodePacked(address(this), "removeOwner", owner)
        )
    {
        return super.removeOwner(owner);
    }

    function replaceOwner (bytes[] memory signatures, address oldOwner, address newOwner)
        public
        hasQuorum(
            abi.encodePacked(address(this), "replaceOwner"),
            signatures,
            abi.encodePacked(address(this), "replaceOwner", oldOwner, newOwner)
        )
    {
        return super.replaceOwner(oldOwner, newOwner);
    }

    function execute (bytes[] memory signatures, address destination, bytes4 dstMethod, uint256 dstValue, uint256 dstGas, bytes memory dstData)
        public
        hasQuorum(
            abi.encodePacked(address(this), "execute", destination, dstMethod),
            signatures,
            abi.encodePacked(address(this), "execute", destination, dstMethod, dstValue, dstGas, dstData)
        )
    {
        (bool success, ) = destination.call.gas(dstGas).value(dstValue)(abi.encodeWithSelector(dstMethod, dstData));
        require(success, "Wallet: Execute failed");
    }

    function executeType (bytes[] memory signatures, address destination, bytes4 dstMethod, uint256 dstValue, uint256 dstGas, bytes memory dstData)
        public
        hasQuorum(
            abi.encodePacked(address(this), "executeType", CodeHash.at(destination), dstMethod),
            signatures,
            abi.encodePacked(address(this), "executeType", destination, dstMethod, dstValue, dstGas, dstData)
        )
    {
        (bool success, ) = destination.call.gas(dstGas).value(dstValue)(abi.encodeWithSelector(dstMethod, dstData));
        require(success, "Wallet: Execute failed");
    }

    function () external payable {
        require(msg.data.length == 0, "Wallet: fallback function does not take arguments");
    }
}
