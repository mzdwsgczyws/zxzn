const checkin = require('../../utils/checkin.js')
const KEYS = require('../../utils/storage-keys.js')

Page({
  data: {
    period: 'week',
    checkinDays: 0,
    checkinRate: 0,
    streak: 0,
    totalDays: 0,
    topMood: '',
    moodSummary: [],
    lotteryCount: 0,
    heatmapDays: [],
    periodLabel: ''
  },

  onLoad(opts) {
    const period = opts.period || 'week'
    this.setData({ period })
    this.buildReport(period)
  },

  onShareAppMessage() {
    return {
      title: `我的${this.data.periodLabel}修炼报告 · 量化自修正念`,
      path: '/pages/index/index'
    }
  },

  switchPeriod(e) {
    const p = e.currentTarget.dataset.period
    this.setData({ period: p })
    this.buildReport(p)
  },

  buildReport(period) {
    const days = period === 'month' ? 30 : 7
    const label = period === 'month' ? '月度' : '周度'
    const heatmap = checkin.getHeatmapDays(days)
    const checkedCount = heatmap.filter(d => d.checked).length
    const rate = days > 0 ? Math.round(checkedCount / days * 100) : 0

    const moodCount = {}
    heatmap.forEach(d => {
      if (d.mood) moodCount[d.mood] = (moodCount[d.mood] || 0) + 1
    })
    const moodSummary = Object.keys(moodCount)
      .map(k => ({ mood: k, count: moodCount[k] }))
      .sort((a, b) => b.count - a.count)
    const topMood = moodSummary.length > 0 ? moodSummary[0].mood : ''

    const summary = checkin.getCheckInSummary()

    let lotteryCount = 0
    try {
      const rows = wx.getStorageSync(KEYS.LOT_ROWS) || []
      const cutoff = Date.now() - days * 86400000
      lotteryCount = rows.filter(r => {
        if (!r.ts) return false
        return r.ts > cutoff
      }).length
    } catch (e) {}

    this.setData({
      periodLabel: label,
      checkinDays: checkedCount,
      checkinRate: rate,
      streak: summary.streak,
      totalDays: summary.totalDays,
      topMood,
      moodSummary,
      lotteryCount,
      heatmapDays: heatmap
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
