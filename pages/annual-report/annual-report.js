const { computeAnnualReport } = require('../../utils/annual-report.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    year: 0,
    currentYear: 0,
    report: null,
    tierList: []
  },

  onLoad(opts) {
    const y = (opts && opts.year) ? Number(opts.year) : new Date().getFullYear()
    this.setData({ year: y, currentYear: new Date().getFullYear() })
    this._refresh(y)
  },

  pickYear(e) {
    const y = Number(e.currentTarget.dataset.y)
    if (!y || y === this.data.year) return
    this.setData({ year: y })
    this._refresh(y)
  },

  _refresh(year) {
    try {
      const report = computeAnnualReport(year)
      const tiers = ['上上', '上', '中', '下', '下下']
      const maxCount = Math.max(1, ...tiers.map(t => report.tierDistribution[t] || 0))
      const tierList = tiers.map(t => ({
        tier: t,
        count: report.tierDistribution[t] || 0,
        pct: Math.round(((report.tierDistribution[t] || 0) / maxCount) * 100)
      }))
      this.setData({ report, tierList })
    } catch (e) {
      this.setData({ report: null, tierList: [] })
    }
  },

  onShareAppMessage() {
    recordShare('/pages/annual-report/annual-report')
    const r = this.data.report
    const keyword = r ? r.keyword : ''
    return {
      title: '我的 ' + this.data.year + ' 年度修炼关键词：' + keyword,
      path: '/pages/annual-report/annual-report?year=' + this.data.year
    }
  }
})
