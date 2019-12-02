pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "./ECDSA.sol";
import "./MultiOwner.sol";

contract Quorum is MultiOwner {
    uint public seq;

    mapping (string => uint) public quorum;
    uint32 quorumPrecision = 0xffffffff;

    // Mark as abstract contract
    constructor() internal {}

    // hasQuorum('replaceOwner', signatures, abi.encodePacked(oldOwner, newOwner))
    modifier hasQuorum(string memory operation, bytes[] memory signatures, bytes memory data) {
        uint minQuorum = quorum[operation];
        require(minQuorum > 0);
        require(signatures.length > 0);
        require(sigsQuorum <= quorumPrecision);
        uint sigsQuorum = (quorumPrecision * signatures.length) / owners.length;
        // Compare uint with uint32
        // Strict larger than. This means 50% quorum on 2 people needs both to sign
        require(sigsQuorum > minQuorum);

        uint i = 0; // signature index
        uint j = 0; // owner index
        uint v = 0; // verified counter
        for (; i < signatures.length; i++) {
            address signer = verify(data, signatures[i]);
            require(isOwner[signer]);
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
        require(v == signatures.length);

        seq++;
        _;
    }

    modifier isSignatureLength (bytes memory signature) {
        require(signature.length == 65);
        _;
    }

    modifier notNullData (bytes memory data) {
        require(data.length > 0);
        _;
    }

    function setQuorum (string memory operation, uint32 minQuroum) internal {
        require(minQuroum > 0);
        require(minQuroum <= quorumPrecision);

        quorum[operation] = minQuroum;
    }

    function verify (bytes memory data, bytes memory signature) public view returns(address) {
        address signer = _verify(signature, seq, data);

        require(signer != address(0));

        return signer;
    }

    function _verify (bytes memory signature, uint currentSeq, bytes memory data)
        isSignatureLength(signature)
        notNullData(data)
        private
        pure
        returns (address)
    {
        bytes32 hash = keccak256(abi.encodePacked(currentSeq, data));
        return ECDSA.recover(hash, signature);
    }
}
