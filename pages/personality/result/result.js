const KEYS = require('../../../utils/storage-keys.js')
const pageAnalytics = require('../../../behaviors/page-analytics.js')
const { recordShare } = require('../../../utils/usage-analytics.js')
const { drawPersonalityPortraitWx } = require('../../../utils/personality-portrait.js')

const PORTRAIT_PX = 280
const SHARE_PORTRAIT = { x: 302, y: 22, w: 184, h: 184 }
const POSTER_PORTRAIT = { x: 56, y: 288, w: 300, h: 300 }

function resultTypeId(result) {
  if (!result) return 0
  if (result.typeId != null) return result.typeId
  if (result.id != null) return result.id
  return 0
}

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
      setTimeout(() => {
        this.renderPortraitCanvas()
        this.renderShareCard()
      }, 200)
    })
  },

  startQuiz() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  retest() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  /** 结果页展示用意象肖像 */
  renderPortraitCanvas() {
    const result = this.data.result
    if (!result) return
    const tid = resultTypeId(result)
    const ctx = wx.createCanvasContext('portraitCanvas', this)
    drawPersonalityPortraitWx(ctx, 0, 0, PORTRAIT_PX, PORTRAIT_PX, tid)
    ctx.draw(false)
  },

  /** 分享用卡片：500×400 CSS 像素，导出 2x 更清晰 */
  renderShareCard() {
    const result = this.data.result
    if (!result) return
    const tid = resultTypeId(result)
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

    drawPersonalityPortraitWx(ctx, SHARE_PORTRAIT.x, SHARE_PORTRAIT.y, SHARE_PORTRAIT.w, SHARE_PORTRAIT.h, tid)

    const leftX = 24
    ctx.setFillStyle('#1a237e')
    ctx.setFontSize(18)
    ctx.fillText('道性十六型 · 自我觉察卡片', leftX, 48)

    ctx.setFontSize(22)
    ctx.fillText('当前更接近（非固定标签）', leftX, 78)

    ctx.setFontSize(28)
    const name = result.typeName || ''
    ctx.fillText(name.length > 11 ? name.slice(0, 11) + '…' : name, leftX, 118)

    ctx.setFillStyle('#6d4c41')
    ctx.setFontSize(16)
    ctx.fillText('形象取意：' + (result.figure || '—'), leftX, 148)

    ctx.setFillStyle('#3e3428')
    ctx.setFontSize(15)
    let y = this.drawLines(ctx, result.summary || '', leftX, 172, 17, 21)

    y += 12
    ctx.setFillStyle('#3949ab')
    ctx.setFontSize(15)
    ctx.fillText('四维 · 动 / 刚 / 散 / 显', leftX, y)
    y += 22
    const sc = result.scores || {}
    ctx.setFillStyle('#4a4034')
    ctx.setFontSize(14)
    ;['动', '刚', '散', '显'].forEach((k) => {
      ctx.fillText(`${k} ${sc[k] || 0}%`, leftX, y)
      y += 19
    })

    ctx.setFillStyle('#a0907c')
    ctx.setFontSize(13)
    ctx.fillText('道性自修 · 仅供文化参考', leftX, H - 26)

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

    const tid = resultTypeId(result)
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

    ctx.setFontSize(38)
    const name = result.typeName || ''
    ctx.fillText(name.length > 11 ? name.slice(0, 11) + '…' : name, 56, 208)

    ctx.setFillStyle('#6d4c41')
    ctx.setFontSize(26)
    ctx.fillText('形象取意：' + (result.figure || ''), 56, 252)

    drawPersonalityPortraitWx(
      ctx,
      POSTER_PORTRAIT.x,
      POSTER_PORTRAIT.y,
      POSTER_PORTRAIT.w,
      POSTER_PORTRAIT.h,
      tid
    )

    ctx.setFillStyle('#3e3428')
    ctx.setFontSize(24)
    const summaryY = POSTER_PORTRAIT.y + POSTER_PORTRAIT.h + 36
    let y = this.drawLines(ctx, result.summary || '', 56, summaryY, 22, 32)

    y = Math.max(y + 28, summaryY + 120)
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
    ctx.fillText('自修建议（摘录）', 56, y)
    y += 40
    ctx.setFillStyle('#4a4034')
    ctx.setFontSize(22)
    const adv = (result.advice || []).slice(0, 5)
    adv.forEach((line) => {
      y = this.drawLines(ctx, '· ' + line, 56, y, 26, 28) + 8
    })

    ctx.setFillStyle('#a0907c')
    ctx.setFontSize(20)
    ctx.fillText('量化自修正念 · 仅供文化参考', 56, H - 56)

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
