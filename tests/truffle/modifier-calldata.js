const ModifierCalldata = artifacts.require('test/ModifierCalldata')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const inst = await ModifierCalldata.new()

    console.log(await inst.count([Buffer.from('hello'), Buffer.from('world')]))
  })
})
