const KEYS = require('../../utils/storage-keys.js')

const GENDER_KEYS = ['unknown', 'male', 'female']
const GENDER_LABELS = ['保密 / 跳过', '男', '女']

const RECENT_LABELS = ['未选择（抽签时将提示完善）', '偏低沉 / 易疲', '平稳', '较充沛 / 偏积极']
const RECENT_VALUES = [null, 'low', 'mid', 'high']

const RHYTHM_LABELS = ['未选择（抽签时将提示完善）', '偏早起', '偏夜猫', '作息不太规律']
const RHYTHM_VALUES = [null, 'early', 'night', 'irregular']

const STYLE_LABELS = ['未选择（抽签时将提示完善）', '简练', '详尽', '略偏文言感', '白话分行（易读）']
const STYLE_VALUES = [null, 'brief', 'rich', 'classical', 'plain']

const FOCUS_OPTIONS = [
  { id: 'work', label: '工作' },
  { id: 'relation', label: '人际' },
  { id: 'health', label: '健康' },
  { id: 'study', label: '学业' },
  { id: 'finance', label: '财务' },
  { id: 'family', label: '家庭' },
  { id: 'rest', label: '休息放松' }
]

function indexFromValue(values, v) {
  const i = values.indexOf(v)
  return i >= 0 ? i : 0
}

function buildFocusChips(selectedIds) {
  const sel = new Set(selectedIds || [])
  return FOCUS_OPTIONS.map((o) => ({ id: o.id, label: o.label, on: sel.has(o.id) }))
}

Page({
  data: {
    age: '',
    birthMonth: '',
    genderIndex: 0,
    genderLabels: GENDER_LABELS,
    locationName: '',
    latitude: null,
    longitude: null,
    recentLabels: RECENT_LABELS,
    recentIndex: 0,
    rhythmLabels: RHYTHM_LABELS,
    rhythmIndex: 0,
    styleLabels: STYLE_LABELS,
    styleIndex: 0,
    focusChips: buildFocusChips([]),
    focusTagsSelected: []
  },

  onShow() {
    const p = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    let gi = 0
    if (p.gender === 'male') gi = 1
    else if (p.gender === 'female') gi = 2
    const hasLoc =
      p.latitude != null &&
      p.longitude != null &&
      !Number.isNaN(Number(p.latitude)) &&
      !Number.isNaN(Number(p.longitude))
    const tags = Array.isArray(p.focusTags) ? p.focusTags.filter(Boolean) : []
    this.setData({
      age: p.age != null && p.age !== '' ? String(p.age) : '',
      birthMonth: p.birthMonth != null && p.birthMonth !== '' ? String(p.birthMonth) : '',
      genderIndex: gi,
      locationName: hasLoc ? (p.locationName || '已选位置') : '',
      latitude: hasLoc ? Number(p.latitude) : null,
      longitude: hasLoc ? Number(p.longitude) : null,
      recentIndex: indexFromValue(RECENT_VALUES, p.recentState),
      rhythmIndex: indexFromValue(RHYTHM_VALUES, p.rhythmType),
      styleIndex: indexFromValue(STYLE_VALUES, p.lotStylePref),
      focusTagsSelected: tags,
      focusChips: buildFocusChips(tags)
    })
  },

  onAge(e) {
    this.setData({ age: e.detail.value })
  },
  onBirthMonth(e) {
    this.setData({ birthMonth: e.detail.value })
  },
  onGenderPick(e) {
    this.setData({ genderIndex: Number(e.detail.value) || 0 })
  },

  onRecentPick(e) {
    this.setData({ recentIndex: Number(e.detail.value) || 0 })
  },
  onRhythmPick(e) {
    this.setData({ rhythmIndex: Number(e.detail.value) || 0 })
  },
  onStylePick(e) {
    this.setData({ styleIndex: Number(e.detail.value) || 0 })
  },

  toggleFocus(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const cur = this.data.focusTagsSelected || []
    const set = new Set(cur)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    const arr = Array.from(set)
    this.setData({ focusTagsSelected: arr, focusChips: buildFocusChips(arr) })
  },

  pickLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          locationName: res.name || res.address || '已选位置',
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') >= 0 || msg.indexOf('取消') >= 0) return
        wx.showToast({ title: '未能选点，可稍后再试', icon: 'none' })
      }
    })
  },

  clearLocation() {
    this.setData({ locationName: '', latitude: null, longitude: null })
    const prev = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const next = { ...prev }
    delete next.latitude
    delete next.longitude
    delete next.locationName
    wx.setStorageSync(KEYS.USER_PROFILE, next)
    wx.showToast({ title: '已清除保存的位置', icon: 'none' })
  },

  save() {
    const ageRaw = this.data.age.trim()
    const bmRaw = this.data.birthMonth.trim()
    let age
    let birthMonth
    if (ageRaw === '') {
      age = undefined
    } else {
      age = parseInt(ageRaw, 10)
      if (Number.isNaN(age) || age < 1 || age > 120) {
        wx.showToast({ title: '年龄范围 1–120 或留空', icon: 'none' })
        return
      }
    }
    if (bmRaw === '') {
      birthMonth = undefined
    } else {
      birthMonth = parseInt(bmRaw, 10)
      if (Number.isNaN(birthMonth) || birthMonth < 1 || birthMonth > 12) {
        wx.showToast({ title: '月份 1–12 或留空', icon: 'none' })
        return
      }
    }
    const gender = GENDER_KEYS[this.data.genderIndex] || 'unknown'
    const prev = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const payload = { ...prev, age, birthMonth, gender }

    const rs = RECENT_VALUES[this.data.recentIndex]
    const rh = RHYTHM_VALUES[this.data.rhythmIndex]
    const sp = STYLE_VALUES[this.data.styleIndex]
    const ft = (this.data.focusTagsSelected || []).slice()

    if (rs) payload.recentState = rs
    else delete payload.recentState
    if (rh) payload.rhythmType = rh
    else delete payload.rhythmType
    if (sp) payload.lotStylePref = sp
    else delete payload.lotStylePref
    if (ft.length) payload.focusTags = ft
    else delete payload.focusTags

    const lat = this.data.latitude
    const lng = this.data.longitude
    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      payload.latitude = Number(lat)
      payload.longitude = Number(lng)
      payload.locationName = this.data.locationName || '已选位置'
    } else {
      delete payload.latitude
      delete payload.longitude
      delete payload.locationName
    }
    wx.setStorageSync(KEYS.USER_PROFILE, payload)
    wx.showToast({ title: '已保存' })
  }
})
