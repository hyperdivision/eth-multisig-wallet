pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;
pragma experimental SMTChecker;

import "./Quorum.sol";
import "./PullWithdrawable.sol";

contract Wallet is Quorum, PullWithdrawable {
    constructor (
        address[] memory initialOwners,
        uint32 setQuorumQuorum,
        uint32 addOwnerQuorum,
        uint32 removeOwnerQuorum,
        uint32 replaceOwnerQuorum
    ) public {
        require(initialOwners.length > 0, "Wallet: initialOwners must be given");

        for(uint i = 0; i < initialOwners.length; i++) {
            super.addOwner(initialOwners[i]);
        }

        super.setQuorum("setQuorum", setQuorumQuorum);
        super.setQuorum("addOwner", addOwnerQuorum);
        super.setQuorum("removeOwner", removeOwnerQuorum);
        super.setQuorum("replaceOwner", replaceOwnerQuorum);
    }

    function setQuorum (bytes[] calldata signatures, string calldata operation, uint32 minQuroum)
        external
        hasQuorum("setQuorum", signatures, abi.encodePacked("setQuorum", operation, minQuroum))
    {
        super.setQuorum(operation, minQuroum);
    }

    function addOwner (bytes[] calldata signatures, address owner)
        external
        hasQuorum("addOwner", signatures, abi.encodePacked("addOwner", owner))
        returns (uint)
    {
        return super.addOwner(owner);
    }

    function removeOwner (bytes[] calldata signatures, address owner)
        external
        hasQuorum("removeOwner", signatures, abi.encodePacked("removeOwner", owner))
    {
        return super.removeOwner(owner);
    }

    function replaceOwner (bytes[] calldata signatures, address oldOwner, address newOwner)
        external
        hasQuorum("replaceOwner", signatures, abi.encodePacked("replaceOwner", oldOwner, newOwner))
    {
        return super.replaceOwner(oldOwner, newOwner);
    }

    function updateWithdrawals (bytes[] calldata signatures, address[] calldata recipients, uint[] calldata amounts)
        external
        hasQuorum("updateWithdrawals", signatures, abi.encodePacked("updateWithdrawals", recipients, amounts))
    {
        return super.updateWithdrawals(recipients, amounts);
    }

    function updateWithdrawalsERC20 (
        bytes[] calldata signatures,
        address[] calldata recipients,
        address[] calldata ERC20Address,
        uint[] calldata amounts
    )
        external
        hasQuorum("updateWithdrawalsERC20", signatures, abi.encodePacked("updateWithdrawalsERC20", recipients, ERC20Address, amounts))
    {
        return super.updateWithdrawalsERC20(recipients, ERC20Address, amounts);
    }

    function () payable external {
        require(msg.data.length == 0, "Wallet: fallback function does not take arguments");
    }
}
