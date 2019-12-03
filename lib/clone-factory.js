module.exports = function (target) {
  const code = Buffer.from('3d602d80600a3d3981f3363d3d373d3d3d363d7300000000000000000000000000000000000000005af43d82803e903d91602b57fd5bf3', 'hex')
  code.set(Buffer.from(target.replace(/^0x/, ''), 'hex'), 0x14)

  return code.toString('hex')
}
