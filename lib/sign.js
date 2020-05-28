const curve = require('secp256k1')
const assert = require('nanoassert')
module.exports = function sign (digest, privateKey) {
  assert(Buffer.isBuffer(digest), 'digest must be Buffer')
  assert(Buffer.isBuffer(privateKey), 'privateKey must be Buffer')
  assert(privateKey.byteLength === 32, 'privateKey must be 32 bytes')

  const sig = curve.ecdsaSign(digest, privateKey)
  const signature = Buffer.alloc(65, sig.signature.subarray(0, 64))
  signature[64] = sig.recovery + 27

  return signature
}
