pragma solidity ^0.5.14;

import "../IPullWithdrawable.sol";

contract Controller {
    function deposit (address payable target, uint amount) public {
        // solium-disable-next-line security/no-call-value
        (bool success, ) = target.call.value(amount)("");
        require(success, "Controller: Deposit failed");
    }

    function withdraw (address target) public {
        IPullWithdrawable con = IPullWithdrawable(target);
        con.withdraw();
    }

    function ()
        external
        payable
    { }
}
