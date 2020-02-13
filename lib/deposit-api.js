const assert = require('nanoassert')
const quorumCalc = require('./quorum-calc')
const abi = require('ethereumjs-abi')
const signData = require('./wallet-sign')
const codehash = require('./codehash')

const { abi: DepositABI, bytecode: DepositByteCode, deployedBytecode: DepositDeployedByteCode } = require('../build/contracts/Deposit.json')

class Deposit {
  static abi = DepositABI
  static byteCode = DepositByteCode
  static codehash = codehash(DepositDeployedByteCode)
  static typeSignatures = {
    init: ['address', 'address'],
    replaceOwner: ['address'],
    replaceRecipient: ['address'],
    sweepERC20: ['address', 'uint256'],
    sweep: []
  }

  constructor (web3, address) {
    this.address = address
    this._contract = new web3.eth.Contract(Deposit.abi, address)
  }

  async trustedOwner () {
    return this._contract.methods.trustedOwner().call()
  }

  async recipient () {
    return this._contract.methods.recipient().call()
  }

  replaceOwner (newOwner) {
    return this._contract.methods.replaceOwner(newOwner)
  }

  replaceRecipient (newRecipient) {
    return this._contract.methods.replaceOwner(newRecipient)
  }

  sweepERC20 (erc20Address, gasLimit = 21000) {
    return this._contract.methods.sweepERC20(erc20Address, gasLimit)
  }

  sweep () {
    return this._contract.methods.sweep()
  }

  static deploy (web3, trustedOwner, recipient) {
    const contract = new web3.eth.Contract(this.abi)
    return contract.deploy({
      data: this.byteCode,
      arguments: [
        trustedOwner,
        recipient
      ]
    })
  }
}

module.exports = Deposit
