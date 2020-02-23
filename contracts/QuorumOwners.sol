pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;
pragma experimental SMTChecker;

import "./Quorum.sol";
import "./CodeHash.sol";

contract QuorumOwners is Quorum {
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

    function execute (bytes[] memory signatures, address destination, bytes4 dstMethod, uint256 dstValue, bytes memory dstData)
        public
        hasQuorum(
            abi.encodePacked(address(this), "execute", destination, dstMethod),
            signatures,
            abi.encodePacked(address(this), "execute", destination, dstMethod, dstValue, dstData)
        )
    {
        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = destination.call.value(dstValue)(abi.encodePacked(dstMethod, dstData));
        require(success, string(returnData));
    }

    function executeType (
        bytes[] memory signatures,
        address destination,
        bytes4 dstMethod,
        uint256 dstValue,

        bytes memory dstData
    ) public
        hasQuorum(
            abi.encodePacked(address(this), "executeType", CodeHash.at(destination), dstMethod),
            signatures,
            abi.encodePacked(address(this), "executeType", destination, dstMethod, dstValue, dstData)
        )
    {
        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory returnData) = destination.call.value(dstValue)(abi.encodePacked(dstMethod, dstData));
        require(success, string(returnData));
    }

    function () external payable {
        require(msg.data.length == 0, "Wallet: fallback function does not take arguments");
    }
}
