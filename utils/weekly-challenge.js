/**
 * 每周挑战：根据五行偏弱轴推荐一项 5 天连续挑战，完成后授予徽章。
 */

var KEYS = require('./storage-keys.js')

var WEEKLY_CHALLENGE = KEYS.WEEKLY_CHALLENGE
var CHALLENGE_BADGES = KEYS.CHALLENGE_BADGES

var CHALLENGE_POOL = [
  { id: 'water', element: '水', title: '养水', desc: '连续 5 天睡眠 ≥ 7 小时', field: 'sleepHours', op: '>=', value: 7, days: 5, badge: '涵水居士' },
  { id: 'wood', element: '木', title: '养木', desc: '连续 5 天步行 ≥ 20 分钟', field: 'walkMinutes', op: '>=', value: 20, days: 5, badge: '扶木行者' },
  { id: 'metal', element: '金', title: '养金', desc: '连续 5 天打卡并记录心境', field: 'checkin_mood', op: 'truthy', value: null, days: 5, badge: '鉴金修士' },
  { id: 'fire', element: '火', title: '养火', desc: '连续 5 天屏幕时间 < 5 小时', field: 'screenHours', op: '<', value: 5, days: 5, badge: '离火散人' },
  { id: 'earth', element: '土', title: '养土', desc: '连续 5 天完成自修记录', field: 'track_record', op: 'truthy', value: null, days: 5, badge: '厚土真人' },
  { id: 'action', element: '通用', title: '微行动达人', desc: '连续 5 天完成至少 2 项微行动', field: 'micro_actions', op: '>=', value: 2, days: 5, badge: '践行居士' }
]

var ELEMENT_TO_CHALLENGE = { '水': 'water', '木': 'wood', '金': 'metal', '火': 'fire', '土': 'earth' }

function todayStr() {
  var d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

function daysBetween(a, b) {
  var pa = String(a).split('-').map(Number)
  var pb = String(b).split('-').map(Number)
  if (pa.length < 3 || pb.length < 3) return Infinity
  var ta = new Date(pa[0], pa[1] - 1, pa[2]).getTime()
  var tb = new Date(pb[0], pb[1] - 1, pb[2]).getTime()
  return Math.round((tb - ta) / 86400000)
}

function loadChallenge() {
  try { return wx.getStorageSync(WEEKLY_CHALLENGE) || null } catch (e) { return null }
}

function saveChallenge(obj) {
  try { wx.setStorageSync(WEEKLY_CHALLENGE, obj) } catch (e) { console.warn('saveChallenge', e) }
}

function findWeakestElement() {
  try {
    var { computeFiveElements } = require('./five-elements-chart.js')
    var records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    if (!records.length) return null
    var sorted = records.slice().sort(function (a, b) {
      var pa = String(a.dateStr || '0-0-0').split('-').map(Number)
      var pb = String(b.dateStr || '0-0-0').split('-').map(Number)
      return new Date(pa[0], pa[1] - 1, pa[2]) - new Date(pb[0], pb[1] - 1, pb[2])
    })
    var fe = computeFiveElements(sorted, null, null)
    if (!fe || !fe.hasData) return null
    var axes = [
      { el: '金', v: fe.jin },
      { el: '木', v: fe.mu },
      { el: '水', v: fe.shui },
      { el: '火', v: fe.huo },
      { el: '土', v: fe.tu }
    ]
    axes.sort(function (a, b) { return a.v - b.v })
    return axes[0].el
  } catch (e) {
    return null
  }
}

function pickChallenge() {
  var weakEl = findWeakestElement()
  if (weakEl && ELEMENT_TO_CHALLENGE[weakEl]) {
    var id = ELEMENT_TO_CHALLENGE[weakEl]
    var found = CHALLENGE_POOL.find(function (c) { return c.id === id })
    if (found) return found
  }
  var idx = Math.floor(Math.random() * CHALLENGE_POOL.length)
  return CHALLENGE_POOL[idx]
}

function getCurrentChallenge() {
  var saved = loadChallenge()
  var today = todayStr()

  if (saved && saved.startDate) {
    var elapsed = daysBetween(saved.startDate, today)
    if (elapsed >= 0 && elapsed < 7 && !saved.completed) {
      return saved
    }
  }

  var challenge = pickChallenge()
  var obj = {
    id: challenge.id,
    element: challenge.element,
    title: challenge.title,
    desc: challenge.desc,
    field: challenge.field,
    op: challenge.op,
    value: challenge.value,
    days: challenge.days,
    badge: challenge.badge,
    startDate: today,
    progress: [],
    completed: false
  }
  saveChallenge(obj)
  return obj
}

function checkCondition(op, fieldValue, target) {
  if (op === 'truthy') return !!fieldValue
  var num = Number(fieldValue)
  if (isNaN(num)) return false
  if (op === '>=') return num >= target
  if (op === '<') return num < target
  if (op === '>') return num > target
  if (op === '<=') return num <= target
  if (op === '==') return num === target
  return false
}

function updateChallengeProgress(dateStr, data) {
  var saved = loadChallenge()
  if (!saved || saved.completed) return saved

  var today = dateStr || todayStr()
  var elapsed = daysBetween(saved.startDate, today)
  if (elapsed < 0 || elapsed >= 7) return saved

  var fieldValue = data ? data[saved.field] : undefined
  var pass = checkCondition(saved.op, fieldValue, saved.value)

  var existing = saved.progress.findIndex(function (p) { return p.dateStr === today })
  if (existing >= 0) {
    saved.progress[existing].pass = pass
  } else {
    saved.progress.push({ dateStr: today, pass: pass })
  }

  if (!saved.completed) {
    var consecutivePasses = 0
    var sorted = saved.progress.slice().sort(function (a, b) {
      var pa = String(a.dateStr).split('-').map(Number)
      var pb = String(b.dateStr).split('-').map(Number)
      var ta = new Date(pa[0], pa[1] - 1, pa[2]).getTime()
      var tb = new Date(pb[0], pb[1] - 1, pb[2]).getTime()
      return ta - tb
    })
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].pass) {
        consecutivePasses++
        if (consecutivePasses >= saved.days) {
          saved.completed = true
          awardBadge(saved.badge)
          break
        }
      } else {
        consecutivePasses = 0
      }
    }
  }

  saveChallenge(saved)
  return saved
}

function awardBadge(badgeName) {
  try {
    var badges = wx.getStorageSync(CHALLENGE_BADGES) || []
    if (!Array.isArray(badges)) badges = []
    if (badges.indexOf(badgeName) === -1) {
      badges.push(badgeName)
      wx.setStorageSync(CHALLENGE_BADGES, badges)
    }
  } catch (e) { console.warn('awardBadge', e) }
}

function getChallengeBadges() {
  try {
    var badges = wx.getStorageSync(CHALLENGE_BADGES) || []
    return Array.isArray(badges) ? badges : []
  } catch (e) {
    return []
  }
}

module.exports = {
  getCurrentChallenge: getCurrentChallenge,
  updateChallengeProgress: updateChallengeProgress,
  getChallengeBadges: getChallengeBadges,
  CHALLENGE_POOL: CHALLENGE_POOL
}
