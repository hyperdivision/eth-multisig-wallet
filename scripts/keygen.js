#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const eff = require('eff-diceware-passphrase')
const sodium = require('sodium-native')
const toChecksumAddress = require('../lib/checksum-address')
const keygen = require('../lib/keygen')

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
let words
try {
  fs.accessSync(privateKeyPath)
  console.error('Cowardly refusing to overwrite private key. Will print corresponding public key and address instead')
  privKey = fs.readFileSync(privateKeyPath)
} catch (_) {
  words = eff.entropy(256)
  privKey = hashPass(words.join(' '))
}

// get the public key in a compressed format
const { publicKey: pubKey, address } = keygen(privKey)

fs.writeFileSync(privateKeyPath, privKey)

if (words) console.log('Words: ', words.join(' '))
if (args.print) console.log('Private key: ', privKey.toString('hex'))
console.log('Public key:', pubKey.toString('hex'))
console.log('Address:', toChecksumAddress(address.toString('hex')))

function hashPass (passphrase) {
  const key = sodium.sodium_malloc(32)
  const password = Buffer.from(passphrase)
  const salt = Buffer.alloc(sodium.crypto_pwhash_SALTBYTES, 0xdb)
  const opslimit = sodium.crypto_pwhash_OPSLIMIT_MODERATE
  const memlimit = sodium.crypto_pwhash_MEMLIMIT_MODERATE
  const algorithm = sodium.crypto_pwhash_ALG_DEFAULT
  sodium.crypto_pwhash(key, password, salt, opslimit, memlimit, algorithm)

  return key
}
