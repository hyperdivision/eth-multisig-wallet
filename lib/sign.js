const curve = require('secp256k1-native')
const assert = require('nanoassert')

const signCtx = curve.secp256k1_context_create(curve.secp256k1_context_SIGN)

module.exports = function sign (digest, privateKey) {
  assert(Buffer.isBuffer(digest), 'digest must be Buffer')
  assert(Buffer.isBuffer(privateKey), 'privateKey must be Buffer')
  assert(privateKey.byteLength === 32, 'privateKey must be 32 bytes')

  const sig = Buffer.alloc(curve.secp256k1_ecdsa_recoverable_SIGBYTES)
  curve.secp256k1_ecdsa_sign_recoverable(signCtx, sig, digest, privateKey)

  reverse(sig.subarray(0, 32))
  reverse(sig.subarray(32, 64))

  sig[64] += 27

  return sig
}

function reverse (buf) {
  const len = buf.byteLength - 1
  for (let i = 0; i < (len + 1) / 2; i++) {
    [buf[i], buf[len - i]] = [buf[len - i], buf[i]]
  }

  return buf
}
