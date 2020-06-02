const curve = require('secp256k1-native')

const signCtx = curve.secp256k1_context_create(curve.secp256k1_context_SIGN)
const assert = require('nanoassert')
module.exports = function sign (digest, privateKey) {
  assert(Buffer.isBuffer(digest), 'digest must be Buffer')
  assert(Buffer.isBuffer(privateKey), 'privateKey must be Buffer')
  assert(privateKey.byteLength === 32, 'privateKey must be 32 bytes')

  const sig = Buffer.alloc(curve.secp256k1_ecdsa_recoverable_SIGBYTES)
  curve.secp256k1_ecdsa_sign_recoverable(signCtx, sig, digest, privateKey)

  sig[64] += 27

  return sig
}
