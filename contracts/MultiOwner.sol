pragma solidity 0.5.12;

contract MultiOwner {
    mapping (address => bool) public isOwner;
    address[] public owners;

    // Mark as abstract contract
    constructor() internal {}

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner], "MultiOwner: `owner` must not be owner");
        _;
    }

    modifier ownerDoesExist(address owner) {
        require(isOwner[owner], "MultiOwner: `owner` must be owner");
        _;
    }

    modifier ownerNotSame(address a, address b) {
        require(a != b, "MultiOwner: `a` must not be equal to `b`");
        _;
    }

    modifier notNullAddress(address _address) {
        require(_address != address(0), "MultiOwner: zero address");
        _;
    }

    modifier minOwners(uint min) {
        require(min >= owners.length, "MultiOwner: minOwners violated");
        _;
    }

    function addOwner (address owner)
        internal
        notNullAddress(owner)
        ownerDoesNotExist(owner)
        returns (uint)
    {
        uint n = _addOwnerUnsafe(owner);
        isOwner[owner] = true;
        return n;
    }

    function removeOwner (address owner)
        internal
        notNullAddress(owner)
        ownerDoesExist(owner)
        minOwners(2)
    {
        _removeOwnerUnsafe(owner);
        isOwner[owner] = false;
    }

    function replaceOwner(address oldOwner, address newOwner)
        internal
        notNullAddress(oldOwner)
        notNullAddress(newOwner)
        ownerDoesExist(oldOwner)
        ownerDoesNotExist(newOwner)
        ownerNotSame(oldOwner, newOwner)
    {
        _replaceOwnerUnsafe(oldOwner, newOwner);
        // Order is important here
        isOwner[oldOwner] = false;
        isOwner[newOwner] = true;
    }

    function _addOwnerUnsafe (address owner) private returns (uint) {
        return owners.push(owner);
    }

    function _removeOwnerUnsafe (address owner) private returns (uint) {
        address lastOwner = owners[owners.length - 1];
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = lastOwner;
                break;
            }
        }

        owners.length -= 1;
        return owners.length;
    }

    function _replaceOwnerUnsafe (address oldOwner, address newOwner) private returns (uint) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == oldOwner) {
                owners[i] = newOwner;
                break;
            }
        }

        return owners.length;
    }
}
