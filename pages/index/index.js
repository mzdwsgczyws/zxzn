const KEYS = require('../../utils/storage-keys.js')
const core = require('../../utils/lottery-core.js')
const { isLotteryProfileComplete } = require('../../utils/profile-lottery.js')
const { getFirstUnlockListSorted, computeAchievements } = require('../../utils/lottery-history.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: Object.assign(core.lotteryDataDefaults(), {
    phase: 'idle',
    statusBarH: 20,
    navTotalPx: 64,
    mainScrollH: 400,
    bottomBarH: 120,
    hallStripH: 100,
    hallLotN: 0,
    hallAchUnlocked: 0,
    hallAchTotal: 0,
    theoryBannerEligible: false
  }),

  onLoad() {
    this.shakeAccum = 0
    this.lastShake = 0
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
    this.refreshTheoryBannerFlag()
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
    this.refreshTheoryBannerFlag()
  },

  refreshTheoryBannerFlag() {
    let dismissed = false
    try {
      dismissed = !!wx.getStorageSync(KEYS.THEORY_INTRO_BANNER_DISMISSED)
    } catch (e) {}
    this.setData({ theoryBannerEligible: !dismissed })
  },

  dismissTheoryBanner() {
    try {
      wx.setStorageSync(KEYS.THEORY_INTRO_BANNER_DISMISSED, true)
    } catch (e) {}
    this.setData({ theoryBannerEligible: false })
  },

  readTheoryIntro() {
    this.dismissTheoryBanner()
    wx.navigateTo({ url: '/pages/theory-intro/theory-intro' })
  },

  openTheoryIntro() {
    wx.navigateTo({ url: '/pages/theory-intro/theory-intro' })
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
    core.clearTodayAndReset(this, 'idle')
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
