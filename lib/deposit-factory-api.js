const crypto = require('crypto')
const assert = require('nanoassert')
const abi = require('./abi')
const codehash = require('./codehash')
const depositAddress = require('./deposit-address')
const cloneFactory = require('./clone-factory')

const { abi: DepositFactoryABI, bytecode: DepositFactoryByteCode, deployedBytecode: DepositFactoryDeployedByteCode } = require('../build/contracts/DepositFactory.json')

class DepositFactory {
  static abi = DepositFactoryABI
  static byteCode = Buffer.from(DepositFactoryByteCode.slice(2), 'hex')
  static codehash = codehash(DepositFactoryDeployedByteCode)
  static typeSignatures = {
    constructor: ['address'],
    create: ['address', 'address', 'uint256'],
  }

  constructor (address) {
    this.address = address
  }

  // Helpers

  static generateAddress (factoryAddress, templateAddress, salt) {
    if (salt == null) salt = crypto.randomBytes(32)
    const address = depositAddress(
      factoryAddress,
      cloneFactory(templateAddress),
      salt
    )

    return { salt: salt.toString('hex'), address: address.toString('hex') }
  }

  // Methods

  static trustedOwnerEncode () {
    return abi.encodeMethod('trustedOwner', [], [])
  }

  static trustedOwnerDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static createEncode (trustedOwner, recipient, salt) {
    return abi.encodeMethod('create', DepositFactory.typeSignatures.create, [trustedOwner, recipient, salt])
  }

  static createDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static constructorEncode (template) {
    return abi.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [template]
    )
  }
}

module.exports = DepositFactory
