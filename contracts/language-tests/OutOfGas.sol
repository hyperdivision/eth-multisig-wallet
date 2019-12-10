pragma solidity 0.5.12;

contract OutOfGas {
    uint public seq = 0;

    function loop () public {
        while (true) {
            seq++;
        }
    }
}
