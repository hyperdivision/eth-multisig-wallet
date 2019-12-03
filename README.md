# `eth-multisig-wallet`

> Ethereum Multisig Wallet

## Usage

```js
const keygen = require('./lib/keygen')
const quorum = require('./lib/quroum-calc')
const signCall = require('./lib/wallet-sign')

const keypair = keygen()
const keypair2 = keygen()

const instance = await Wallet.new([keypair.address], quorum(0.5), quorum(0.5), quorum(0.5), quorum(0.5))

assert(await instance.isOwner.call(keypair.address) === true)
assert(await instance.isOwner.call(keypair2.address) === false)

const res = await instance.replaceOwner([
  signCall(
    0, // seq,
    instance.address,
    keypair,
    'replaceOwner',
    ['address', 'address'],
    [keypair.address, keypair2.address]
  )
], keypair.address, keypair2.address)

assert((await instance.seq.call()).toNumber() === 1)
assert(await instance.isOwner.call(keypair.address) === false)
assert(await instance.isOwner.call(keypair2.address) === true)
```

## API

### `contract Wallet(address[] initialOwners, uint32 setQuorumQuorum, uint32 addOwnerQuorum, uint32 removeOwnerQuorum, uint32 replaceOwnerQuorum)`

### `wallet.setQuorum(bytes[] signatures, string operation, uint32 minQuorum)`

### `wallet.addOwner(bytes[] signatures, address owner)`

### `wallet.removeOwner(bytes[] signatures, address owner)`

### `wallet.replaceOwner(bytes[] signatures, address oldOwner, address newOwner)`

## License

[ISC](LICENSE)
