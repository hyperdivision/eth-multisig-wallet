const abi = require('ethereumjs-abi')

module.exports = {
  encodeConstructor,
  encodeMethod,
  decodeOutput,

  // Maybe something better
  solidityPack: abi.solidityPack
}

function encodeConstructor (bytecode, signature, args) {
  return abi.solidityPack(['bytes', 'bytes'], [
    bytecode,
    abi.rawEncode(signature, args)
  ])
}

function encodeMethod (method, signature, args) {
  return abi.solidityPack(['bytes4', 'bytes'], [
    abi.methodID(method, signature),
    abi.rawEncode(signature, args)
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
