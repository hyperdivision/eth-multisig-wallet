/* global artifacts, contract, it, web3, BigInt */

const Wallet = artifacts.require('Wallet')
const Controller = artifacts.require('Controller')
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

    const controller = await Controller.new()
    const wallet = await Wallet.new([toAddress(keypairA.address)], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))
    const deposit = await Deposit.new(wallet.address)
    const depositFactory = await DepositFactory.new(deposit.address)

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
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

    // Fund controller
    await web3.eth.sendTransaction({ to: controller.address, from: user, value: web3.utils.toWei('0.5', 'ether') })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    // Fund wallet
    console.log(await controller.deposit(userAddress, web3.utils.toWei('0.3', 'ether')))

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    // Deploy
    await depositFactory.create(await deposit.trustedOwner.call(), user1Salt)
    const userDeposit = await Deposit.at(userAddress)

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('-----')

    await userDeposit.sweep()

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('Controller withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(controller.address), 'ether'))
    console.log('-----')

    console.log(await controller.deposit(userAddress, web3.utils.toWei('0.2', 'ether')))
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('Controller withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(controller.address), 'ether'))
    console.log('-----')

    console.log(await web3.eth.sendTransaction({ to: userAddress, from: user, value: web3.utils.toWei('0.5', 'ether') }))
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('Controller withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(controller.address), 'ether'))
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
      ),
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairB,
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
        [[controller.address], [web3.utils.toWei('0.2', 'ether')]]
      ),
      signCall(
        await wallet.seq.call(), // seq,
        wallet.address,
        keypairB,
        'updateWithdrawals',
        ['address[]', 'uint[]'],
        [[controller.address], [web3.utils.toWei('0.2', 'ether')]]
      )
    ], [controller.address], [web3.utils.toWei('0.2', 'ether')])
    console.log('updateWithdrawals complete')

    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('Controller withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(controller.address), 'ether'))
    console.log('-----')

    consoledir(await controller.withdraw(wallet.address), { depth: null })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('Controller:', await web3.eth.getBalance(controller.address))
    console.log('Wallet:', await web3.eth.getBalance(wallet.address))
    console.log('Deposit:', await web3.eth.getBalance(deposit.address))
    console.log('DepositFactory:', await web3.eth.getBalance(depositFactory.address))
    console.log('UserAddress:', await web3.eth.getBalance(userAddress))
    console.log('Controller withdrawal:', web3.utils.fromWei(await wallet.withdrawals.call(controller.address), 'ether'))
    console.log('-----')
  })
})

function toAddress (buf) {
  return '0x' + buf.toString('hex')
}

function fromAddress (str) {
  return Buffer.from(str.replace(/^0x/, ''), 'hex')
}

function consoledir () {}
