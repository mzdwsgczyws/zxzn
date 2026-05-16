const { computeAchievements } = require('../../utils/lottery-history.js')

const pageAnalytics = require('../../behaviors/page-analytics.js')
const poster = require('../../utils/poster-engine.js')
const { recordShare } = require('../../utils/usage-analytics.js')
const { computeSolarBadges } = require('../../utils/solar-badges.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    achievements: [],
    unlockedCount: 0,
    total: 0,
    progressPct: 0,
    pressVisible: false,
    pressComment: '',
    solarBadges: [],
    solarCount: 0
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
    try {
      const sb = computeSolarBadges()
      this.setData({ solarBadges: sb.list, solarCount: sb.count })
    } catch (e) { console.warn('achieveHall:solarBadges', e) }
  },

  onShareAppMessage() {
    recordShare('/pages/achieve-hall/achieve-hall')
    return {
      title: '我在「量化自修正念」解锁了 ' + this.data.unlockedCount + ' 项成就',
      path: '/pages/achieve-hall/achieve-hall'
    }
  },

  async shareAchieve(e) {
    const id = e.currentTarget.dataset.id
    const item = this._achMap && this._achMap[id]
    if (!item || !item.unlocked) return
    wx.showLoading({ title: '生成中…' })
    try {
      const path = await poster.generate(
        this, 'poster-canvas',
        poster.tplAchieve({
          achieveName: item.name,
          achieveDesc: item.subtitle || item.comment || '',
          unlockedCount: this.data.unlockedCount,
          total: this.data.total
        }),
        600, 800
      )
      wx.hideLoading()
      wx.previewImage({ urls: [path], current: path })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
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
