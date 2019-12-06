const OutOfGas = artifacts.require('test/OutOfGas')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const inst = await OutOfGas.new()

    console.log(await inst.seq.call())
    try {
      await inst.loop()
    } catch (e) { }
    console.log(await inst.seq.call())
  })
})
