pragma solidity ^0.5.11;
pragma experimental ABIEncoderV2;

contract ModifierCalldata {
    event Counter(uint count);

    modifier countMod (bytes[] memory data) {
        emit Counter(data.length);
        _;
    }

    function count (bytes[] memory data)
        public
        countMod(data)
        returns(uint)
    {
        return data.length;
    }
}
