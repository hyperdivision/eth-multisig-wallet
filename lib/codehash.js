const hash = require('sha3-wasm').keccak256
module.exports = function (deployedBytecode) {
  return '0x' + hash('keccak256').update(Buffer.from(deployedBytecode.replace(/^0x/, ''), 'hex')).digest('hex')
}
