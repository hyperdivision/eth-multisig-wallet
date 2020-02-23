const assert = require('nanoassert')
const abi = require('ethereumjs-abi')
const abi2 = require('web3-eth-abi')

const rawEncode = (t, a) => Buffer.from(abi2.encodeParameters(t, a).slice(2), 'hex')

module.exports = {
  encodeConstructor,
  encodeMethod,
  decodeOutput,
  encodeLocal,
  encodeMethodType,
  encodeMethodExternal,

  // Maybe something better
  solidityPack: abi.solidityPack,
  methodID: abi.methodID,
  rawEncode
}

function encodeConstructor (bytecode, signature, args) {
  return abi.solidityPack(['bytes', 'bytes'], [
    bytecode,
    rawEncode(signature, args)
  ])
}

function encodeMethod (method, signature, args) {
  return abi.solidityPack(['bytes4', 'bytes'], [
    abi.methodID(method, signature),
    rawEncode(signature, args)
  ])
}

function decodeOutput (signature, data) {
  const addrIdx = []
  const addrListIdx = []
  if (data[1] === 'x') data = Buffer.from(data.slice(2), 'hex')
  for (var i = 0; i < signature.length; i++) {
    if (signature[i] === 'address') {
      addrIdx.push(i)
    }

    if (signature[i] === 'address[]') {
      addrListIdx.push(i)
    }
  }

  const result = abi.rawDecode(signature, data)

  for (var j = 0; j < addrIdx.length; j++) {
    result[addrIdx[j]] = '0x' + result[addrIdx[j]]
  }

  for (var k = 0; k < addrListIdx.length; k++) {
    result[addrListIdx[k]] = result[addrListIdx[k]].map(a => '0x' + a)
  }

  return result
}

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
  assert(contract.length === 42, 'contract must be 42 bytes (160 bit)')
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
