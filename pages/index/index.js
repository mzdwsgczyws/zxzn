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
    adviceFbDone: false,
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
    checkinExpanded: false,
    milestoneText: '',
    milestoneStreak: 0,
    showMilestone: false,
    seasonalHint: '',
    microActions: [],
    yesterdayActionSummary: '',
    weekHighlight: ''
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
    this.refreshMicroActions()
    this.refreshWeekHighlight()
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

  refreshMicroActions() {
    try {
      const cache = wx.getStorageSync(KEYS.LOTTERY_TODAY) || {}
      const structured = cache.adviceStructured || []
      const actions = structured.filter(s => s.microAction).map(s => ({
        text: s.microAction,
        reason: s.reason || '',
        done: false
      }))
      const state = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
      const log = state.dayLog || {}
      const d = new Date()
      const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (log[today] && Array.isArray(log[today].actions)) {
        log[today].actions.forEach((saved, i) => {
          if (actions[i]) actions[i].done = !!saved.done
        })
      }
      const yDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
      const yesterday = `${yDate.getFullYear()}-${yDate.getMonth() + 1}-${yDate.getDate()}`
      let yesterdaySummary = ''
      if (log[yesterday] && Array.isArray(log[yesterday].actions)) {
        const ya = log[yesterday].actions
        const done = ya.filter(a => a.done).length
        if (ya.length > 0) {
          yesterdaySummary = `昨日完成 ${done}/${ya.length} 项微行动`
        }
      }
      this.setData({ microActions: actions, yesterdayActionSummary: yesterdaySummary })
    } catch (e) {}
  },

  onMicroActionChange(e) {
    this.setData({ microActions: e.detail.actions })
  },

  closeMilestone() {
    this.setData({ showMilestone: false })
  },

  refreshWeekHighlight() {
    try {
      const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
      if (records.length < 7) { this.setData({ weekHighlight: '' }); return }
      const sorted = records.slice().sort((a, b) => (a.date > b.date ? 1 : -1))
      const thisW = sorted.slice(-7)
      const prevW = sorted.slice(-14, -7)
      if (prevW.length < 3) { this.setData({ weekHighlight: '' }); return }
      const wavg = (arr, k) => {
        const xs = arr.map(r => Number(r[k])).filter(n => !Number.isNaN(n))
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
      }
      const curRec = wavg(thisW, 'recoveryScore')
      const prevRec = wavg(prevW, 'recoveryScore')
      const curSleep = wavg(thisW, 'sleepHours')
      const prevSleep = wavg(prevW, 'sleepHours')
      
      let highlight = ''
      if (curRec != null && prevRec != null && curRec > prevRec) {
        const pct = Math.round((curRec - prevRec) / Math.max(prevRec, 0.1) * 100)
        if (pct >= 5) highlight = `本周恢复感提升了 ${pct}%`
      }
      if (!highlight && curSleep != null && prevSleep != null && curSleep > prevSleep + 0.3) {
        highlight = `本周平均多睡了 ${(curSleep - prevSleep).toFixed(1)}h`
      }
      
      const state = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
      const log = state.dayLog || {}
      let streak = 0
      const d = new Date()
      for (let i = 0; i < 7; i++) {
        const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i)
        const ds = `${dd.getFullYear()}-${dd.getMonth() + 1}-${dd.getDate()}`
        if (log[ds] && Array.isArray(log[ds].actions) && log[ds].actions.some(a => a.done)) {
          streak++
        } else break
      }
      if (!highlight && streak >= 3) {
        highlight = `连续 ${streak} 天完成微行动`
      }
      this.setData({ weekHighlight: highlight || '' })
    } catch (e) {
      this.setData({ weekHighlight: '' })
    }
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
    this.setData({ checkinExpanded: true })
    if (r.milestone) {
      this.setData({ milestoneText: r.milestone, milestoneStreak: r.streak, showMilestone: true })
    } else {
      wx.showToast({ title: `已连续 ${r.streak} 天`, icon: 'none' })
    }
  },

  onMoodPick(e) {
    const mood = e.detail.mood
    checkin.updateMood(mood)
    this.setData({ checkinMood: mood })
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
            wx.navigateTo({ url: '/pages/profile/profile?expand=1' })
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

  tapAdviceLike() {
    if (this.data.adviceFbDone) return
    this.setData({ adviceFbDone: true })
    try {
      const fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || { liked: {}, dislikedTexts: [], likedCats: {}, dislikedCats: {} }
      if (!fb.likedCats) fb.likedCats = {}
      const structured = this.data.adviceStructured || []
      const list = this.data.adviceList || []
      structured.forEach((s) => {
        if (s.cat) fb.likedCats[s.cat] = (fb.likedCats[s.cat] || 0) + 1
      })
      list.forEach((line) => {
        const cat = String(line).replace(/^\d+\.\s*/, '').slice(0, 2)
        fb.liked[cat] = (fb.liked[cat] || 0) + 1
      })
      wx.setStorageSync(KEYS.ADVICE_FEEDBACK, fb)
    } catch (e) {}
    wx.showToast({ title: '感谢反馈', icon: 'none' })
  },

  tapAdviceSkip() {
    if (this.data.adviceFbDone) return
    this.setData({ adviceFbDone: true })
    try {
      const fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || { liked: {}, dislikedTexts: [], likedCats: {}, dislikedCats: {} }
      if (!fb.dislikedCats) fb.dislikedCats = {}
      const structured = this.data.adviceStructured || []
      const list = this.data.adviceList || []
      structured.forEach((s) => {
        if (s.cat) fb.dislikedCats[s.cat] = (fb.dislikedCats[s.cat] || 0) + 1
      })
      const texts = list.map((l) => String(l).replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean)
      const s = new Set(fb.dislikedTexts || [])
      texts.forEach((t) => s.add(t))
      fb.dislikedTexts = Array.from(s).slice(-50)
      wx.setStorageSync(KEYS.ADVICE_FEEDBACK, fb)
    } catch (e) {}
    wx.showToast({ title: '已记录', icon: 'none' })
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
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/report' })
  },

  goTreeHole() {
    wx.navigateTo({ url: '/pages/tree-hole/tree-hole' })
  }
})
