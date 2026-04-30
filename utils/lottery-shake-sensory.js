/**
 * 抽签摇动：短震动 + 本地音效，模拟竹筒签条碰撞与落定感。
 * 真机有效；开发者工具无震动、音效可能受限。
 */

let tickCtx = null
let settleCtx = null

function vibrateShortTyped(prefer) {
  try {
    if (!wx.vibrateShort) return
    const types = prefer === 'heavy' ? ['heavy', 'medium', 'light'] : prefer === 'medium' ? ['medium', 'light'] : ['light', 'medium']
    if (wx.canIUse && wx.canIUse('vibrateShort.object.type')) {
      wx.vibrateShort({ type: types[0] })
    } else {
      wx.vibrateShort()
    }
  } catch (e) {}
}

function ensureTick() {
  if (tickCtx) return tickCtx
  try {
    if (!wx.createInnerAudioContext) return null
    const ctx = wx.createInnerAudioContext()
    ctx.src = '/audio/lottery-shake-tick.wav'
    ctx.volume = 0.52
    tickCtx = ctx
    return ctx
  } catch (e) {
    return null
  }
}

function ensureSettle() {
  if (settleCtx) return settleCtx
  try {
    if (!wx.createInnerAudioContext) return null
    const ctx = wx.createInnerAudioContext()
    ctx.src = '/audio/lottery-draw-settle.wav'
    ctx.volume = 0.48
    settleCtx = ctx
    return ctx
  } catch (e) {
    return null
  }
}

function playTick() {
  const ctx = ensureTick()
  if (!ctx) return
  try {
    ctx.stop()
    ctx.seek(0)
    ctx.play()
  } catch (e) {}
}

function playSettle() {
  const ctx = ensureSettle()
  if (!ctx) return
  try {
    ctx.stop()
    ctx.seek(0)
    ctx.play()
  } catch (e) {}
}

/** 单次有效摇动：轻震 + 碰撞短音 */
function feedbackShakeImpulse() {
  vibrateShortTyped('light')
  playTick()
}

/** 次数已满、进入生成：两下强弱震动 + 落定音 */
function feedbackDrawCommitted() {
  vibrateShortTyped('heavy')
  setTimeout(() => vibrateShortTyped('medium'), 110)
  playSettle()
}

/**
 * 模拟器「一键补足摇动」：快速连播 9 次与真实摇动相近的反馈，再回调。
 * @param {() => void} done
 */
function feedbackSimulatedNineTicks(done) {
  for (let i = 0; i < 9; i++) {
    setTimeout(() => feedbackShakeImpulse(), i * 42)
  }
  if (typeof done === 'function') {
    setTimeout(done, 9 * 42 + 70)
  }
}

function teardown() {
  try {
    if (tickCtx) {
      tickCtx.stop()
      tickCtx.destroy()
      tickCtx = null
    }
    if (settleCtx) {
      settleCtx.stop()
      settleCtx.destroy()
      settleCtx = null
    }
  } catch (e) {}
}

module.exports = {
  feedbackShakeImpulse,
  feedbackDrawCommitted,
  feedbackSimulatedNineTicks,
  teardown
}
