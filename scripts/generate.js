const Nanoeth = require('nanoeth/metamask')
const { QuorumOwners, PullWithdrawable, Deposit, DepositFactory, keygen } = require('..')

const eth = new Nanoeth()

function contract (name, user, fn) {
  var container = document.createElement('div')
  var label = document.createElement('label')
  label.style.display = 'block'
  label.textContent = name

  var input = document.createElement('input')
  var button = document.createElement('button')
  button.textContent = 'Deploy'

  button.onclick = async function () {
    input.value = 'Pending'
    var addr = await fn(user)
    window.localStorage.setItem(name, addr)
    input.value = addr
  }

  var address = window.localStorage.getItem(name)

  input.value = address

  container.appendChild(label)
  container.appendChild(input)
  container.appendChild(button)

  return container
}

function method (name, user, fn) {
  var container = document.createElement('div')
  var label = document.createElement('label')
  label.style.display = 'block'
  label.textContent = name

  var input = document.createElement('input')
  var button = document.createElement('button')
  button.textContent = 'Run'

  button.onclick = async function () {
    button.disabled = true
    var i = input.value
    input.value = 'Pending'
    try {
      input.value = await fn(user, i)
    } catch (ex) {
      console.error(ex)
      input.value = 'Failed: ' + ex
    } finally {
      button.disabled = false
    }
  }

  container.appendChild(label)
  container.appendChild(input)
  container.appendChild(button)

  return container
}

async function seq (addr) {
  const [seq] = QuorumOwners.seqDecode(await eth.call({
    to: addr,
    data: format(QuorumOwners.seqEncode())
  }))

  return seq
}

async function owners (addr) {
  const [owners] = QuorumOwners.allOwnersDecode(await eth.call({
    to: addr,
    data: format(QuorumOwners.allOwnersEncode())
  }))

  return owners
}

function format (buf) {
  return '0x' + buf.toString('hex')
}

const wait = (x) => new Promise(resolve => setTimeout(resolve, x))
async function sendTransaction (opts) {
  const txHash = await eth.sendTransaction(opts)

  while (true) {
    await wait(500)
    var tx = await eth.getTransactionReceipt(txHash)
    if (tx != null) break
  }

  return tx
}

;(async () => {
  const user = (await eth.accounts())[0]

  var owner = contract('QuorumOwners ' + QuorumOwners.codehash, user, async function (user) {
    const quorumOwnerTx = await sendTransaction({
      from: user,
      data: format(QuorumOwners.constructorEncode([
        '0x8a619377EeB15CdE8c2E11Ee7DBFeB25430A0B67',
        '0x530b6d96fE8ED8B1e46b6D8c5847b300fEf624c9'
      ]))
    })

    return quorumOwnerTx.contractAddress
  })

  var wallet = contract('PullWithdrawable ' + PullWithdrawable.codehash, user, async function (user) {
    const walletTx = await sendTransaction({
      from: user,
      data: format(PullWithdrawable.constructorEncode(
        owner.querySelector('input').value
      ))
    })

    return walletTx.contractAddress
  })

  var deposit = contract('Deposit ' + Deposit.codehash, user, async function (user) {
    const depositTx = await sendTransaction({
      from: user,
      data: format(Deposit.constructorEncode(
        owner.querySelector('input').value,
        wallet.querySelector('input').value
      ))
    })

    return depositTx.contractAddress
  })

  var depositFactory = contract('DepositFactory ' + DepositFactory.codehash, user, async function (user) {
    const depositFactoryTx = await sendTransaction({
      from: user,
      data: format(DepositFactory.constructorEncode(
        deposit.querySelector('input').value,
        owner.querySelector('input').value,
        wallet.querySelector('input').value
      ))
    })

    return depositFactoryTx.contractAddress
  })

  var depositFactoryDeploy = contract('depositFactoryDeploy', user, async function (user) {
    var addr = await sendTransaction({
      from: user,
      to: depositFactory.querySelector('input').value,
      data: format(DepositFactory.createEncode(
        '0x' + window.prompt('Salt')
      ))
    })
    console.log(addr)
    return addr
  })

  var sweep = method('Sweep Deposit', user, async function (user, addr) {
    console.log(user, addr)
    await sendTransaction({
      from: user,
      to: addr,
      data: format(Deposit.sweepEncode())
    })
  })

  var sweep = method('Sweep Deposit', user, async function (user, addr) {
    console.log(user, addr)
    await sendTransaction({
      from: user,
      to: addr,
      data: format(Deposit.sweepEncode())
    })
  })

  var trustedOwner = method('Wallet trustedOwner', user, async function (user) {
    return PullWithdrawable.trustedOwnerDecode(await eth.call({
      to: wallet.querySelector('input').value,
      data: format(PullWithdrawable.trustedOwnerEncode())
    }))
  })

  var quorom = method('Quorum for updateWithdrawals', user, async function (user) {
    console.log(wallet.querySelector('input').value)
    return QuorumOwners.quorumDecode(await eth.call({
      to: wallet.querySelector('input').value,
      data: format(QuorumOwners.quorumEncode(
        QuorumOwners.setQuorumExternalProposeOperationEncode(
          wallet.querySelector('input').value,
          'updateWithdrawals',
          PullWithdrawable.typeSignatures.updateWithdrawals
        )
      ))
    }))
  })

  var setWithdrawQuroum = method('Set withdraw quorum', user, async function (user, quorum) {
    var q = parseFloat(quorum)

    const t0 = await seq(owner.querySelector('input').value)
    const p0 = QuorumOwners.setQuorumExternalPropose(
      owner.querySelector('input').value,
      t0,
      [
        wallet.querySelector('input').value,
        'updateWithdrawals',
        PullWithdrawable.typeSignatures.updateWithdrawals
      ],
      q
    )

    const s0 = [
      QuorumOwners.sign(p0, keygen(Buffer.from(prompt('pk1'), 'hex'))),
      QuorumOwners.sign(p0, keygen(Buffer.from(prompt('pk2'), 'hex')))
    ]

    const c0 = QuorumOwners.combine(await owners(owner.querySelector('input').value), p0, s0)

    await sendTransaction({
      from: user,
      to: owner.querySelector('input').value,
      data: format(QuorumOwners[p0.method + 'Encode'](...c0.args))
    })
  })

  var withdraw = method('Withdraw', user, async function (user, dest) {
    const balance = await eth.getBalance(wallet.querySelector('input').value)
    console.log(dest, balance)
    console.log([[dest], [BigInt(balance).toString()]])

    const t0 = await seq(owner.querySelector('input').value)
    const p0 = QuorumOwners.executePropose(
      owner.querySelector('input').value,
      t0,
      wallet.querySelector('input').value,
      'updateWithdrawals',
      PullWithdrawable.typeSignatures.updateWithdrawals,
      [[dest], [BigInt(balance).toString()]])

    const s0 = [
      QuorumOwners.sign(p0, keygen(Buffer.from(prompt('pk1'), 'hex'))),
      QuorumOwners.sign(p0, keygen(Buffer.from(prompt('pk2'), 'hex')))
    ]

    const c0 = QuorumOwners.combine(await owners(owner.querySelector('input').value), p0, s0)

    await sendTransaction({
      from: user,
      to: owner.querySelector('input').value,
      data: format(QuorumOwners[p0.method + 'Encode'](...c0.args))
    })
  })

  var checkWithdrawal = method('Check withdrawal', user, async function (user, addr) {
    return PullWithdrawable.withdrawalsDecode(await eth.call({
      to: wallet.querySelector('input').value,
      data: format(PullWithdrawable.withdrawalsEncode(addr))
    }))
  })

  var withdrawFrom = method('Pull withdrawal', user, async function (user) {
    await sendTransaction({
      from: user,
      to: wallet.querySelector('input').value,
      data: format(PullWithdrawable.withdrawEncode())
    })
  })

  document.body.appendChild(owner)
  document.body.appendChild(wallet)
  document.body.appendChild(deposit)
  document.body.appendChild(depositFactory)
  document.body.appendChild(depositFactoryDeploy)
  document.body.appendChild(sweep)
  document.body.appendChild(quorom)
  document.body.appendChild(trustedOwner)
  document.body.appendChild(setWithdrawQuroum)
  document.body.appendChild(withdraw)
  document.body.appendChild(checkWithdrawal)
  document.body.appendChild(withdrawFrom)

  var gen = document.createElement('button')
  gen.textContent = 'Generate address'

  gen.onclick = () => {
    console.log(DepositFactory.generateAddress(
      depositFactory.querySelector('input').value,
      deposit.querySelector('input').value)
    )
  }

  document.body.appendChild(gen)
})()
