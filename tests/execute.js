const test = require('tape-parity')
const signer = require('eth-sign')
const utils = require('eth-utils/utils')
const keygen = require('../lib/keygen.js')
const QuorumOwners = require('../lib/quorum-owners-api.js')
const DepositFactory = require('../lib/deposit-factory-api.js')
const Deposit = require('../lib/deposit-api.js')
const fs = require('fs')
const pMap = require('p-map-series')

test('execute external method: deposit address', async t => {
  const user = keygen()
  const eoa = keygen()
  const eoa2 = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode(
    [
      user.address.toLowerCase(),
      user2.address.toLowerCase()
    ], 1, 1, 1, 1
  )

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)
  const qo = new QuorumOwners(c.contractAddress, t.eth)

  const owners = await qo.owners()
  t.same(owners, [user, user2].map(a => a.address.toLowerCase()))

  const deposit = Deposit.constructorEncode(
    qo.address,
    eoa.address
  )

  const depositHash = await sendTx(t.eth, {
    from: eoa,
    data: deposit
  })

  const depositReceipt = await t.mined(depositHash)

  const depositFactory = DepositFactory.constructorEncode(
    depositReceipt.contractAddress,
    qo.address,
    eoa2.address
  )

  const factoryHash = await sendTx(t.eth, {
    from: eoa,
    data: depositFactory
  })

  const d = await t.mined(factoryHash)

  const setQuorumProposal = await qo.setQuorumExternal(
    [
      d.contractAddress,
      'create',
      DepositFactory.typeSignatures.create
    ],
    0.4
  )

  const extSig1 = QuorumOwners.sign(setQuorumProposal, user)
  const extSig2 = QuorumOwners.sign(setQuorumProposal, user2)
  const extCombined = await qo.combine(setQuorumProposal, [extSig1, extSig2])
  const extData = utils.format(QuorumOwners[setQuorumProposal.method + 'Encode'](...extCombined.args))

  const extHash = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: extData
  })

  await t.mined(extHash)

  const addr = DepositFactory.generateAddress(d.contractAddress, depositReceipt.contractAddress)
  const executeProposal = await qo.execute(d.contractAddress, 'create', DepositFactory.typeSignatures.create, [addr.salt])

  const sig1 = QuorumOwners.sign(executeProposal, user)
  const sig2 = QuorumOwners.sign(executeProposal, user2)

  await t.fund(addr.address, 1e18)

  const executeCombined = await qo.combine(executeProposal, [sig1, sig2])
  const execData = QuorumOwners.executeEncode(...executeCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: execData
  }, true)

  await t.mined(txHash3)

  t.equal(Number(await t.eth.getBalance(eoa2.address)), 1e18, 'balance sweeped')
  t.end()
})

test('execute external method: replace recipient', async t => {
  const user = keygen()
  const eoa = keygen()
  const recipient = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode(
    [
      user.address.toLowerCase(),
      user2.address.toLowerCase()
    ], 1, 1, 1, 1
  )

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)
  const qo = new QuorumOwners(c.contractAddress, t.eth)

  const owners = await qo.owners()
  t.same(owners, [user, user2].map(a => a.address.toLowerCase()))

  const deposit = Deposit.constructorEncode(
    qo.address,
    eoa.address
  )

  const depositHash = await sendTx(t.eth, {
    from: eoa,
    data: deposit
  })

  const depositReceipt = await t.mined(depositHash)

  const depositFactory = DepositFactory.constructorEncode(depositReceipt.contractAddress, qo.address, eoa.address)

  const factoryHash = await sendTx(t.eth, {
    from: eoa,
    data: depositFactory
  })

  const d = await t.mined(factoryHash)

  const factory = new DepositFactory(d.contractAddress, depositReceipt.contractAddress)

  await pMap(['create', 'replaceRecipient'], async method => {
    const params = factory.setQuorumParams(method)
    const proposal = await qo.setQuorumExternal(params, 0.4)

    const sigs = [user, user2].map(u => QuorumOwners.sign(proposal, u))
    const combined = await qo.combine(proposal, sigs)
    const data = utils.format(QuorumOwners[proposal.method + 'Encode'](...combined.args))

    const hash = await sendTx(t.eth, {
      from: eoa,
      to: c.contractAddress,
      data
    })

    await t.mined(hash)
  })

  const replaceParams = factory.executeParams('replaceRecipient', [[recipient.address]])
  const replaceProposal = await qo.execute(...replaceParams)
  const replaceSig = [user].map(u => QuorumOwners.sign(replaceProposal, u))
  const replaceCombined = await qo.combine(replaceProposal, replaceSig)
  const replaceData = QuorumOwners.executeEncode(...replaceCombined.args)

  const replaceHash = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: replaceData
  })

  await t.mined(replaceHash)

  const addr = factory.generateAddress()
  const genParams = factory.executeParams('create', [[addr.salt]])
  const genProposal = await qo.execute(...genParams)

  await t.fund(addr.address, 1e18)

  const sig = [user, user2].map(u => QuorumOwners.sign(genProposal, u))
  const genCombined = await qo.combine(genProposal, sig)
  const genData = QuorumOwners.executeEncode(...genCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: genData
  }, true)

  await t.mined(txHash3)

  t.equal(Number(await t.eth.getBalance(recipient.address)), 1e18, 'balance sweeped to new address')
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

  if (log) fs.writeFileSync('trace.json', JSON.stringify(await eth.rpc.request('trace_rawTransaction', [utils.format(tx.raw), ['trace', 'vmTrace', 'stateDiff']]), null, 2))

  return eth.sendRawTransaction(utils.format(tx.raw))
}
