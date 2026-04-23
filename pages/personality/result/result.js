const KEYS = require('../../../utils/storage-keys.js')
const pageAnalytics = require('../../../behaviors/page-analytics.js')
const { recordShare } = require('../../../utils/usage-analytics.js')

const SHARE_PORTRAIT = { x: 302, y: 22, w: 184, h: 184 }
const POSTER_PORTRAIT = { x: 56, y: 288, w: 300, h: 300 }
/** 海报用小程序码图（与十六型图同目录，便于分包预载） */
const MINI_CODE_SRCS = [
  '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
  '/subpackages/portrait-assets/images/personality-portraits/index.png'
]
const POSTER_W = 750
const POSTER_H = 1200
/** 二维码海报区域：右上方，分享时与签文同屏 */
const MINI_CODE_BOX = { x: 550, y: 52, w: 168, h: 168 }
const POSTER_FONT = 'system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

function getImageInfoPath(src) {
  return new Promise((resolve) => {
    wx.getImageInfo({
      src,
      success: (i) => resolve(i && i.path ? i.path : ''),
      fail: () => resolve('')
    })
  })
}

async function firstImagePathAndSrc(sources) {
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i]
    const p = await getImageInfoPath(s)
    if (p) return { path: p, packSrc: s }
  }
  return { path: '', packSrc: sources[0] || '' }
}

function personalityPortraitCandidates(tid) {
  const n = Number(tid)
  const id = Number.isFinite(n) && n >= 0 && n <= 15 ? Math.floor(n) : 0
  const base = '/subpackages/portrait-assets/images/personality-portraits/'
  return [`${base}${id}.jpg`, `${base}${id}.png`]
}

function loadPortraitSubpackage() {
  return new Promise((resolve) => {
    if (typeof wx.loadSubpackage !== 'function') {
      resolve()
      return
    }
    wx.loadSubpackage({
      name: 'portrait-assets',
      success: () => resolve(),
      fail: () => resolve()
    })
  })
}

function createImageCompat(canvas) {
  if (canvas && typeof canvas.createImage === 'function') return canvas.createImage()
  if (typeof wx.createImage === 'function') return wx.createImage()
  return null
}

function readFileDataUrl(filePath) {
  return new Promise((resolve) => {
    if (!filePath) {
      resolve('')
      return
    }
    try {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (r) => {
          const ext = String(filePath.split('.').pop() || 'jpg').toLowerCase()
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
          resolve(`data:${mime};base64,` + r.data)
        },
        fail: () => resolve('')
      })
    } catch (e) {
      resolve('')
    }
  })
}

function tryImageLoadOnce(canvas, src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = createImageCompat(canvas)
    if (!img) {
      resolve(null)
      return
    }
    const t = setTimeout(() => resolve(null), 5000)
    img.onload = () => {
      clearTimeout(t)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(t)
      resolve(null)
    }
    try {
      img.src = src
    } catch (e) {
      clearTimeout(t)
      resolve(null)
    }
  })
}

async function loadImage2dRobust(canvas, fsPath, packSrc) {
  let img = await tryImageLoadOnce(canvas, fsPath)
  if (img) return img
  if (packSrc && packSrc !== fsPath) {
    img = await tryImageLoadOnce(canvas, packSrc)
    if (img) return img
  }
  if (fsPath) {
    const dataUrl = await readFileDataUrl(fsPath)
    if (dataUrl) {
      img = await tryImageLoadOnce(canvas, dataUrl)
      if (img) return img
    }
  }
  return null
}

function resultTypeId(result) {
  if (!result) return 0
  if (result.typeId != null) return result.typeId
  if (result.id != null) return result.id
  return 0
}

/** 与 utils/personality.js 中 id 0～15 对应；肖像在分包以控制主包体积 */
function personalityPortraitSrc(tid) {
  const n = Number(tid)
  const id = Number.isFinite(n) && n >= 0 && n <= 15 ? Math.floor(n) : 0
  return `/subpackages/portrait-assets/images/personality-portraits/${id}.jpg`
}

function buildQuizMetaLine(result) {
  if (!result) return ''
  const ne = result.neitherCount || 0
  const early = result.earlyExit === true
  if (early && ne > 0) {
    return `本次为提前完成，另有 ${ne} 题选用了「都难选」。结果仅供自察参考。`
  }
  if (early) {
    return '本次为提前完成，未做题目已纳入系统处理。结果仅供自察参考。'
  }
  if (ne > 0) {
    return `有 ${ne} 题选用了「都难选」。结果仅供自察参考。`
  }
  return ''
}

Page({
  behaviors: [pageAnalytics],

  data: {
    hasResult: false,
    result: null,
    scoreList: [],
    shareImg: '',
    portraitSrc: '',
    quizMetaLine: ''
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
      this.setData({ hasResult: false, result: null, scoreList: [], shareImg: '', portraitSrc: '', quizMetaLine: '' })
      return
    }
    const s = result.scores || {}
    const scoreList = [
      { k: '动', v: s['动'] || 0 },
      { k: '刚', v: s['刚'] || 0 },
      { k: '散', v: s['散'] || 0 },
      { k: '显', v: s['显'] || 0 }
    ]
    const portraitSrc = personalityPortraitSrc(resultTypeId(result))
    const quizMetaLine = buildQuizMetaLine(result)
    this.setData({ hasResult: true, result, scoreList, shareImg: '', portraitSrc, quizMetaLine }, () => {
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
    const src = personalityPortraitSrc(resultTypeId(result))
    wx.getImageInfo({
      src,
      success: (info) => this._paintShareCard(result, info.path),
      fail: () => this._paintShareCard(result, '')
    })
  },

  _paintShareCard(result, portraitLocalPath) {
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

    if (portraitLocalPath) {
      ctx.drawImage(
        portraitLocalPath,
        SHARE_PORTRAIT.x,
        SHARE_PORTRAIT.y,
        SHARE_PORTRAIT.w,
        SHARE_PORTRAIT.h
      )
    } else {
      ctx.setFillStyle('#d7cfc4')
      ctx.fillRect(SHARE_PORTRAIT.x, SHARE_PORTRAIT.y, SHARE_PORTRAIT.w, SHARE_PORTRAIT.h)
    }

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
    this._exportPoster2d().catch((e) => {
      console.warn('export poster', e)
      wx.showToast({ title: '生成图片失败，请重试', icon: 'none' })
    })
  },

  _getPosterCanvas2d() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery().in(this)
      query
        .select('#posterCanvas2d')
        .fields({ node: true, size: true })
        .exec((res) => {
          const r = res && res[0]
          if (!r || !r.node) {
            reject(new Error('no canvas'))
            return
          }
          const canvas = r.node
          if (!canvas.getContext) {
            reject(new Error('no getContext'))
            return
          }
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('no 2d context'))
            return
          }
          const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
          const dpr = Math.min(sys.pixelRatio || 2, 3)
          canvas.width = Math.floor(POSTER_W * dpr)
          canvas.height = Math.floor(POSTER_H * dpr)
          ctx.scale(dpr, dpr)
          ctx.textBaseline = 'alphabetic'
          resolve({ canvas, ctx, dpr })
        })
    })
  },

  async _exportPoster2d() {
    const { result } = this.data
    if (!result) return
    wx.showLoading({ title: '生成中', mask: true })
    try {
      await loadPortraitSubpackage()
      const tid = resultTypeId(result)
      const [portraitRes, indexRes] = await Promise.all([
        firstImagePathAndSrc(personalityPortraitCandidates(tid)),
        firstImagePathAndSrc(MINI_CODE_SRCS)
      ])
      const { canvas, ctx } = await this._getPosterCanvas2d()
      const [imgPortrait, imgCode] = await Promise.all([
        loadImage2dRobust(canvas, portraitRes.path, portraitRes.packSrc),
        loadImage2dRobust(canvas, indexRes.path, indexRes.packSrc)
      ])
      const needLegacy =
        (portraitRes.path && !imgPortrait) || (indexRes.path && !imgCode)
      if (needLegacy) {
        await this._exportPosterLegacy(result, portraitRes.path, indexRes.path)
        return
      }
      this._paintPoster2dContent(ctx, result, {
        imgPortrait,
        imgCode,
        indexPath: indexRes.path
      })
      try {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            wx.canvasToTempFilePath(
              {
                type: '2d',
                canvas,
                fileType: 'png',
                quality: 1,
                success: (r) => {
                  this.saveFile(r.tempFilePath)
                  resolve()
                },
                fail: (e) => {
                  console.warn('canvasToTempFilePath 2d', e)
                  reject(e)
                }
              },
              this
            )
          }, 100)
        )
      } catch (e) {
        if (portraitRes.path || indexRes.path) {
          console.warn('2d toTemp 失败，改旧版 canvas', e)
          await this._exportPosterLegacy(result, portraitRes.path, indexRes.path)
        } else {
          throw e
        }
      }
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 真机部分环境下 2D createImage 无法解码分包图，但旧版 drawImage(本地路径字符串) 可用
   */
  _exportPosterLegacy(result, portraitPath, indexPath) {
    const ctx = wx.createCanvasContext('posterCanvasLegacy', this)
    return new Promise((resolve, reject) => {
      this._paintPosterLegacyContent(ctx, result, portraitPath, indexPath, () => {
        setTimeout(() => {
          const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
          const dpr = Math.min(sys.pixelRatio || 2, 3)
          wx.canvasToTempFilePath(
            {
              canvasId: 'posterCanvasLegacy',
              x: 0,
              y: 0,
              width: POSTER_W,
              height: POSTER_H,
              destWidth: Math.floor(POSTER_W * dpr),
              destHeight: Math.floor(POSTER_H * dpr),
              fileType: 'png',
              quality: 1,
              success: (r) => {
                this.saveFile(r.tempFilePath)
                resolve()
              },
              fail: (e) => {
                console.warn('canvasToTempFilePath legacy', e)
                reject(e)
              }
            },
            this
          )
        }, 220)
      })
    })
  },

  _paintPosterLegacyContent(ctx, result, portraitPath, indexPath, done) {
    const W = POSTER_W
    const H = POSTER_H

    ctx.setFillStyle('#0d1642')
    ctx.fillRect(0, 0, W, H)

    ctx.setFillStyle('#f5f0e8')
    ctx.fillRect(32, 32, W - 64, H - 64)

    ctx.setFillStyle('#1a237e')
    ctx.fillRect(32, 32, W - 64, 20)
    ctx.fillRect(32, H - 52, W - 64, 20)

    ctx.setFillStyle('#c9a227')
    ctx.fillRect(56, 72, W - 112, 4)

    if (indexPath) {
      const b = MINI_CODE_BOX
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      ctx.setStrokeStyle('#c9a227')
      ctx.setLineWidth(2)
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      try {
        ctx.drawImage(indexPath, b.x, b.y, b.w, b.h)
      } catch (e) {
        console.warn('legacy drawImage index', e)
      }
      ctx.setFillStyle('#5c4d3d')
      ctx.setFontSize(19)
      ctx.fillText('微信扫一扫，使用本小程序', b.x, b.y + b.h + 30)
    }

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

    if (portraitPath) {
      try {
        ctx.drawImage(
          portraitPath,
          POSTER_PORTRAIT.x,
          POSTER_PORTRAIT.y,
          POSTER_PORTRAIT.w,
          POSTER_PORTRAIT.h
        )
      } catch (e) {
        console.warn('legacy drawImage portrait', e)
        ctx.setFillStyle('#d7cfc4')
        ctx.fillRect(
          POSTER_PORTRAIT.x,
          POSTER_PORTRAIT.y,
          POSTER_PORTRAIT.w,
          POSTER_PORTRAIT.h
        )
      }
    } else {
      ctx.setFillStyle('#d7cfc4')
      ctx.fillRect(POSTER_PORTRAIT.x, POSTER_PORTRAIT.y, POSTER_PORTRAIT.w, POSTER_PORTRAIT.h)
    }

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

    ctx.draw(false, done)
  },

  _paintPoster2dContent(
    ctx,
    result,
    { imgPortrait, imgCode, indexPath }
  ) {
    const W = POSTER_W
    const H = POSTER_H
    const f = (px) => `${px}px ${POSTER_FONT}`

    ctx.fillStyle = '#0d1642'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#f5f0e8'
    ctx.fillRect(32, 32, W - 64, H - 64)

    ctx.fillStyle = '#1a237e'
    ctx.fillRect(32, 32, W - 64, 20)
    ctx.fillRect(32, H - 52, W - 64, 20)

    ctx.fillStyle = '#c9a227'
    ctx.fillRect(56, 72, W - 112, 4)

    if (indexPath) {
      const b = MINI_CODE_BOX
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      ctx.strokeStyle = '#c9a227'
      ctx.lineWidth = 2
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      if (imgCode) {
        ctx.drawImage(imgCode, b.x, b.y, b.w, b.h)
      } else {
        ctx.fillStyle = '#ede8df'
        ctx.fillRect(b.x, b.y, b.w, b.h)
        ctx.fillStyle = '#7d6a58'
        ctx.font = f(16)
        ctx.fillText('小程序码未加载', b.x + 12, b.y + 92)
      }
      ctx.fillStyle = '#5c4d3d'
      ctx.font = f(19)
      ctx.fillText('微信扫一扫，使用本小程序', b.x, b.y + b.h + 30)
    }

    ctx.fillStyle = '#1a237e'
    ctx.font = f(32)
    ctx.fillText('道性十六型 · 结果海报', 56, 118)

    ctx.font = f(24)
    ctx.fillText('当前更接近（非固定标签）', 56, 158)

    ctx.font = f(38)
    const name = result.typeName || ''
    ctx.fillText(name.length > 11 ? name.slice(0, 11) + '…' : name, 56, 208)

    ctx.fillStyle = '#6d4c41'
    ctx.font = f(26)
    ctx.fillText('形象取意：' + (result.figure || ''), 56, 252)

    if (imgPortrait) {
      ctx.drawImage(
        imgPortrait,
        POSTER_PORTRAIT.x,
        POSTER_PORTRAIT.y,
        POSTER_PORTRAIT.w,
        POSTER_PORTRAIT.h
      )
    } else {
      ctx.fillStyle = '#d7cfc4'
      ctx.fillRect(POSTER_PORTRAIT.x, POSTER_PORTRAIT.y, POSTER_PORTRAIT.w, POSTER_PORTRAIT.h)
    }

    ctx.fillStyle = '#3e3428'
    ctx.font = f(24)
    const summaryY = POSTER_PORTRAIT.y + POSTER_PORTRAIT.h + 36
    let y = this.drawLines2d(ctx, result.summary || '', 56, summaryY, 22, 32)

    y = Math.max(y + 28, summaryY + 120)
    ctx.fillStyle = '#3949ab'
    ctx.font = f(26)
    ctx.fillText('四维概览', 56, y)
    y += 40
    const scores = result.scores || {}
    ctx.fillStyle = '#4a4034'
    ctx.font = f(24)
    ;['动', '刚', '散', '显'].forEach((k) => {
      ctx.fillText(`${k} ${scores[k] || 0}%`, 56, y)
      y += 36
    })

    y += 24
    ctx.fillStyle = '#3949ab'
    ctx.font = f(26)
    ctx.fillText('自修建议（摘录）', 56, y)
    y += 40
    ctx.fillStyle = '#4a4034'
    ctx.font = f(22)
    const adv = (result.advice || []).slice(0, 5)
    adv.forEach((line) => {
      y = this.drawLines2d(ctx, '· ' + line, 56, y, 26, 28) + 8
    })

    ctx.fillStyle = '#a0907c'
    ctx.font = f(20)
    ctx.fillText('量化自修正念 · 仅供文化参考', 56, H - 56)
  },

  drawLines2d(ctx, text, x, startY, maxCharsPerLine, lineHeight) {
    const s = String(text).replace(/\n/g, '')
    let y = startY
    for (let i = 0; i < s.length; i += maxCharsPerLine) {
      ctx.fillText(s.slice(i, i + maxCharsPerLine), x, y)
      y += lineHeight
    }
    return y
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
    const runSave = () => {
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => wx.showToast({ title: '已保存到相册' }),
        fail: (err) => {
          const msg = (err && err.errMsg) || ''
          const denied = /auth deny|denied|permission|authorize|拒绝/i.test(msg)
          wx.showModal({
            title: denied ? '需要相册权限' : '保存失败',
            content: denied
              ? '请在设置中开启「保存到相册」后重试。'
              : '可稍后重试或截图本页。',
            confirmText: denied ? '去设置' : '知道了',
            success: (r) => {
              if (denied && r.confirm) wx.openSetting({})
            }
          })
        }
      })
    }

    wx.getSetting({
      success: (res) => {
        const w = res.authSetting['scope.writePhotosAlbum']
        if (w === true) {
          runSave()
          return
        }
        if (w === false) {
          wx.showModal({
            title: '需要相册权限',
            content: '保存高清海报需开启「保存到相册」，请在设置中打开。',
            confirmText: '去设置',
            cancelText: '取消',
            success: (r) => {
              if (r.confirm) wx.openSetting({})
            }
          })
          return
        }
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => runSave(),
          fail: () => {
            wx.showModal({
              title: '需要相册权限',
              content: '请允许保存到相册，以便保存海报。',
              confirmText: '去设置',
              cancelText: '取消',
              success: (r) => {
                if (r.confirm) wx.openSetting({})
              }
            })
          }
        })
      },
      fail: () => runSave()
    })
  }
})
