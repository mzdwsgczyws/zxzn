/**
 * 今日灵签：首页与 lottery 页共用（同一份本地缓存）
 */

const KEYS = require('./storage-keys.js')
const { buildFortuneMeta, getGanZhiDaySeed } = require('./fortune.js')
const { getLotById } = require('./lots.js')
const { getHuangdaoPackage } = require('./almanac.js')
const { fetchWeather } = require('./weather.js')
const { computeLotteryAdvices } = require('./lottery-advice.js')
const { drawLotArtWx } = require('./lot-art.js')
const { applyLotStylePref } = require('./lot-display.js')

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const TIER_COLORS = {
  上上: '#c62828',
  上: '#6a1b9a',
  中: '#1565c0',
  下: '#6d4c41',
  下下: '#37474f'
}

function defaultLotCanvasSize() {
  const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const margin = (win.windowWidth / 750) * 96
  const w = Math.max(200, Math.floor(win.windowWidth - margin))
  const h = Math.max(120, Math.floor((win.windowHeight || 600) * 0.2))
  return { w, h }
}

function getCanvasId(page) {
  return page._lotCanvasId || 'lotArtCanvas'
}

function lotteryDataDefaults() {
  const { w, h } = defaultLotCanvasSize()
  return {
    phase: 'shake',
    shaking: false,
    shakeHint: '摇动手机数次…',
    lot: null,
    revealed: false,
    tierColor: '#1565c0',
    adviceList: [],
    lotArtW: w,
    lotArtH: h
  }
}

/**
 * @param {WechatMiniprogram.Page.TrivialInstance} page
 * @param {{ whenEmpty?: 'idle' | 'shake' }} options
 */
function restoreToday(page, options) {
  const whenEmpty = options && options.whenEmpty === 'idle' ? 'idle' : 'shake'
  const t = todayStr()
  const cache = wx.getStorageSync(KEYS.LOTTERY_TODAY)
  if (cache && cache.dateStr === t && cache.lotId != null) {
    const raw = getLotById(cache.lotId)
    const lot = applyLotStylePref(raw, cache.lotStylePref || 'rich')
    page.setData(
      {
        phase: 'result',
        lot,
        revealed: !!cache.revealed,
        tierColor: TIER_COLORS[lot.tier] || '#1565c0',
        adviceList: cache.adviceList || []
      },
      () => {
        if (cache.revealed) {
          wx.nextTick(() => setTimeout(() => renderLotArt(page), 80))
        }
      }
    )
    page.shakeAccum = 0
    page.lastShake = 0
    stopAccel(page)
    return
  }
  page.setData({
    phase: whenEmpty,
    shaking: false,
    shakeHint: '摇动手机数次…',
    lot: null,
    revealed: false,
    adviceList: []
  })
  page.shakeAccum = 0
  page.lastShake = 0
  stopAccel(page)
  if (whenEmpty === 'shake') {
    setTimeout(() => startAccel(page), 50)
  }
}

function startShakeFromIdle(page) {
  if (page.data.phase !== 'idle') return
  page.setData({ phase: 'shake', shakeHint: '摇动手机数次…', shaking: false })
  page.shakeAccum = 0
  page.lastShake = 0
  setTimeout(() => startAccel(page), 50)
}

function startAccel(page) {
  stopAccel(page)
  wx.onAccelerometerChange((res) => {
    if (page.data.phase !== 'shake') return
    const { x, y, z } = res
    const g = Math.sqrt(x * x + y * y + z * z)
    const now = Date.now()
    if (g > 1.65 && now - page.lastShake > 120) {
      page.lastShake = now
      page.shakeAccum += 1
      page.setData({ shaking: true, shakeHint: `感应中… ${Math.min(page.shakeAccum, 12)}/12` })
      if (page.shakeAccum >= 12) {
        stopAccel(page)
        drawLot(page)
      }
    }
  })
  wx.startAccelerometer({ interval: 'game' })
}

function stopAccel(page) {
  try {
    wx.stopAccelerometer()
  } catch (e) {}
  wx.offAccelerometerChange()
}

function readProfileLatLng() {
  const profile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
  const lat = profile.latitude != null ? Number(profile.latitude) : NaN
  const lng = profile.longitude != null ? Number(profile.longitude) : NaN
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { lat: null, lng: null }
  return { lat, lng }
}

function drawLot(page) {
  page.setData({ phase: 'anim', shaking: true, shakeHint: '签筒已动，请稍候…' })
  const { lat, lng } = readProfileLatLng()
  if (lat != null && lng != null) {
    fetchWeather(lat, lng).then((w) => {
      finalizeDraw(page, lat, lng, w)
    })
    return
  }
  finalizeDraw(page, null, null, null)
}

function finalizeDraw(page, lat, lng, weather) {
  const profile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
  const pers = wx.getStorageSync(KEYS.PERSONALITY_RESULT) || {}
  const hasPersonality = !!(pers && pers.typeName)
  const gender = profile.gender === 'male' || profile.gender === 'female' ? profile.gender : 'unknown'

  const now = new Date()
  const y = now.getFullYear()
  const mo = now.getMonth() + 1
  const d = now.getDate()
  const { gz } = getGanZhiDaySeed(y, mo, d)
  const almanac = getHuangdaoPackage(now, gz)

  const meta = buildFortuneMeta({
    now,
    hasPersonality,
    personalityTypeId: hasPersonality ? pers.typeId : null,
    age: profile.age,
    gender,
    birthMonth: profile.birthMonth,
    lat,
    lng,
    jieqi: almanac.jieqi,
    jianchu: almanac.jianchu,
    weatherCode: weather ? weather.code : null,
    weatherText: weather ? weather.text : '',
    recentState: profile.recentState,
    rhythmType: profile.rhythmType,
    focusTags: profile.focusTags,
    lotStylePref: profile.lotStylePref
  })

  const rawLot = getLotById(meta.lotId)
  const stylePref = profile.lotStylePref || 'rich'
  const lot = applyLotStylePref(rawLot, stylePref)
  const adviceList = computeLotteryAdvices({
    dateStr: meta.dateStr,
    lotId: meta.lotId,
    tier: rawLot.tier,
    lotTitle: rawLot.title,
    almanac,
    weather,
    age: profile.age,
    gender,
    personality: hasPersonality ? pers : null,
    recentState: profile.recentState,
    rhythmType: profile.rhythmType,
    focusTags: profile.focusTags
  })

  const payload = {
    dateStr: meta.dateStr,
    lotId: meta.lotId,
    revealed: false,
    adviceList,
    lotStylePref: stylePref
  }
  wx.setStorageSync(KEYS.LOTTERY_TODAY, payload)

  setTimeout(() => {
    page.setData({
      phase: 'result',
      shaking: false,
      lot,
      revealed: false,
      tierColor: TIER_COLORS[lot.tier] || '#1565c0',
      adviceList
    })
  }, 900)
}

function reveal(page) {
  const t = todayStr()
  const cache = wx.getStorageSync(KEYS.LOTTERY_TODAY) || {}
  if (cache.dateStr !== t) return
  cache.revealed = true
  wx.setStorageSync(KEYS.LOTTERY_TODAY, cache)
  page.setData({ revealed: true }, () => {
    wx.nextTick(() => setTimeout(() => renderLotArt(page), 80))
  })
}

function renderLotArt(page, retry) {
  const lot = page.data.lot
  if (!lot || !page.data.revealed) return
  const n = retry == null ? 0 : retry
  wx.createSelectorQuery()
    .in(page)
    .select('.lot-art-wrap')
    .boundingClientRect()
    .exec((res) => {
      const rect = res && res[0]
      let w
      let h
      if (rect && rect.width >= 2 && rect.height >= 2) {
        w = Math.floor(rect.width)
        h = Math.floor(rect.height)
      } else if (n < 15) {
        setTimeout(() => renderLotArt(page, n + 1), 80)
        return
      } else {
        const d = defaultLotCanvasSize()
        w = d.w
        h = d.h
      }
      page.setData({ lotArtW: w, lotArtH: h }, () => {
        wx.nextTick(() => setTimeout(() => paintLotToCanvas(page, w, h, lot), 30))
      })
    })
}

function paintLotToCanvas(page, w, h, lot) {
  if (!lot || w < 2 || h < 2) return
  try {
    const ctx = wx.createCanvasContext(getCanvasId(page), page)
    drawLotArtWx(ctx, w, h, {
      id: lot.id,
      title: lot.title,
      tierLabel: lot.tierLabel || '',
      tier: lot.tier
    })
    ctx.draw(false)
  } catch (e) {
    console.warn('lot canvas draw', e)
  }
}

function simShake(page) {
  if (page.data.phase !== 'shake') return
  page.shakeAccum = 12
  stopAccel(page)
  drawLot(page)
}

function clearTodayAndReset(page, whenEmpty) {
  wx.removeStorageSync(KEYS.LOTTERY_TODAY)
  restoreToday(page, { whenEmpty: whenEmpty || 'idle' })
}

function onLotteryLoad(page) {
  const { w, h } = defaultLotCanvasSize()
  page.setData({ lotArtW: w, lotArtH: h })
}

module.exports = {
  todayStr,
  TIER_COLORS,
  defaultLotCanvasSize,
  lotteryDataDefaults,
  restoreToday,
  startShakeFromIdle,
  startAccel,
  stopAccel,
  drawLot,
  finalizeDraw,
  reveal,
  renderLotArt,
  paintLotToCanvas,
  simShake,
  clearTodayAndReset,
  onLotteryLoad,
  getCanvasId
}
