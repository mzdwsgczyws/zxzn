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
    var myScores = null
    var peerScores = null

    var my = wx.getStorageSync(KEYS.PERSONALITY_RESULT)
    if (my && my.scores) myScores = my.scores

    if (opts && opts.typeId) {
      try {
        var { PERSONALITY_TYPES } = require('../../utils/personality.js')
        var peerType = PERSONALITY_TYPES[Number(opts.typeId)]
        if (peerType && peerType.vector) {
          var v = peerType.vector
          peerScores = {
            动: Math.round(v[0] * 100),
            刚: Math.round(v[1] * 100),
            散: Math.round(v[2] * 100),
            显: Math.round(v[3] * 100)
          }
        }
      } catch (e) {
        console.warn('compatibility: failed to load peer type', e)
      }
    }

    this.setData({ myScores: myScores, peerScores: peerScores })
    this._compute(myScores, peerScores)
  },

  _compute(myScores, peerScores) {
    myScores = myScores || this.data.myScores
    peerScores = peerScores || this.data.peerScores
    if (!myScores || !peerScores) return
    var result = computeCompatibility(myScores, peerScores)
    this.setData({ result: result })
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
