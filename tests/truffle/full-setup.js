/* global artifacts, contract, it, web3, BigInt */

const Wallet = artifacts.require('Wallet')
const Deposit = artifacts.require('Deposit')
const DepositFactory = artifacts.require('DepositFactory')

const crypto = require('crypto')
const depositAddress = require('../../lib/deposit-address')
const cloneFactory = require('../../lib/clone-factory')

const keygen = require('../../lib/keygen')
const quorum = require('../../lib/quorum-calc')
const signCall = require('../../lib/wallet-sign')

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const keypairA = keygen()
    const keypairB = keygen()
    const keypairC = keygen()
    const user = accounts[0]

    const wallet = await Wallet.new([toAddress(keypairA.address)], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))
    const deposit = await Deposit.new(wallet.address)
    const depositFactory = await DepositFactory.new(deposit.address)

    console.log('User:', await web3.eth.getBalance(user))
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
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    // Deploy
    await depositFactory.create(await deposit.trustedOwner.call(), user1Salt)
    const userDeposit = await Deposit.at(userAddress)

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    await userDeposit.sweep()

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(userAddress), 'ether'))
    console.log('-----')

    await wallet.addOwner([
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairA,
        'addOwner',
        ['address'],
        [toAddress(keypairB.address)]
      )
    ], toAddress(keypairB.address))
    console.log('addOwner complete')

    await wallet.addOwner([
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairA,
        'addOwner',
        ['address'],
        [toAddress(keypairC.address)]
      ),
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairB,
        'addOwner',
        ['address'],
        [toAddress(keypairC.address)]
      )
    ], toAddress(keypairC.address))
    console.log('addOwner complete')

    await wallet.setQuorum([
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairA,
        'setQuorum',
        ['string', 'uint32'],
        ['updateWithdrawals', quorum(0.5)]
      )
    ], 'updateWithdrawals', quorum(0.5))
    console.log('setQuorum complete')

    await wallet.updateWithdrawals([
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairA,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [web3.utils.toWei('0.5', 'ether')]]
      )
    ], [user], [web3.utils.toWei('0.5', 'ether')])
    console.log('updateWithdrawals complete')

    await wallet.updateWithdrawals([
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairA,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[user], [subtract(web3.utils.toWei('-0.4', 'ether'))]]
      )
    ], [user], [subtract(web3.utils.toWei('-0.4', 'ether'))])
    console.log('updateWithdrawals complete')

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(user), 'ether'))
    console.log('-----')

    consoledir(await wallet.withdraw(web3.utils.toWei('0.1', 'ether')), { depth: null })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(user), 'ether'))
    console.log('-----')

    // consoledir(await wallet.withdraw(web3.utils.toWei('0.4', 'ether')), { depth: null })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('User withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(user), 'ether'))
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
