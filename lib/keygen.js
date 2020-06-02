const hash = require('sha3-wasm').keccak256
const curve = require('secp256k1-native')
const crypto = require('crypto')
const toChecksumAddress = require('./checksum-address')

const signCtx = curve.secp256k1_context_create(curve.secp256k1_context_SIGN)
module.exports = function keygen (privateKey) {
  if (privateKey == null) {
    do {
      privateKey = crypto.randomBytes(32)
    } while (!curve.secp256k1_ec_seckey_verify(signCtx, privateKey))
  }

  const k = Buffer.alloc(curve.secp256k1_PUBKEYBYTES)
  curve.secp256k1_ec_pubkey_create(signCtx, k, privateKey)

  const publicKey = Buffer.alloc(65)
  curve.secp256k1_ec_pubkey_serialize(signCtx, publicKey, k, curve.secp256k1_ec_UNCOMPRESSED)

  const digest = hash().update(publicKey.slice(1)).digest()
  const address = toChecksumAddress(digest.slice(-20))

  return { privateKey, publicKey, address }
}
