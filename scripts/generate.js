const Nanoeth = require('nanoeth/metamask')
const QuorumOwners = require('../lib/quorum-owners-api')
const PullWithdrawable = require('../lib/pull-withdrawable-api')
const Deposit = require('../lib/deposit-api')
const DepositFactory = require('../lib/deposit-factory-api')

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

  var owner = contract('QuorumOwner ' + QuorumOwners.codehash, user, async function (user) {
    const quorumOwnerTx = await sendTransaction({
      from: user,
      data: '0x' + QuorumOwners.constructorEncode([
        '0xd362289631900bbd43B111d5faD5d36eC581C51c',
        '0xFCC2f839B01557b07624C36310741A8455eDc9C5'
      ]).toString('hex')
    })

    return quorumOwnerTx.contractAddress
  })

  var wallet = contract('PullWithdrawable ' + PullWithdrawable.codehash, user, async function (user) {
    const walletTx = await sendTransaction({
      from: user,
      data: '0x' + PullWithdrawable.constructorEncode(
        owner.querySelector('input').value
      ).toString('hex')
    })

    return walletTx.contractAddress
  })

  var deposit = contract('Deposit ' + Deposit.codehash, user, async function (user) {
    const depositTx = await sendTransaction({
      from: user,
      data: '0x' + Deposit.constructorEncode(
        owner.querySelector('input').value,
        wallet.querySelector('input').value
      ).toString('hex')
    })

    return depositTx.contractAddress
  })

  var depositFactory = contract('DepositFactory ' + DepositFactory.codehash, user, async function (user) {
    const depositFactoryTx = await sendTransaction({
      from: user,
      data: '0x' + DepositFactory.constructorEncode(
        deposit.querySelector('input').value
      ).toString('hex')
    })

    return depositFactoryTx.contractAddress
  })

  var depositFactoryDeploy = contract('depositFactoryDeploy', user, async function (user) {
    var addr = await sendTransaction({
      from: user,
      to: depositFactory.querySelector('input').value,
      data: '0x' + DepositFactory.createEncode(
        owner.querySelector('input').value,
        wallet.querySelector('input').value,
        '0x' + window.prompt('Salt')
      ).toString('hex')
    })
    console.log(addr)
    return addr
  })

  document.body.appendChild(owner)
  document.body.appendChild(wallet)
  document.body.appendChild(deposit)
  document.body.appendChild(depositFactory)
  document.body.appendChild(depositFactoryDeploy)

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
