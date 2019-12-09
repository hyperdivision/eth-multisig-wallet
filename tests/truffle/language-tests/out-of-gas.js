const OutOfGas = artifacts.require('test/OutOfGas')

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
