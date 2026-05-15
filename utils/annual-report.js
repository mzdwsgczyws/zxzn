/**
 * 年度报告数据聚合
 *
 * 从本地存储汇总指定年份的抽签、打卡、自修记录与成就数据，
 * 生成年度关键词与统计摘要，供年度报告页面展示。
 */

var KEYS = require('./storage-keys.js')
var { loadHistoryRaw, computeAchievements } = require('./lottery-history.js')

/**
 * @param {number|string} year  四位年份，如 2026
 * @returns {object} 年度报告聚合数据
 */
function computeAnnualReport(year) {
  var yearStr = String(year)

  // --- 抽签历史 ---
  var history = loadHistoryRaw()
  var allDraws = history.draws || []
  var yearDraws = allDraws.filter(function (d) {
    return String(d.dateStr).indexOf(yearStr + '-') === 0
  })

  var totalDraws = yearDraws.length
  var lotIdSet = {}
  yearDraws.forEach(function (d) { lotIdSet[d.lotId] = true })
  var uniqueLots = Object.keys(lotIdSet).length

  var tierDistribution = { '上上': 0, '上': 0, '中': 0, '下': 0, '下下': 0 }
  yearDraws.forEach(function (d) {
    var t = d.tier || '中'
    if (tierDistribution[t] !== undefined) tierDistribution[t]++
    else tierDistribution[t] = 1
  })

  // --- 打卡 ---
  var checkinState = null
  try {
    checkinState = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
  } catch (e) {
    checkinState = {}
  }

  var totalDays = checkinState.totalDays || 0
  var dayLog = checkinState.dayLog || {}
  var dayLogKeys = Object.keys(dayLog)
  var yearDayKeys = dayLogKeys.filter(function (k) {
    return k.indexOf(yearStr + '-') === 0
  })
  var checkinDaysInYear = yearDayKeys.length

  var bestStreak = computeBestStreak(yearDayKeys)

  var moodHistory = checkinState.moodHistory || []
  var yearMoods = moodHistory.filter(function (m) {
    return String(m.date).indexOf(yearStr + '-') === 0
  })
  var moodDistribution = {}
  yearMoods.forEach(function (m) {
    if (!m.mood) return
    moodDistribution[m.mood] = (moodDistribution[m.mood] || 0) + 1
  })

  var topMood = ''
  var topMoodCount = 0
  Object.keys(moodDistribution).forEach(function (emoji) {
    if (moodDistribution[emoji] > topMoodCount) {
      topMoodCount = moodDistribution[emoji]
      topMood = emoji
    }
  })

  // --- 自修记录 ---
  var recordsInYear = 0
  try {
    var trackRecords = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    if (Array.isArray(trackRecords)) {
      recordsInYear = trackRecords.filter(function (r) {
        var ds = r.dateStr || r.date || ''
        return String(ds).indexOf(yearStr + '-') === 0
      }).length
    }
  } catch (e) { console.warn('annualReport:trackRecords', e) }

  // --- 成就 ---
  var achievements = computeAchievements()
  var unlockedAchievements = achievements.unlockedCount || 0
  var totalAchievements = achievements.total || 0

  // --- 年度关键词 ---
  var keyword = deriveKeyword({
    totalDraws: totalDraws,
    checkinDaysInYear: checkinDaysInYear,
    bestStreak: bestStreak,
    uniqueLots: uniqueLots,
    tierDistribution: tierDistribution,
    recordsInYear: recordsInYear
  })

  return {
    year: yearStr,
    totalDraws: totalDraws,
    uniqueLots: uniqueLots,
    tierDistribution: tierDistribution,
    checkinDaysInYear: checkinDaysInYear,
    bestStreak: bestStreak,
    moodDistribution: moodDistribution,
    topMood: topMood,
    recordsInYear: recordsInYear,
    unlockedAchievements: unlockedAchievements,
    totalAchievements: totalAchievements,
    keyword: keyword
  }
}

/**
 * 从 dayLog 的日期键列表中计算该年最长连续打卡天数。
 * 日期格式 "YYYY-M-D"（与 checkin.js todayStr 一致，月/日不补零）。
 */
function computeBestStreak(dateKeys) {
  if (!dateKeys.length) return 0

  var timestamps = dateKeys.map(function (s) {
    var parts = String(s).split('-').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) return NaN
    return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
  }).filter(function (t) { return !isNaN(t) })
    .sort(function (a, b) { return a - b })

  var best = 0
  var cur = 0
  var prev = null
  for (var i = 0; i < timestamps.length; i++) {
    var t = timestamps[i]
    if (prev !== null && t - prev === 86400000) {
      cur++
    } else {
      cur = 1
    }
    prev = t
    if (cur > best) best = cur
  }
  return best
}

function deriveKeyword(data) {
  if (data.totalDraws >= 200 && data.checkinDaysInYear >= 200) return '精进'
  if (data.bestStreak >= 30) return '持守'
  if (data.uniqueLots >= 48) return '博览'

  var upper = (data.tierDistribution['上上'] || 0) + (data.tierDistribution['上'] || 0)
  var total = data.totalDraws || 1
  if (upper / total > 0.5 && total >= 10) return '鸿运'

  if (data.recordsInYear >= 100) return '自省'

  return '求索'
}

module.exports = { computeAnnualReport }
