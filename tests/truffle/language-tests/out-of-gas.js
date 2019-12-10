/* global artifacts, contract, it, assert */

const OutOfGas = artifacts.require('language-tests/OutOfGas')

contract('OutOfGas', async accounts => {
  it('simple', async () => {
    const inst = await OutOfGas.new()

    assert((await inst.seq.call()).toString() === '0', 'Initial sequence is 0')
    try {
      await inst.loop()
    } catch (e) {
      assert(true, 'Did revert')
    }
    assert((await inst.seq.call()).toString() === '0', 'Revert sequence is 0')
  })
})
