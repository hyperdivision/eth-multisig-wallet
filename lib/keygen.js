const hash = require('keccak')
const curve = require('secp256k1')
const crypto = require('crypto')
const toChecksumAddress = require('./checksum-address')

module.exports = function keygen (privateKey) {
  if (privateKey == null) {
    privateKey = crypto.randomBytes(32)
  }

  const publicKey = curve.publicKeyCreate(privateKey, false)
  const digest = hash('keccak256').update(publicKey.slice(1)).digest()
  const address = toChecksumAddress(digest.slice(-20))

  return { privateKey, publicKey, address }
}
