const Wallet = artifacts.require('Wallet')

const keygen = require('../../lib/keygen')
const quorum = require('../../lib/quorum-calc')
const signCall = require('../../lib/wallet-sign')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const keypair = keygen()
    const keypair2 = keygen()

    const instance = await Wallet.new([keypair.address], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))

    assert(await instance.isOwner.call(keypair.address) === true)
    assert(await instance.isOwner.call(keypair2.address) === false)

    await instance.addOwner([
      signCall(
        0, // seq,
        instance.address,
        keypair,
        'addOwner',
        ['address'],
        [keypair2.address]
      )
    ], keypair2.address)

    assert((await instance.seq.call()).toNumber() === 1)
    assert(await instance.isOwner.call(keypair.address) === true)
    assert(await instance.isOwner.call(keypair2.address) === true)

    await instance.setQuorum([
      signCall(
        1, // seq,
        instance.address,
        keypair,
        'setQuroum',
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      ),
      signCall(
        1, // seq,
        instance.address,
        keypair2,
        'setQuroum',
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      )
    ], 'updateWithdrawals', quorum(0.5))
  })
})
