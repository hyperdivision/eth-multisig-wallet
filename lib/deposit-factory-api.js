const crypto = require('crypto')
const assert = require('nanoassert')
const abi = require('./abi')
const codehash = require('./codehash')
const depositAddress = require('./deposit-address')
const cloneFactory = require('./clone-factory')
const toChecksumAddress = require('./checksum-address')

const { abi: DepositFactoryABI, bytecode: DepositFactoryByteCode, deployedBytecode: DepositFactoryDeployedByteCode } = require('../build/DepositFactory.json')

class DepositFactory {
  static abi = DepositFactoryABI
  static byteCode = Buffer.from(DepositFactoryByteCode.slice(2), 'hex')
  static codehash = codehash(DepositFactoryDeployedByteCode)
  static typeSignatures = {
    constructor: ['address', 'address', 'address'],
    replaceOwner: ['address'],
    replaceRecipient: ['address'],
    create: ['uint256']
  }

  constructor (address, template) {
    this.address = address
    this.template = template
  }

  setQuorumParams (method) {
    return [
      this.address,
      method,
      DepositFactory.typeSignatures[method],
    ]
  }

  executeParams (method, args) {
    return [
      this.address,
      method,
      DepositFactory.typeSignatures[method],
      ...args
    ]
  }

  generateAddress (salt) {
    return DepositFactory.generateAddress(this.address, this.template, salt)
  }

  // Helpers

  static generateAddress (factoryAddress, templateAddress, salt) {
    if (salt == null) salt = crypto.randomBytes(32)
    const address = depositAddress(
      factoryAddress,
      cloneFactory(templateAddress),
      salt
    )

    return { salt: '0x' + salt.toString('hex'), address: toChecksumAddress(address) }
  }

  // Methods

  static templateAddressEncode () {
    return abi.encodeMethod('templateAddress', [], [])
  }

  static templateAddressDecode (str) {
    return abi.decodeOutput(['address'], str)
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
    return abi.encodeMethod('replaceRecipient', DepositFactory.typeSignatures.replaceRecipient, [newRecipient])
  }

  static replaceOwnerEncode (trustedOwner) {
    return abi.encodeMethod('replaceOwner', DepositFactory.typeSignatures.replaceOwner, [trustedOwner])
  }

  static createEncode (salt) {
    return abi.encodeMethod('create', DepositFactory.typeSignatures.create, [salt])
  }

  static createDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static constructorEncode (template, trustedOwner, recipient) {
    return abi.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [template, trustedOwner, recipient]
    )
  }
}

module.exports = DepositFactory
