import "./CloneFactory.sol";
import "./Deposit.sol";

contract DepositFactory is CloneFactory {
    address public libraryAddress;

    constructor(address _libraryAddress) public {
        libraryAddress = _libraryAddress;
    }

    function create(address owner, uint256 salt) public returns(address) {
        address spawned = super.create2Clone(libraryAddress, salt);
        Deposit(_payable(spawned)).init(owner);
        return spawned;
    }

    function _payable(address addr) private pure returns(address payable){
        return address(uint160(addr));
    }
}
