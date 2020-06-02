const hash = require('sha3-wasm').keccak256
const assert = require('nanoassert')

const prefix = Buffer.from([0xff])
module.exports = function (address, code, salt) {
  if (typeof address === 'string') address = Buffer.from(address.slice(2), 'hex')
  if (typeof code === 'string') code = Buffer.from(code.slice(2), 'hex')

  assert(Buffer.isBuffer(address), 'address must be Buffer')
  assert(address.byteLength === 20, 'address must be 20 bytes')
  assert(Buffer.isBuffer(code), 'code must be Buffer')
  assert(Buffer.isBuffer(salt), 'salt must be Buffer')
  assert(salt.length === 32, 'salt must be 32 bytes (uint256)')

  const codeHash = hash('keccak256').update(code).digest()

  return hash('keccak256')
    .update(prefix)
    .update(address)
    .update(salt)
    .update(codeHash)
    .digest()
    .slice(-20)
}
