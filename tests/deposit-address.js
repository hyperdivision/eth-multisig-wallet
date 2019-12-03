const test = require('tape')
const depositAddress = require('../lib/deposit-address')

test('test vectors', function (assert) {
  console.log(depositAddress('0x0000000000000000000000000000000000000000', '0x00', '0x0000000000000000000000000000000000000000000000000000000000000000'))
  assert.end()
})
