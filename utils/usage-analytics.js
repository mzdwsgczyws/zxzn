/**
 * 本地使用统计（紧凑 JSON，短键名省空间）
 *
 * 说明：当前仍仅存本机；若未来接服务端，建议按 userId 分片 + 列式/时序库存事件，
 * 见 README「使用统计与规模化存储」。
 */
const KEYS = require('./storage-keys.js')

const MAX_SESSIONS = 80
const MAX_NAV = 150
const MAX_EVENTS = 120
const SAVE_DEBOUNCE_MS = 600

let _lastRoute = ''
let _sessionStart = 0
let _dirty = false
let _saveTimer = null

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function load() {
  try {
    const raw = wx.getStorageSync(KEYS.USAGE_STATS)
    if (raw && raw.v === 1) return raw
  } catch (e) {}
  return {
    v: 1,
    fo: 0,
    lo: 0,
    lc: 0,
    d: {},
    ss: [],
    p: {},
    nv: [],
    sh: {},
    ev: []
  }
}

function trimState(s) {
  if (s.ss.length > MAX_SESSIONS) s.ss = s.ss.slice(-MAX_SESSIONS)
  if (s.nv.length > MAX_NAV) s.nv = s.nv.slice(-MAX_NAV)
  if (s.ev.length > MAX_EVENTS) s.ev = s.ev.slice(-MAX_EVENTS)
}

function scheduleSave(s) {
  _dirty = true
  if (_saveTimer) return
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    if (!_dirty) return
    _dirty = false
    try {
      trimState(s)
      wx.setStorageSync(KEYS.USAGE_STATS, s)
    } catch (e) {}
  }, SAVE_DEBOUNCE_MS)
}

function flush() {
  const s = load()
  trimState(s)
  try {
    wx.setStorageSync(KEYS.USAGE_STATS, s)
    _dirty = false
  } catch (e) {}
}

function recordEvent(code, extra) {
  const s = load()
  const row = [Date.now(), code]
  if (extra != null && extra !== '') row.push(extra)
  s.ev.push(row)
  scheduleSave(s)
}

/** 小程序 onLaunch */
function onAppLaunch() {
  const s = load()
  const now = Date.now()
  if (!s.fo) s.fo = now
  s.lo = now
  s.lc = (s.lc || 0) + 1
  s.ev.push([now, 'lc', String(s.lc)])
  scheduleSave(s)
}

/** 小程序 onShow */
function onAppShow() {
  const s = load()
  const day = todayStr()
  if (!s.d[day]) s.d[day] = { o: 0, t: 0 }
  s.d[day].o = (s.d[day].o || 0) + 1
  if (!_sessionStart) _sessionStart = Date.now()
  scheduleSave(s)
}

/** 小程序 onHide */
function onAppHide() {
  const now = Date.now()
  if (_sessionStart) {
    const s = load()
    s.ss.push([_sessionStart, now])
    _sessionStart = 0
    scheduleSave(s)
  }
  flush()
}

/** 页面 onShow：记跳转序 */
function onPageShow(route) {
  if (!route) return
  const now = Date.now()
  if (_lastRoute && _lastRoute !== route) {
    const s = load()
    s.nv.push([_lastRoute, route, now])
    scheduleSave(s)
  }
  _lastRoute = route
}

/** 页面 onHide：累计停留 */
function onPageHide(route, enterTs) {
  if (!route || !enterTs) return
  const ms = Math.max(0, Date.now() - enterTs)
  const s = load()
  if (!s.p[route]) s.p[route] = [0, 0]
  s.p[route][0] = (s.p[route][0] || 0) + 1
  s.p[route][1] = (s.p[route][1] || 0) + ms
  const day = todayStr()
  if (!s.d[day]) s.d[day] = { o: 0, t: 0 }
  s.d[day].t = (s.d[day].t || 0) + ms
  scheduleSave(s)
}

/** onShareAppMessage 内调用：path 建议带前导 / */
function recordShare(path) {
  const s = load()
  const key = path || 'unknown'
  s.sh[key] = (s.sh[key] || 0) + 1
  recordEvent('share', key)
  scheduleSave(s)
}

/** 业务点可选手动打点，code 宜短，如 lot_draw、quiz_done */
function recordBiz(code, extra) {
  recordEvent(code, extra)
}

function getStatsForDebug() {
  return load()
}

module.exports = {
  onAppLaunch,
  onAppShow,
  onAppHide,
  onPageShow,
  onPageHide,
  recordShare,
  recordBiz,
  flush,
  getStatsForDebug
}
