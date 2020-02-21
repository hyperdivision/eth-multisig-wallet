pragma solidity ^0.5.0;

interface IPullWithdrawable {
    event Withdrawal(address indexed to, uint256 amount);
    event WithdrawalERC20(address indexed ERC20Address, address indexed to, uint256 amount);

    function withdraw (uint256 amount) external;

    function withdraw () external;

    function withdrawFrom (address payable from) external;

    function withdrawFrom (address payable from, uint256 amount) external;

    function withdrawERC20 (address ERC20Address, uint256 amount) external;

    function withdrawERC20 (address ERC20Address) external;

    function withdrawERC20From (address ERC20Address, address payable from) external;

    function withdrawERC20From (address ERC20Address, address payable from, uint256 amount) external;
}
