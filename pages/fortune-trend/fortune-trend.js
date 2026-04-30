const KEYS = require('../../utils/storage-keys.js')
const { getDailyTrendSeries } = require('../../utils/lottery-history.js')
const { getLotById } = require('../../utils/lots.js')
const { applyLotStylePref } = require('../../utils/lot-display.js')
const { TIER_COLORS } = require('../../utils/lottery-core.js')
const { paintFortuneCandles } = require('../../utils/fortune-trend-candles.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    rows: [],
    empty: true,
    chartW: 320,
    chartH: 220,
    detailVisible: false,
    detail: null
  },

  onLoad() {
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const w = Math.max(280, Math.floor(win.windowWidth - 28))
    const h = Math.floor(Math.min(320, win.windowWidth * 0.46))
    this.setData({ chartW: w, chartH: h })
  },

  onShow() {
    this.reload()
  },

  reload() {
    const profile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const pref = profile.lotStylePref || 'rich'
    const series = getDailyTrendSeries()
    const rows = series.map((s) => {
      const raw = getLotById(s.lotId)
      const lot = applyLotStylePref(raw, pref)
      return {
        dateStr: s.dateStr,
        ts: s.ts,
        lotId: s.lotId,
        tier: s.tier,
        title: s.title,
        tierColor: TIER_COLORS[s.tier] || '#1565c0',
        tierLabel: lot.tierLabel || s.tier,
        name: lot.name || raw.name,
        poem: lot.poem || '',
        interpret: lot.interpret || ''
      }
    })
    this.setData({ rows, empty: rows.length === 0 }, () => {
      wx.nextTick(() => this.paintChart())
    })
  },

  paintChart() {
    const ctx = wx.createCanvasContext('fortuneCandleCanvas', this)
    const series = (this.data.rows || []).map((r) => ({ tier: r.tier, dateStr: r.dateStr }))
    paintFortuneCandles(ctx, this.data.chartW, this.data.chartH, series)
    ctx.draw(false)
  },

  onRowLongPress(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const row = this.data.rows[idx]
    if (!row) return
    this.setData({
      detailVisible: true,
      detail: {
        dateStr: row.dateStr,
        tier: row.tier,
        tierColor: row.tierColor,
        tierLabel: row.tierLabel,
        title: row.title,
        name: row.name,
        poem: row.poem,
        interpret: row.interpret
      }
    })
  },

  closeDetail() {
    this.setData({ detailVisible: false, detail: null })
  },

  noop() {}
})
