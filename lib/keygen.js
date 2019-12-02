const hash = require('keccak')
const curve = require('secp256k1')
const crypto = require('crypto')

module.exports = function keygen () {
  const privateKey = crypto.randomBytes(32)
  const publicKey = curve.publicKeyCreate(privateKey, false)
  const digest = hash('keccak256').update(publicKey.slice(1)).digest('hex')
  const address = '0x' + digest.slice(-40)

  return { privateKey, publicKey, address }
}
