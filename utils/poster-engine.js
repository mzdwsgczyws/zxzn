/**
 * 统一海报引擎 — 使用 Canvas 2D API 生成分享图
 * 调用方需在 wxml 中放置:
 *   <canvas type="2d" id="poster-canvas" style="width:{{pw}}px;height:{{ph}}px;position:fixed;left:-999px;top:0;" />
 *
 * 用法：
 *   const poster = require('../../utils/poster-engine.js')
 *   const path = await poster.generate(this, 'poster-canvas', templateFn, 750, 1200)
 *   wx.previewImage({ urls: [path] })
 */

function getCanvas(pageCtx, canvasId) {
  return new Promise((resolve, reject) => {
    const query = pageCtx.createSelectorQuery()
    query.select('#' + canvasId)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0] && res[0].node) {
          resolve(res[0])
        } else {
          reject(new Error('poster canvas not found: #' + canvasId))
        }
      })
  })
}

/**
 * Generate a poster image.
 * @param {Object} pageCtx - The page/component `this`
 * @param {string} canvasId - Canvas element id (without #)
 * @param {Function} templateFn - async function(ctx, w, h, dpr) that draws on context
 * @param {number} w - logical width (px)
 * @param {number} h - logical height (px)
 * @returns {Promise<string>} temp file path of the generated image
 */
async function generate(pageCtx, canvasId, templateFn, w, h) {
  const info = wx.getSystemInfoSync()
  const dpr = info.pixelRatio || 2

  const res = await getCanvas(pageCtx, canvasId)
  const canvas = res.node
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  await templateFn(ctx, w, h, dpr, canvas)

  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: w * dpr,
      height: h * dpr,
      destWidth: w * dpr,
      destHeight: h * dpr,
      fileType: 'png',
      success: (r) => resolve(r.tempFilePath),
      fail: reject
    })
  })
}

function loadImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  const chars = text.split('')
  const lines = []
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// ---- Built-in Templates ----

/**
 * Template: 箴言分享卡
 * data: { text, sourceName, date }
 */
function tplMaxim(data) {
  return async function (ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#1a1530')
    gradient.addColorStop(1, '#0d0b14')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(212, 175, 55, 0.06)'
    drawRoundRect(ctx, 40, 40, w - 80, h - 80, 16)
    ctx.fill()

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
    ctx.lineWidth = 1
    drawRoundRect(ctx, 40, 40, w - 80, h - 80, 16)
    ctx.stroke()

    ctx.font = '600 36px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'center'
    ctx.fillText('道 性 自 察', w / 2, 100)

    ctx.font = '28px serif'
    ctx.fillStyle = '#e0d8cc'
    ctx.textAlign = 'center'
    const lines = wrapText(ctx, data.text || '', w - 160)
    let y = 200
    for (const line of lines) {
      ctx.fillText(line, w / 2, y)
      y += 44
    }

    ctx.font = '22px sans-serif'
    ctx.fillStyle = '#a09888'
    ctx.fillText(data.sourceName || '', w / 2, h - 120)
    ctx.fillText(data.date || '', w / 2, h - 85)

    ctx.font = '18px sans-serif'
    ctx.fillStyle = '#7a6e62'
    ctx.fillText('来自「道性自察」小程序', w / 2, h - 50)
  }
}

/**
 * Template: 道性人格分享卡
 * data: { typeName, typeCode, description }
 */
function tplPersonality(data) {
  return async function (ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#1a1530')
    gradient.addColorStop(1, '#0d0b14')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.font = 'bold 72px sans-serif'
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)'
    ctx.textAlign = 'center'
    ctx.fillText(data.typeCode || '', w / 2, 180)

    ctx.font = '600 40px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.fillText(data.typeName || '', w / 2, 300)

    ctx.font = '24px sans-serif'
    ctx.fillStyle = '#c4b8a8'
    const lines = wrapText(ctx, data.description || '', w - 140)
    let y = 380
    for (const line of lines) {
      ctx.fillText(line, w / 2, y)
      y += 38
    }

    ctx.font = '18px sans-serif'
    ctx.fillStyle = '#7a6e62'
    ctx.fillText('来自「道性自察」小程序', w / 2, h - 50)
  }
}

/**
 * Template: 成就分享卡
 * data: { achieveName, achieveDesc, unlockedCount, total }
 */
function tplAchieve(data) {
  return async function (ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, '#1a1530')
    gradient.addColorStop(1, '#0d0b14')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    ctx.font = '80px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'center'
    ctx.fillText('🏆', w / 2, 200)

    ctx.font = '600 36px sans-serif'
    ctx.fillStyle = '#e0d8cc'
    ctx.fillText(data.achieveName || '', w / 2, 300)

    ctx.font = '24px sans-serif'
    ctx.fillStyle = '#a09888'
    const lines = wrapText(ctx, data.achieveDesc || '', w - 140)
    let y = 370
    for (const line of lines) {
      ctx.fillText(line, w / 2, y)
      y += 38
    }

    ctx.font = '22px sans-serif'
    ctx.fillStyle = '#7a6e62'
    ctx.fillText(`已解锁 ${data.unlockedCount || 0} / ${data.total || 0} 项成就`, w / 2, h - 90)
    ctx.font = '18px sans-serif'
    ctx.fillText('来自「道性自察」小程序', w / 2, h - 50)
  }
}

module.exports = {
  generate,
  loadImage,
  drawRoundRect,
  wrapText,
  tplMaxim,
  tplPersonality,
  tplAchieve
}
