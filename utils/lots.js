/**
 * 64 签：上上 8、上 16、中 24、下 10、下下 6；文案见 lots-data.js
 *
 * 等第按「签诗 + 释义」整体语气与常见卦象吉凶对齐，不再用 lotId 连续区间硬切，
 * 避免出现「讼、否、剥」等偏警示文案却标上上/上之类错位。
 * 下标与 lots-data 一致（周易六十四卦序）。
 */
const RAW_LOTS = require('./lots-data.js')

const TIER_NAMES = ['上上', '上', '中', '下', '下下']

/** 与 RAW_LOTS[i] 一一对应；分布固定为 8 / 16 / 24 / 10 / 6 */
const TIERS_BY_LOT_ID = [
  '上上',
  '上上',
  '中',
  '上',
  '上',
  '下',
  '中',
  '上',
  '中',
  '上',
  '上上',
  '下下',
  '上上',
  '上上',
  '上上',
  '上',
  '上',
  '下',
  '上',
  '中',
  '下',
  '中',
  '下下',
  '上',
  '下',
  '上',
  '中',
  '下',
  '下下',
  '中',
  '上',
  '上',
  '中',
  '中',
  '上上',
  '下下',
  '上',
  '中',
  '下',
  '上',
  '中',
  '上',
  '中',
  '中',
  '上上',
  '下下',
  '中',
  '中',
  '上',
  '下',
  '中',
  '中',
  '下下',
  '中',
  '下',
  '中',
  '中',
  '中',
  '中',
  '中',
  '上',
  '下',
  '下',
  '中'
]

function tierForId(id) {
  const i = Math.max(0, Math.min(63, id | 0))
  return TIERS_BY_LOT_ID[i] || '中'
}

const _TIER_COUNT = { 上上: 0, 上: 0, 中: 0, 下: 0, 下下: 0 }
TIERS_BY_LOT_ID.forEach((t) => {
  _TIER_COUNT[t] = (_TIER_COUNT[t] || 0) + 1
})
if (
  TIERS_BY_LOT_ID.length !== 64 ||
  _TIER_COUNT['上上'] !== 8 ||
  _TIER_COUNT['上'] !== 16 ||
  _TIER_COUNT['中'] !== 24 ||
  _TIER_COUNT['下'] !== 10 ||
  _TIER_COUNT['下下'] !== 6
) {
  throw new Error('lots.js: TIERS_BY_LOT_ID 须为 64 项且分布 8/16/24/10/6')
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

module.exports = { LOTS, getLotById, TIER_NAMES, tierForId, TIERS_BY_LOT_ID }
