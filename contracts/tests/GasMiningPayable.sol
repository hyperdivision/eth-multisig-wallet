pragma solidity ^0.5.12;

contract GasMiningPayable {
    uint private _seq = 0;

    function () external payable {
        while (true) {
            _seq++;
        }
    }
}
