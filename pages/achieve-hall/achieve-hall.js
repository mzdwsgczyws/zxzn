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
    this._pressTimer = setTimeout(() => {
      this._pressTimer = null
      if (this._pressPendingId !== id) return
      try { wx.vibrateShort({ type: 'heavy' }) } catch (e) {}
      this.setData({
        pressVisible: true,
        pressComment: item.comment
      })
    }, 400)
  },

  onAchPressEnd() {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer)
      this._pressTimer = null
    }
    this._pressPendingId = null
    this.setData({
      pressVisible: false,
      pressComment: ''
    })
  }
})
