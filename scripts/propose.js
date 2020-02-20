const QuorumOwner = require('../lib/quorum-owners-api')
const PullWithdrawable = require('../lib/pull-withdrawable-api')

const quorumOwnerAddr = '0xaf0ac5bb351d50ab360e08108c62c3cbaaaddfab'
const seq = 0

const walletAddr = '0x67fd04cf3558796d8a20b3396765b040cac70bb3'

console.log(JSON.stringify(QuorumOwner.setQuorumExternalPropose(
  quorumOwnerAddr,
  seq,
  [walletAddr, 'updateWithdrawals', PullWithdrawable.typeSignatures.updateWithdrawals],
  1
)))
