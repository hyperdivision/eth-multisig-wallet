pragma solidity ^0.5.12;

library CodeHash {
    function at (address c) internal view returns (bytes32) {
        bytes32 h;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            h := extcodehash(c)
        }

        require(h != 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470, "No code");
        require(h != 0, "Empty or Non-existent");
        return h;
    }
}
