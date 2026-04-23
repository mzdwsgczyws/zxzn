/**
 * 每日打卡（本地存本地账号，无后端）
 * 产品文案与设计见 docs/check-in-system-brief.md
 */
const KEYS = require('./storage-keys.js')

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function parseLocalDate(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d+)-(\d+)-(\d+)$/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** 仅比较日历日，last 是否为 ref 的「昨天」 */
function isYesterdayBefore(last, ref) {
  const a = parseLocalDate(last)
  const b = parseLocalDate(ref)
  if (!a || !b) return false
  const diff = b - a
  return diff >= 86400000 && diff < 172800000
}

function loadState() {
  try {
    return wx.getStorageSync(KEYS.CHECKIN_STATE) || null
  } catch (e) {
    return null
  }
}

function saveState(s) {
  try {
    wx.setStorageSync(KEYS.CHECKIN_STATE, s)
  } catch (e) {}
}

/**
 * 供首页展示
 * @returns {{ streak: number, totalDays: number, checkedToday: boolean, lastDateStr: string }}
 */
function getCheckInSummary() {
  const t = todayStr()
  const s = loadState() || { streak: 0, totalDays: 0, lastDateStr: '' }
  const checkedToday = s.lastDateStr === t
  return {
    streak: s.streak || 0,
    totalDays: s.totalDays || 0,
    checkedToday,
    lastDateStr: s.lastDateStr || ''
  }
}

/**
 * 用户点击「今日打卡」
 * @returns {{ ok: boolean, already?: boolean, streak: number, totalDays: number, milestone?: string }}
 */
function recordCheckIn() {
  const t = todayStr()
  const s = loadState() || { streak: 0, totalDays: 0, lastDateStr: '' }
  if (s.lastDateStr === t) {
    return { ok: true, already: true, streak: s.streak, totalDays: s.totalDays }
  }
  let nextStreak = 1
  if (s.lastDateStr && isYesterdayBefore(s.lastDateStr, t)) {
    nextStreak = (s.streak || 0) + 1
  }
  const totalDays = (s.totalDays || 0) + 1
  const next = {
    lastDateStr: t,
    streak: nextStreak,
    totalDays
  }
  saveState(next)

  let milestone
  if (nextStreak === 7) milestone = '周不断'
  else if (nextStreak === 30) milestone = '月如一'
  else if (nextStreak === 100) milestone = '百念如一'

  return { ok: true, already: false, streak: nextStreak, totalDays, milestone }
}

module.exports = {
  todayStr,
  getCheckInSummary,
  recordCheckIn
}
