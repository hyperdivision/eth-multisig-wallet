const assert = require('nanoassert')
const abi = require('./abi')
const codehash = require('./codehash')

const { abi: PullWithdrawableABI, bytecode: PullWithdrawableByteCode, deployedBytecode: PullWithdrawableDeployedByteCode } = require('../build/contracts/PullWithdrawable.json')

class PullWithdrawable {
  static abi = PullWithdrawableABI
  static byteCode = Buffer.from(PullWithdrawableByteCode.slice(2), 'hex')
  static codehash = codehash(PullWithdrawableDeployedByteCode)
  static typeSignatures = {
    constructor: ['address'],
    replaceOwner: ['address'],
    updateWithdrawals: ['address[]', 'uint256[]'],
    updateWithdrawalsERC20: ['address[]', 'address[]', 'uint256[]'],
    getWithdrawalsBatch: ['address[]'],
    getWithdrawalsERC20Batch: ['address[]', 'address[]'],
    withdrawals: ['address'],
    withdraw: [
      [],
      ['uint256']
    ],
    withdrawFrom: [
      null,
      ['address'],
      ['address', 'uint256']
    ],
    withdrawERC20: [
      null,
      ['address']
      ['address', 'uint256']
    ],
    withdrawERC20From: [
      null,
      null,
      ['address', 'address'],
      ['address', 'address', 'uint256']
    ]
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

  static withdrawalsEncode (addr) {
    return abi.encodeMethod('withdrawals', this.typeSignatures.withdrawals, [addr])
  }

  static withdrawalsDecode (str) {
    return abi.decodeOutput(['uint256'], str)
  }

  static replaceOwnerEncode (trustedOwner) {
    return abi.encodeMethod('replaceOwner', this.typeSignatures.replaceOwner, [trustedOwner])
  }

  static updateWithdrawals (recipients, amounts) {
    return abi.encodeMethod(
      'updateWithdrawals',
      PullWithdrawable.typeSignatures.updateWithdrawals,
      [recipients, amounts]
    )
  }

  static updateWithdrawalsERC20 (erc20Addresses, recipients, amounts) {
    return abi.encodeMethod(
      'updateWithdrawals',
      PullWithdrawable.typeSignatures.updateWithdrawalsERC20,
      [erc20Addresses, recipients, amounts]
    )
  }

  static getWithdrawalsBatchEncode (recipients) {
    return abi.encodeMethod(
      'getWithdrawalsBatchEncode',
      PullWithdrawable.typeSignatures.getWithdrawalsBatch,
      [recipients])
  }

  static getWithdrawalsBatchDecode (str) {
    return abi.decodeOutput(['uint256[]'], str)
  }

  static getWithdrawalsBatchERC20Encode (erc20Addresses, recipients) {
    return abi.encodeMethod(
      'getWithdrawalsBatchEncode',
      PullWithdrawable.typeSignatures.getWithdrawalsBatchERC20,
      [erc20Addresses, recipients])
  }

  static getWithdrawalsBatchERC20Decode (str) {
    return abi.decodeOutput(['uint256[]'], str)
  }

  static withdrawEncode (...args) {
    return abi.encodeMethod(
      'withdraw',
      PullWithdrawable.typeSignatures.withdraw[args.length],
      args
    )
  }

  static withdrawFromEncode (...args) {
    return abi.encodeMethod(
      'withdrawFrom',
      PullWithdrawable.typeSignatures.withdrawFrom[args.length],
      args
    )
  }

  static withdrawERC20Encode (...args) {
    return abi.encodeMethod(
      'withdrawERC20',
      PullWithdrawable.typeSignatures.withdrawERC20[args.length],
      args
    )
  }

  static withdrawERC20FromEncode (...args) {
    return abi.encodeMethod(
      'withdrawERC20From',
      PullWithdrawable.typeSignatures.withdrawERC20From[args.length],
      args
    )
  }

  static constructorEncode (trustedOwner) {
    return abi.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [
        trustedOwner
      ]
    )
  }
}

module.exports = PullWithdrawable
