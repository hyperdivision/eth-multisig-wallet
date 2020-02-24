const hash = require('keccak')
module.exports = function toChecksumAddress (address, chainId = null) {
  const addr = address.toString('hex').toLowerCase().replace('0x', '')
  const prefix = chainId != null ? chainId.toString() + '0x' : ''
  var ret = '0x'
  const h = hash('keccak256').update(Buffer.from(prefix + addr, 'ascii')).digest('hex')

  for (var i = 0; i < addr.length; i++) {
    if (parseInt(h[i], 16) >= 8) {
      ret += addr[i].toUpperCase()
    } else {
      ret += addr[i]
    }
  }

  return ret
}
