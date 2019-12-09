// pragma experimental ABIEncoderV2;
//
// contract ModifierCalldata {
//     event Counter(uint count);
//
//     modifier countMod (bytes[] memory data) {
//         emit Counter(data.length);
//         _;
//     }
//
//     function count (bytes[] calldata data)
//         external
//         countMod(data)
//         returns(uint)
//     {
//         return data.length;
//     }
// }
