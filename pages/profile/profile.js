const KEYS = require('../../utils/storage-keys.js')
const backup = require('../../utils/data-backup.js')
const { computeRank } = require('../../utils/cultivation-rank.js')
const {
  getProvinceLabels,
  getCityLabels,
  getCountryLabels,
  getCountryCode
} = require('../../utils/region-cn.js')
const { geocodeFromProfileParts } = require('../../utils/geocode.js')

const GENDER_KEYS = ['unknown', 'male', 'female']
const GENDER_LABELS = ['保密 / 跳过', '男', '女']

const RECENT_LABELS = ['-', '偏低沉 / 易疲', '平稳', '较充沛 / 偏积极']
const RECENT_VALUES = [null, 'low', 'mid', 'high']

const EMOTION_LABELS = [
  '自动（据近期状态与道性推测）',
  '偏安抚（心浮气躁时）',
  '偏鼓励（低落时）',
  '偏同理（易怒好辩时）',
  '仅中性签条（语气均衡）'
]
const EMOTION_VALUES = [null, 'soothe', 'encourage', 'empathy', 'neutral_only']

const RHYTHM_LABELS = ['-', '作息规律', '晚睡早起', '偏早起', '偏夜猫', '作息不太规律']
const RHYTHM_VALUES = [null, 'regular', 'late_early', 'early', 'night', 'irregular']

const STYLE_LABELS = ['-', '简练', '详尽', '略偏文言感', '白话分行（易读）']
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

const PLACEHOLDER_PROVINCE = ['—']
const PLACEHOLDER_CITY = ['—']

function indexFromValue(values, v) {
  const i = values.indexOf(v)
  return i >= 0 ? i : 0
}

function buildFocusChips(selectedIds) {
  const sel = new Set(selectedIds || [])
  return FOCUS_OPTIONS.map((o) => ({ id: o.id, label: o.label, on: sel.has(o.id) }))
}

function findProvinceIndex(name) {
  if (!name) return 0
  const list = getProvinceLabels()
  const i = list.indexOf(name)
  return i >= 0 ? i : 0
}

function findCityIndex(provinceIndex, cityName) {
  if (!cityName) return 0
  const cities = getCityLabels(provinceIndex)
  const i = cities.indexOf(cityName)
  return i >= 0 ? i : 0
}

const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordBiz } = require('../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    formExpanded: false,
    profileSummary: '',
    age: '',
    birthMonth: '',
    genderIndex: 0,
    genderLabels: GENDER_LABELS,
    countryLabels: getCountryLabels(),
    countryIndex: 0,
    provinceLabels: getProvinceLabels(),
    provinceIndex: 0,
    cityLabels: getCityLabels(0),
    cityIndex: 0,
    addrIsOther: false,
    addrDetail: '',
    addrSummary: '',
    hasAddressText: false,
    geocodeHint: '',
    recentLabels: RECENT_LABELS,
    recentIndex: 0,
    emotionLabels: EMOTION_LABELS,
    emotionIndex: 0,
    rhythmLabels: RHYTHM_LABELS,
    rhythmIndex: 0,
    styleLabels: STYLE_LABELS,
    styleIndex: 0,
    focusChips: buildFocusChips([]),
    focusTagsSelected: [],
    largeFont: false,
    rankInfo: null
  },

  onLoad(opts) {
    if (opts && opts.expand === '1') {
      this._fromExpand = true
      this.setData({ formExpanded: true })
    }
  },

  toggleForm() {
    this.setData({ formExpanded: !this.data.formExpanded })
  },

  _goHomeAfterSave() {
    if (this._fromExpand) {
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 1000)
    }
  },

  goFortuneTrend() {
    wx.navigateTo({ url: '/pages/fortune-trend/fortune-trend' })
  },

  goLotHall() {
    wx.navigateTo({ url: '/pages/lot-hall/lot-hall' })
  },

  goAchieveHall() {
    wx.navigateTo({ url: '/pages/achieve-hall/achieve-hall' })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/report' })
  },

  goTheoryIntro() {
    wx.navigateTo({ url: '/pages/theory-intro/theory-intro' })
  },

  goTreeHole() {
    wx.navigateTo({ url: '/pages/tree-hole/tree-hole' })
  },

  goAnnualReport() {
    wx.navigateTo({ url: '/pages/annual-report/annual-report' })
  },

  goCompatibility() {
    wx.navigateTo({ url: '/pages/compatibility/compatibility' })
  },

  applyCountryIndex(ci, resetPc) {
    const countryLabels = getCountryLabels()
    const idx = Math.max(0, Math.min(countryLabels.length - 1, ci | 0))
    const code = getCountryCode(idx)
    const isOther = code === 'OTHER'
    let provinceLabels
    let cityLabels
    let provinceIndex
    let cityIndex
    if (isOther) {
      provinceLabels = PLACEHOLDER_PROVINCE
      cityLabels = PLACEHOLDER_CITY
      provinceIndex = 0
      cityIndex = 0
    } else {
      provinceLabels = getProvinceLabels()
      provinceIndex = resetPc ? 0 : Math.min(this.data.provinceIndex || 0, provinceLabels.length - 1)
      cityLabels = getCityLabels(provinceIndex)
      cityIndex = resetPc ? 0 : Math.min(this.data.cityIndex || 0, cityLabels.length - 1)
    }
    this.setData({
      countryIndex: idx,
      addrIsOther: isOther,
      provinceLabels,
      provinceIndex,
      cityLabels,
      cityIndex
    })
  },

  onCountryPick(e) {
    const v = Number(e.detail.value) || 0
    this.applyCountryIndex(v, true)
  },

  onProvincePick(e) {
    if (this.data.addrIsOther) return
    const pi = Number(e.detail.value) || 0
    const cityLabels = getCityLabels(pi)
    this.setData({
      provinceIndex: pi,
      cityLabels,
      cityIndex: 0
    })
  },

  onCityPick(e) {
    if (this.data.addrIsOther) return
    this.setData({ cityIndex: Number(e.detail.value) || 0 })
  },

  onAddrDetail(e) {
    this.setData({ addrDetail: e.detail.value })
  },

  clearAddress() {
    this.applyCountryIndex(0, true)
    this.setData({
      addrDetail: '',
      addrSummary: '',
      hasAddressText: false,
      geocodeHint: ''
    })
    const prev = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const next = { ...prev }
    delete next.addrCountryCode
    delete next.addrProvince
    delete next.addrCity
    delete next.addrDetail
    delete next.latitude
    delete next.longitude
    delete next.locationName
    wx.setStorageSync(KEYS.USER_PROFILE, next)
    wx.showToast({ title: '已清除地区', icon: 'none' })
  },

  buildSummaryFromForm() {
    const cname = this.data.countryLabels[this.data.countryIndex] || ''
    if (this.data.addrIsOther) {
      const d = (this.data.addrDetail || '').trim()
      return d ? `${cname} · ${d}` : cname
    }
    const p = this.data.provinceLabels[this.data.provinceIndex] || ''
    const city = this.data.cityLabels[this.data.cityIndex] || ''
    const d = (this.data.addrDetail || '').trim()
    const parts = [cname, p, city].filter(Boolean)
    if (d) parts.push(d)
    return parts.join(' · ')
  },

  refreshAddressFlags() {
    const summary = this.buildSummaryFromForm()
    const has =
      !this.data.addrIsOther ||
      (this.data.addrDetail || '').trim().length > 0 ||
      this.data.countryIndex > 0
    this.setData({
      addrSummary: summary,
      hasAddressText: !!summary && summary !== (this.data.countryLabels[this.data.countryIndex] || '')
    })
  },

  onShow() {
    try { this.setData({ rankInfo: computeRank() }) } catch (e) { console.warn('profile:rank', e) }

    const p = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    let gi = 0
    if (p.gender === 'male') gi = 1
    else if (p.gender === 'female') gi = 2
    const tags = Array.isArray(p.focusTags) ? p.focusTags.filter(Boolean) : []

    const countryLabels = getCountryLabels()
    let countryIndex = 0
    if (p.addrCountryCode === 'OTHER') countryIndex = 1
    const addrIsOther = countryIndex === 1

    let provinceLabels = getProvinceLabels()
    let provinceIndex = 0
    let cityLabels = getCityLabels(0)
    let cityIndex = 0
    let addrDetail = typeof p.addrDetail === 'string' ? p.addrDetail : ''

    const legacyMap =
      !p.addrCountryCode &&
      p.latitude != null &&
      p.longitude != null &&
      !Number.isNaN(Number(p.latitude)) &&
      !Number.isNaN(Number(p.longitude))

    if (addrIsOther) {
      provinceLabels = PLACEHOLDER_PROVINCE
      cityLabels = PLACEHOLDER_CITY
    } else if (p.addrProvince) {
      provinceIndex = findProvinceIndex(p.addrProvince)
      cityLabels = getCityLabels(provinceIndex)
      cityIndex = findCityIndex(provinceIndex, p.addrCity)
    } else if (legacyMap) {
      addrDetail = p.locationName || addrDetail || ''
    }

    const hasCoords =
      p.latitude != null &&
      p.longitude != null &&
      !Number.isNaN(Number(p.latitude)) &&
      !Number.isNaN(Number(p.longitude))

    let geocodeHint = ''
    if (legacyMap) {
      geocodeHint = '曾使用地图选点，请改选下方省/市后保存；当前仍可临时用于天气。'
    } else if (hasCoords) {
      geocodeHint = '已保存可用于天气的坐标（保存时会按当前地区重新解析）'
    }

    const summary =
      p.locationName ||
      [p.addrCountryCode === 'OTHER' ? '其他' : '中国', p.addrProvince, p.addrCity, p.addrDetail]
        .filter(Boolean)
        .join(' · ')

    this.setData({
      age: p.age != null && p.age !== '' ? String(p.age) : '',
      birthMonth: p.birthMonth != null && p.birthMonth !== '' ? String(p.birthMonth) : '',
      genderIndex: gi,
      countryLabels,
      countryIndex,
      addrIsOther,
      provinceLabels,
      provinceIndex,
      cityLabels,
      cityIndex,
      addrDetail,
      addrSummary: summary || '',
      hasAddressText: !!(
        p.addrProvince ||
        p.addrCity ||
        (p.addrDetail && String(p.addrDetail).trim()) ||
        p.addrCountryCode === 'OTHER' ||
        legacyMap
      ),
      geocodeHint,
      recentIndex: indexFromValue(RECENT_VALUES, p.recentState),
      emotionIndex: indexFromValue(EMOTION_VALUES, p.emotionTendency),
      rhythmIndex: indexFromValue(RHYTHM_VALUES, p.rhythmType),
      styleIndex: indexFromValue(STYLE_VALUES, p.lotStylePref),
      focusTagsSelected: tags,
      focusChips: buildFocusChips(tags)
    })

    if (!addrIsOther && p.addrProvince) {
      this.setData({
        cityLabels: getCityLabels(provinceIndex),
        cityIndex: findCityIndex(provinceIndex, p.addrCity)
      })
    }

    try {
      const lf = wx.getStorageSync(KEYS.LARGE_FONT)
      this.setData({ largeFont: !!lf })
    } catch (e) { console.warn('profile:largeFont', e) }

    this._refreshSummary(p)
  },

  _refreshSummary(p) {
    if (!p) p = wx.getStorageSync(KEYS.USER_PROFILE) || {}
    const parts = []
    if (p.recentState) parts.push(RECENT_LABELS[RECENT_VALUES.indexOf(p.recentState)] || '')
    if (p.age) parts.push(`${p.age}岁`)
    if (p.gender === 'male') parts.push('男')
    else if (p.gender === 'female') parts.push('女')
    if (p.addrProvince) parts.push(p.addrProvince)
    const filled = parts.filter(Boolean).join(' · ')
    this.setData({ profileSummary: filled || '尚未填写档案信息' })
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
  onEmotionPick(e) {
    this.setData({ emotionIndex: Number(e.detail.value) || 0 })
  },
  onRhythmPick(e) {
    this.setData({ rhythmIndex: Number(e.detail.value) || 0 })
  },
  onStylePick(e) {
    this.setData({ styleIndex: Number(e.detail.value) || 0 })
  },

  onLargeFontChange(e) {
    const val = !!e.detail.value
    this.setData({ largeFont: val })
    try {
      wx.setStorageSync(KEYS.LARGE_FONT, val)
    } catch (e2) {}
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

  async onExport() {
    wx.showLoading({ title: '导出中...' })
    try {
      const res = await backup.exportData()
      wx.hideLoading()
      if (res.method === 'file') {
        wx.showToast({ title: res.msg || '已保存到本地', icon: 'none' })
      } else {
        wx.showToast({ title: '导出成功', icon: 'success' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showModal({ title: '导出失败', content: e.message || '未知错误', showCancel: false })
    }
  },

  async onImport() {
    try {
      const confirm = await new Promise((resolve) => {
        wx.showModal({
          title: '导入数据',
          content: '导入将覆盖当前数据，确定继续？',
          success: (r) => resolve(r.confirm)
        })
      })
      if (!confirm) return

      const res = await backup.importData()
      if (res.cancelled) return
      if (res.ok) {
        wx.showToast({ title: `已恢复 ${res.restored} 项数据`, icon: 'success' })
        setTimeout(() => this.onShow(), 800)
      }
    } catch (e) {
      wx.showModal({ title: '导入失败', content: e.message || '未知错误', showCancel: false })
    }
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
    const em = EMOTION_VALUES[this.data.emotionIndex]
    const rh = RHYTHM_VALUES[this.data.rhythmIndex]
    const sp = STYLE_VALUES[this.data.styleIndex]
    const ft = (this.data.focusTagsSelected || []).slice()

    if (rs) payload.recentState = rs
    else delete payload.recentState
    if (em != null && em !== '') payload.emotionTendency = em
    else delete payload.emotionTendency
    if (rh) payload.rhythmType = rh
    else delete payload.rhythmType
    if (sp) payload.lotStylePref = sp
    else delete payload.lotStylePref
    if (ft.length) payload.focusTags = ft
    else delete payload.focusTags

    const cc = getCountryCode(this.data.countryIndex)
    const detailTrim = (this.data.addrDetail || '').trim()
    const isOther = cc === 'OTHER'

    if (isOther) {
      if (!detailTrim) {
        delete payload.addrCountryCode
        delete payload.addrProvince
        delete payload.addrCity
        delete payload.addrDetail
        delete payload.latitude
        delete payload.longitude
        delete payload.locationName
        wx.setStorageSync(KEYS.USER_PROFILE, payload)
        recordBiz('profile_save')
        wx.showToast({ title: '已保存' })
        this.setData({ addrSummary: '', hasAddressText: false, geocodeHint: '' })
        this._refreshSummary(payload)
        this._goHomeAfterSave()
        return
      }
      payload.addrCountryCode = 'OTHER'
      payload.addrProvince = ''
      payload.addrCity = ''
      payload.addrDetail = detailTrim
      payload.locationName = `${this.data.countryLabels[this.data.countryIndex] || '其他'} · ${detailTrim}`
    } else {
      const prov = this.data.provinceLabels[this.data.provinceIndex] || ''
      const city = this.data.cityLabels[this.data.cityIndex] || ''
      payload.addrCountryCode = 'CN'
      payload.addrProvince = prov
      payload.addrCity = city
      payload.addrDetail = detailTrim
      payload.locationName = ['中国', prov, city, detailTrim].filter(Boolean).join(' · ')
    }

    const parts = {
      countryCode: cc,
      countryName: this.data.countryLabels[this.data.countryIndex],
      province: isOther ? '' : this.data.provinceLabels[this.data.provinceIndex],
      city: isOther ? '' : this.data.cityLabels[this.data.cityIndex],
      detail: detailTrim
    }

    wx.showLoading({ title: '解析坐标…', mask: true })
    geocodeFromProfileParts(parts).then((coords) => {
      wx.hideLoading()
      if (coords) {
        payload.latitude = coords.lat
        payload.longitude = coords.lng
        this.setData({ geocodeHint: '已解析坐标，抽取时将结合当地天气' })
      } else {
        delete payload.latitude
        delete payload.longitude
        this.setData({
          geocodeHint: isOther
            ? '未能解析坐标，天气将略过（仍可保存文字地区）'
            : '未能解析坐标，请检查城市是否准确或稍后再试'
        })
      }
      wx.setStorageSync(KEYS.USER_PROFILE, payload)
      recordBiz('profile_save')
      wx.showToast({ title: '已保存' })
      this.setData({
        addrSummary: payload.locationName || '',
        hasAddressText: true
      })
      this._refreshSummary(payload)
      this._goHomeAfterSave()
    })
  }
})
