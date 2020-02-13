/* global artifacts, contract, it */
const Inspect = artifacts.require('tests/Inspect')

contract('FunctionCalldata', async accounts => {
  it('simple', async () => {
    const inst = await Inspect.new()

    console.log(await inst.hash(inst.address))
    console.log(await inst.hash(accounts[0]))
    console.log(await inst.hash('0x0000000000000000000001000000000000000000'))
  })
})
