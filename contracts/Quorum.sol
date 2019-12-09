pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "./ECDSA.sol";
import "./MultiOwner.sol";

contract Quorum is MultiOwner {
    uint public seq;

    mapping (string => uint) public quorum;
    uint32 constant QUORUM_PRECISION = 0xffffffff;

    // Mark as abstract contract
    constructor() internal {}

    // hasQuorum('replaceOwner', signatures, abi.encodePacked(oldOwner, newOwner))
    modifier hasQuorum(string memory operation, bytes[] memory signatures, bytes memory data) {
        uint minQuorum = quorum[operation];
        require(minQuorum > 0, "Quorum: minQuorum for operation must be greater than zero");
        require(signatures.length > 0, "Quorum: At least one signature must be given");
        require(signatures.length <= owners.length, "Quorum: Each owner can sign at most once");
        uint32 sigsQuorum = uint32((QUORUM_PRECISION * signatures.length) / owners.length);
        require(sigsQuorum <= QUORUM_PRECISION, "Quorum: number of signatures must be less than quorum precision");
        // Strict larger than. This means 50% quorum on 2 people needs both to sign
        require(sigsQuorum > minQuorum, "Quorum: minQuroum number of signatures must be strictly greater");

        uint i = 0; // signature index
        uint j = 0; // owner index
        uint v = 0; // verified counter
        for (; i < signatures.length; i++) {
            address signer = verify(data, signatures[i]);
            require(isOwner[signer], "Quorum: invalid signature (perhaps invalid signer or wrong data)");
            while (j < owners.length) {
                if (signer != owners[j]) j++;
                else {
                    j++;
                    v++;
                    break;
                }
            }

            if (j == owners.length) break;
        }
        require(v == signatures.length, "Quorum: all signatures must be valid");

        seq++;
        _;
    }

    modifier isSignatureLength (bytes memory signature) {
        require(signature.length == 65, "Quorum: signature must be 65 bytes (32 s, 32 r, 1 v)");
        _;
    }

    modifier notNullData (bytes memory data) {
        require(data.length > 0, "Quorum: data cannot be null");
        _;
    }

    function setQuorum (string memory operation, uint32 minQuroum) internal {
        require(minQuroum > 0, "Quorum: minQuroum must be greater than 0");
        require(minQuroum <= QUORUM_PRECISION, "Quorum: minQuroum must be at most precision");

        quorum[operation] = minQuroum;
    }

    function verify (bytes memory data, bytes memory signature) public view returns(address) {
        address signer = _verify(signature, seq, address(this), data);

        require(signer != address(0), "Quorum: invalid signature");

        return signer;
    }

    function _verify (bytes memory signature, uint currentSeq, address addr, bytes memory data)
        private
        isSignatureLength(signature)
        notNullData(data)
        pure
        returns (address)
    {
        bytes32 hash = keccak256(abi.encodePacked(byte(0x19), currentSeq, addr, data));
        return ECDSA.recover(hash, signature);
    }
}
