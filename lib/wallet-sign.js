const abi = require('ethereumjs-abi')
const sign = require('./sign')

module.exports = function signData (keypair, seq, contractAddress, operation, types, args) {
  // operation, arguments...
  const data = abi.solidityPack(['address', 'string', ...types], [contractAddress, operation, ...args])

  // seq, data
  const digest = abi.soliditySHA3(['bytes1', 'uint256', 'address', 'bytes'], ['0x19', seq, contractAddress, data])
  return sign(digest, keypair.privateKey)
}
