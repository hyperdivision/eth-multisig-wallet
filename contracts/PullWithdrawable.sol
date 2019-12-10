pragma solidity 0.5.12;

import "./IERC20.sol";

contract PullWithdrawable {
    event Withdrawal(address indexed to, uint amount);
    event WithdrawalERC20(address indexed ERC20Address, address indexed to, uint amount);

    mapping (address => uint) public withdrawals;
    mapping (address => mapping(address => uint)) public withdrawalsERC20;

    // Mark as abstract contract
    constructor () internal {}
    // solium-disable-previous-line no-empty-blocks

    function updateWithdrawals (address[] memory recipients, uint[] memory amounts) internal {
        require(recipients.length > 0, "PullWithdrawable: recipients must be given");
        require(recipients.length == amounts.length, "PullWithdrawable: recipients must be same length as amounts");
        for(uint i = 0; i < recipients.length; i++) {
            withdrawals[recipients[i]] += amounts[i];
        }
    }

    function updateWithdrawalsERC20 (address[] memory recipients, address[] memory ERC20Address, uint[] memory amounts) internal {
        require(recipients.length > 0, "PullWithdrawable: recipients must be given");
        require(recipients.length == ERC20Address.length, "PullWithdrawable: recipients must be same length as ERC20Addresses");
        require(ERC20Address.length == amounts.length, "PullWithdrawable: ERC20Addresses must be same length as amounts");
        for(uint i = 0; i < recipients.length; i++) {
            withdrawalsERC20[ERC20Address[i]][recipients[i]] += amounts[i];
        }
    }

    function withdraw (uint amount) external {
        uint balance = withdrawals[msg.sender];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");
        withdrawals[msg.sender] -= amount;
        msg.sender.transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }

    function withdraw () external {
        uint balance = withdrawals[msg.sender];
        require(0 < balance, "PullWithdrawable: no balance");
        withdrawals[msg.sender] = 0;
        msg.sender.transfer(balance);
        emit Withdrawal(msg.sender, balance);
    }

    function withdrawERC20 (address ERC20Address, uint amount) external {
        uint balance = withdrawalsERC20[ERC20Address][msg.sender];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");

        IERC20 erc20Contract = IERC20(ERC20Address);
        withdrawals[msg.sender] -= amount;

        bool success = erc20Contract.transfer(msg.sender, amount);
        require(success, "Deposit: ERC20 transfer failed");
        emit WithdrawalERC20(ERC20Address, msg.sender, amount);
    }

    function withdrawERC20 (address ERC20Address) external {
        uint balance = withdrawalsERC20[ERC20Address][msg.sender];
        require(0 < balance, "PullWithdrawable: no balance");
        IERC20 erc20Contract = IERC20(ERC20Address);
        withdrawals[msg.sender] = 0;

        bool success = erc20Contract.transfer(msg.sender, balance);
        require(success, "Deposit: ERC20 transfer failed");
        emit WithdrawalERC20(ERC20Address, msg.sender, balance);
    }
}
