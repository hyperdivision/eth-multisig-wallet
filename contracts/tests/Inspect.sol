pragma solidity 0.5.12;

import "../CodeHash.sol";

contract Inspect {
    function hash (address addr) external view returns (bytes32) {
        return CodeHash.at(addr);
    }
}
