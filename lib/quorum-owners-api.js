const assert = require('nanoassert')
const quorumCalc = require('./quorum-calc')
const abi = require('./abi')
const signData = require('./wallet-sign')
const codehash = require('./codehash')

const { abi: QuorumOwnerABI, bytecode: QuorumOwnerByteCode, deployedBytecode: QuorumOwnerDeployedByteCode } = require('../build/contracts/QuorumOwners.json')

class QuorumOwner {
  static abi = QuorumOwnerABI
  static byteCode = Buffer.from(QuorumOwnerByteCode.slice(2), 'hex')
  static codehash = codehash(QuorumOwnerDeployedByteCode)
  static typeSignatures = {
    constructor: ['address[]', 'uint32', 'uint32', 'uint32', 'uint32'],
    setQuorum: ['bytes[]', 'bytes', 'uint32'],
    addOwner: ['bytes[]','address'],
    removeOwner: ['bytes[]','address'],
    replaceOwner: ['bytes[]','address', 'address'],
    execute: ['bytes[]','address', 'bytes4', 'uint256', 'uint256', 'bytes'],
    executeType: ['bytes[]', 'address', 'bytes4', 'uint256', 'uint256', 'bytes'],
    seq: [],
    allOwners: [],
    // inherited
    isOwner: ['address'],
    quorum: ['bytes'],
    verify: ['bytes', 'bytes'],
    isOwner: ['address'],
    owners: ['uint256']

  }

  constructor (address) {
    this.address = address
  }

  // Methods
  async setQuorum (web3, ...args) {
    const seq = QuorumOwner.seqDecode(await web3.eth.call({ to: this.address, data: QuorumOwner.seqEncode() }))
    console.log(seq)
    return QuorumOwner.setQuorum(this.address, seq, ...args)
  }

  async setQuorumExternal (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.setQuorumExternal(this.address, seq, ...args)
  }

  async setQuorumType (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.setQuorumType(this.address, seq, ...args)
  }

  async addOwner (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.addOwner(this.address, seq, ...args)
  }

  async removeOwner (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.removeOwner(this.address, seq, ...args)
  }

  async replaceOwner (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.replaceOwner(this.address, seq, ...args)
  }

  async execute (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.execute(this.address, seq, ...args)
  }

  async executeType (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwner.executeType(this.address, seq, ...args)
  }

  async combine (web3, proposal, signatures) {
    return QuorumOwner.combine(await this.owners(), proposal, signatures)
  }

  // Signatures

  static sign (proposal, keys) {
    return {
      address: keys.address,
      signature: signData(
        keys,
        proposal.seq,
        proposal.contractAddress,
        proposal.method,
        proposal.signature,
        proposal.args)
    }
  }

  static signExecute (proposal, keys) {
    return {
      address: keys.address,
      signature: signData(
        keys,
        proposal.seq,
        proposal.contractAddress,
        abi.solidityPack(['string', 'address', 'bytes4'], [proposal.method, proposal.args[0], proposal.args[1]]),
        proposal.signature.slice(2),
        proposal.args.slice(2))
    }
  }

  static combine (owners, proposal, signatures) {
    var res = []
    for (var i = 0; i < owners.length; i++) {
      var owner = signatures.find(s => s.address.toLowerCase() === owners[i].toLowerCase())
      if (owner == null) throw new Error('Unknown owner')

      res.push(owner.signature)
    }

    return {
      method: proposal.method,
      args: [
        res,
        ...proposal.args
      ]
    }
  }

  // Proposals

  static setQuorumPropose (contractAddress, seq, method, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(typeof method === 'string', 'method must be string')

    quorum = quorumCalc(quorum)
    var method = abi.encodeLocal(contractAddress, Buffer.from(method))

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum.slice(1),
      args: [
        method,
        quorum
      ]
    }
  }

  static setQuorumExternalPropose (contractAddress, seq, methodExternal, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(Array.isArray(methodExternal), 'methodExternal must be array ')

    quorum = quorumCalc(quorum)
    var method = abi.encodeMethodExternal(contractAddress, ...methodExternal)

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum.slice(1),
      args: [
        method,
        quorum
      ]
    }
  }

  static setQuorumTypePropose (contractAddress, seq, methodType, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(Array.isArray(methodType), 'methodType must be array')

    quorum = quorumCalc(quorum)
    var method = abi.encodeMethodType(contractAddress, ...methodType)

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum.slice(1),
      args: [
        method,
        quorum
      ]
    }
  }

  static addOwnerPropose (contractAddress, seq, owner) {
    return {
      seq,
      contractAddress,
      method: 'addOwner',
      signature: this.typeSignatures.addOwner.slice(1),
      args: [
        owner
      ]
    }
  }

  static removeOwnerPropose (contractAddress, seq, owner) {
    return {
      seq,
      contractAddress,
      method: 'removeOwner',
      signature: this.typeSignatures.removeOwner.slice(1),
      args: [
        owner
      ]
    }
  }

  static replaceOwnerPropose (contractAddress, seq, oldOwner, newOwner) {
    return {
      seq,
      contractAddress,
      method: 'replaceOwner',
      signature: this.typeSignatures.replaceOwner.slice(1),
      args: [
        oldOwner,
        newOwner
      ]
    }
  }

  static executePropose (contractAddress, seq, destination, method, signature, args, value = 0, gas = 21000) {
    return {
      seq,
      contractAddress,
      method: 'execute',
      signature: this.typeSignatures.execute.slice(1),
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        gas,
        abi.rawEncode(signature, args)
      ]
    }
  }

  static executeTypePropose (contractAddress, seq, destination, method, signature, args, value = 0, gas = 21000) {
    return {
      seq,
      contractAddress,
      method: 'executeType',
      signature: this.typeSignatures.execute.slice(1),
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        gas,
        abi.rawEncode(signature, args)
      ]
    }
  }

  // Encoding

  static QUORUM_PRECISION = 0xffffffff

  static setQuorumEncode (signatures, operation, minQuroum) {
    return abi.encodeMethod(
      'setQuorum',
      QuorumOwner.typeSignatures.setQuorum,
      [signatures, operation, minQuroum]
    )
  }

  static addOwnerEncode (signatures, owner) {
    return abi.encodeMethod(
      'addOwner',
      QuorumOwner.typeSignatures.addOwner,
      [signatures, owner]
    )
  }

  static removeOwnerEncode (signatures, owner) {
    return abi.encodeMethod(
      'removeOwner',
      QuorumOwner.typeSignatures.removeOwner,
      [signatures, owner]
    )
  }

  static replaceOwnerEncode (signatures, oldOwner, newOwner) {
    return abi.encodeMethod(
      'replaceOwner',
      QuorumOwner.typeSignatures.replaceOwner,
      [signatures, oldOwner, newOwner]
    )
  }

  static executeEncode (signatures, destination, dstMethod, dstValue, dstGas, dstData) {
    return abi.encodeMethod(
      'execute',
      QuorumOwner.typeSignatures.execute,
      [signatures, destination, dstMethod, dstValue, dstGas, dstData]
    )
  }

  static executeTypeEncode (signatures, destination, dstMethod, dstValue, dstGas, dstData) {
    return abi.encodeMethod(
      'executeType',
      QuorumOwner.typeSignatures.executeType,
      [signatures, destination, dstMethod, dstValue, dstGas, dstData]
    )
  }

  static seqEncode () {
    return abi.encodeMethod(
      'seq',
      QuorumOwner.typeSignatures.seq,
      []
    )
  }

  static seqDecode (str) {
    return abi.decodeOutput(['uint256'], str)
  }

  static allOwnersEncode () {
    return abi.encodeMethod(
      'allOwners',
      QuorumOwner.typeSignatures.allOwners,
      []
    )
  }

  static allOwnersDecode (str) {
    return abi.decodeOutput(['address[]'], str)
  }

  static isOwnerEncode (address) {
    return abi.encodeMethod(
      'isOwner',
      QuorumOwner.typeSignatures.isOwner,
      [address]
    )
  }

  static isOwnerDecode (str) {
    return abi.decodeOutput(['bool'], str)
  }

  static quorumEncode (operation) {
    return abi.encodeMethod(
      'quorum',
      QuorumOwner.typeSignatures.quorum,
      [operation]
    )
  }

  static setQuorumProposeOperationEncode (contractAddress, method) {
    return abi.encodeLocal(contractAddress, method)
  }
  static setQuorumExternalProposeOperationEncode (contractAddress, methodExternal) {
    return abi.encodeMethodExternal(contractAddress, ...methodExternal)
  }
  static setQuorumTypeProposeOperationEncode (contractAddress, methodType) {
    return abi.encodeMethodType(contractAddress, ...methodType)
  }

  static quorumDecode (str) {
    return abi.decodeOutput(['uint32'], str)
  }

  static verifyEncode (signature, data) {
    return abi.encodeMethod(
      'verify',
      QuorumOwner.typeSignatures.verify,
      [signature, data]
    )
  }

  static verifyDecode (str) {
    return abi.decodeOutput(['address'], str)
  }

  static quorumCalc (float) {
    return quorumCalc(float)
  }

  static constructorEncode (
    initialOwners,
    setQuorumQuorum = 1,
    addOwnerQuorum = 1,
    removeOwnerQuorum = 1,
    replaceOwnerQuorum = 1
  ) {
    assert(0 < setQuorumQuorum && setQuorumQuorum <= 1, 'setQuorumQuorum must be number between (0, 1]')
    assert(0 < addOwnerQuorum && addOwnerQuorum <= 1, 'addOwnerQuorum must be number between (0, 1]')
    assert(0 < removeOwnerQuorum && removeOwnerQuorum <= 1, 'removeOwnerQuorum must be number between (0, 1]')
    assert(0 < replaceOwnerQuorum && replaceOwnerQuorum <= 1, 'replaceOwnerQuorum must be number between (0, 1]')

    return abi.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [
        initialOwners,
        quorumCalc(setQuorumQuorum),
        quorumCalc(addOwnerQuorum),
        quorumCalc(removeOwnerQuorum),
        quorumCalc(replaceOwnerQuorum)
      ]
    )
  }
}

module.exports = QuorumOwner
