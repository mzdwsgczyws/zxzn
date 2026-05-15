/**
 * 每日打卡（本地存储，无后端）
 * 产品文案与设计见 docs/check-in-system-brief.md
 */
const KEYS = require('./storage-keys.js')

const MOOD_OPTIONS = ['😌', '😊', '😐', '😢', '😤']

const MILESTONES = [
  { days: 3, text: '初心三日', achievement: null },
  { days: 7, text: '周不断', achievement: 'checkin_7' },
  { days: 14, text: '双周如一', achievement: null },
  { days: 21, text: '习惯养成', achievement: 'checkin_21' },
  { days: 30, text: '月如一', achievement: 'checkin_30' },
  { days: 60, text: '双月行者', achievement: null },
  { days: 100, text: '百念如一', achievement: 'checkin_100' },
  { days: 365, text: '岁月为证', achievement: 'checkin_365' }
]

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
  } catch (e) { console.warn('checkin:saveState', e) }
}

function getCheckInSummary() {
  const t = todayStr()
  const s = loadState() || { streak: 0, totalDays: 0, lastDateStr: '', moodHistory: [], dayLog: {} }
  const checkedToday = s.lastDateStr === t
  const todayMood = s.dayLog && s.dayLog[t] ? s.dayLog[t].mood || '' : ''
  return {
    streak: s.streak || 0,
    totalDays: s.totalDays || 0,
    checkedToday,
    lastDateStr: s.lastDateStr || '',
    todayMood
  }
}

function recordCheckIn(mood) {
  const t = todayStr()
  const s = loadState() || { streak: 0, totalDays: 0, lastDateStr: '', moodHistory: [], dayLog: {} }
  if (!s.dayLog) s.dayLog = {}
  if (!s.moodHistory) s.moodHistory = []

  if (s.lastDateStr === t) {
    if (mood && s.dayLog[t]) {
      s.dayLog[t].mood = mood
      saveState(s)
    }
    return { ok: true, already: true, streak: s.streak, totalDays: s.totalDays }
  }

  let nextStreak = 1
  if (s.lastDateStr && isYesterdayBefore(s.lastDateStr, t)) {
    nextStreak = (s.streak || 0) + 1
  }
  const totalDays = (s.totalDays || 0) + 1

  s.dayLog[t] = { mood: mood || '', ts: Date.now() }
  if (mood) s.moodHistory.push({ date: t, mood })
  if (s.moodHistory.length > 365) s.moodHistory = s.moodHistory.slice(-365)

  // Trim dayLog to ~120 days
  const dayKeys = Object.keys(s.dayLog).sort()
  if (dayKeys.length > 120) {
    dayKeys.slice(0, dayKeys.length - 120).forEach(k => delete s.dayLog[k])
  }

  const next = {
    lastDateStr: t,
    streak: nextStreak,
    totalDays,
    moodHistory: s.moodHistory,
    dayLog: s.dayLog
  }
  saveState(next)

  let milestone
  const hit = MILESTONES.find(m => m.days === nextStreak)
  if (hit) milestone = hit.text

  return { ok: true, already: false, streak: nextStreak, totalDays, milestone }
}

function updateMood(mood) {
  const t = todayStr()
  const s = loadState()
  if (!s || !s.dayLog || !s.dayLog[t]) return
  s.dayLog[t].mood = mood || ''
  const idx = (s.moodHistory || []).findIndex(m => m.date === t)
  if (idx >= 0) s.moodHistory[idx].mood = mood
  else if (mood) {
    if (!s.moodHistory) s.moodHistory = []
    s.moodHistory.push({ date: t, mood })
  }
  saveState(s)
}

/**
 * Returns last N days of check-in data for heatmap display
 * @returns {Array<{dateStr: string, checked: boolean, mood: string, streak: number}>}
 */
function getHeatmapDays(count) {
  const n = count || 90
  const s = loadState() || { dayLog: {} }
  const log = s.dayLog || {}
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const ds = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const entry = log[ds]
    result.push({
      dateStr: ds,
      day: d.getDate(),
      weekday: d.getDay(),
      checked: !!entry,
      mood: entry ? entry.mood || '' : ''
    })
  }
  return result
}

module.exports = {
  todayStr,
  getCheckInSummary,
  recordCheckIn,
  updateMood,
  getHeatmapDays,
  MOOD_OPTIONS,
  MILESTONES
}
