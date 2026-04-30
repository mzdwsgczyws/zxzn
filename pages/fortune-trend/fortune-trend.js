const KEYS = require('../../utils/storage-keys.js')
const { getDailyTrendSeries } = require('../../utils/lottery-history.js')
const { getLotById } = require('../../utils/lots.js')
const { applyLotStylePref } = require('../../utils/lot-display.js')
const { TIER_COLORS } = require('../../utils/lottery-core.js')
const { paintFortuneCandles } = require('../../utils/fortune-trend-candles.js')
const {
  WEEK_TITLES,
  buildMonthCells,
  computeYearBounds,
  buildYearChoices
} = require('../../utils/fortune-trend-calendar.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    rows: [],
    empty: true,
    chartW: 320,
    chartH: 220,
    detailVisible: false,
    detail: null,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth() + 1,
    yearChoices: [],
    yearLabels: [],
    yearPickIdx: 0,
    monthLabels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthPickIdx: 0,
    weekDayTitles: WEEK_TITLES,
    calCells: []
  },

  onLoad() {
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const w = Math.max(280, Math.floor(win.windowWidth - 28))
    const h = Math.floor(Math.min(320, win.windowWidth * 0.46))
    this.setData({ chartW: w, chartH: h })
    this._trendByDate = {}
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

    const trendByDate = {}
    rows.forEach((r) => {
      trendByDate[r.dateStr] = r
    })
    this._trendByDate = trendByDate

    const now = new Date()
    const y0 = now.getFullYear()
    const { minY, maxY } = computeYearBounds(rows, y0)
    const yearChoices = buildYearChoices(minY, maxY)
    const yearLabels = yearChoices.map((y) => `${y}年`)

    let calYear = this.data.calYear
    let calMonth = this.data.calMonth
    let yearPickIdx = yearChoices.indexOf(calYear)
    if (yearPickIdx < 0) {
      calYear = Math.min(Math.max(calYear, yearChoices[0]), yearChoices[yearChoices.length - 1])
      yearPickIdx = yearChoices.indexOf(calYear)
      if (yearPickIdx < 0) {
        yearPickIdx = yearChoices.length - 1
        calYear = yearChoices[yearPickIdx]
      }
    }
    const monthPickIdx = Math.max(0, Math.min(11, calMonth - 1))

    this.setData(
      {
        rows,
        empty: rows.length === 0,
        yearChoices,
        yearLabels,
        yearPickIdx,
        calYear,
        calMonth: monthPickIdx + 1,
        monthPickIdx
      },
      () => {
        this.rebuildCalendar()
        wx.nextTick(() => this.paintChart())
      }
    )
  },

  rebuildCalendar() {
    const cells = buildMonthCells(this.data.calYear, this.data.calMonth, this._trendByDate || {})
    this.setData({ calCells: cells })
  },

  onYearPick(e) {
    const idx = Math.max(0, Number(e.detail.value) || 0)
    const y = this.data.yearChoices[idx]
    if (y == null) return
    this.setData({ yearPickIdx: idx, calYear: y }, () => this.rebuildCalendar())
  },

  onMonthPick(e) {
    const idx = Math.max(0, Math.min(11, Number(e.detail.value) || 0))
    this.setData({ monthPickIdx: idx, calMonth: idx + 1 }, () => this.rebuildCalendar())
  },

  paintChart() {
    const ctx = wx.createCanvasContext('fortuneCandleCanvas', this)
    const series = (this.data.rows || []).map((r) => ({ tier: r.tier, dateStr: r.dateStr }))
    paintFortuneCandles(ctx, this.data.chartW, this.data.chartH, series)
    ctx.draw(false)
  },

  onCalLongPress(e) {
    const ds = e.currentTarget.dataset.datestr
    if (!ds) return
    const row = this._trendByDate && this._trendByDate[ds]
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
