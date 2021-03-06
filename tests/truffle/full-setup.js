/* global artifacts, contract, it, web3, BigInt */

const QuorumOwner = artifacts.require('QuorumOwner')
const Deposit = artifacts.require('Deposit')
const DepositFactory = artifacts.require('DepositFactory')
const PullWithdrawable = artifacts.require('PullWithdrawable')

const crypto = require('crypto')
const depositAddress = require('../../lib/deposit-address')
const cloneFactory = require('../../lib/clone-factory')

const keygen = require('../../lib/keygen')
const quorum = require('../../lib/quorum-calc')
const signCall = require('../../lib/wallet-sign')
const remoteSign = require('../../lib/remote-sign')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const keypairA = keygen()
    const keypairB = keygen()
    const keypairC = keygen()
    const user = accounts[0]

    const ownerOrg = await QuorumOwner.new([toAddress(keypairA.address)], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))
    const wallet = await PullWithdrawable.new(ownerOrg.address)
    const deposit = await Deposit.new(ownerOrg.address, wallet.address)
    const depositFactory = await DepositFactory.new(deposit.address)

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('-----')

    // User
    const user1Salt = crypto.randomBytes(32)
    const userAddress = toAddress(
      depositAddress(
        fromAddress(depositFactory.address),
        cloneFactory(fromAddress(deposit.address)),
        user1Salt
      )
    )

    // Fund
    await web3.eth.sendTransaction({ to: userAddress, from: user, value: web3.utils.toWei('0.5', 'ether') })

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    // Deploy
    await depositFactory.create(await deposit.trustedOwner.call(), await deposit.recipient.call(), user1Salt)
    const userDeposit = await Deposit.at(userAddress)

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    await userDeposit.sweep()

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await ownerOrg.withdrawals.call(userAddress), 'ether'))
    console.log('-----')

    await ownerOrg.addOwner([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        [ownerOrg.address, 'addOwner'],
        ['address'],
        [toAddress(keypairB.address)]
      )
    ], toAddress(keypairB.address))
    console.log('addOwner complete')

    await ownerOrg.addOwner([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        [ownerOrg.address, 'addOwner'],
        ['address'],
        [toAddress(keypairC.address)]
      ),
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairB,
        [ownerOrg.address, 'addOwner'],
        ['address'],
        [toAddress(keypairC.address)]
      )
    ], toAddress(keypairC.address))
    console.log('addOwner complete')

    await ownerOrg.setQuorum([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        [ownerOrg.address, 'setQuorum'],
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      ),
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairB,
        [ownerOrg.address, 'setQuorum'],
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      )
    ], 'updateWithdrawals', quorum(0.5))
    console.log('setQuorum complete')

    await ownerOrg.setQuorum([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        [ownerOrg.address, 'setQuorum'],
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      ),
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairB,
        [ownerOrg.address, 'setQuorum'],
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      )
    ], 'updateWithdrawals', quorum(0.5))

    await ownerOrg.updateWithdrawals([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [web3.utils.toWei('0.5', 'ether')]]
      ),
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairB,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [web3.utils.toWei('0.5', 'ether')]]
      )
    ], [user], [web3.utils.toWei('0.5', 'ether')])
    console.log('updateWithdrawals complete')

    await ownerOrg.updateWithdrawals([
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairA,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [subtract(web3.utils.toWei('-0.4', 'ether'))]]
      ),
      signCall(
        await ownerOrg.seq.call(), // seq,
        ownerOrg.address,
        keypairB,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [subtract(web3.utils.toWei('-0.4', 'ether'))]]
      )
    ], [user], [subtract(web3.utils.toWei('-0.4', 'ether'))])
    console.log('updateWithdrawals complete')

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await ownerOrg.withdrawals.call(user), 'ether'))
    console.log('-----')

    consoledir(await ownerOrg.withdraw(web3.utils.toWei('0.1', 'ether')), { depth: null })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await ownerOrg.withdrawals.call(user), 'ether'))
    console.log('-----')

    // consoledir(await ownerOrg.withdraw(web3.utils.toWei('0.4', 'ether')), { depth: null })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(ownerOrg.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await ownerOrg.withdrawals.call(user), 'ether'))
    console.log('-----')
  })
})

function toAddress (buf) {
  return '0x' + buf.toString('hex')
}

function fromAddress (str) {
  return Buffer.from(str.replace(/^0x/, ''), 'hex')
}

function subtract (n) {
  return BigInt.asUintN(256, n).toString()
}

function consoledir () {}
