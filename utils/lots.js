/**
 * 64 签：上上 8、上 16、中 24、下 10、下下 6；文案见 lots-data.js
 */

const RAW_LOTS = require('./lots-data.js')

const TIER_NAMES = ['上上', '上', '中', '下', '下下']
const TIER_RANGES = [
  [0, 8],
  [8, 24],
  [24, 48],
  [48, 58],
  [58, 64]
]

function tierForId(id) {
  for (let t = 0; t < TIER_RANGES.length; t++) {
    const [a, b] = TIER_RANGES[t]
    if (id >= a && id < b) return TIER_NAMES[t]
  }
  return '中'
}

function buildLots() {
  const lots = []
  for (let id = 0; id < 64; id++) {
    const raw = RAW_LOTS[id] || RAW_LOTS[0]
    const tier = tierForId(id)
    lots.push({
      id,
      tier,
      tierLabel: tier,
      title: raw.title,
      name: `${raw.title}·第${id + 1}签`,
      poem: raw.poem,
      interpret: raw.interpret
    })
  }
  return lots
}

const LOTS = buildLots()

function getLotById(id) {
  const i = Math.max(0, Math.min(63, id | 0))
  return LOTS[i]
}

module.exports = { LOTS, getLotById, TIER_NAMES }
