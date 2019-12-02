const curve = require('secp256k1')

module.exports = function sign (digest, privateKey) {
  const sig = curve.sign(digest, privateKey)
  const signature = Buffer.alloc(65, sig.signature)
  signature[64] = sig.recovery + 27

  return signature
}
