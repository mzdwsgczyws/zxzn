const KEYS = require('../../utils/storage-keys.js')
const { analyzeRecords, TRACK_FOCUS_OPTIONS } = require('../../utils/cultivation-model.js')
const { computeFiveElements, drawFiveRadar, RADAR_FOOTER_LINES } = require('../../utils/five-elements-chart.js')
const { recordBiz } = require('../../utils/usage-analytics.js')

function scheduleDraw(cb) {
  if (typeof wx.nextTick === 'function') wx.nextTick(cb)
  else setTimeout(cb, 40)
}

const PHASE_OPTIONS = [
  { id: 'si', label: '思多（脑力、反复琢磨）' },
  { id: 'dong', label: '动多（事务、奔波）' },
  { id: 'yan', label: '言多（沟通、表达）' },
  { id: 'jing', label: '静多（独处、内向收）' },
  { id: 'za', label: '杂 / 切换多' }
]

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function phaseIndexFromId(id) {
  const i = PHASE_OPTIONS.findIndex((p) => p.id === id)
  return i >= 0 ? i : PHASE_OPTIONS.length - 1
}

const DEFAULT_FORM = {
  sleepHours: 7,
  angerCount: 0,
  worryCount: 2,
  screenHours: 4,
  walkMinutes: 30,
  calmMinutes: 10,
  recoveryScore: 3,
  drainScore: 3,
  socialLoad: 2,
  phaseMode: 'za',
  blankMinutes: 0,
  miniActionDone: false
}

function formFromRecord(today) {
  if (!today) return { ...DEFAULT_FORM }
  return {
    sleepHours: today.sleepHours != null ? today.sleepHours : DEFAULT_FORM.sleepHours,
    angerCount: today.angerCount != null ? today.angerCount : DEFAULT_FORM.angerCount,
    worryCount: today.worryCount != null ? today.worryCount : DEFAULT_FORM.worryCount,
    screenHours: today.screenHours != null ? today.screenHours : DEFAULT_FORM.screenHours,
    walkMinutes: today.walkMinutes != null ? today.walkMinutes : DEFAULT_FORM.walkMinutes,
    calmMinutes: today.calmMinutes != null ? today.calmMinutes : DEFAULT_FORM.calmMinutes,
    recoveryScore: today.recoveryScore != null ? today.recoveryScore : DEFAULT_FORM.recoveryScore,
    drainScore: today.drainScore != null ? today.drainScore : DEFAULT_FORM.drainScore,
    socialLoad: today.socialLoad != null ? today.socialLoad : DEFAULT_FORM.socialLoad,
    phaseMode: today.phaseMode && PHASE_OPTIONS.some((p) => p.id === today.phaseMode) ? today.phaseMode : DEFAULT_FORM.phaseMode,
    blankMinutes: today.blankMinutes != null ? today.blankMinutes : DEFAULT_FORM.blankMinutes,
    miniActionDone: !!today.miniActionDone
  }
}

function buildPriorityChips(selectedIds) {
  const sel = new Set(selectedIds || [])
  return TRACK_FOCUS_OPTIONS.map((o) => ({ id: o.id, label: o.label, on: sel.has(o.id) }))
}

const PHASE_SHORT = { si: '思', dong: '动', yan: '言', jing: '静', za: '杂' }

const pageAnalytics = require('../../behaviors/page-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    form: { ...DEFAULT_FORM },
    phaseLabels: PHASE_OPTIONS.map((p) => p.label),
    phaseIndex: PHASE_OPTIONS.length - 1,
    priorityIds: [],
    priorityChips: buildPriorityChips([]),
    records: [],
    analysis: null,
    radarFooterLines: RADAR_FOOTER_LINES,
    radarFooterExtra: '',
    fiveRows: []
  },

  onShow() {
    this.loadPriorities()
    this.loadRecords()
  },

  onReady() {
    scheduleDraw(() => this.updateFiveElementRadar())
  },

  loadPriorities() {
    const priorityIds = wx.getStorageSync(KEYS.TRACK_PRIORITIES) || []
    const safe = Array.isArray(priorityIds) ? priorityIds.filter((id) => TRACK_FOCUS_OPTIONS.some((o) => o.id === id)) : []
    this.setData({ priorityIds: safe, priorityChips: buildPriorityChips(safe) })
  },

  loadRecords() {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    const t = todayStr()
    const today = records.find((r) => r.date === t)
    const form = formFromRecord(today)
    const phaseIndex = phaseIndexFromId(form.phaseMode)
    const list = records
      .slice(-14)
      .reverse()
      .map((r) => ({
        ...r,
        phaseShort: r.phaseMode && PHASE_SHORT[r.phaseMode] != null ? PHASE_SHORT[r.phaseMode] : '—'
      }))
    this.setData(
      {
        records: list,
        form,
        phaseIndex
      },
      () => this.updateFiveElementRadar()
    )
  },

  updateFiveElementRadar() {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    const profile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const personality = wx.getStorageSync(KEYS.PERSONALITY_RESULT) || null
    const fe = computeFiveElements(records, profile, personality)
    this.setData({
      radarFooterExtra: fe.hint || '',
      fiveRows: (fe.rows || []).map((r) => ({ name: r.name, value: r.value, tip: r.tip }))
    })
    scheduleDraw(() => {
      const q = wx.createSelectorQuery().in(this)
      q.select('.five-radar-canvas')
        .boundingClientRect()
        .exec((res) => {
          const rect = res && res[0]
          if (!rect || rect.width < 8) return
          drawFiveRadar('fiveRadar', this, rect, fe)
        })
    })
  },

  togglePriority(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    let cur = [...(this.data.priorityIds || [])]
    const i = cur.indexOf(id)
    if (i >= 0) cur.splice(i, 1)
    else if (cur.length < 3) cur.push(id)
    wx.setStorageSync(KEYS.TRACK_PRIORITIES, cur)
    this.setData({ priorityIds: cur, priorityChips: buildPriorityChips(cur) })
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
  onRecovery(e) {
    this.setData({ 'form.recoveryScore': e.detail.value })
  },
  onDrain(e) {
    this.setData({ 'form.drainScore': e.detail.value })
  },
  onSocial(e) {
    this.setData({ 'form.socialLoad': e.detail.value })
  },
  onBlank(e) {
    this.setData({ 'form.blankMinutes': e.detail.value })
  },
  onPhase(e) {
    const i = Number(e.detail.value) || 0
    const id = PHASE_OPTIONS[i] ? PHASE_OPTIONS[i].id : 'za'
    this.setData({ phaseIndex: i, 'form.phaseMode': id })
  },
  onMiniAction(e) {
    this.setData({ 'form.miniActionDone': !!e.detail.value })
  },

  saveToday() {
    const t = todayStr()
    let records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    records = records.filter((r) => r.date !== t)
    records.push({ date: t, ...this.data.form, savedAt: Date.now() })
    records.sort((a, b) => (a.date > b.date ? 1 : -1))
    wx.setStorageSync(KEYS.TRACK_RECORDS, records)
    recordBiz('track_save')
    wx.showToast({ title: '已保存' })
    this.loadRecords()
    this.runAnalysis()
  },

  runAnalysis() {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    const personality = wx.getStorageSync(KEYS.PERSONALITY_RESULT) || null
    const profile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const priorities = wx.getStorageSync(KEYS.TRACK_PRIORITIES) || []
    const analysis = analyzeRecords(records, {
      personality,
      profile,
      priorities: Array.isArray(priorities) ? priorities : []
    })
    this.setData({ analysis })
  }
})
