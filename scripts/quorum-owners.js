const Nanoeth = require('nanoeth/metamask')
const QuorumOwners = require('../lib/quorum-owners-api')
const PullWithdrawable = require('../lib/pull-withdrawable-api')
const Deposit = require('../lib/deposit-api')
const DepositFactory = require('../lib/deposit-factory-api')
const keygen = require('../lib/keygen')

const eth = new Nanoeth()

const pk1 = Buffer.from('24297bd1c4b628ab2517d85a1bb2962cd8e9d361a8624d11da88bd5bf364b713', 'hex')
const pk2 = Buffer.from('76001c70164e86f5a8832fbf52e14194ec90e67e0cec1ea4d505f863660d638b', 'hex')

;(async () => {
  const user = (await eth.accounts())[0]

  const quorumOwnerAddr = await deploy(user)
  const walletAddr = await deployWallet(quorumOwnerAddr, user)

  await sendTransaction({
    from: user,
    to: walletAddr,
    data: format(PullWithdrawable.withdrawEncode())
  })

  return

  const t0 = await seq(quorumOwnerAddr)
  // const p0 = QuorumOwners.setQuorumExternalPropose(quorumOwnerAddr, t0,
  //   [walletAddr,
  //   'updateWithdrawals',
  //   PullWithdrawable.typeSignatures.updateWithdrawals], 1)
  const p0 = QuorumOwners.executePropose(quorumOwnerAddr, t0,
    walletAddr,
    'updateWithdrawals',
    PullWithdrawable.typeSignatures.updateWithdrawals,
    [['0x49FA51BF4388B239fc5cb7929eA1d7BB6B18F9b5'], ['10000000000000000']])

  const s0 = [
    QuorumOwners.sign(p0, keygen(pk1)),
    QuorumOwners.sign(p0, keygen(pk2))
  ]

  const c0 = QuorumOwners.combine(await owners(quorumOwnerAddr), p0, s0)

  await sendTransaction({
    from: user,
    to: quorumOwnerAddr,
    data: format(QuorumOwners[p0.method + 'Encode'](...c0.args))
  })
})()

async function deploy (user) {
  const key = 'QuorumOwners ' + QuorumOwners.codehash
  var addr = localStorage.getItem(key)
  if (addr) return addr

  const quorumOwnerTx = await sendTransaction({
    from: user,
    data: format(QuorumOwners.constructorEncode([
      '0xd362289631900bbd43B111d5faD5d36eC581C51c'
    ]))
  })

  addr = quorumOwnerTx.contractAddress
  localStorage.setItem(key, addr)
  return addr
}

async function deployWallet (quorumOwner, user) {
  const key = 'PullWithdrawable ' + PullWithdrawable.codehash
  var addr = localStorage.getItem(key)
  if (addr) return addr

  const tx = await sendTransaction({
    from: user,
    data: format(PullWithdrawable.constructorEncode([
      quorumOwner
    ]))
  })

  addr = tx.contractAddress
  localStorage.setItem(key, addr)
  return addr
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
  console.log('0x' + buf.toString('hex'))
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
