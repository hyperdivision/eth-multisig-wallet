const hash = require('keccak')
module.exports = function toChecksumAddress (address) {
  const addr = address.toString('hex')
  var ret = '0x'
  const h = hash('keccak256').update(address).digest('hex')

  for (var i = 0; i < addr.length; i++) {
    if (parseInt(h[i], 16) >= 8) {
      ret += addr[i].toUpperCase()
    } else {
      ret += addr[i]
    }
  }

  return ret
}
