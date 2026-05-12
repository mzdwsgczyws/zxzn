const KEYS = require('../../utils/storage-keys.js')
const core = require('../../utils/lottery-core.js')
const { isLotteryProfileComplete } = require('../../utils/profile-lottery.js')
const { getFirstUnlockListSorted, computeAchievements, getDailyTrendSeries } = require('../../utils/lottery-history.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')
const checkin = require('../../utils/checkin.js')

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
    hallTrendDays: 0,
    theoryBannerEligible: false,
    checkinStreak: 0,
    checkinTotalDays: 0,
    checkinCheckedToday: false,
    checkinMood: '',
    seasonalHint: ''
  }),

  onLoad() {
    try {
      if (!wx.getStorageSync(KEYS.ONBOARDING_DONE)) {
        wx.redirectTo({ url: '/pages/onboarding/onboarding' })
        return
      }
    } catch (e) {}
    this.shakeAccum = 0
    this.lastShake = 0
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const sb = win.statusBarHeight || 20
    const rpx2px = win.windowWidth / 750
    const navContentPx = Math.ceil(88 * rpx2px)
    const navTotal = sb + navContentPx
    // 底栏（主页 + 三入口）：在约 1/7 屏高基础上再缩小 1/3（≈2/21 屏）；主区留给心象箴言滚动
    const bottomPx = Math.max(68, Math.floor((win.windowHeight / 7) * (2 / 3)))
    const hallStripPx = Math.max(78, Math.floor(148 * rpx2px))
    const mainH = Math.max(200, win.windowHeight - navTotal - bottomPx - hallStripPx)
    this.setData({
      statusBarH: sb,
      navTotalPx: navTotal,
      mainScrollH: mainH,
      bottomBarH: bottomPx,
      hallStripH: hallStripPx
    })
    core.onLotteryLoad(this)
    this.refreshTheoryBannerFlag()
    wx.nextTick(() => this.refreshHallStrip())
  },

  refreshHallStrip() {
    try {
      const n = getFirstUnlockListSorted().length
      const { unlockedCount, total } = computeAchievements()
      let trendDays = 0
      try {
        trendDays = getDailyTrendSeries().length
      } catch (e2) {}
      this.setData({
        hallLotN: n,
        hallAchUnlocked: unlockedCount,
        hallAchTotal: total,
        hallTrendDays: trendDays
      })
    } catch (e) {}
  },

  onShow() {
    core.restoreToday(this, { whenEmpty: 'idle' })
    this.refreshHallStrip()
    this.refreshTheoryBannerFlag()
    this.refreshCheckIn()
    this.refreshSeasonalHint()
  },

  refreshCheckIn() {
    const s = checkin.getCheckInSummary()
    this.setData({
      checkinStreak: s.streak,
      checkinTotalDays: s.totalDays,
      checkinCheckedToday: s.checkedToday,
      checkinMood: s.todayMood
    })
  },

  refreshSeasonalHint() {
    try {
      const { getSeasonalContext } = require('../../utils/seasonal.js')
      const ctx = getSeasonalContext()
      this.setData({ seasonalHint: ctx.idleHint || '' })
    } catch (e) {}
  },

  tapCheckIn() {
    const r = checkin.recordCheckIn()
    this.refreshCheckIn()
    if (!r.already) {
      try { wx.vibrateShort({ type: 'medium' }) } catch (e) {}
    }
    if (r.already) {
      wx.showToast({ title: '今日已打卡', icon: 'none' })
      return
    }
    if (r.milestone) {
      wx.showToast({ title: `「${r.milestone}」`, icon: 'none' })
    } else {
      wx.showToast({ title: `已连续 ${r.streak} 天`, icon: 'none' })
    }
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
    core.clearThinkingReveal(this)
  },

  onUnload() {
    core.stopAccel(this)
    core.clearThinkingReveal(this)
    core.teardownShakeSensory()
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

  tapSkipThinkingReveal() {
    core.skipThinkingReveal(this)
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

  goFortuneTrend() {
    wx.navigateTo({ url: '/pages/fortune-trend/fortune-trend' })
  },

  goLotHall() {
    wx.navigateTo({ url: '/pages/lot-hall/lot-hall' })
  },

  goAchieveHall() {
    wx.navigateTo({ url: '/pages/achieve-hall/achieve-hall' })
  }
})
