const hash = require('keccak')

module.exports = function (contactAddress, contractBytes, saltStr) {
  const prefix = Buffer.from([0xff])
  const address = Buffer.from(contactAddress.replace(/^0x/, ''), 'hex')
  const salt = Buffer.from(saltStr.replace(/^0x/, ''), 'hex')
  const initCode = Buffer.from(contractBytes.replace(/^0x/, ''), 'hex')
  const codeHash = hash('keccak256').update(initCode).digest()

  return '0x' + hash('keccak256')
    .update(prefix)
    .update(address)
    .update(salt)
    .update(codeHash)
    .digest('hex').toString('hex').slice(24)
}
