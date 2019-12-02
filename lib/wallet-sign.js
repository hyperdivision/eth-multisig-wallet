const abi = require('ethereumjs-abi')
const sign = require('./sign')

module.exports = function signData (seq, contractAddress, keypair, operation, types, args) {
  // operation, arguments...
  const data = abi.solidityPack(['string', ...types], [operation, ...args])
  // seq, data
  const digest = abi.soliditySHA3(['byte', 'uint', 'address', 'bytes'], ['0x19', seq, contractAddress, data])
  return sign(digest, keypair.privateKey)
}
