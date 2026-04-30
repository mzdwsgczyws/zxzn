const KEYS = require('../../../utils/storage-keys.js')
const pageAnalytics = require('../../../behaviors/page-analytics.js')
const { recordShare } = require('../../../utils/usage-analytics.js')

const SHARE_PORTRAIT = { x: 302, y: 22, w: 184, h: 184 }
/** 与 result.wxml 中 banner.tip 一致 */
const BANNER_TIP =
  '你当前更接近以下状态（非固定标签，可随自修与境遇变化）'
const PORTRAIT_W = 280
const PORTRAIT_H = 280
const PORTRAIT_X = (750 - PORTRAIT_W) / 2
/** 海报用小程序码图（与十六型图同目录，便于分包预载） */
const MINI_CODE_SRCS = [
  '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
  '/subpackages/portrait-assets/images/personality-portraits/index.png'
]
const POSTER_W = 750
/** 二维码：右上方，下方两行说明避免裁切 */
const MINI_CODE_BOX = { x: 538, y: 40, w: 172, h: 172 }
const POSTER_FONT = 'system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

function lineRows(str, cpl) {
  const s = String(str || '').replace(/\n/g, '')
  if (!s) return 0
  return Math.max(1, Math.ceil(s.length / cpl))
}

function applyTextStyle(ctx, is2d, color, fontPx) {
  if (is2d) {
    ctx.fillStyle = color
    ctx.font = `${fontPx}px ${POSTER_FONT}`
  } else {
    ctx.setFillStyle(color)
    ctx.setFontSize(fontPx)
  }
}

/**
 * 与页面长文换行尽量一致，返回最终 y
 */
function drawWrappedLines(ctx, is2d, str, x, y, cpl, lineHeight, color, fontPx) {
  const s = String(str || '').replace(/\n/g, '')
  if (!s) return y
  applyTextStyle(ctx, is2d, color, fontPx)
  let py = y
  for (let i = 0; i < s.length; i += cpl) {
    ctx.fillText(s.slice(i, i + cpl), x, py)
    py += lineHeight
  }
  return py
}

function computePosterHeight(result, metaLine) {
  let y = 100
  y += lineRows(BANNER_TIP, 22) * 28 + 16
  if (metaLine) y += lineRows(metaLine, 22) * 24 + 12
  y = Math.max(y, 280)
  y += PORTRAIT_H + 20
  y += lineRows(String(result.typeName || ''), 16) * 48 + 12
  y += lineRows('历史形象取意：' + (result.figure || ''), 24) * 32 + 16
  y += lineRows(result.summary || '', 24) * 32 + 24
  y += 4 * 36 + 24
  y += 32 + 12
  ;(result.traits || []).forEach((t) => {
    y += lineRows('· ' + t, 24) * 30 + 6
  })
  y += 20
  y += 32 + 12
  ;(result.risks || []).forEach((t) => {
    y += lineRows('· ' + t, 24) * 30 + 6
  })
  y += 20
  y += 32 + 12
  ;(result.advice || []).forEach((t) => {
    y += lineRows('· ' + t, 24) * 30 + 6
  })
  y += 20
  y += 32 + 12
  y += lineRows(result.detail || '', 24) * 32 + 40
  return Math.max(1200, y + 200)
}

/**
 * 与 result 页 wxml 顺序一致：banner → meta → 肖像 → 主卡片全文；右上小程序码
 */
function paintResultPoster(
  ctx,
  {
    is2d,
    H,
    result,
    metaLine,
    imgPortrait,
    imgCode,
    indexPath,
    portraitPath
  }
) {
  const W = POSTER_W

  if (is2d) {
    ctx.fillStyle = '#0d1642'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#f5f0e8'
    ctx.fillRect(32, 32, W - 64, H - 64)
    ctx.fillStyle = '#1a237e'
    ctx.fillRect(32, 32, W - 64, 20)
    ctx.fillRect(32, H - 52, W - 64, 20)
    ctx.fillStyle = '#c9a227'
    ctx.fillRect(56, 72, W - 112, 4)
  } else {
    ctx.setFillStyle('#0d1642')
    ctx.fillRect(0, 0, W, H)
    ctx.setFillStyle('#f5f0e8')
    ctx.fillRect(32, 32, W - 64, H - 64)
    ctx.setFillStyle('#1a237e')
    ctx.fillRect(32, 32, W - 64, 20)
    ctx.fillRect(32, H - 52, W - 64, 20)
    ctx.setFillStyle('#c9a227')
    ctx.fillRect(56, 72, W - 112, 4)
  }

  if (indexPath) {
    const b = MINI_CODE_BOX
    if (is2d) {
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
        applyTextStyle(ctx, true, '#7d6a58', 16)
        ctx.fillText('小程序码未加载', b.x + 12, b.y + 92)
      }
    } else {
      ctx.setFillStyle('#ffffff')
      ctx.fillRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      ctx.setStrokeStyle('#c9a227')
      ctx.setLineWidth(2)
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12)
      try {
        ctx.drawImage(indexPath, b.x, b.y, b.w, b.h)
      } catch (e) {
        console.warn('index draw', e)
        ctx.setFillStyle('#ede8df')
        ctx.fillRect(b.x, b.y, b.w, b.h)
        applyTextStyle(ctx, false, '#7d6a58', 16)
        ctx.fillText('小程序码未加载', b.x + 12, b.y + 92)
      }
    }
    let ty = b.y + b.h + 22
    if (is2d) {
      applyTextStyle(ctx, true, '#5c4d3d', 19)
    } else {
      applyTextStyle(ctx, false, '#5c4d3d', 19)
    }
    ctx.fillText('微信扫一扫', b.x, ty)
    ctx.fillText('使用本小程序', b.x, ty + 26)
  }

  let y = 100
  y = drawWrappedLines(
    ctx,
    is2d,
    BANNER_TIP,
    56,
    y,
    22,
    28,
    '#5c4d3d',
    20
  )
  y += 16
  if (metaLine) {
    y = drawWrappedLines(
      ctx,
      is2d,
      metaLine,
      56,
      y,
      22,
      24,
      '#5c4d3d',
      20
    )
    y += 12
  }
  y = Math.max(y, 280)

  if (is2d) {
    if (imgPortrait) {
      ctx.drawImage(imgPortrait, PORTRAIT_X, y, PORTRAIT_W, PORTRAIT_H)
    } else {
      ctx.fillStyle = '#d7cfc4'
      ctx.fillRect(PORTRAIT_X, y, PORTRAIT_W, PORTRAIT_H)
    }
  } else if (portraitPath) {
    try {
      ctx.drawImage(portraitPath, PORTRAIT_X, y, PORTRAIT_W, PORTRAIT_H)
    } catch (e) {
      ctx.setFillStyle('#d7cfc4')
      ctx.fillRect(PORTRAIT_X, y, PORTRAIT_W, PORTRAIT_H)
    }
  } else {
    ctx.setFillStyle('#d7cfc4')
    ctx.fillRect(PORTRAIT_X, y, PORTRAIT_W, PORTRAIT_H)
  }
  y += PORTRAIT_H + 20

  y = drawWrappedLines(
    ctx,
    is2d,
    result.typeName || '',
    56,
    y,
    16,
    48,
    '#1a237e',
    38
  )
  y += 12
  y = drawWrappedLines(
    ctx,
    is2d,
    '历史形象取意：' + (result.figure || ''),
    56,
    y,
    24,
    32,
    '#8d6e63',
    26
  )
  y += 16
  y = drawWrappedLines(
    ctx,
    is2d,
    result.summary || '',
    56,
    y,
    24,
    32,
    '#3e3428',
    24
  )
  y += 24
  const sc = result.scores || {}
  const scoreFont = 24
  const scoreC = is2d ? (px) => applyTextStyle(ctx, true, '#4a4034', px) : (px) => applyTextStyle(ctx, false, '#4a4034', px)
  scoreC(scoreFont)
  ;['动', '刚', '散', '显'].forEach((k) => {
    ctx.fillText(`${k}  ${sc[k] || 0}%`, 56, y)
    y += 36
  })
  y += 16

  applyTextStyle(ctx, is2d, '#3949ab', 28)
  ctx.fillText('核心特征', 56, y)
  y += 40
  ;(result.traits || []).forEach((t) => {
    y = drawWrappedLines(
      ctx,
      is2d,
      '· ' + t,
      56,
      y,
      24,
      30,
      '#4a4034',
      26
    )
    y += 8
  })
  y += 20

  applyTextStyle(ctx, is2d, '#3949ab', 28)
  ctx.fillText('风险点', 56, y)
  y += 40
  ;(result.risks || []).forEach((t) => {
    y = drawWrappedLines(
      ctx,
      is2d,
      '· ' + t,
      56,
      y,
      24,
      30,
      '#4a4034',
      26
    )
    y += 8
  })
  y += 20

  applyTextStyle(ctx, is2d, '#3949ab', 28)
  ctx.fillText('自修建议', 56, y)
  y += 40
  ;(result.advice || []).forEach((t) => {
    y = drawWrappedLines(
      ctx,
      is2d,
      '· ' + t,
      56,
      y,
      24,
      30,
      '#4a4034',
      26
    )
    y += 8
  })
  y += 20

  applyTextStyle(ctx, is2d, '#3949ab', 28)
  ctx.fillText('详细说明', 56, y)
  y += 40
  y = drawWrappedLines(
    ctx,
    is2d,
    result.detail || '',
    56,
    y,
    24,
    32,
    '#5c4d3d',
    26
  )
  y += 32
  applyTextStyle(ctx, is2d, '#a0907c', 20)
  ctx.fillText('量化自修正念 · 仅供文化参考', 56, H - 56)
}

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
    portraitImgBind: null,
    quizMetaLine: '',
    posterCanvasH: 2400
  },

  onLoad() {
    loadPortraitSubpackage()
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
      this._portraitShowGen = (this._portraitShowGen || 0) + 1
      this.setData({
        hasResult: false,
        result: null,
        scoreList: [],
        shareImg: '',
        portraitImgBind: null,
        quizMetaLine: ''
      })
      return
    }
    const s = result.scores || {}
    const scoreList = [
      { k: '动', v: s['动'] || 0 },
      { k: '刚', v: s['刚'] || 0 },
      { k: '散', v: s['散'] || 0 },
      { k: '显', v: s['显'] || 0 }
    ]
    const tid = resultTypeId(result)
    const quizMetaLine = buildQuizMetaLine(result)
    const myGen = (this._portraitShowGen = (this._portraitShowGen || 0) + 1)
    /**
     * <image> 不要用 getImageInfo 的 path（部分基础库下可被 canvas 用、组件不能用）。
     * 仅用分包内静态路径；延迟挂载避免分包刚回调立刻解码失败；_portraitShowGen 挡交错 onShow。
     */
    this.setData(
      {
        hasResult: true,
        result,
        scoreList,
        shareImg: '',
        portraitImgBind: null,
        quizMetaLine
      },
      () => {
        loadPortraitSubpackage().then(() => {
          if (myGen !== this._portraitShowGen) return
          if (!this.data.hasResult || !this.data.result || resultTypeId(this.data.result) !== tid) return
          const plain = personalityPortraitSrc(tid)
          const delayMs = 220
          setTimeout(() => {
            if (myGen !== this._portraitShowGen) return
            if (!this.data.hasResult || !this.data.result || resultTypeId(this.data.result) !== tid) return
            this.setData(
              { portraitImgBind: { key: String(myGen), src: plain } },
              () => setTimeout(() => this.renderShareCard(), 200)
            )
          }, delayMs)
        })
      }
    )
  },

  startQuiz() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  retest() {
    wx.navigateTo({ url: '/pages/personality/quiz/quiz' })
  },

  /** jpg 失败时换 png；仍失败则重新拉分包后再挂一次 jpg */
  onPortraitImgError() {
    const b = this.data.portraitImgBind
    const r = this.data.result
    if (!b || !r || !b.src) return
    const tid = resultTypeId(r)
    const gen = this._portraitShowGen
    const [jpg, png] = personalityPortraitCandidates(tid)

    if (b.src === jpg) {
      this.setData({ portraitImgBind: { key: `${gen}_png`, src: png } })
      return
    }
    if (b.src === png) {
      loadPortraitSubpackage().then(() => {
        setTimeout(() => {
          if (gen !== this._portraitShowGen) return
          if (!this.data.result || resultTypeId(this.data.result) !== tid) return
          this.setData({ portraitImgBind: { key: `${gen}_r`, src: jpg } })
        }, 280)
      })
    }
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

  _getPosterCanvas2d(posterH) {
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
          const H = posterH
          canvas.width = Math.floor(POSTER_W * dpr)
          canvas.height = Math.floor(H * dpr)
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
      const metaLine = buildQuizMetaLine(result)
      const H = computePosterHeight(result, metaLine)
      await new Promise((resolve) => {
        this.setData({ posterCanvasH: H }, () => resolve())
      })
      const [portraitRes, indexRes] = await Promise.all([
        firstImagePathAndSrc(personalityPortraitCandidates(tid)),
        firstImagePathAndSrc(MINI_CODE_SRCS)
      ])
      const { canvas, ctx } = await this._getPosterCanvas2d(H)
      const [imgPortrait, imgCode] = await Promise.all([
        loadImage2dRobust(canvas, portraitRes.path, portraitRes.packSrc),
        loadImage2dRobust(canvas, indexRes.path, indexRes.packSrc)
      ])
      const needLegacy =
        (portraitRes.path && !imgPortrait) || (indexRes.path && !imgCode)
      if (needLegacy) {
        await this._exportPosterLegacy(
          result,
          portraitRes.path,
          indexRes.path,
          H,
          metaLine
        )
        return
      }
      paintResultPoster(ctx, {
        is2d: true,
        H,
        result,
        metaLine,
        imgPortrait,
        imgCode,
        indexPath: indexRes.path,
        portraitPath: ''
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
        })
      } catch (e) {
        if (portraitRes.path || indexRes.path) {
          console.warn('2d toTemp 失败，改旧版 canvas', e)
          await this._exportPosterLegacy(
            result,
            portraitRes.path,
            indexRes.path,
            H,
            metaLine
          )
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
  _exportPosterLegacy(result, portraitPath, indexPath, H, metaLine) {
    const ctx = wx.createCanvasContext('posterCanvasLegacy', this)
    return new Promise((resolve, reject) => {
      paintResultPoster(ctx, {
        is2d: false,
        H,
        result,
        metaLine: metaLine || buildQuizMetaLine(result),
        imgPortrait: null,
        imgCode: null,
        indexPath,
        portraitPath
      })
      ctx.draw(false, () => {
        setTimeout(() => {
          const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
          const dpr = Math.min(sys.pixelRatio || 2, 3)
          wx.canvasToTempFilePath(
            {
              canvasId: 'posterCanvasLegacy',
              x: 0,
              y: 0,
              width: POSTER_W,
              height: H,
              destWidth: Math.floor(POSTER_W * dpr),
              destHeight: Math.floor(H * dpr),
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
