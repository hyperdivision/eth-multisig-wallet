const Deposit = require('../lib/deposit-api')

console.log('0x' + Deposit.sweepEncode().toString('hex'))
