return
const ModifierCalldata = artifacts.require('test/ModifierCalldata')

contract('ModifierCalldata', async accounts => {
  it('simple', async () => {
    const inst = await ModifierCalldata.new()

    console.log(await inst.count([Buffer.from('hello'), Buffer.from('world')]))
  })
})
