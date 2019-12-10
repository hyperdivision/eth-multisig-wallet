return
const FunctionCalldata = artifacts.require('language-tests/FunctionCalldata')

contract('FunctionCalldata', async accounts => {
  it('simple', async () => {
    const inst = await FunctionCalldata.new()

    console.log(await inst.count([Buffer.from('hello'), Buffer.from('world')]))
  })
})
