pragma solidity ^0.5.12;

contract NonPayableRecipient {
    function () external payable {
        revert("NonPayable");
    }
}
