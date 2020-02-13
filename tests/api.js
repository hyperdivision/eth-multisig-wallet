const QuorumOwner = require('../lib/api')
const Deposit = require('../lib/deposit-api')
const keygen = require('../lib/keygen')

module.exports = async (cb) => {
  try {
    const firstOwner = keygen(null, await web3.eth.getChainId())
    const user = (await web3.eth.getAccounts())[0]
    const dest = '0x0000000000000000000001000000000000000000'

    const deployOrg = QuorumOwner.deploy(web3, [
      firstOwner.address.toLowerCase()
    ])

    const c = await deployOrg.send({
      from: user,
      gasLimit: 1e7
    })

    const deployDepo = Deposit.deploy(web3, c.options.address, dest)

    const d = await deployDepo.send({
      from: user,
      gasLimit: 1e7
    })

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.options.address))
    console.log('Deposit:', await web3.eth.getBalance(d.options.address))
    console.log('Dest:', await web3.eth.getBalance(dest))

    var q = new QuorumOwner(web3, c.options.address)
    var dd = new Deposit(web3, d.options.address)

    await web3.eth.sendTransaction({ to: dd.address, from: user, value: web3.utils.toWei('0.5', 'ether') })
    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.options.address))
    console.log('Deposit:', await web3.eth.getBalance(d.options.address))
    console.log('Dest:', await web3.eth.getBalance(dest))

    // const proposal = await q.addOwner('0xd362289631900bbd43B111d5faD5d36eC581C51c')
    const proposal = await q.setQuorumType([Deposit.codehash, 'sweep', Deposit.typeSignatures.sweep], 0.5)
    console.log(proposal)
    const s1 = QuorumOwner.sign(proposal, firstOwner)
    const tx = await q.combine(proposal, [s1])
    console.log(await q.broadcast(tx).send({
      from: user,
      gasLimit: 1e7
    }))
    console.log(await q.owners())
    console.log(await q.seq())

    const proposalWrapped = await q.executeType(dd.address, 'sweep', Deposit.typeSignatures.sweep, [])
    console.log('from eth', await q.debug(dd.address, 'sweep', Deposit.typeSignatures.sweep, []).call())
    const s3 = QuorumOwner.signExecute(proposalWrapped, firstOwner)
    const tx3 = await q.combine(proposalWrapped, [s3])
    console.log(await q.broadcast(tx3).send({
      from: user,
      gasLimit: 1e7
    }))
    console.log(await q.owners())
    console.log(await q.seq())

    console.log('User:', await web3.eth.getBalance(user))
    console.log('QuorumOwner:', await web3.eth.getBalance(c.options.address))
    console.log('Deposit:', await web3.eth.getBalance(d.options.address))
    console.log('Dest:', await web3.eth.getBalance(dest))

    cb()
  } catch (ex) {
    cb(ex)
  }
}
