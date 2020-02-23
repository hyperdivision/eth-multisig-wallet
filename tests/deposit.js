const Deposit = require('../lib/deposit-api')

module.exports = async (cb) => {
  try {
    const user = (await web3.eth.getAccounts())[0]
    const dest = '0x0000000000000000000001000000000000000000'

    const deployDepo = Deposit.constructorEncode(user, dest)
    const d = await web3.eth.sendTransaction({
      from: user,
      gasLimit: 1e7,
      data: '0x' + deployDepo.toString('hex')
    })

    const addr = d.contractAddress

    const pkg = Deposit.trustedOwnerEncode()
    await web3.eth.call({
      to: addr,
      from: user,
      gasLimit: 1e7,
      data: '0x' + pkg.toString('hex')
    })

    console.log('recipient', await web3.eth.call({
      to: addr,
      from: user,
      gasLimit: 1e7,
      data: '0x' + Deposit.recipientEncode().toString('hex')
    }))

    console.log(await web3.eth.sendTransaction({
      to: addr,
      from: user,
      gasLimit: 1e7,
      data: '0x' + Deposit.replaceRecipientEncode(user).toString('hex')
    }))

    console.log(Deposit.recipientDecode(await web3.eth.call({
      to: addr,
      from: user,
      gasLimit: 1e7,
      data: '0x' + Deposit.recipientEncode().toString('hex')
    })))

    cb()
  } catch (ex) {
    cb(ex)
  }
}
