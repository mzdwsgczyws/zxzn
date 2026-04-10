const { QUESTIONS, calculatePersonality } = require('../../../utils/personality.js')
const KEYS = require('../../../utils/storage-keys.js')
const pageAnalytics = require('../../../behaviors/page-analytics.js')
const { recordBiz } = require('../../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],
  data: {
    total: QUESTIONS.length,
    currentIndex: 0,
    current: null,
    progress: 0,
    answers: {}
  },

  onLoad() {
    this.setQuestion(0)
  },

  setQuestion(index) {
    const current = QUESTIONS[index]
    const progress = Math.round(((index + 1) / QUESTIONS.length) * 100)
    this.setData({ currentIndex: index, current, progress })
  },

  choose(e) {
    const side = e.currentTarget.dataset.side
    const { currentIndex, answers, total } = this.data
    const q = QUESTIONS[currentIndex]
    const next = { ...answers, [q.id]: side }

    if (currentIndex + 1 >= total) {
      recordBiz('quiz_done')
      const result = calculatePersonality(next)
      const payload = {
        ...result,
        finishedAt: Date.now()
      }
      wx.setStorageSync(KEYS.PERSONALITY_RESULT, payload)
      wx.redirectTo({
        url: '/pages/personality/result/result?from=quiz'
      })
      return
    }

    this.setData({ answers: next })
    this.setQuestion(currentIndex + 1)
  }
})
