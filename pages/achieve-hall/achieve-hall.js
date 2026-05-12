const { computeAchievements } = require('../../utils/lottery-history.js')

const pageAnalytics = require('../../behaviors/page-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    achievements: [],
    unlockedCount: 0,
    total: 0,
    progressPct: 0,
    pressVisible: false,
    pressComment: ''
  },

  onShow() {
    const { list, unlockedCount, total } = computeAchievements()
    const map = {}
    list.forEach((x) => {
      map[x.id] = x
    })
    this._achMap = map
    const progressPct = total > 0 ? Math.round((unlockedCount * 100) / total) : 0
    list.forEach((x) => {
      x.starsArr = Array.from({ length: x.stars || 1 }, (_, i) => i)
    })
    this.setData({
      achievements: list,
      unlockedCount,
      total,
      progressPct
    })
  },

  onAchPressStart(e) {
    const id = e.currentTarget.dataset.id
    const item = this._achMap && this._achMap[id]
    if (!item) return
    if (this._pressTimer) clearTimeout(this._pressTimer)
    this._pressPendingId = id
    this._pressStartY = e.touches && e.touches[0] ? e.touches[0].clientY : 0
    this._pressTimer = setTimeout(() => {
      this._pressTimer = null
      if (this._pressPendingId !== id) return
      try { wx.vibrateShort({ type: 'heavy' }) } catch (e2) {}
      this.setData({
        pressVisible: true,
        pressComment: item.comment
      })
    }, 400)
  },

  onAchPressMove(e) {
    if (!this._pressTimer && !this.data.pressVisible) return
    const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0
    if (Math.abs(y - (this._pressStartY || 0)) > 10) {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer)
        this._pressTimer = null
      }
      this._pressPendingId = null
      if (this.data.pressVisible) {
        this.setData({ pressVisible: false, pressComment: '' })
      }
    }
  },

  onAchPressEnd() {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer)
      this._pressTimer = null
    }
    this._pressPendingId = null
    if (this.data.pressVisible) {
      this.setData({ pressVisible: false, pressComment: '' })
    }
  }
})
