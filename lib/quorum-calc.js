const assert = require('nanoassert')
module.exports = function (min) {
  assert(min >= 0, 'min must be at least 0')
  assert(min <= 1, 'min must be at most 1')
  return (0xffffffff * min >>> 0)
}
