const assert = require('nanoassert')
const quorumCalc = require('./quorum-calc')
const abi = require('ethereumjs-abi')
const abi2 = require('./abi')
const signData = require('./wallet-sign')
const codehash = require('./codehash')

const { abi: QuorumOwnerABI, bytecode: QuorumOwnerByteCode, deployedBytecode: QuorumOwnerDeployedByteCode } = require('../build/contracts/QuorumOwners.json')

class QuorumOwner {
  static abi = QuorumOwnerABI
  static byteCode = Buffer.from(QuorumOwnerByteCode.slice(2), 'hex')
  static codehash = codehash(QuorumOwnerDeployedByteCode)
  static typeSignatures = {
    constructor: ['address[]', 'uint32', 'uint32', 'uint32', 'uint32'],
    setQuorum: ['bytes', 'uint32'],
    addOwner: ['address'],
    removeOwner: ['address'],
    replaceOwner: ['address', 'address'],
    execute: ['address', 'bytes4', 'uint256', 'uint256', 'bytes'],
    executeType: ['address', 'bytes4', 'uint256', 'uint256', 'bytes']
  }

  constructor (web3, address) {
    this.address = address
    this._contract = new web3.eth.Contract(QuorumOwner.abi, address)
  }

  async setQuorum (...args) {
    const seq = await this.seq()
    return QuorumOwner.setQuorum(this.address, seq, ...args)
  }

  async setQuorumExternal (...args) {
    const seq = await this.seq()
    return QuorumOwner.setQuorumExternal(this.address, seq, ...args)
  }

  async setQuorumType (...args) {
    const seq = await this.seq()
    return QuorumOwner.setQuorumType(this.address, seq, ...args)
  }

  async addOwner (...args) {
    const seq = await this.seq()
    return QuorumOwner.addOwner(this.address, seq, ...args)
  }

  async removeOwner (...args) {
    const seq = await this.seq()
    return QuorumOwner.removeOwner(this.address, seq, ...args)
  }

  async replaceOwner (...args) {
    const seq = await this.seq()
    return QuorumOwner.replaceOwner(this.address, seq, ...args)
  }

  async execute (...args) {
    const seq = await this.seq()
    return QuorumOwner.execute(this.address, seq, ...args)
  }

  async executeType (...args) {
    const seq = await this.seq()
    return QuorumOwner.executeType(this.address, seq, ...args)
  }

  async combine (proposal, signatures) {
    return QuorumOwner.combine(await this.owners(), proposal, signatures)
  }

  codehash (address) {
    return this._contract.methods.codehash(address)
  }

  codecopy (address) {
    return this._contract.methods.codecopy2(address)
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

  broadcast (call) {
    return this._contract.methods[call.method](...call.args)
  }

  async seq () {
    return parseInt(await this._contract.methods.seq().call())
  }

  async owners () {
    return this._contract.methods.allOwners().call()
  }

  static setQuorum (contractAddress, seq, method, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(typeof method === 'string', 'method must be string')

    quorum = quorumCalc(quorum)
    var method = encodeLocal(contractAddress, Buffer.from(method))

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum,
      args: [
        method,
        quorum
      ]
    }
  }

  static setQuorumExternal (contractAddress, seq, methodExternal, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(Array.isArray(methodExternal), 'methodExternal must be array ')

    quorum = quorumCalc(quorum)
    var method = encodeMethodExternal(contractAddress, ...methodExternal)

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum,
      args: [
        method,
        quorum
      ]
    }
  }

  static setQuorumType (contractAddress, seq, methodType, quorum) {
    assert(0 < quorum && quorum <= 1, 'quorum must be number between (0, 1]')
    assert(Array.isArray(methodType), 'methodType must be array')

    quorum = quorumCalc(quorum)
    var method = encodeMethodType(contractAddress, ...methodType)

    return {
      seq,
      contractAddress,
      method: 'setQuorum',
      signature: this.typeSignatures.setQuorum,
      args: [
        method,
        quorum
      ]
    }
  }

  static addOwner (contractAddress, seq, owner) {
    return {
      seq,
      contractAddress,
      method: 'addOwner',
      signature: this.typeSignatures.addOwner,
      args: [
        owner
      ]
    }
  }

  static removeOwner (contractAddress, seq, owner) {
    return {
      seq,
      contractAddress,
      method: 'removeOwner',
      signature: this.typeSignatures.removeOwner,
      args: [
        owner
      ]
    }
  }

  static replaceOwner (contractAddress, seq, oldOwner, newOwner) {
    return {
      seq,
      contractAddress,
      method: 'replaceOwner',
      signature: this.typeSignatures.replaceOwner,
      args: [
        oldOwner,
        newOwner
      ]
    }
  }

  static execute (contractAddress, seq, destination, method, signature, args, value = 0, gas = 21000) {
    return {
      seq,
      contractAddress,
      method: 'execute',
      signature: this.typeSignatures.execute,
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        gas,
        abi.rawEncode(signature, args)
      ]
    }
  }

  static executeType (contractAddress, seq, destination, method, signature, args, value = 0, gas = 21000) {
    return {
      seq,
      contractAddress,
      method: 'executeType',
      signature: this.typeSignatures.execute,
      args: [
        destination,
        abi.methodID(method, signature),
        value,
        gas,
        abi.rawEncode(signature, args)
      ]
    }
  }

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

  static create (
    initialOwners,
    setQuorumQuorum = quorumCalc(1),
    addOwnerQuorum = quorumCalc(1),
    removeOwnerQuorum = quorumCalc(1),
    replaceOwnerQuorum = quorumCalc(1)
  ) {
    return abi2.encodeConstructor(
      this.byteCode,
      this.typeSignatures.constructor,
      [
        initialOwners,
        setQuorumQuorum,
        addOwnerQuorum,
        removeOwnerQuorum,
        replaceOwnerQuorum
      ]
    )
  }
}

module.exports = QuorumOwner

function encodeLocal (contractAddress, method) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(typeof method === 'string', 'method must be string')

  return abi.solidityPack(
    ['address', 'string'],
    [contractAddress, method]
  )
}

function encodeMethodExternal (contractAddress, contract, method, signature) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(contractAddress.length === 42, 'contractAddress must be an ethereum address')
  assert(typeof contract === 'string', 'contract must be string')
  assert(contract.length === 66, 'contract must be 66 bytes (256 bit)')
  assert(typeof method === 'string', 'method must be string')
  assert(Array.isArray(signature), 'signature must be an array of solidity types')

  return abi.solidityPack(
    ['bytes', 'address', 'bytes4'],
    [encodeLocal(contractAddress, 'execute'), contract, abi.methodID(method, signature)]
  )
}

function encodeMethodType (contractAddress, codehash, method, signature) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(contractAddress.length === 42, 'contractAddress must be an ethereum address')
  assert(typeof codehash === 'string', 'codehash must be string')
  assert(codehash.length === 66, 'codehash must be 66 bytes (256 bit)')
  assert(typeof method === 'string', 'method must be string')
  assert(Array.isArray(signature), 'signature must be an array of solidity types')

  return abi.solidityPack(
    ['bytes', 'bytes32', 'bytes4'],
    [encodeLocal(contractAddress, 'executeType'), codehash, abi.methodID(method, signature)]
  )
}


// Combine
//  Check seq is still the same
//  Fetch owners array and sort accordingly



// Proposal:
//   Web3, contractAddress, addOwner(address)
// Sign:
//  Sign(seq, address, addOwner(address))
// ...
// Combine:
//  Web3, concat(Signs)
// Broadcast:
//  Web3


//
// const quorumOwner = new QuorumOwner(address)
//
// const proposal = await quorumOwner.addOwner(someAddress)
//
// const proposal = await quorumOwner.setQuorum('addOwner', 0.5)
//
// const proposal = await quorumOwner.setQuorum([someContract, method, typeSignature], 0.5)
//
// proposal.seq = 1
// proposal.contract = address
// proposal.operation = 'addOwner'
// proposal.signature = ['address']
// proposal.args = [someAddress]
//
// const signature = QuorumOwner.sign(proposal, key)
//
//
// const payload = quorumOwner.combine(signatures)
