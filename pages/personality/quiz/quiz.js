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
    answers: {},
    selectedIdx: -1
  },

  onLoad() {
    this.setQuestion(0)
  },

  setQuestion(index) {
    const current = QUESTIONS[index]
    const progress = Math.round(((index + 1) / QUESTIONS.length) * 100)
    const existing = this.data.answers[current.id]
    this.setData({
      currentIndex: index,
      current,
      progress,
      selectedIdx: existing != null ? existing : -1
    })
  },

  choose(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const { currentIndex, answers, total } = this.data
    const q = QUESTIONS[currentIndex]
    const next = { ...answers, [q.id]: idx }

    this.setData({ answers: next, selectedIdx: idx })

    setTimeout(() => {
      if (currentIndex + 1 >= total) {
        recordBiz('quiz_done')
        const result = calculatePersonality(next, { earlyExit: false })
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
      this.setQuestion(currentIndex + 1)
    }, 280)
  },

  goPrev() {
    const { currentIndex } = this.data
    if (currentIndex <= 0) return
    this.setQuestion(currentIndex - 1)
  },

  /** 未答部分按中性估算，并叠提前交卷偏置 */
  finishEarly() {
    const { answers } = this.data
    const n = Object.keys(answers).length
    const tip =
      n === 0
        ? '你尚未选择任何一题。未答题将按各维「无信息」估算，并略体现希望尽快看到结果的倾向。确定继续？'
        : `已答 ${n} 题。未答题目将按各维「无信息」估算，并略体现「提前结束、求简求结果」的倾向。确定直接看结果？`
    wx.showModal({
      title: '提前看结果',
      content: tip,
      confirmText: '确定',
      cancelText: '继续做题',
      success: (res) => {
        if (!res.confirm) return
        recordBiz('quiz_early_exit', { answered: n })
        const result = calculatePersonality(answers, { earlyExit: true })
        const payload = { ...result, finishedAt: Date.now() }
        wx.setStorageSync(KEYS.PERSONALITY_RESULT, payload)
        wx.redirectTo({ url: '/pages/personality/result/result?from=quiz' })
      }
    })
  }
})
