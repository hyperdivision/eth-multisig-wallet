const test = require('tape-parity')
const signer = require('eth-sign')
const keygen = require('../lib/keygen.js')
const QuorumOwners = require('../lib/quorum-owners-api.js')

test('basic', async t => {
  const keys = keygen()
  await t.fund(keys.address, 10000)

  t.equals(await t.eth.getBalance(keys.address), format(10000))
  t.end()
})

test('quorum owners', async t => {
  var count = 0
  const eoa = keygen()
  const user = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address.toLowerCase() ])
})

test('set new quorum owners', async t => {
  var count = 0
  const user = keygen()
  const eoa = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address.toLowerCase() ])

  const proposal = QuorumOwners.addOwnerPropose(c.contractAddress, 0, user2.address)
  const signedProposal = QuorumOwners.sign(proposal, user)
  const combined = QuorumOwners.combine(owners, proposal, [ signedProposal ])

  const data = QuorumOwners.addOwnerEncode(...combined.args)

  const txHash2 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: data
  })

  const c2 = await t.mined(txHash2)

  const [ newOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(newOwners, [ user.address.toLowerCase(), user2.address.toLowerCase() ])
})


test('remove old quorum owners', async t => {
  var count = 0
  const user = keygen()
  const eoa = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address.toLowerCase() ])

  const addProposal = QuorumOwners.addOwnerPropose(c.contractAddress, 0, user2.address)
  const signedProposal = QuorumOwners.sign(addProposal, user)
  const addCombined = QuorumOwners.combine(owners, addProposal, [ signedProposal ])

  const addData = QuorumOwners.addOwnerEncode(...addCombined.args)
  const txHash2 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: addData
  })

  const c2 = await t.mined(txHash2)

  const [ newOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(newOwners, [ user.address.toLowerCase(), user2.address.toLowerCase() ])  

  const removeProposal = QuorumOwners.removeOwnerPropose(c.contractAddress, 1, user.address)
  const sig = QuorumOwners.sign(removeProposal, user)
  const sig2 = QuorumOwners.sign(removeProposal, user2)
  const removeCombined = QuorumOwners.combine(newOwners, removeProposal, [ sig, sig2 ])

  const removeData = QuorumOwners.removeOwnerEncode(...removeCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: removeData
  })

  const c3 = await t.mined(txHash3)

  const [ finalOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(finalOwners, [ user2.address.toLowerCase() ])
})

test('remove and readd original quorum owner', async t => {
  var count = 0
  const user = keygen()
  const eoa = keygen()
  const user2 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address.toLowerCase() ])

  const addProposal = QuorumOwners.addOwnerPropose(c.contractAddress, count++, user2.address)
  const signedProposal = QuorumOwners.sign(addProposal, user)
  const addCombined = QuorumOwners.combine(owners, addProposal, [ signedProposal ])

  const addData = QuorumOwners.addOwnerEncode(...addCombined.args)
  const txHash2 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: addData
  })

  await t.mined(txHash2)

  const [ newOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(newOwners, [ user.address.toLowerCase(), user2.address.toLowerCase() ])  

  const removeProposal = QuorumOwners.removeOwnerPropose(c.contractAddress, count++, user.address)
  const sig = QuorumOwners.sign(removeProposal, user)
  const sig2 = QuorumOwners.sign(removeProposal, user2)
  const removeCombined = QuorumOwners.combine(newOwners, removeProposal, [ sig, sig2 ])

  const removeData = QuorumOwners.removeOwnerEncode(...removeCombined.args)
  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: removeData
  })

  await t.mined(txHash3)

  const [ finalOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(finalOwners, [ user2.address.toLowerCase() ])

  const readdProposal = QuorumOwners.addOwnerPropose(c.contractAddress, count++, user.address)
  const resignedProposal = QuorumOwners.sign(readdProposal, user2)
  const readdCombined = QuorumOwners.combine(finalOwners, readdProposal, [ resignedProposal ])

  const readdData = QuorumOwners.addOwnerEncode(...readdCombined.args)
  const txHash4 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: readdData
  }, true)

  await t.mined(txHash4)

  const [ readdOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(readdOwners, [ user2.address.toLowerCase(), user.address.toLowerCase() ])  

  t.end()
})

test('replace original quorum owner', async t => {
  var count = 0
  const eoa = keygen()

  const user = keygen()
  const user2 = keygen()
  const user3 = keygen()
  const user4 = keygen()
  const user5 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase(),
    user2.address.toLowerCase(),
    user3.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address, user2.address, user3.address ].map(a => a.toLowerCase()))

  const addProposal = QuorumOwners.addOwnerPropose(c.contractAddress, count++, user4.address)
  const sig1 = QuorumOwners.sign(addProposal, user)
  const sig2 = QuorumOwners.sign(addProposal, user2)
  const sig3 = QuorumOwners.sign(addProposal, user3)
  const addCombined = QuorumOwners.combine(owners, addProposal, [ sig1, sig2, sig3 ])

  const addData = QuorumOwners.addOwnerEncode(...addCombined.args)
  const txHash2 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: addData
  })

  await t.mined(txHash2)

  const [ newOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(newOwners, [ user.address, user2.address, user3.address, user4.address ].map(a => a.toLowerCase()))

  const replaceProposal = QuorumOwners.replaceOwnerPropose(c.contractAddress, count++, user4.address, user5.address)
  const replaceSig = QuorumOwners.sign(replaceProposal, user)
  const replaceSig2 = QuorumOwners.sign(replaceProposal, user2)
  const replaceSig3 = QuorumOwners.sign(replaceProposal, user3)
  const replaceSig4 = QuorumOwners.sign(replaceProposal, user4)
  const replaceCombined = QuorumOwners.combine(newOwners, replaceProposal, [ replaceSig, replaceSig2, replaceSig3, replaceSig4 ])

  const replaceData = QuorumOwners.replaceOwnerEncode(...replaceCombined.args)
  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: replaceData
  })

  const c2 = await t.mined(txHash3)

  const [ finalOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(finalOwners, [ user.address, user2.address, user3.address, user5.address ].map(a => a.toLowerCase()))
  t.end()
})

test.only('replace original quorum owner', async t => {
  var count = 0

  const eoa = keygen()
  const user = keygen()
  const user2 = keygen()
  const user3 = keygen()

  await t.fund(eoa.address, 1e18)

  const deployOrg = QuorumOwners.constructorEncode([
    user.address.toLowerCase(),
    user2.address.toLowerCase(),
    user3.address.toLowerCase()
  ])

  const txHash = await sendTx(t.eth, {
    from: eoa,
    data: deployOrg
  })

  const c = await t.mined(txHash)

  const [ owners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(owners, [ user.address, user2.address, user3.address ].map(a => a.toLowerCase()))

  const failProposal = QuorumOwners.removeOwnerPropose(c.contractAddress, count, user3.address)
  const sig1 = QuorumOwners.sign(failProposal, user)
  const sig2 = QuorumOwners.sign(failProposal, user2)
  const failCombined = QuorumOwners.combine(owners, failProposal, [ sig1, sig2 ])

  const failData = QuorumOwners.removeOwnerEncode(...failCombined.args)

  try {
    const failHash = await sendTx(t.eth, {
      from: eoa,
      to: c.contractAddress,
      data: failData
    })

    await t.mined(failHash)
    t.fail()
  } catch {
    t.pass('throws')
  }

  const quorumProposal = QuorumOwners.setQuorumPropose(c.contractAddress, count++, 'removeOwner', 0.65)
  const quorumSig = QuorumOwners.sign(quorumProposal, user)
  const quorumSig2 = QuorumOwners.sign(quorumProposal, user2)
  const quorumSig3 = QuorumOwners.sign(quorumProposal, user3)
  const quorumCombined = QuorumOwners.combine(owners, quorumProposal, [ quorumSig, quorumSig2, quorumSig3 ])

  const quorumData = QuorumOwners.setQuorumEncode(...quorumCombined.args)

  const txHash2 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: quorumData
  })

  const c2 = await t.mined(txHash2)

  const removeProposal = QuorumOwners.removeOwnerPropose(c.contractAddress, count, user3.address)
  const removeSig1 = QuorumOwners.sign(removeProposal, user)
  const removeSig2 = QuorumOwners.sign(removeProposal, user2)
  const removeCombined = QuorumOwners.combine(owners, removeProposal, [ removeSig1, removeSig2 ])

  const removeData = QuorumOwners.removeOwnerEncode(...removeCombined.args)

  const txHash3 = await sendTx(t.eth, {
    from: eoa,
    to: c.contractAddress,
    data: removeData
  })

  const [ finalOwners ] = QuorumOwners.allOwnersDecode(await t.eth.call({
    to: c.contractAddress,
    gasPrice: format(1),
    gas: format(1e6),
    data: format(QuorumOwners.allOwnersEncode())
  }))

  t.same(finalOwners, [ user.address, user2.address ].map(a => a.toLowerCase()))
  t.end()
})

function format (data) {
  if (data == null) return null
  if (typeof data === 'string') {
    if (data[1] === 'x') return data
    return '0x' + data
  }
  if (data instanceof Uint8Array) return '0x' + data.toString('hex')
  return '0x' + data.toString(16)
}

async function sendTx (eth, { from, to, value, data }, log = false) {
  const tx = signer.sign({
    from: format(from.address),
    gasPrice: format(1),
    gas: format(8e6),
    data: format(data),
    to: format(to),
    nonce: await eth.getTransactionCount(format(from.address), 'pending')
  }, from.privateKey)

  // if (log) console.error(JSON.stringify(await eth.rpc.request('trace_rawTransaction', [ format(tx.raw), [ 'trace', 'vmTrace', 'stateDiff' ] ]), null, 2))

  return eth.sendRawTransaction(format(tx.raw))
}

async function getSequence (eth, contractAddress) {
  return QuorumOwners.seqDecode(await eth.call({
    to: contractAddress,
    data: format(QuorumOwners.seqEncode())
  }))
}
