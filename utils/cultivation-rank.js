/**
 * 修行品阶系统：综合打卡、抽签、成就、自修等行为积分，映射为十级道号。
 */

const KEYS = require('./storage-keys.js')
const { getFirstUnlockListSorted, computeAchievements, loadHistoryRaw } = require('./lottery-history.js')
const { getCheckInSummary } = require('./checkin.js')

const RANKS = [
  { name: '初入道门', threshold: 0, level: 0 },
  { name: '记名弟子', threshold: 50, level: 1 },
  { name: '持戒居士', threshold: 120, level: 2 },
  { name: '内观修士', threshold: 220, level: 3 },
  { name: '清虚散人', threshold: 350, level: 4 },
  { name: '洞明真人', threshold: 500, level: 5 },
  { name: '紫府上仙', threshold: 700, level: 6 },
  { name: '太虚道尊', threshold: 1000, level: 7 },
  { name: '混元仙师', threshold: 1500, level: 8 },
  { name: '无极大道', threshold: 2500, level: 9 }
]

function computeRankScore() {
  let score = 0

  try {
    const checkinState = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
    score += (checkinState.totalDays || 0) * 3
  } catch (e) {}

  try {
    const raw = loadHistoryRaw()
    const uniqueDates = {}
    raw.draws.forEach(function (d) {
      if (d.dateStr) uniqueDates[d.dateStr] = true
    })
    score += Object.keys(uniqueDates).length * 2
  } catch (e) {}

  try {
    const ach = computeAchievements()
    score += (ach.unlockedCount || 0) * 15
  } catch (e) {}

  try {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    score += records.length * 2
  } catch (e) {}

  try {
    const checkinState = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
    const dayLog = checkinState.dayLog || {}
    Object.keys(dayLog).forEach(function (key) {
      var entry = dayLog[key]
      if (entry && entry.mood) score += 2
    })
  } catch (e) {}

  try {
    score += getFirstUnlockListSorted().length * 1
  } catch (e) {}

  return score
}

function computeRank() {
  var score = computeRankScore()

  var rank = RANKS[0]
  for (var i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].threshold) {
      rank = RANKS[i]
      break
    }
  }

  var nextRank = rank.level < RANKS.length - 1 ? RANKS[rank.level + 1] : null

  var progress = 100
  if (nextRank) {
    var range = nextRank.threshold - rank.threshold
    progress = range > 0 ? Math.min(100, Math.round(((score - rank.threshold) / range) * 100)) : 100
  }

  var title = '【' + rank.name + '】'
  if (nextRank) {
    title += '　距「' + nextRank.name + '」还需 ' + (nextRank.threshold - score) + ' 分'
  } else {
    title += '　已臻圆满'
  }

  return {
    score: score,
    rank: rank,
    nextRank: nextRank,
    progress: progress,
    title: title
  }
}

module.exports = { computeRank: computeRank, computeRankScore: computeRankScore, RANKS: RANKS }
