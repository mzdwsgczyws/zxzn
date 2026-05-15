const KEYS = require('../../utils/storage-keys.js')
const { computeCompatibility } = require('../../utils/compatibility.js')
const pageAnalytics = require('../../behaviors/page-analytics.js')
const { recordShare } = require('../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    myScores: null,
    peerScores: null,
    result: null
  },

  onLoad(opts) {
    const my = wx.getStorageSync(KEYS.PERSONALITY_RESULT)
    if (my && my.scores) {
      this.setData({ myScores: my.scores })
    }
    if (opts && opts.typeId) {
      try {
        const { PERSONALITY_TYPES } = require('../../utils/personality.js')
        const peerType = PERSONALITY_TYPES[Number(opts.typeId)]
        if (peerType && peerType.vector) {
          const v = peerType.vector
          this.setData({
            peerScores: {
              动: Math.round(v[0] * 100),
              刚: Math.round(v[1] * 100),
              散: Math.round(v[2] * 100),
              显: Math.round(v[3] * 100)
            }
          })
        }
      } catch (e) {}
    }
    this._compute()
  },

  _compute() {
    const { myScores, peerScores } = this.data
    if (!myScores || !peerScores) return
    const result = computeCompatibility(myScores, peerScores)
    this.setData({ result })
  },

  onShareAppMessage() {
    recordShare('/pages/compatibility/compatibility')
    const my = wx.getStorageSync(KEYS.PERSONALITY_RESULT)
    const typeId = my && my.typeId != null ? my.typeId : ''
    return {
      title: '来测测我们的道性配对吧！',
      path: '/pages/compatibility/compatibility?typeId=' + typeId
    }
  },

  goQuiz() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  }
})
