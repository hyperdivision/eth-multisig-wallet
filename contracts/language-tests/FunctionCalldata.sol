// pragma experimental ABIEncoderV2;
//
// contract ModifierCalldata {
//     event Counter(uint count);
//
//     function countMod (bytes[] memory data) internal {
//         emit Counter(data.length);
//     }
//
//     function count (bytes[] calldata data)
//         external
//         returns(uint)
//     {
//         countMod(data);
//         return data.length;
//     }
// }
