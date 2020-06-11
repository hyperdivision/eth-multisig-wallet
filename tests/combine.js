const test = require('tape-parity')
const signer = require('eth-sign')
const utils = require('eth-utils/utils')
const keygen = require('../lib/keygen.js')
const QuorumOwners = require('../lib/quorum-owners-api.js')

test('set new quorum owners', async t => {
  const user = keygen()
  const eoa = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode(
    [
      user.address.toLowerCase(),
      user2.address.toLowerCase()
    ], 1, 1, 0.4, 1
  )

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)
  const qo = new QuorumOwners(c.contractAddress, t.eth)

  const owners = await qo.owners()

  t.same(owners, [user, user2].map(a => a.address.toLowerCase()))

  const removeProposal = await qo.removeOwner(user.address)
  const sig2 = QuorumOwners.sign(removeProposal, user2)
  const removeCombined = await qo.combine(removeProposal, [sig2])

  const removeData = QuorumOwners.removeOwnerEncode(...removeCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: removeData
  })

  await t.mined(txHash3)

  const newOwners = await qo.owners()
  t.same(newOwners, [user2.address.toLowerCase()])
  t.end()
})

async function sendTx (eth, { from, to, value, data }, log = false) {
  const tx = signer.sign({
    from: utils.format(from.address),
    gasPrice: utils.format(1),
    gas: utils.format(8e6),
    data: utils.format(data),
    to: utils.format(to),
    nonce: await eth.getTransactionCount(utils.format(from.address), 'pending')
  }, from.privateKey)

  if (log) console.error(JSON.stringify(await eth.rpc.request('trace_rawTransaction', [utils.format(tx.raw), ['trace', 'vmTrace', 'stateDiff']]), null, 2))

  return eth.sendRawTransaction(utils.format(tx.raw))
}
