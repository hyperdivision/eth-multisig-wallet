pragma solidity 0.5.12;

import "./IERC20.sol";

contract PullWithdrawable {
    mapping (address => uint) withdrawals;
    mapping (address => mapping(address => uint)) withdrawalsERC20;

    constructor () internal {}

    function updateWithdrawals (address[] memory recipients, uint[] memory amounts) internal {
        require(recipients.length > 0);
        require(amounts.length > 0);
        require(recipients.length == amounts.length);
        for(uint i = 0; i < recipients.length; i++) {
            withdrawals[recipients[i]] += amounts[i];
        }
    }

    function updateWithdrawalsERC20 (address[] memory recipients, address[] memory ERC20Address, uint[] memory amounts) internal {
        require(recipients.length > 0);
        require(ERC20Address.length > 0);
        require(amounts.length > 0);
        require(recipients.length == ERC20Address.length);
        require(ERC20Address.length == amounts.length);
        for(uint i = 0; i < recipients.length; i++) {
            withdrawalsERC20[ERC20Address[i]][recipients[i]] += amounts[i];
        }
    }

    function withdraw (uint amount) internal {
        uint balance = withdrawals[msg.sender];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");
        withdrawals[msg.sender] -= amount;
        (bool success, ) = msg.sender.call.value(amount)("");
        require(success);
    }

    function withdrawERC20 (address ERC20Address, uint amount) internal {
        uint balance = withdrawalsERC20[ERC20Address][msg.sender];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");

        IERC20 erc20Contract = IERC20(ERC20Address);
        withdrawals[msg.sender] -= amount;

        bool success = erc20Contract.transfer(msg.sender, amount);
        require(success, "Deposit: ERC20 transfer failed");
    }
}
