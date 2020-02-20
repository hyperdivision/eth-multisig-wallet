const QuorumOwner = require('../lib/quorum-owners-api')
const keygen = require('../lib/keygen')

const proposalJson = ''
const privateKey = ''

console.log(JSON.stringify(QuorumOwner.sign(
  JSON.parse(proposalJson, function (key, value) {
    if (value.type === 'Buffer') return Buffer.from(value.data)
    return value
  }),
  keygen(Buffer.from(privateKey, 'hex'))
)))
