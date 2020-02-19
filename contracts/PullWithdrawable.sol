pragma solidity 0.5.12;

import "./IERC20.sol";
import "./IPullWithdrawable.sol";

contract PullWithdrawable is IPullWithdrawable {
    event Withdrawal(address indexed to, uint256 amount);
    event WithdrawalERC20(address indexed ERC20Address, address indexed to, uint256 amount);

    mapping (address => uint256) public withdrawals;
    mapping (address => mapping(address => uint256)) public withdrawalsERC20;

    address payable public trustedOwner;

    constructor (address payable _trustedOwner) public {
        trustedOwner = _trustedOwner;
    }

    function replaceOwner (address payable newOwner) external {
        require(msg.sender == trustedOwner, "PullWithdrawable: Only trustedOwner can call this");
        require(address(0) != newOwner, "PullWithdrawable: newOwner cannot be empty");

        trustedOwner = newOwner;
    }

    function updateWithdrawals (address[] memory recipients, uint256[] memory amounts) public {
        require(msg.sender == trustedOwner, "PullWithdrawable: Only trustedOwner can call this");
        require(recipients.length > 0, "PullWithdrawable: recipients must be given");
        require(recipients.length == amounts.length, "PullWithdrawable: recipients must be same length as amounts");

        for(uint256 i = 0; i < recipients.length; i++) {
            withdrawals[recipients[i]] += amounts[i];
        }
    }

    function updateWithdrawalsERC20 (address[] memory ERC20Address, address[] memory recipients, uint256[] memory amounts) public {
        require(msg.sender == trustedOwner, "PullWithdrawable: Only trustedOwner can call this");
        require(recipients.length > 0, "PullWithdrawable: recipients must be given");
        require(recipients.length == ERC20Address.length, "PullWithdrawable: recipients must be same length as ERC20Addresses");
        require(ERC20Address.length == amounts.length, "PullWithdrawable: ERC20Addresses must be same length as amounts");

        for(uint256 i = 0; i < recipients.length; i++) {
            withdrawalsERC20[ERC20Address[i]][recipients[i]] += amounts[i];
        }
    }

    function withdraw (uint256 amount) public {
        _withdraw(msg.sender, amount);
    }

    function withdraw () public {
        _withdraw(msg.sender, withdrawals[msg.sender]);
    }

    function withdrawFrom (address payable from) public {
        _withdraw(from, withdrawals[from]);
    }

    function withdrawFrom (address payable from, uint256 amount) public {
        _withdraw(from, amount);
    }

    function _withdraw (address payable recipient, uint256 amount) internal {
        uint256 balance = withdrawals[recipient];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");
        withdrawals[recipient] -= amount;
        // Owner can provide whatever gas stipend they want if ie. withdrawing
        // to a smart contract
        // solium-disable-next-line security/no-call-value
        (bool success, ) = recipient.call.value(amount)("");
        require(success, "PullWithdrawable: Transfer failed");
        emit Withdrawal(recipient, amount);
    }

    function withdrawERC20 (address ERC20Address, uint256 amount) public {
        _withdrawERC20(msg.sender, ERC20Address, amount);
    }

    function withdrawERC20 (address ERC20Address) public {
        _withdrawERC20(msg.sender, ERC20Address, withdrawalsERC20[ERC20Address][msg.sender]);
    }

    function withdrawERC20From (address ERC20Address, address payable from) public {
        _withdrawERC20(from, ERC20Address, withdrawalsERC20[ERC20Address][from]);
    }

    function withdrawERC20From (address ERC20Address, address payable from, uint256 amount) public {
        _withdrawERC20(from, ERC20Address, amount);
    }

    function _withdrawERC20(address payable recipient, address ERC20Address, uint256 amount) internal {
        uint256 balance = withdrawalsERC20[ERC20Address][recipient];
        require(amount <= balance, "PullWithdrawable: amount must be less than balance");

        IERC20 erc20Contract = IERC20(ERC20Address);
        withdrawals[recipient] -= amount;

        bool success = erc20Contract.transfer(recipient, amount);
        require(success, "PullWithdrawable: ERC20 transfer failed");
        emit WithdrawalERC20(ERC20Address, recipient, amount);
    }
}
