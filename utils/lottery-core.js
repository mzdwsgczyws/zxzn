/**
 * 今日心象箴言：首页与 lottery 页共用（同一份本地缓存）
 */

const KEYS = require('./storage-keys.js')

/** 有效摇动累计次数达标后出结果（与首页提示文案一致） */
const SHAKE_COUNT_NEED = 9
const { appendLotteryDraw } = require('./lottery-history.js')
const { recordBiz } = require('./usage-analytics.js')
const { buildFortuneMeta, getGanZhiDaySeed } = require('./fortune.js')
const { getLotById } = require('./lots.js')
const { getHuangdaoPackage } = require('./almanac.js')
const { fetchWeather } = require('./weather.js')
const { computeLotteryAdvices } = require('./lottery-advice.js')
const { drawLotArtWx } = require('./lot-art.js')
const { applyLotStylePref } = require('./lot-display.js')
const { buildLotteryThinkingBrief } = require('./lottery-thinking.js')
const sensory = require('./lottery-shake-sensory.js')

/** 与 lottery-advice 编号列表对应，去掉前序号便于跨次去重 */
function stripAdvicePlainLine(line) {
  return String(line || '')
    .replace(/^\s*\d+\.\s*/, '')
    .trim()
}

/** 思考模式类目逐项显现间隔（毫秒，整体偏慢便于阅读） */
const THINKING_REVEAL_INITIAL_MS = 480
const THINKING_REVEAL_STEP_MS = 720
/** 最后一项类目出现后，延迟再展示脚注 */
const THINKING_REVEAL_FOOTNOTE_MS = 640
/** 脚注出现后自动进入箴言卡片（留出脚注动画与扫读时间） */
const THINKING_AUTO_ADVANCE_MS = 1200

function clearThinkingReveal(page) {
  if (!page) return
  if (page._thinkingRevealTimer != null) {
    clearTimeout(page._thinkingRevealTimer)
    page._thinkingRevealTimer = null
  }
  if (page._thinkingAdvanceTimer != null) {
    clearTimeout(page._thinkingAdvanceTimer)
    page._thinkingAdvanceTimer = null
  }
}

/** 展示完毕后自动切入 phase result */
function scheduleThinkingAdvance(page) {
  if (!page || page.data.phase !== 'thinking') return
  if (page._thinkingAdvanceTimer != null) {
    clearTimeout(page._thinkingAdvanceTimer)
    page._thinkingAdvanceTimer = null
  }
  page._thinkingAdvanceTimer = setTimeout(() => {
    page._thinkingAdvanceTimer = null
    if (!page || page.data.phase !== 'thinking') return
    confirmThinkingToResult(page)
  }, THINKING_AUTO_ADVANCE_MS)
}

function startThinkingReveal(page) {
  clearThinkingReveal(page)
  const cats = page.data.thinkingCategories || []
  const total = cats.length
  if (total === 0) {
    page.setData({ thinkingFootnoteVisible: true }, () => scheduleThinkingAdvance(page))
    return
  }
  const tick = (step) => {
    if (!page || page.data.phase !== 'thinking') return
    page.setData({ thinkingVisibleCount: step })
    if (step >= total) {
      page._thinkingRevealTimer = setTimeout(() => {
        if (!page || page.data.phase !== 'thinking') return
        page.setData({ thinkingFootnoteVisible: true })
        page._thinkingRevealTimer = null
        scheduleThinkingAdvance(page)
      }, THINKING_REVEAL_FOOTNOTE_MS)
      return
    }
    page._thinkingRevealTimer = setTimeout(() => tick(step + 1), THINKING_REVEAL_STEP_MS)
  }
  page._thinkingRevealTimer = setTimeout(() => tick(1), THINKING_REVEAL_INITIAL_MS)
}

/** 跳过逐项动画，直接进入箴言卡片 */
function skipThinkingReveal(page) {
  if (!page || page.data.phase !== 'thinking') return
  clearThinkingReveal(page)
  confirmThinkingToResult(page)
}

/** 每次生成当日签 +1，用于作废延迟 setData 与跨页清缓存 */
let gLotDrawVer = 0

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
    thinkingCategories: [],
    thinkingFootnote: '',
    thinkingVisibleCount: 0,
    thinkingFootnoteVisible: false,
    lotArtW: w,
    lotArtH: h
  }
}

/**
 * @param {WechatMiniprogram.Page.TrivialInstance} page
 * @param {{ whenEmpty?: 'idle' | 'shake' }} options
 */
function restoreToday(page, options) {
  clearThinkingReveal(page)
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
        adviceList: cache.adviceList || [],
        thinkingCategories: [],
        thinkingFootnote: '',
        thinkingVisibleCount: 0,
        thinkingFootnoteVisible: false
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
  page.setData(
    {
      phase: whenEmpty,
      shaking: false,
      shakeHint: '摇动手机数次…',
      lot: null,
      revealed: false,
      adviceList: [],
      thinkingCategories: [],
      thinkingFootnote: '',
      thinkingVisibleCount: 0,
      thinkingFootnoteVisible: false
    },
    () => {
      clearLotCanvas(page)
    }
  )
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
      sensory.feedbackShakeImpulse()
      page.setData({
        shaking: true,
        shakeHint: `感应中… ${Math.min(page.shakeAccum, SHAKE_COUNT_NEED)}/${SHAKE_COUNT_NEED}`
      })
      if (page.shakeAccum >= SHAKE_COUNT_NEED) {
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
  sensory.feedbackDrawCommitted()
  page.setData({ phase: 'anim', shaking: true, shakeHint: '内容生成中，请稍候…' })
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
  const { gz, wxDay } = getGanZhiDaySeed(y, mo, d)
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

  let avoidAdviceTexts = []
  try {
    const prev = wx.getStorageSync(KEYS.LOTTERY_ADVICE_RECENT) || {}
    avoidAdviceTexts = Array.isArray(prev.texts) ? prev.texts : []
    const fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || {}
    if (Array.isArray(fb.dislikedTexts)) {
      avoidAdviceTexts = avoidAdviceTexts.concat(fb.dislikedTexts)
    }
  } catch (e) {}

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
    profile,
    wxDay,
    typeId: hasPersonality && pers.typeId != null ? pers.typeId : null,
    recentState: profile.recentState,
    rhythmType: profile.rhythmType,
    focusTags: profile.focusTags,
    avoidAdviceTexts
  })

  try {
    const texts = adviceList.map(stripAdvicePlainLine).filter(Boolean)
    wx.setStorageSync(KEYS.LOTTERY_ADVICE_RECENT, { texts, ts: now.getTime() })
  } catch (e) {}

  const drawVer = ++gLotDrawVer
  const payload = {
    dateStr: meta.dateStr,
    lotId: meta.lotId,
    revealed: false,
    adviceList,
    lotStylePref: stylePref,
    _drawVer: drawVer
  }
  wx.setStorageSync(KEYS.LOTTERY_TODAY, payload)
  appendLotteryDraw({
    ts: now.getTime(),
    dateStr: meta.dateStr,
    lotId: meta.lotId,
    tier: rawLot.tier,
    title: rawLot.title
  })
  recordBiz('lot_draw', String(meta.lotId))

  const seasonal = require('./seasonal.js')
  const seasonCtx = seasonal.getSeasonalContext(now)

  const thinking = buildLotteryThinkingBrief()

  setTimeout(() => {
    const cache = wx.getStorageSync(KEYS.LOTTERY_TODAY) || {}
    if (!cache.lotId || cache._drawVer !== drawVer) return
    if (cache.lotId !== meta.lotId || cache.dateStr !== meta.dateStr) return
    page.setData(
      {
        phase: 'thinking',
        shaking: false,
        thinkingCategories: thinking.categories,
        thinkingFootnote: thinking.footnote,
        thinkingVisibleCount: 0,
        thinkingFootnoteVisible: false,
        lot,
        revealed: false,
        tierColor: TIER_COLORS[lot.tier] || '#1565c0',
        adviceList
      },
      () => startThinkingReveal(page)
    )
  }, 900)
}

/** 思考模式结束后进入箴言揭晓卡片（lot 已在数据中，仍保持 revealed=false） */
function confirmThinkingToResult(page) {
  if (!page || page.data.phase !== 'thinking') return
  clearThinkingReveal(page)
  page.setData({ phase: 'result' })
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
  // 使用已计算好的 lotArtW/lotArtH（精确 px），避免 iOS 上 boundingClientRect 返回 0
  const w = page.data.lotArtW
  const h = page.data.lotArtH
  if (w >= 2 && h >= 2) {
    wx.nextTick(() => setTimeout(() => paintLotToCanvas(page, w, h, lot), 30))
    return
  }
  // 回退：等待布局完成后重试
  if (n < 15) {
    setTimeout(() => renderLotArt(page, n + 1), 80)
    return
  }
  const d = defaultLotCanvasSize()
  page.setData({ lotArtW: d.w, lotArtH: d.h }, () => {
    wx.nextTick(() => setTimeout(() => paintLotToCanvas(page, d.w, d.h, lot), 30))
  })
}

/** 清空签图画布，避免重进页或重抽后旧像素残留 */
function clearLotCanvas(page) {
  const w = page.data.lotArtW
  const h = page.data.lotArtH
  if (w < 2 || h < 2) return
  try {
    const ctx = wx.createCanvasContext(getCanvasId(page), page)
    ctx.clearRect(0, 0, w, h)
    ctx.draw(false)
  } catch (e) {}
}

function paintLotToCanvas(page, w, h, lot) {
  if (!lot || w < 2 || h < 2) return
  try {
    const ctx = wx.createCanvasContext(getCanvasId(page), page)
    ctx.clearRect(0, 0, w, h)
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
  stopAccel(page)
  sensory.feedbackSimulatedNineTicks(() => {
    if (!page || page.data.phase !== 'shake') return
    page.shakeAccum = SHAKE_COUNT_NEED
    drawLot(page)
  })
}

function clearTodayAndReset(page, whenEmpty) {
  wx.removeStorageSync(KEYS.LOTTERY_TODAY)
  clearLotCanvas(page)
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
  confirmThinkingToResult,
  skipThinkingReveal,
  clearThinkingReveal,
  reveal,
  renderLotArt,
  paintLotToCanvas,
  clearLotCanvas,
  simShake,
  clearTodayAndReset,
  onLotteryLoad,
  getCanvasId,
  teardownShakeSensory: sensory.teardown
}
