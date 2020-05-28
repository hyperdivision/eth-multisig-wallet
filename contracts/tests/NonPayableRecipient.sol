pragma solidity ^0.5.14;

contract NonPayableRecipient {
    function () external payable {
        revert("NonPayable");
    }
}
