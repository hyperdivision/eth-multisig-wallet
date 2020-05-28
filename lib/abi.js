const assert = require('nanoassert')
const abi = require('eth-serde').abi

const rawEncode = (t, a) => Buffer.from(abi2.encodeParameters(t, a).slice(2), 'hex')

module.exports = {
  encodeConstructor: abi.encodeConstructor,
  encodeMethod: abi.encodeMethod,
  decodeOutput: abi.decodeOutput,
  encodeLocal,
  encodeMethodType,
  encodeMethodExternal,

  // Maybe something better
  solidityPack: abi.raw.pack,
  methodID: abi.methodID,
  rawEncode
}

function encodeLocal (contractAddress, method) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(typeof method === 'string', 'method must be string')

  return abi.raw.pack(
    ['address', 'string'],
    [contractAddress, method]
  )
}

function encodeMethodExternal (contractAddress, contract, method, signature) {
  assert(typeof contractAddress === 'string', 'contractAddress must be string')
  assert(contractAddress.length === 42, 'contractAddress must be an ethereum address')
  assert(typeof contract === 'string', 'contract must be string')
  assert(contract.length === 42, 'contract must be 42 bytes (160 bit)')
  assert(typeof method === 'string', 'method must be string')
  assert(Array.isArray(signature), 'signature must be an array of solidity types')

  return abi.raw.pack(
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

  return abi.raw.pack(
    ['bytes', 'bytes32', 'bytes4'],
    [encodeLocal(contractAddress, 'executeType'), codehash, abi.methodID(method, signature)]
  )
}
