const KEYS = require('../../utils/storage-keys.js')
const core = require('../../utils/lottery-core.js')
const { isLotteryProfileComplete } = require('../../utils/profile-lottery.js')

Page({
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
          '完善个人档案可提高抽签准确性。若暂不完善，可先摇签，稍后在「个人档案」补充即可。',
        confirmText: '去完善',
        cancelText: '继续抽签',
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
  },

  onUnload() {
    core.stopAccel(this)
  },

  onShareAppMessage() {
    const { lot } = this.data
    return {
      title: lot ? `今日灵签：${lot.tierLabel} · ${lot.title}` : '今日灵签 · 量化论道修身',
      path: '/pages/lottery/lottery'
    }
  },

  onShareTimeline() {
    const { lot } = this.data
    return {
      title: lot ? `今日灵签 · ${lot.tierLabel} · ${lot.title}` : '今日灵签 · 量化论道修身'
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
  }
})
