const SK = require('../../utils/storage-keys')

const SERVICE_NAME = 'tree-hole'

function uuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function fmtDate(d) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  if (isNaN(dt.getTime())) return String(d)
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function callServer(path, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: 'prod-3gfos7n3a3e061a4' },
      path,
      method: 'POST',
      header: { 'X-WX-SERVICE': SERVICE_NAME, 'content-type': 'application/json' },
      data,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          resolve(res.data)
        } else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

Page({
  data: {
    letterContent: '',
    submitting: false,
    flyAnim: false,
    repliedLetters: [],
    pendingLetters: [],
    loaded: false
  },

  onShow() {
    this._loadLetters()
  },

  onInput(e) {
    this.setData({ letterContent: e.detail.value })
  },

  async submitLetter() {
    const content = this.data.letterContent.trim()
    if (!content) return

    const daily = wx.getStorageSync(SK.TREE_HOLE_DAILY) || {}
    const today = todayStr()
    if (daily.date === today && daily.count >= 3) {
      wx.showToast({ title: '今日投信已满 3 封', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const letterToken = uuid()

    try {
      const res = await callServer('/api/submit', { content, letterToken })

      if (res && res.success) {
        const letters = wx.getStorageSync(SK.TREE_HOLE_LETTERS) || []
        letters.unshift({ letterToken, content, createdAt: new Date().toISOString() })
        wx.setStorageSync(SK.TREE_HOLE_LETTERS, letters)

        const newCount = (daily.date === today ? daily.count : 0) + 1
        wx.setStorageSync(SK.TREE_HOLE_DAILY, { date: today, count: newCount })

        this.setData({ letterContent: '', flyAnim: true })
        wx.vibrateShort({ type: 'medium' })

        setTimeout(() => {
          this.setData({ flyAnim: false })
          this._loadLetters()
          wx.showToast({ title: '已投入树洞', icon: 'success' })
        }, 1200)
      } else {
        wx.showToast({ title: (res && res.error) || '投递失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    }

    this.setData({ submitting: false })
  },

  async _loadLetters() {
    const localLetters = wx.getStorageSync(SK.TREE_HOLE_LETTERS) || []
    if (localLetters.length === 0) {
      this.setData({ repliedLetters: [], pendingLetters: [], loaded: true })
      return
    }

    const tokens = localLetters.map(l => l.letterToken)

    try {
      const res = await callServer('/api/query', { letterTokens: tokens })

      if (res && res.success) {
        const serverMap = {}
        res.letters.forEach(l => { serverMap[l.letterToken] = l })

        const replied = []
        const pending = []

        localLetters.forEach(local => {
          const server = serverMap[local.letterToken]
          if (server && server.status === 'replied') {
            replied.push({
              letterToken: server.letterToken,
              content: server.content,
              reply: server.reply,
              repliedAtStr: fmtDate(server.repliedAt)
            })
          } else {
            pending.push({
              letterToken: local.letterToken,
              contentPreview: (local.content || '').substring(0, 40) + ((local.content || '').length > 40 ? '...' : ''),
              createdAtStr: fmtDate(local.createdAt)
            })
          }
        })

        this.setData({ repliedLetters: replied, pendingLetters: pending, loaded: true })
      } else {
        this._fallbackLocal(localLetters)
      }
    } catch (err) {
      this._fallbackLocal(localLetters)
    }
  },

  _fallbackLocal(localLetters) {
    const pending = localLetters.map(l => ({
      letterToken: l.letterToken,
      contentPreview: (l.content || '').substring(0, 40) + ((l.content || '').length > 40 ? '...' : ''),
      createdAtStr: fmtDate(l.createdAt)
    }))
    this.setData({ repliedLetters: [], pendingLetters: pending, loaded: true })
  }
})
