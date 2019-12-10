/* global artifacts, contract, it, web3, assert, BigInt */

const Deposit = artifacts.require('Deposit')
const DepositFactory = artifacts.require('DepositFactory')
const GoodERC20 = artifacts.require('tests/GoodERC20')
const BadERC20 = artifacts.require('tests/BadERC20')
const GasMiningERC20 = artifacts.require('tests/GasMiningERC20')

const crypto = require('crypto')
const depositAddress = require('../../lib/deposit-address')
const cloneFactory = require('../../lib/clone-factory')

const EPSILON = BigInt(web3.utils.toWei('0.004', 'ether'))

contract('2nd Auth test', async accounts => {
  it('naive', async () => {
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    const initialBalance = await web3.eth.getBalance(await instance.trustedOwner.call())
    assert(await web3.eth.getBalance(instance.address) === '0', 'initial instance balance')

    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.5', 'ether') })

    await factory.create(await instance.trustedOwner.call(), salt)
    const specificInstance = await Deposit.at(forwardAddr)
    assert(await web3.eth.getBalance(specificInstance.address) === web3.utils.toWei('0.5', 'ether'), 'clone balance before sweep')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance before sweep')
    assert((BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.trustedOwner.call())) - BigInt(web3.utils.toWei('0.5', 'ether'))) < EPSILON, 'account balance before sweep')

    await specificInstance.sweep()
    assert(await web3.eth.getBalance(specificInstance.address) === '0', 'clone balance after sweep')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance after sweep')
    assert(BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.trustedOwner.call())) < EPSILON, 'account balance after sweep')
  })

  it('naive, deploy first', async () => {
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    const initialBalance = await web3.eth.getBalance(await instance.trustedOwner.call())
    assert(await web3.eth.getBalance(instance.address) === '0', 'initial instance balance')

    await factory.create(await instance.trustedOwner.call(), salt)
    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.5', 'ether') })

    const specificInstance = await Deposit.at(forwardAddr)
    assert(await web3.eth.getBalance(specificInstance.address) === '0', 'clone balance')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance')
    assert(BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.trustedOwner.call())) < EPSILON, 'account balance after sweep')
  })

  it('naive, deposit, deploy, sweep', async () => {
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    const initialBalance = await web3.eth.getBalance(await instance.trustedOwner.call())
    assert(await web3.eth.getBalance(instance.address) === '0', 'initial instance balance')

    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })
    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })
    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })
    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })
    await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })

    await factory.create(await instance.trustedOwner.call(), salt)

    for (let i = 0; i < 10; i++) {
      await web3.eth.sendTransaction({ to: forwardAddr, from: await instance.trustedOwner.call(), value: web3.utils.toWei('0.05', 'ether') })
    }

    const specificInstance = await Deposit.at(forwardAddr)

    await specificInstance.sweep()

    assert(await web3.eth.getBalance(specificInstance.address) === '0', 'clone balance')
    assert(await web3.eth.getBalance(instance.address) === '0', 'instance balance')
    assert(BigInt(initialBalance) - BigInt(await web3.eth.getBalance(await instance.trustedOwner.call())) < 15n * EPSILON, 'account balance after sweep')
  })

  it('test good erc20 sweep', async () => {
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    const erc20 = await GoodERC20.new()
    assert((await erc20.balanceOf(forwardAddr)).toString() === '0', 'initial erc20 balance')
    await erc20.transferFrom(erc20.address, forwardAddr, '1000')
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '0', 'transferred erc20 balance')

    await factory.create(await instance.trustedOwner.call(), salt)
    const specificInstance = await Deposit.at(forwardAddr)
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    await specificInstance.sweepERC20(erc20.address, '50000')
    assert((await erc20.balanceOf(forwardAddr)).toString() === '0', 'transferred erc20 balance')
    assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '1000', 'transferred erc20 balance')
  })

  it('test bad erc20 sweep', async () => {
    const erc20 = await BadERC20.new()
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    assert((await erc20.balanceOf(forwardAddr)).toString() === '0', 'initial erc20 balance')
    await erc20.transferFrom(erc20.address, forwardAddr, '1000')
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '0', 'transferred erc20 balance')

    await factory.create(await instance.trustedOwner.call(), salt)
    const specificInstance = await Deposit.at(forwardAddr)
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    try {
      await specificInstance.sweepERC20(erc20.address, '50000')
    } catch (ex) {
      assert(true, 'failed to execute')
      assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
      assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '0', 'transferred erc20 balance')
    }
  })

  it('test gas mining erc20 sweep', async () => {
    const erc20 = await GasMiningERC20.new()
    const instance = await Deposit.new(accounts[0])
    const factory = await DepositFactory.new(instance.address)

    var salt = crypto.randomBytes(32)

    const forwardAddr = toAddress(
      depositAddress(
        fromAddress(factory.address),
        cloneFactory(fromAddress(instance.address)),
        salt
      )
    )

    assert((await erc20.balanceOf(forwardAddr)).toString() === '0', 'initial erc20 balance')
    await erc20.transferFrom(erc20.address, forwardAddr, '1000')
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '0', 'transferred erc20 balance')

    await factory.create(await instance.trustedOwner.call(), salt)
    const specificInstance = await Deposit.at(forwardAddr)
    assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
    const initialBalance = await web3.eth.getBalance(accounts[0])

    try {
      console.log(await specificInstance.sweepERC20(erc20.address, '5000000'))
    } catch (ex) {
      assert(BigInt(initialBalance) - BigInt(await web3.eth.getBalance(accounts[0])) < BigInt(await web3.eth.getGasPrice()) * (5000000n + 42671n))
      assert(true, 'failed to execute')
      assert((await erc20.balanceOf(forwardAddr)).toString() === '1000', 'transferred erc20 balance')
      assert((await erc20.balanceOf(await instance.trustedOwner.call())).toString() === '0', 'transferred erc20 balance')
    }
  })
})

function toAddress (buf) {
  return '0x' + buf.toString('hex')
}

function fromAddress (str) {
  return Buffer.from(str.replace(/^0x/, ''), 'hex')
}
