interface IPullWithdrawable {
    event Withdrawal(address indexed to, uint amount);
    event WithdrawalERC20(address indexed ERC20Address, address indexed to, uint amount);

    function withdraw (uint amount) external;

    function withdraw () external;

    function withdrawFrom (address payable from) external;

    function withdrawFrom (address payable from, uint amount) external;

    function withdrawERC20 (address ERC20Address, uint amount) external;

    function withdrawERC20 (address ERC20Address) external;

    function withdrawERC20From (address ERC20Address, address payable from) external;

    function withdrawERC20From (address ERC20Address, address payable from, uint amount) external;
}
