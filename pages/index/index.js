const KEYS = require('../../utils/storage-keys.js')
const core = require('../../utils/lottery-core.js')
const { isLotteryProfileComplete } = require('../../utils/profile-lottery.js')
const { getFirstUnlockListSorted, computeAchievements } = require('../../utils/lottery-history.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')

/** 混元流式生文（内联在本文件：当前工具链不会把同目录 hunyuan.js 打进页面包） */
const HUNYUAN_MODEL = 'hunyuan-turbos-latest'

function parseHunyuanStreamEvent(event) {
  if (!event || event.data === '[DONE]') return { text: '', think: '' }
  try {
    const data = JSON.parse(event.data)
    const delta = data && data.choices && data.choices[0] && data.choices[0].delta
    const think = delta && delta.reasoning_content ? String(delta.reasoning_content) : ''
    const text = delta && delta.content ? String(delta.content) : ''
    return { text, think }
  } catch (e) {
    return { text: '', think: '' }
  }
}

function streamHunyuanText(messages, opts) {
  const onDelta = opts && opts.onDelta
  const onThink = opts && opts.onThink
  if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
    return Promise.reject(new Error('请使用基础库 3.7.1+ 并在 app.js 中 wx.cloud.init'))
  }
  const model = wx.cloud.extend.AI.createModel('hunyuan-exp')
  return model
    .streamText({
      data: {
        model: HUNYUAN_MODEL,
        messages
      }
    })
    .then((res) => {
      let full = ''
      const stream = res && res.eventStream
      if (!stream) {
        throw new Error('未返回 eventStream')
      }
      const iter = typeof stream[Symbol.asyncIterator] === 'function' ? stream[Symbol.asyncIterator]() : null
      if (!iter) {
        throw new Error('eventStream 不可迭代')
      }
      function pump() {
        return iter.next().then((step) => {
          if (step.done) return full
          const event = step.value
          if (event && event.data === '[DONE]') return full
          const parsed = parseHunyuanStreamEvent(event)
          if (parsed.think && onThink) onThink(parsed.think)
          if (parsed.text) {
            full += parsed.text
            if (onDelta) onDelta(parsed.text, full)
          }
          return pump()
        })
      }
      return pump()
    })
}

Page({
  behaviors: [pageAnalytics],

  data: Object.assign(core.lotteryDataDefaults(), {
    phase: 'idle',
    statusBarH: 20,
    navTotalPx: 64,
    mainScrollH: 400,
    bottomBarH: 120,
    hallStripH: 100,
    aiExpandLoading: false,
    aiExpandText: '',
    aiExpandErr: '',
    hallLotN: 0,
    hallAchUnlocked: 0,
    hallAchTotal: 0
  }),

  onLoad() {
    this.shakeAccum = 0
    this.lastShake = 0
    this._aiThrottleAt = 0
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const sb = win.statusBarHeight || 20
    const rpx2px = win.windowWidth / 750
    const navContentPx = Math.ceil(88 * rpx2px)
    const navTotal = sb + navContentPx
    // 底栏（主页 + 三入口）：在约 1/7 屏高基础上再缩小 1/3（≈2/21 屏）；主区留给心象箴言滚动
    const bottomPx = Math.max(68, Math.floor((win.windowHeight / 7) * (2 / 3)))
    const hallStripPx = Math.max(72, Math.floor(132 * rpx2px))
    const mainH = Math.max(200, win.windowHeight - navTotal - bottomPx - hallStripPx)
    this.setData({
      statusBarH: sb,
      navTotalPx: navTotal,
      mainScrollH: mainH,
      bottomBarH: bottomPx,
      hallStripH: hallStripPx
    })
    core.onLotteryLoad(this)
    this.refreshHallStrip()
  },

  refreshHallStrip() {
    try {
      const n = getFirstUnlockListSorted().length
      const { unlockedCount, total } = computeAchievements()
      this.setData({
        hallLotN: n,
        hallAchUnlocked: unlockedCount,
        hallAchTotal: total
      })
    } catch (e) {}
  },

  onShow() {
    core.restoreToday(this, { whenEmpty: 'idle' })
    this.refreshHallStrip()
  },

  onHide() {
    core.stopAccel(this)
  },

  onUnload() {
    core.stopAccel(this)
  },

  onShareAppMessage() {
    recordShare('/pages/index/index')
    const { lot } = this.data
    return {
      title: lot ? `今日心象箴言：${lot.tierLabel} · ${lot.title}` : '量化自修正念',
      path: '/pages/index/index'
    }
  },

  /** 首页：点击后进入摇动感应 */
  tapStartLottery() {
    const p = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    if (!isLotteryProfileComplete(p)) {
      // confirmText / cancelText 各最多 4 个字符，超长会导致 showModal 失败且无提示
      wx.showModal({
        title: '提示',
        content:
          '完善个人档案可提高匹配准确度。若暂不完善，可先摇动手机生成，稍后在「个人档案」补充即可。',
        confirmText: '去完善',
        cancelText: '继续抽取',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/profile/profile' })
          } else {
            core.startShakeFromIdle(this)
          }
        },
        fail: () => {
          core.startShakeFromIdle(this)
        }
      })
      return
    }
    core.startShakeFromIdle(this)
  },

  reveal() {
    core.reveal(this)
  },

  simShake() {
    core.simShake(this)
  },

  /** 清除当日缓存并回到抽取入口 */
  redrawLottery() {
    this.setData({ aiExpandText: '', aiExpandErr: '', aiExpandLoading: false })
    core.clearTodayAndReset(this, 'idle')
  },

  /** 混元延展漫谈（云开发 AI，需已 init 且有额度） */
  tapAiExpand() {
    const lot = this.data.lot
    if (!lot || !this.data.revealed || this.data.aiExpandLoading) return
    this.setData({ aiExpandLoading: true, aiExpandErr: '', aiExpandText: '' })
    const interpret = (lot.interpret || '').slice(0, 800)
    const poem = (lot.poem || '').slice(0, 400)
    const messages = [
      {
        role: 'system',
        content:
          '你是传统文化与自我观察方向的辅助写手。根据用户提供的心象箴言相关文案写 3～6 句延展漫谈，语气温和、口语化。禁止：断言吉凶命运、医疗心理咨询、违法违规与迷信恐吓。说明这是文化娱乐与自我提醒，非专业建议。'
      },
      {
        role: 'user',
        content: `标题：${lot.title || ''}\n等第：${lot.tierLabel || lot.tier || ''}\n诗句：${poem}\n释义节选：${interpret}\n请直接输出正文，不要小标题。`
      }
    ]
    const page = this
    streamHunyuanText(messages, {
      onDelta(_chunk, full) {
        const now = Date.now()
        if (now - page._aiThrottleAt > 160) {
          page._aiThrottleAt = now
          page.setData({ aiExpandText: full })
        }
      }
    })
      .then((full) => {
        page.setData({ aiExpandLoading: false, aiExpandText: full })
      })
      .catch((e) => {
        page.setData({
          aiExpandLoading: false,
          aiExpandErr: (e && e.message) || '生成失败，请检查网络与云开发额度'
        })
      })
  },

  tapAiRegenerate() {
    if (this.data.aiExpandLoading) return
    this.setData({ aiExpandText: '', aiExpandErr: '' })
    this.tapAiExpand()
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  goQuiz() {
    const prev = wx.getStorageSync(KEYS.PERSONALITY_RESULT)
    if (prev && prev.typeName) {
      wx.navigateTo({ url: '/pages/personality/result/result' })
    } else {
      wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
    }
  },

  goTrack() {
    wx.navigateTo({ url: '/pages/track/track' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  goLotHall() {
    wx.navigateTo({ url: '/pages/lot-hall/lot-hall' })
  },

  goAchieveHall() {
    wx.navigateTo({ url: '/pages/achieve-hall/achieve-hall' })
  }
})
