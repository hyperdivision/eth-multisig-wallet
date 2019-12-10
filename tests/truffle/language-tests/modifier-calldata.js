/* global artifacts, contract, it */
return
const ModifierCalldata = artifacts.require('language-tests/ModifierCalldata')

contract('ModifierCalldata', async accounts => {
  it('simple', async () => {
    const inst = await ModifierCalldata.new()

    console.log(await inst.count([Buffer.from('hello'), Buffer.from('world')]))
  })
})
