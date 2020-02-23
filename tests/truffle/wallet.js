/* global artifacts, contract, it, assert */
const QuorumOwner = artifacts.require('QuorumOwner')

const keygen = require('../../lib/keygen')
const quorum = require('../../lib/quorum-calc')
const signCall = require('../../lib/wallet-sign')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const keypair = keygen()
    const keypair2 = keygen()

    const instance = await QuorumOwner.new([toAddress(keypair.address)], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))

    assert(await instance.isOwner.call(toAddress(keypair.address)) === true)
    assert(await instance.isOwner.call(toAddress(keypair2.address)) === false)

    await instance.addOwner([
      signCall(
        await instance.seq.call(),
        instance.address,
        keypair,
        'addOwner',
        ['address'],
        [toAddress(keypair2.address)]
      )
    ], toAddress(keypair2.address))

    assert((await instance.seq.call()).toNumber() === 1)
    assert(await instance.isOwner.call(toAddress(keypair.address)) === true)
    assert(await instance.isOwner.call(toAddress(keypair2.address)) === true)

    await instance.setQuorum([
      signCall(
        await instance.seq.call(),
        instance.address,
        keypair,
        'setQuorum',
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      ),
      signCall(
        await instance.seq.call(),
        instance.address,
        keypair2,
        'setQuorum',
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      )
    ], 'updateWithdrawals', quorum(0.5))
  })
})

function toAddress (buf) {
  return '0x' + buf.toString('hex')
}
