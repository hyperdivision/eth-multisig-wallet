pragma solidity 0.5.12;

import "./IERC20.sol";

contract Deposit {
    address public owner;

    constructor () public {
        owner = msg.sender;
    }

    modifier onlyOwner () {
        require(msg.sender == owner, "Deposit: only owner can call this function");
        _;
    }

    function ()
        external
        payable
    {
        _payable(owner).transfer(msg.value);
    }

    function sweepERC20(address ERC20Address) public {
        IERC20 erc20Contract = IERC20(ERC20Address);

        address self = address(this);
        uint balance = erc20Contract.balanceOf(self);

        if (balance == 0) return;

        bool success = erc20Contract.transfer(owner, balance);
        require(success, "Deposit: ERC20 transfer failed");
    }

    function sweep () public {
        uint balance = address(this).balance;
        _payable(owner).transfer(balance);
    }

    function _payable(address addr) private pure returns(address payable){
        return address(uint160(addr));
    }
}
