const abi = require('eth-serde').abi
const keccak = require('sha3-wasm').keccak256
const sign = require('./sign')

module.exports = function signData (keypair, seq, contractAddress, operation, types, args) {
  // operation, arguments...
  const data = abi.raw.pack(['address', 'string', ...types], [contractAddress, operation, ...args])

  // seq, data
  const digest = keccak().update(abi.raw.pack(['bytes1', 'uint256', 'address', 'bytes'], ['0x19', seq, contractAddress, data])).digest()
  return sign(digest, keypair.privateKey)
}
