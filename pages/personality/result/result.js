const KEYS = require('../../../utils/storage-keys.js')
const pageAnalytics = require('../../../behaviors/page-analytics.js')
const { recordShare } = require('../../../utils/usage-analytics.js')

Page({
  behaviors: [pageAnalytics],

  data: {
    hasResult: false,
    result: null,
    scoreList: [],
    shareImg: ''
  },

  onShow() {
    this.loadResult()
  },

  onShareAppMessage() {
    recordShare('/pages/personality/result/result')
    const r = this.data.result
    return {
      title: r ? `我的道性状态更接近：${r.typeName}` : '道性十六型测验',
      path: '/pages/personality/result/result',
      imageUrl: this.data.shareImg || ''
    }
  },

  onShareTimeline() {
    recordShare('timeline:personality_result')
    const r = this.data.result
    return {
      title: r ? `道性十六型 · ${r.typeName}` : '道性十六型 · 自我觉察',
      imageUrl: this.data.shareImg || ''
    }
  },

  loadResult() {
    const result = wx.getStorageSync(KEYS.PERSONALITY_RESULT)
    if (!result || !result.typeName) {
      this.setData({ hasResult: false, result: null, scoreList: [], shareImg: '' })
      return
    }
    const s = result.scores || {}
    const scoreList = [
      { k: '动', v: s['动'] || 0 },
      { k: '刚', v: s['刚'] || 0 },
      { k: '散', v: s['散'] || 0 },
      { k: '显', v: s['显'] || 0 }
    ]
    this.setData({ hasResult: true, result, scoreList, shareImg: '' }, () => {
      setTimeout(() => this.renderShareCard(), 200)
    })
  },

  startQuiz() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  retest() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  /** 分享用卡片：500×400 CSS 像素，导出 2x 更清晰 */
  renderShareCard() {
    const result = this.data.result
    if (!result) return
    const ctx = wx.createCanvasContext('shareCanvas', this)
    const W = 500
    const H = 400

    ctx.setFillStyle('#f5f0e8')
    ctx.fillRect(0, 0, W, H)

    ctx.setFillStyle('#1a237e')
    ctx.fillRect(0, 0, W, 14)
    ctx.fillRect(0, H - 14, W, 14)

    ctx.setFillStyle('#d4af37')
    ctx.fillRect(12, 24, W - 24, 3)
    ctx.fillRect(12, H - 36, W - 24, 3)

    ctx.setFillStyle('#1a237e')
    ctx.setFontSize(20)
    ctx.fillText('道性十六型 · 自我觉察卡片', 28, 52)

    ctx.setFontSize(26)
    ctx.fillText('当前更接近（非固定标签）', 28, 82)

    ctx.setFontSize(32)
    const name = result.typeName || ''
    ctx.fillText(name.length > 14 ? name.slice(0, 14) + '…' : name, 28, 128)

    ctx.setFillStyle('#6d4c41')
    ctx.setFontSize(18)
    ctx.fillText('形象取意：' + (result.figure || '—'), 28, 158)

    ctx.setFillStyle('#3e3428')
    ctx.setFontSize(17)
    let y = this.drawLines(ctx, result.summary || '', 28, 188, 20, 24)

    y += 16
    ctx.setFillStyle('#3949ab')
    ctx.setFontSize(17)
    ctx.fillText('四维 · 动 / 刚 / 散 / 显', 28, y)
    y += 28
    const sc = result.scores || {}
    ctx.setFillStyle('#4a4034')
    ctx.setFontSize(16)
    ;['动', '刚', '散', '显'].forEach((k) => {
      ctx.fillText(`${k} ${sc[k] || 0}%`, 28, y)
      y += 22
    })

    ctx.setFillStyle('#a0907c')
    ctx.setFontSize(14)
    ctx.fillText('道性修行 · 仅供文化参考', 28, H - 28)

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath(
          {
            canvasId: 'shareCanvas',
            width: W,
            height: H,
            destWidth: W * 2,
            destHeight: H * 2,
            success: (res) => this.setData({ shareImg: res.tempFilePath }),
            fail: () => {}
          },
          this
        )
      }, 80)
    })
  },

  savePoster() {
    const { result } = this.data
    if (!result) return

    const ctx = wx.createCanvasContext('posterCanvas', this)
    const W = 750
    const H = 1200

    ctx.setFillStyle('#0d1642')
    ctx.fillRect(0, 0, W, H)

    ctx.setFillStyle('#f5f0e8')
    ctx.fillRect(32, 32, W - 64, H - 64)

    ctx.setFillStyle('#1a237e')
    ctx.fillRect(32, 32, W - 64, 20)
    ctx.fillRect(32, H - 52, W - 64, 20)

    ctx.setFillStyle('#c9a227')
    ctx.fillRect(56, 72, W - 112, 4)

    ctx.setFillStyle('#1a237e')
    ctx.setFontSize(32)
    ctx.fillText('道性十六型 · 结果海报', 56, 118)

    ctx.setFontSize(24)
    ctx.fillText('当前更接近（非固定标签）', 56, 158)

    ctx.setFontSize(40)
    const name = result.typeName || ''
    ctx.fillText(name.length > 12 ? name.slice(0, 12) + '…' : name, 56, 220)

    ctx.setFillStyle('#6d4c41')
    ctx.setFontSize(26)
    ctx.fillText('形象取意：' + (result.figure || ''), 56, 268)

    ctx.setFillStyle('#3e3428')
    ctx.setFontSize(24)
    let y = this.drawLines(ctx, result.summary || '', 56, 308, 22, 32)

    y = Math.max(y + 28, 420)
    ctx.setFillStyle('#3949ab')
    ctx.setFontSize(26)
    ctx.fillText('四维概览', 56, y)
    y += 40
    const scores = result.scores || {}
    ctx.setFillStyle('#4a4034')
    ctx.setFontSize(24)
    ;['动', '刚', '散', '显'].forEach((k) => {
      ctx.fillText(`${k} ${scores[k] || 0}%`, 56, y)
      y += 36
    })

    y += 24
    ctx.setFillStyle('#3949ab')
    ctx.setFontSize(26)
    ctx.fillText('修行建议（摘录）', 56, y)
    y += 40
    ctx.setFillStyle('#4a4034')
    ctx.setFontSize(22)
    const adv = (result.advice || []).slice(0, 5)
    adv.forEach((line) => {
      y = this.drawLines(ctx, '· ' + line, 56, y, 26, 28) + 8
    })

    ctx.setFillStyle('#a0907c')
    ctx.setFontSize(20)
    ctx.fillText('道性修行小程序 · 仅供文化参考', 56, H - 56)

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath(
          {
            canvasId: 'posterCanvas',
            success: (res) => this.saveFile(res.tempFilePath),
            fail: () => wx.showToast({ title: '生成图片失败', icon: 'none' })
          },
          this
        )
      }, 120)
    })
  },

  drawLines(ctx, text, x, startY, maxCharsPerLine, lineHeight) {
    const s = String(text).replace(/\n/g, '')
    let y = startY
    for (let i = 0; i < s.length; i += maxCharsPerLine) {
      ctx.fillText(s.slice(i, i + maxCharsPerLine), x, y)
      y += lineHeight
    }
    return y
  },

  saveFile(path) {
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: () => wx.showToast({ title: '已保存到相册' }),
      fail: (err) => {
        const denied = err.errMsg && err.errMsg.indexOf('auth deny') >= 0
        wx.showModal({
          title: denied ? '需要相册权限' : '保存失败',
          content: denied ? '请在设置中开启「保存到相册」后重试。' : '可稍后重试或截图本页。',
          confirmText: denied ? '去设置' : '知道了',
          success: (r) => {
            if (denied && r.confirm) wx.openSetting({})
          }
        })
      }
    })
  }
})
