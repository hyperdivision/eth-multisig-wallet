const QuorumOwner = require('../lib/quorum-owners-api')

const proposal = parse('')
const signatures = [
  parse(''),
  parse('')
]

const combined = QuorumOwner.combine(
  [
    '0xd362289631900bbd43B111d5faD5d36eC581C51c',
    '0xFCC2f839B01557b07624C36310741A8455eDc9C5'
  ],
  proposal,
  signatures
)

console.log('0x' + QuorumOwner[proposal.method + 'Encode'](...combined.args).toString('hex'))

function parse (json) {
  return JSON.parse(json, function (key, value) {
    if (value.type === 'Buffer') return Buffer.from(value.data)
    return value
  })
}
