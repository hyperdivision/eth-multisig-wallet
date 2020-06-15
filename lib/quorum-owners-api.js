const assert = require('nanoassert')
const utils = require('eth-utils/utils')
const quorumCalc = require('./quorum-calc')
const abi = require('./abi')
const signData = require('./wallet-sign')
const codehash = require('./codehash')

const { abi: QuorumOwnerABI, bytecode: QuorumOwnerByteCode, deployedBytecode: QuorumOwnerDeployedByteCode } = require('../build/QuorumOwners.json')

class QuorumOwners {
  static abi = QuorumOwnerABI
  static byteCode = Buffer.from(QuorumOwnerByteCode.slice(2), 'hex')
  static codehash = codehash(QuorumOwnerDeployedByteCode)
  static typeSignatures = {
    constructor: ['address[]', 'uint32', 'uint32', 'uint32', 'uint32'],
    setQuorum: ['bytes[]', 'bytes', 'uint32'],
    addOwner: ['bytes[]','address'],
    removeOwner: ['bytes[]','address'],
    replaceOwner: ['bytes[]','address', 'address'],
    execute: ['bytes[]','address', 'bytes4', 'uint256', 'bytes'],
    executeType: ['bytes[]', 'address', 'bytes4', 'uint256', 'bytes'],
    seq: [],
    allOwners: [],
    // inherited
    isOwner: ['address'],
    quorum: ['bytes'],
    verify: ['bytes', 'bytes'],
    isOwner: ['address'],
    owners: ['uint256']

  }

  constructor (address, eth) {
    this.address = address
    this.eth = eth
  }

  // Methods
  async setQuorum (...args) {
    const seq = await this.seq()
    return QuorumOwners.setQuorumPropose(this.address, seq, ...args)
  }

  async setQuorumExternal (...args) {
    const seq = await this.seq()
    return QuorumOwners.setQuorumExternalPropose(this.address, seq, ...args)
  }

  async setQuorumType (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwners.setQuorumType(this.address, seq, ...args)
  }

  async addOwner (arg) {
    const seq = await this.seq()
    const proposal = QuorumOwners.addOwnerPropose(this.address, seq, arg)
    return proposal
  }

  async removeOwner (arg) {
    const seq = await this.seq()
    return QuorumOwners.removeOwnerPropose(this.address, seq, arg)
  }

  async replaceOwner (args) {
    const seq = await this.seq()
    return QuorumOwners.replaceOwnerPropose(this.address, seq, ...args)
  }

  async execute (...args) {
    const seq = await this.seq()
    return QuorumOwners.executePropose(this.address, seq, ...args)
  }

  async combineData (proposal, signatures) {
    const combined = await this.combine(proposal, signatures)
    return QuorumOwners[combined.method + 'Encode'](...combined.args)
  }

  async executeType (web3, ...args) {
    const seq = await this.seq()
    return QuorumOwners.executeType(this.address, seq, ...args)
  }

  async seq () {
    const [ sequence ] = QuorumOwners.seqDecode(await this.eth.call({
      to: this.address,
      data: utils.format(QuorumOwners.seqEncode())
    }))

    return sequence
  }

  async owners () {
    const [ owners ] = QuorumOwners.allOwnersDecode(await this.eth.call({
      to: this.address,
      gasPrice: utils.format(1),
      gas: utils.format(1e6),
      data: utils.format(QuorumOwners.allOwnersEncode())
    }))

    return owners
  }

  async combine (proposal, signatures) {
    const owners = await this.owners()
    return QuorumOwners.combine(owners, proposal, signatures)
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
    console.log(proposal)
    return {
      address: keys.address,
      signature: signData(
        keys,
        proposal.seq,
        proposal.contractAddress,
        utils.format(abi.solidityPack(['string', 'address', 'bytes4'], [proposal.method, proposal.args[0], proposal.args[1]])),
        proposal.signature.slice(2),
        proposal.args.slice(2))
    }
  }

  static combine (owners, proposal, signatures) {
    assert(owners.length >= signatures.length, 'Too many signatures')
    const res = []
    
    for (let i = 0; i < owners.length; i++) {
      const signature = signatures.find(s => owners[i].toLowerCase() === s.address.toLowerCase())
      if (signature == null) continue

      res.push(signature.signature)
    }

    assert(res.length === signatures.length, 'Duplicate signatures')

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
    var method = abi.encodeLocal(contractAddress, method)

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

  static executePropose (contractAddress, seq, destination, method, signature, args, value = 0) {
    return {
      seq,
      contractAddress,
      method: 'execute',
      signature: this.typeSignatures.execute.slice(1),
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        abi.raw.encode(signature, args)
      ]
    }
  }

  static executeTypePropose (contractAddress, seq, destination, method, signature, args, value = 0) {
    return {
      seq,
      contractAddress,
      method: 'executeType',
      signature: this.typeSignatures.execute.slice(1),
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        abi.rawEncode(signature, args)
      ]
    }
  }

  // Encoding

  static QUORUM_PRECISION = 0xffffffff

  static setQuorumEncode (signatures, operation, minQuroum) {
    return abi.encodeMethod(
      'setQuorum',
      QuorumOwners.typeSignatures.setQuorum,
      [signatures, operation, minQuroum]
    )
  }

  static addOwnerEncode (signatures, owner) {
    return abi.encodeMethod(
      'addOwner',
      QuorumOwners.typeSignatures.addOwner,
      [signatures, owner]
    )
  }

  static removeOwnerEncode (signatures, owner) {
    return abi.encodeMethod(
      'removeOwner',
      QuorumOwners.typeSignatures.removeOwner,
      [signatures, owner]
    )
  }

  static replaceOwnerEncode (signatures, oldOwner, newOwner) {
    return abi.encodeMethod(
      'replaceOwner',
      QuorumOwners.typeSignatures.replaceOwner,
      [signatures, oldOwner, newOwner]
    )
  }

  static executeEncode (signatures, destination, dstMethod, dstValue, dstData) {
    return abi.encodeMethod(
      'execute',
      QuorumOwners.typeSignatures.execute,
      [signatures, destination, dstMethod, dstValue, dstData]
    )
  }

  static executeTypeEncode (signatures, destination, dstMethod, dstValue, dstData) {
    return abi.encodeMethod(
      'executeType',
      QuorumOwners.typeSignatures.executeType,
      [signatures, destination, dstMethod, dstValue, dstData]
    )
  }

  static seqEncode () {
    return abi.encodeMethod(
      'seq',
      QuorumOwners.typeSignatures.seq,
      []
    )
  }

  static seqDecode (str) {
    return abi.decodeOutput(['uint256'], str)
  }

  static allOwnersEncode () {
    return abi.encodeMethod(
      'allOwners',
      QuorumOwners.typeSignatures.allOwners,
      []
    )
  }

  static allOwnersDecode (str) {
    return abi.decodeOutput(['address[]'], str)
  }

  static isOwnerEncode (address) {
    return abi.encodeMethod(
      'isOwner',
      QuorumOwners.typeSignatures.isOwner,
      [address]
    )
  }

  static isOwnerDecode (str) {
    return abi.decodeOutput(['bool'], str)
  }

  static quorumEncode (operation) {
    return abi.encodeMethod(
      'quorum',
      QuorumOwners.typeSignatures.quorum,
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
      QuorumOwners.typeSignatures.verify,
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

module.exports = QuorumOwners
