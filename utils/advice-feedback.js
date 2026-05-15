/**
 * 建议反馈公共逻辑，供 index 和 lottery 页共用。
 */

var KEYS = require('./storage-keys.js')

function handleLike(page) {
  if (page.data.adviceFbDone) return
  page.setData({ adviceFbDone: true })
  try {
    var fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || { liked: {}, dislikedTexts: [], likedCats: {}, dislikedCats: {} }
    if (!fb.likedCats) fb.likedCats = {}
    var structured = page.data.adviceStructured || []
    structured.forEach(function (s) {
      if (s.cat) fb.likedCats[s.cat] = (fb.likedCats[s.cat] || 0) + 1
    })
    wx.setStorageSync(KEYS.ADVICE_FEEDBACK, fb)
    var cache = wx.getStorageSync(KEYS.LOTTERY_TODAY)
    if (cache) { cache.adviceFbDone = true; wx.setStorageSync(KEYS.LOTTERY_TODAY, cache) }
  } catch (e) { console.warn('advice-feedback like error', e) }
  wx.showToast({ title: '感谢反馈', icon: 'none' })
}

function handleSkip(page) {
  if (page.data.adviceFbDone) return
  page.setData({ adviceFbDone: true })
  try {
    var fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || { liked: {}, dislikedTexts: [], likedCats: {}, dislikedCats: {} }
    if (!fb.dislikedCats) fb.dislikedCats = {}
    var structured = page.data.adviceStructured || []
    structured.forEach(function (s) {
      if (s.cat) fb.dislikedCats[s.cat] = (fb.dislikedCats[s.cat] || 0) + 1
    })
    var list = page.data.adviceList || []
    var texts = list.map(function (l) { return String(l).replace(/^\s*\d+\.\s*/, '').trim() }).filter(Boolean)
    var st = new Set(fb.dislikedTexts || [])
    texts.forEach(function (t) { st.add(t) })
    fb.dislikedTexts = Array.from(st).slice(-50)
    wx.setStorageSync(KEYS.ADVICE_FEEDBACK, fb)
    var cache = wx.getStorageSync(KEYS.LOTTERY_TODAY)
    if (cache) { cache.adviceFbDone = true; wx.setStorageSync(KEYS.LOTTERY_TODAY, cache) }
  } catch (e) { console.warn('advice-feedback skip error', e) }
  wx.showToast({ title: '已记录', icon: 'none' })
}

module.exports = { handleLike: handleLike, handleSkip: handleSkip }
