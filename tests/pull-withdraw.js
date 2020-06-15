const test = require('tape-parity')
const signer = require('eth-sign')
const utils = require('eth-utils/utils')
const keygen = require('../lib/keygen.js')
const QuorumOwners = require('../lib/quorum-owners-api.js')
const DepositFactory = require('../lib/deposit-factory-api.js')
const PullWithdrawable = require('../lib/pull-withdrawable-api.js')
const Deposit = require('../lib/deposit-api.js')
const fs = require('fs')
const pMap = require('p-map-series')

test('withdrawals: update and withdraw', async t => {
  const user = keygen()
  const eoa = keygen()
  const withdraw = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)
  await t.fund(withdraw.address, 1e8)

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

  const withdrawData = PullWithdrawable.constructorEncode(qo.address)

  const walletReceipt = await mineTx(t, {
    from: eoa,
    data: withdrawData
  })

  const wallet = new PullWithdrawable(walletReceipt.contractAddress)
  await t.fund(wallet.address, 1e9)

  await pMap(['updateWithdrawals'], async method => {
    const params = wallet.setQuorumParams(method)
    const proposal = await qo.setQuorumExternal(params, 0.4)

    const sigs = [user, user2].map(u => QuorumOwners.sign(proposal, u))
    const data = await qo.combineData(proposal, sigs)

    const hash = await sendTx(t.eth, {
      from: eoa,
      to: c.contractAddress,
      data
    })

    await t.mined(hash)
  })

  const updateParams = wallet.executeParams('updateWithdrawals', [withdraw.address], [10n ** 9n])
  const updateProposal = await qo.execute(...updateParams)
  const sig = [user, user2].map(u => QuorumOwners.sign(updateProposal, u))
  const updateData = await qo.combineData(updateProposal, sig)

  const updateTx = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: updateData
  })

  await t.mined(updateTx)

  const [balance] = PullWithdrawable.withdrawalsDecode(await t.eth.call({
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawalsEncode(withdraw.address))
  }))

  const withdrawTx = await sendTx(t.eth, {
    from: withdraw,
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawEncode())
  }, true)

  await t.mined(withdrawTx)

  const [newBalance] = PullWithdrawable.withdrawalsDecode(await t.eth.call({
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawalsEncode(withdraw.address))
  }))

  t.equal(newBalance, 0n)
  t.ok(BigInt(await t.eth.getBalance(withdraw.address)) > balance)
  t.end()
})

test('withdrawals: deposit and withdraw', async t => {
  const user = keygen()
  const eoa = keygen()
  const withdraw = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)
  await t.fund(withdraw.address, 1e8)

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

  const withdrawData = PullWithdrawable.constructorEncode(qo.address)

  const walletReceipt = await mineTx(t, {
    from: eoa,
    data: withdrawData
  })

  const wallet = new PullWithdrawable(walletReceipt.contractAddress)
  await t.fund(wallet.address, 1e9)

  await pMap(['updateWithdrawals'], async method => {
    const params = wallet.setQuorumParams(method)
    const proposal = await qo.setQuorumExternal(params, 0.4)

    const sigs = [user, user2].map(u => QuorumOwners.sign(proposal, u))
    const data = await qo.combineData(proposal, sigs)

    const hash = await sendTx(t.eth, {
      from: eoa,
      to: c.contractAddress,
      data
    })

    await t.mined(hash)
  })

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
    wallet.address
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

  const extSig = [user, user2].map(u => QuorumOwners.sign(setQuorumProposal, u))
  const extData = await qo.combineData(setQuorumProposal, extSig)

  const extHash = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: extData
  })

  await t.mined(extHash)

  const addr = DepositFactory.generateAddress(d.contractAddress, depositReceipt.contractAddress)
  await t.fund(addr.address, 1e18)

  const executeProposal = await qo.execute(d.contractAddress, 'create', DepositFactory.typeSignatures.create, [addr.salt])
  const execSig = [user, user2].map(u => QuorumOwners.sign(executeProposal, u))
  const executeCombined = await qo.combine(executeProposal, execSig)
  const execData = QuorumOwners.executeEncode(...executeCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: execData
  }, true)

  await t.mined(txHash3)

  const updateParams = wallet.executeParams('updateWithdrawals', [withdraw.address], [1e18])
  const updateProposal = await qo.execute(...updateParams)
  const sig = [user, user2].map(u => QuorumOwners.sign(updateProposal, u))
  const updateData = await qo.combineData(updateProposal, sig)

  const updateTx = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: updateData
  })

  await t.mined(updateTx)

  const withdrawTx = await sendTx(t.eth, {
    from: withdraw,
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawEncode())
  }, true)
  await t.mined(withdrawTx)

  var [balance] = PullWithdrawable.withdrawalsDecode(await t.eth.call({
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawalsEncode(withdraw.address))
  }))

  t.equal(balance, 0n)
  t.ok(Number(await t.eth.getBalance(withdraw.address)) > 1e18)
  t.end()
})

test('withdrawals: withdrawFrom', async t => {
  const user = keygen()
  const eoa = keygen()
  const withdraw = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)
  await t.fund(withdraw.address, 1e8)

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

  const withdrawData = PullWithdrawable.constructorEncode(qo.address)

  const walletReceipt = await mineTx(t, {
    from: eoa,
    data: withdrawData
  })

  const wallet = new PullWithdrawable(walletReceipt.contractAddress)
  await t.fund(wallet.address, 1e9)

  await pMap(['updateWithdrawals'], async method => {
    const params = wallet.setQuorumParams(method)
    const proposal = await qo.setQuorumExternal(params, 0.4)

    const sigs = [user, user2].map(u => QuorumOwners.sign(proposal, u))
    const data = await qo.combineData(proposal, sigs)

    const hash = await sendTx(t.eth, {
      from: eoa,
      to: c.contractAddress,
      data
    })

    await t.mined(hash)
  })

  const updateParams = wallet.executeParams('updateWithdrawals', [withdraw.address], [10n ** 9n])
  const updateProposal = await qo.execute(...updateParams)
  const sig = [user, user2].map(u => QuorumOwners.sign(updateProposal, u))
  const updateData = await qo.combineData(updateProposal, sig)

  const updateTx = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: updateData
  })

  await t.mined(updateTx)

  const [balance] = PullWithdrawable.withdrawalsDecode(await t.eth.call({
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawalsEncode(withdraw.address))
  }))

  const withdrawTx = await sendTx(t.eth, {
    from: eoa,
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawFromEncode(withdraw.address))
  }, true)

  await t.mined(withdrawTx)

  const [newBalance] = PullWithdrawable.withdrawalsDecode(await t.eth.call({
    to: wallet.address,
    data: utils.format(PullWithdrawable.withdrawalsEncode(withdraw.address))
  }))

  t.equal(newBalance, 0n)
  t.ok(BigInt(await t.eth.getBalance(withdraw.address)) > balance)
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

async function mineTx (t, { from, to, value, data }, log = false) {
  const hash = await sendTx(t.eth, { from, to, value, data }, log)
  return t.mined(hash)
}
