const KEYS = require('../../utils/storage-keys.js')
const { analyzeRecords } = require('../../utils/analysis.js')

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

Page({
  data: {
    form: {
      sleepHours: 7,
      angerCount: 0,
      worryCount: 2,
      screenHours: 4,
      walkMinutes: 30,
      calmMinutes: 10
    },
    records: [],
    analysis: null
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    const t = todayStr()
    const today = records.find((r) => r.date === t)
    const form = today
      ? {
          sleepHours: today.sleepHours,
          angerCount: today.angerCount,
          worryCount: today.worryCount,
          screenHours: today.screenHours,
          walkMinutes: today.walkMinutes,
          calmMinutes: today.calmMinutes
        }
      : this.data.form
    this.setData({ records: records.slice(-14).reverse(), form })
  },

  onSleep(e) {
    this.setData({ 'form.sleepHours': e.detail.value })
  },
  onAnger(e) {
    this.setData({ 'form.angerCount': e.detail.value })
  },
  onWorry(e) {
    this.setData({ 'form.worryCount': e.detail.value })
  },
  onScreen(e) {
    this.setData({ 'form.screenHours': e.detail.value })
  },
  onWalk(e) {
    this.setData({ 'form.walkMinutes': e.detail.value })
  },
  onCalm(e) {
    this.setData({ 'form.calmMinutes': e.detail.value })
  },

  saveToday() {
    const t = todayStr()
    let records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    records = records.filter((r) => r.date !== t)
    records.push({ date: t, ...this.data.form, savedAt: Date.now() })
    records.sort((a, b) => (a.date > b.date ? 1 : -1))
    wx.setStorageSync(KEYS.TRACK_RECORDS, records)
    wx.showToast({ title: '已保存' })
    this.loadRecords()
    this.runAnalysis()
  },

  runAnalysis() {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    const analysis = analyzeRecords(records)
    this.setData({ analysis })
  }
})
