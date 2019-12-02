pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

contract Wallet is Quorum {
    constructor (
        address[] memory initialOwners,
        uint32 setQuorumQuorum,
        uint32 addOwnerQuorum,
        uint32 removeOwnerQuorum,
        uint32 replaceOwnerQuorum
    ) public {
        require(initialOwners.length > 0);

        for(uint i = 0; i < initialOwners.length; i++) {
            super.addOwner(initialOwners[i]);
        }

        super.setQuorum("setQuorum", setQuorumQuorum);
        super.setQuorum("addOwner", addOwnerQuorum);
        super.setQuorum("removeOwner", removeOwnerQuorum);
        super.setQuorum("replaceOwner", replaceOwnerQuorum);
    }

    function setQuorum (bytes[] memory signatures, string memory operation, uint32 minQuroum)
        public
        hasQuorum("setQuorum", signatures, abi.encodePacked("setQuorum", operation, minQuroum))
    {
        super.setQuorum(operation, minQuroum);
    }

    function addOwner (bytes[] memory signatures, address owner)
        public
        hasQuorum("addOwner", signatures, abi.encodePacked("addOwner", owner))
        returns (uint)
    {
        return super.addOwner(owner);
    }

    function removeOwner (bytes[] memory signatures, address owner)
        public
        hasQuorum("removeOwner", signatures, abi.encodePacked("removeOwner", owner))
    {
        return super.removeOwner(owner);
    }

    function replaceOwner (bytes[] memory signatures, address oldOwner, address newOwner)
        public
        hasQuorum("removeOwner", signatures, abi.encodePacked("replaceOwner", oldOwner, newOwner))
    {
        return super.replaceOwner(oldOwner, newOwner);
    }
}
