const hash = require('keccak')
const curve = require('secp256k1')
const crypto = require('crypto')

module.exports = function keygen (privateKey) {
  if (privateKey == null) {
    privateKey = crypto.randomBytes(32)
  }

  const publicKey = curve.publicKeyCreate(privateKey, false)
  const digest = hash('keccak256').update(publicKey.slice(1)).digest()
  const address = toChecksumAddress(digest.slice(-20))

  return { privateKey, publicKey, address }
}

function toChecksumAddress (address, eip1191ChainId) {
  const addr = address.toString('hex')
  const prefix = eip1191ChainId != null ? eip1191ChainId.toString() + '0x' : ''
  var ret = '0x'
  const h = hash('keccak256').update(prefix + address).digest('hex')

  for (var i = 0; i < addr.length; i++) {
    if (parseInt(h[i], 16) >= 8) {
      ret += addr[i].toUpperCase()
    } else {
      ret += addr[i]
    }
  }

  return ret
}
