return
const FunctionCalldata = artifacts.require('test/FunctionCalldata')

contract('FunctionCalldata', async accounts => {
  it('simple', async () => {
    const inst = await FunctionCalldata.new()

    console.log(await inst.count([Buffer.from('hello'), Buffer.from('world')]))
  })
})
