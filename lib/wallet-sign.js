const abi = require('ethereumjs-abi')
const sign = require('./sign')

module.exports = function signData (seq, keypair, operation, types, args) {
  // operation, arguments...
  const data = abi.solidityPack(['string', ...types], [operation, ...args])
  // seq, data
  const digest = abi.soliditySHA3(['uint', 'bytes'], [seq, data])
  return sign(digest, keypair.privateKey)
}
