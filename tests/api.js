const QuorumOwner = require('../lib/api')
const Deposit = require('../lib/deposit-api')
const keygen = require('../lib/keygen')

module.exports = async (cb) => {
  try {
    const firstOwner = keygen(null, await web3.eth.getChainId())
    const user = (await web3.eth.getAccounts())[0]
    const dest = '0x0000000000000000000001000000000000000000'

    const deployOrg = QuorumOwner.create([
      firstOwner.address.toLowerCase()
    ])

    const c = await web3.eth.sendTransaction({
      from: user,
      gasLimit: 1e7,
      data: '0x' + deployOrg.toString('hex')
    })

    console.log(c.contractAddress)
    const deployDepo = Deposit.constructorEncode(c.contractAddress, dest)

    const d = await web3.eth.sendTransaction({
      from: user,
      data: '0x' + deployDepo.toString('hex'),
      gasLimit: 1e7
    })

    console.log(dest)
    console.log(await web3.eth.call({
      from: user,
      to: d.contractAddress,
      data: '0x' + Deposit.trustedOwnerEncode().toString('hex')
    }))

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.contractAddress))
    console.log('Deposit:', await web3.eth.getBalance(d.contractAddress))
    console.log('Dest:', await web3.eth.getBalance(dest))

    var q = new QuorumOwner(web3, c.contractAddress)
    var dd = new Deposit(d.contractAddress)

    await web3.eth.sendTransaction({ to: dd.address, from: user, value: web3.utils.toWei('0.5', 'ether') })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.contractAddress))
    console.log('Deposit:', await web3.eth.getBalance(dd.address))
    console.log('Dest:', await web3.eth.getBalance(dest))

    const proposal = await q.addOwner('0xd362289631900bbd43B111d5faD5d36eC581C51c')
    //const proposal = await q.addOwner([Deposit.codehash, 'replaceOwner', Deposit.typeSignatures.replaceOwner], 0.5)
    const s1 = QuorumOwner.sign(proposal, firstOwner)
    const tx = await q.combine(proposal, [s1])
    console.log('data', q.broadcast(tx).encodeABI())
    console.log(await q.broadcast(tx).send({
      from: user,
      gasLimit: 1e7
    }))
    console.log(await q.owners())
    console.log(await q.seq())

    const proposalWrapped = await q.executeType(dd.address, 'replaceOwner', Deposit.typeSignatures.replaceOwner, [dest])
    // console.log('from eth', await q.debug(dd.address, 'replaceOwner', Deposit.typeSignatures.replaceOwner, [dest]).call())
    const s3 = QuorumOwner.signExecute(proposalWrapped, firstOwner)
    const tx3 = await q.combine(proposalWrapped, [s3])
    console.log('data', await q.broadcast(tx3).data())
    console.log(await q.broadcast(tx3).send({
      from: user,
      gasLimit: 1e7
    }))
    console.log(await q.owners())
    console.log(await q.seq())

    console.log(dest)
    console.log(await web3.eth.call({
      from: user,
      to: dd.address,
      data: '0x' + Deposit.trustedOwner().toString('hex')
    }))

    const con = new web3.eth.Contract(Deposit.abi, dd.address)
    console.log(dest)
    console.log(await con.methods.trustedOwner().call())
    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.contractAddress))
    console.log('Deposit:', await web3.eth.getBalance(dd.address))
    console.log('Dest:', await web3.eth.getBalance(dest))

    cb()
  } catch (ex) {
    cb(ex)
  }
}
