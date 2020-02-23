const Nanoeth = require('nanoeth/metamask')
const QuorumOwners = require('../lib/quorum-owners-api')
const PullWithdrawable = require('../lib/pull-withdrawable-api')
const Deposit = require('../lib/deposit-api')
const DepositFactory = require('../lib/deposit-factory-api')
const keygen = require('../lib/keygen')
const abi = require('ethereumjs-abi')

const eth = new Nanoeth()

const pk1 = '24297bd1c4b628ab2517d85a1bb2962cd8e9d361a8624d11da88bd5bf364b713'
const pk2 = '76001c70164e86f5a8832fbf52e14194ec90e67e0cec1ea4d505f863660d638b'

;(async () => {
  const user = (await eth.accounts())[0]

  const quorumOwnerAddr = localStorage.getItem('QuorumOwner ' + QuorumOwners.codehash)
  const pullWithdrawableAddr = localStorage.getItem('PullWithdrawable ' + PullWithdrawable.codehash)
  if (quorumOwnerAddr == null) return console.error('Deploy QuorumOwner')
  if (pullWithdrawableAddr == null) return console.error('Deploy PullWithdrawable')

  const [seq] = QuorumOwners.seqDecode(await eth.call({
    to: quorumOwnerAddr,
    data: '0x' + QuorumOwners.seqEncode().toString('hex')
  }))

  const proposal = QuorumOwners.addOwnerPropose(
    quorumOwnerAddr,
    seq.toString('hex'),
    '0xd362289631900bbd43B111d5faD5d36eC581C51c'
  )

  const s1 = QuorumOwners.sign(proposal, keygen(Buffer.from(pk1, 'hex')))
  const s2 = QuorumOwners.sign(proposal, keygen(Buffer.from(pk2, 'hex')))

  const [owners] = QuorumOwners.allOwnersDecode(await eth.call({
    to: quorumOwnerAddr,
    data: '0x' + QuorumOwners.allOwnersEncode().toString('hex')
  }))

  const combined = QuorumOwners.combine(owners, proposal, [s2])

  console.log('0x' + QuorumOwners[combined.method + 'Encode'](...combined.args).toString('hex'))
  console.log(await sendTransaction({
    to: quorumOwnerAddr,
    from: user,
    gas: '700000',
    data: '0x' + QuorumOwners[combined.method + 'Encode'](...combined.args).toString('hex')
  }))
})()

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
