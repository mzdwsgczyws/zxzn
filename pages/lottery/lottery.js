const KEYS = require('../../utils/storage-keys.js')
const core = require('../../utils/lottery-core.js')
const { isLotteryProfileComplete } = require('../../utils/profile-lottery.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],
  data: core.lotteryDataDefaults(),

  shakeAccum: 0,
  lastShake: 0,

  onLoad() {
    core.onLotteryLoad(this)
  },

  onShow() {
    const t = core.todayStr()
    const cache = wx.getStorageSync(KEYS.LOTTERY_TODAY)
    const hasToday = cache && cache.dateStr === t && cache.lotId != null
    if (hasToday) {
      core.restoreToday(this, { whenEmpty: 'shake' })
      return
    }
    const p = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    if (!isLotteryProfileComplete(p)) {
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
            core.restoreToday(this, { whenEmpty: 'shake' })
          }
        },
        fail: () => {
          core.restoreToday(this, { whenEmpty: 'shake' })
        }
      })
      return
    }
    core.restoreToday(this, { whenEmpty: 'shake' })
  },

  onHide() {
    core.stopAccel(this)
    core.clearThinkingReveal(this)
  },

  onUnload() {
    core.stopAccel(this)
    core.clearThinkingReveal(this)
  },

  onShareAppMessage() {
    recordShare('/pages/lottery/lottery')
    const { lot } = this.data
    return {
      title: lot ? `今日心象箴言：${lot.tierLabel} · ${lot.title}` : '今日心象箴言 · 量化自修正念',
      path: '/pages/lottery/lottery'
    }
  },

  onShareTimeline() {
    recordShare('timeline:lottery')
    const { lot } = this.data
    return {
      title: lot ? `今日心象箴言 · ${lot.tierLabel} · ${lot.title}` : '今日心象箴言 · 量化自修正念'
    }
  },

  reveal() {
    core.reveal(this)
  },

  shareHint() {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
    wx.showToast({ title: '点右上角分享', icon: 'none' })
  },

  simShake() {
    core.simShake(this)
  },

  tapConfirmThinking() {
    core.confirmThinkingToResult(this)
  },

  tapSkipThinkingReveal() {
    core.skipThinkingReveal(this)
  }
})
