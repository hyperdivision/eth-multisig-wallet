const assert = require('nanoassert')

module.exports = function (targetAddress) {
  if (typeof targetAddress === 'string') targetAddress = Buffer.from(targetAddress.slice(2), 'hex')
  assert(Buffer.isBuffer(targetAddress), 'targetAddress must be Buffer')
  assert(targetAddress.byteLength === 20, 'targetAddress must be 20 bytes')

  const code = Buffer.from('3d602d80600a3d3981f3363d3d373d3d3d363d7300000000000000000000000000000000000000005af43d82803e903d91602b57fd5bf3', 'hex')
  code.set(targetAddress, 0x14)

  return code
}
