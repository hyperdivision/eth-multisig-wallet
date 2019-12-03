/* global artifacts, contract, it, web3, assert, BigInt */

const Deposit = artifacts.require('Deposit')
const DepositFactory = artifacts.require('DepositFactory')

const crypto = require('crypto')
const depositAddress = require('../../lib/deposit-address')
const cloneFactory = require('../../lib/clone-factory')

const EPSILON = BigInt(web3.utils.toWei('0.004', 'ether'))

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const instance = await Deposit.new()
    const factory = await DepositFactory.new(instance.address)

    var salt = '0x' + crypto.randomBytes(32).toString('hex')

    const code = cloneFactory(instance.address)
    const forwardAddr = depositAddress(factory.address, code, salt)

    const initialBalance = await web3.eth.getBalance(await instance.owner.call())
    assert(await web3.eth.getBalance(instance.address) === '0', 'initial instance balance')

    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.owner.call(), value: web3.utils.toWei('0.5', 'ether') })

    await factory.create(await instance.owner.call(), salt)
    const specificInstance = await Deposit.at(forwardAddr)
    assert(await web3.eth.getBalance(specificInstance.address) === web3.utils.toWei('0.5', 'ether'), 'clone balance before sweep')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance before sweep')
    assert((BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.owner.call())) - BigInt(web3.utils.toWei('0.5', 'ether'))) < EPSILON, 'account balance before sweep')

    await specificInstance.sweep()
    assert(await web3.eth.getBalance(specificInstance.address) === '0', 'clone balance after sweep')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance after sweep')
    assert(BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.owner.call())) < EPSILON, 'account balance after sweep')
  })
})
