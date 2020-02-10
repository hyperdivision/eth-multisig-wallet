#!/usr/bin/env node

const crypto = require('crypto')
const secp256k1 = require('secp256k1')
const hash = require('keccak')
const fs = require('fs')
const path = require('path')

function toChecksumAddress (address) {
  const addr = address.toString('hex')
  var ret = ''
  const h = hash('keccak256').update(address).digest('hex')

  for (var i = 0; i < addr.length; i++) {
    if (parseInt(h[i], 16) >= 8) {
      ret += addr[i].toUpperCase()
    } else {
      ret += addr[i]
    }
  }

  return ret
}

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    p: 'private-key',
    h: 'help'
  },
  boolean: ['help'],
  string: ['private-key']
})

if (args.help) {
  console.log(`Generate a new key pair

Usage:
  keygen --private-key=KEY_FILE > PUBLIC_KEY

Example:
  # Generate a new key pair, writing the public key to stdout
  # It is very important that this happens on the machine where the private key
  # will be stored. The private key is strictly confidential,
  # while the public key can be shared to a networked computer.
  # This command can be safely run multiple times, subsequent times it will
  # simply output the same public key
  keygen --private-key=main.key

Options:
  --help, -h          Display this message
  --private-key, -p   Path to write private key to
`)
  process.exit(0)
}

if (!args['private-key']) {
  console.error('--private-key is required and should be set to the path where the private-key should be saved')
  process.exit(1)
}

const privateKeyPath = path.resolve(process.cwd(), args['private-key'])
let privKey
try {
  fs.accessSync(privateKeyPath)
  console.error('Cowardly refusing to overwrite private key. Will print corresponding public key and address instead')
  privKey = fs.readFileSync(privateKeyPath)
} catch (_) {
  do {
    privKey = crypto.randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))
}

// get the public key in a compressed format
const pubKey = secp256k1.publicKeyCreate(privKey, false)

const digest = hash('keccak256').update(pubKey.slice(1)).digest()
const address = digest.slice(-20)

fs.writeFileSync(privateKeyPath, privKey)

console.log('Public key:', pubKey.toString('hex'))
console.log('Address:', '0x' + toChecksumAddress(address.toString('hex')))
