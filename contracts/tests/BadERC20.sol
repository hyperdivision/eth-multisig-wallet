pragma solidity ^0.5.14;

import "../IERC20.sol";

contract BadERC20 is IERC20 {
    mapping (address => uint256) private _balances;

    uint256 private _totalSupply = 1000000;
    uint private _seq = 0;

    constructor () public {
        _balances[address(this)] = _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        return false;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    // Shim remaining methods
    function approve(address spender, uint256 amount) external returns (bool) {
        return false;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return 0;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
}
