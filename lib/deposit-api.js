const assert = require('nanoassert')
const abi = require('./abi')
const codehash = require('./codehash')

const { abi: DepositABI, bytecode: DepositByteCode, deployedBytecode: DepositDeployedByteCode } = require('../build/contracts/Deposit.json')

class Deposit {
  static abi = DepositABI
  static byteCode = Buffer.from(DepositByteCode.slice(2), 'hex')
  static codehash = codehash(DepositDeployedByteCode)
  static typeSignatures = {
    constructor: ['address', 'address'],
    init: ['address', 'address'],
    replaceOwner: ['address'],
    replaceRecipient: ['address'],
    sweepERC20: ['address', 'uint256'],
    sweep: []
  }

  constructor (address) {
    this.address = address
  }

  static trustedOwnerEncode () {
    return abi.encodeMethod('trustedOwner', [], [])
  }

  static trustedOwnerDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static recipientEncode () {
    return abi.encodeMethod('recipient', [], [])
  }

  static recipientDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static replaceRecipientEncode (newRecipient) {
    return abi.encodeMethod('replaceRecipient', Deposit.typeSignatures.replaceRecipient, [newRecipient])
  }

  static replaceOwnerEncode (trustedOwner) {
    return abi.encodeMethod('replaceOwner', Deposit.typeSignatures.replaceOwner, [trustedOwner])
  }

  static sweepERC20Encode (erc20Address, gasLimit = 21000) {
    return abi.encodeMethod('sweepERC20', Deposit.typeSignatures.sweepERC20, [erc20Address, gasLimit])
  }

  static sweepEncode () {
    return abi.encodeMethod('sweep', Deposit.typeSignatures.sweep, [])
  }

  static constructorEncode (trustedOwner, recipient) {
    return abi.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [trustedOwner, recipient]
    )
  }
}

module.exports = Deposit
