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
  return async function (ctx, w, h, dpr, canvas) {
    // ── 背景渐变 ──
    const bg = ctx.createLinearGradient(0, 0, w * 0.3, h)
    bg.addColorStop(0, '#1f1840')
    bg.addColorStop(0.4, '#17122e')
    bg.addColorStop(1, '#0d0a18')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // ── 装饰：顶部云纹弧线 ──
    ctx.save()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.10)'
    ctx.lineWidth = 1.5
    for (var i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(w * 0.15, -60 + i * 18, 160 + i * 30, 0.3, Math.PI * 0.8)
      ctx.stroke()
    }
    for (var j = 0; j < 4; j++) {
      ctx.beginPath()
      ctx.arc(w * 0.85, -40 + j * 20, 140 + j * 25, Math.PI * 0.2, Math.PI * 0.7)
      ctx.stroke()
    }
    ctx.restore()

    // ── 装饰：底部山峦剪影 ──
    ctx.save()
    ctx.fillStyle = 'rgba(212, 175, 55, 0.04)'
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, h - 90)
    ctx.quadraticCurveTo(w * 0.15, h - 150, w * 0.3, h - 110)
    ctx.quadraticCurveTo(w * 0.45, h - 70, w * 0.55, h - 130)
    ctx.quadraticCurveTo(w * 0.7, h - 190, w * 0.85, h - 100)
    ctx.quadraticCurveTo(w * 0.95, h - 60, w, h - 80)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(212, 175, 55, 0.03)'
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, h - 50)
    ctx.quadraticCurveTo(w * 0.2, h - 100, w * 0.4, h - 70)
    ctx.quadraticCurveTo(w * 0.6, h - 40, w * 0.8, h - 80)
    ctx.quadraticCurveTo(w * 0.9, h - 100, w, h - 60)
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // ── 装饰：散落光点 ──
    ctx.save()
    var dots = [
      [w * 0.12, h * 0.25, 2.5], [w * 0.88, h * 0.18, 2],
      [w * 0.08, h * 0.55, 1.8], [w * 0.92, h * 0.45, 2.2],
      [w * 0.2, h * 0.7, 1.5], [w * 0.78, h * 0.72, 1.8],
      [w * 0.5, h * 0.12, 2], [w * 0.35, h * 0.85, 1.5],
      [w * 0.65, h * 0.08, 1.8]
    ]
    for (var d = 0; d < dots.length; d++) {
      var dot = dots[d]
      var glow = ctx.createRadialGradient(dot[0], dot[1], 0, dot[0], dot[1], dot[2] * 4)
      glow.addColorStop(0, 'rgba(212, 175, 55, 0.25)')
      glow.addColorStop(1, 'rgba(212, 175, 55, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(dot[0], dot[1], dot[2] * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(232, 212, 168, 0.6)'
      ctx.beginPath()
      ctx.arc(dot[0], dot[1], dot[2], 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // ── 内框 ──
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.30)'
    ctx.lineWidth = 1
    drawRoundRect(ctx, 36, 36, w - 72, h - 72, 18)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)'
    drawRoundRect(ctx, 42, 42, w - 84, h - 84, 15)
    ctx.stroke()

    // ── 顶部角花 ──
    ctx.save()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
    ctx.lineWidth = 1.5
    var cornerSize = 28
    // 左上
    ctx.beginPath()
    ctx.moveTo(36, 36 + cornerSize); ctx.lineTo(36, 36); ctx.lineTo(36 + cornerSize, 36)
    ctx.stroke()
    // 右上
    ctx.beginPath()
    ctx.moveTo(w - 36 - cornerSize, 36); ctx.lineTo(w - 36, 36); ctx.lineTo(w - 36, 36 + cornerSize)
    ctx.stroke()
    // 左下
    ctx.beginPath()
    ctx.moveTo(36, h - 36 - cornerSize); ctx.lineTo(36, h - 36); ctx.lineTo(36 + cornerSize, h - 36)
    ctx.stroke()
    // 右下
    ctx.beginPath()
    ctx.moveTo(w - 36 - cornerSize, h - 36); ctx.lineTo(w - 36, h - 36); ctx.lineTo(w - 36, h - 36 - cornerSize)
    ctx.stroke()
    ctx.restore()

    // ── 顶部横纹分隔 ──
    var titleY = 95
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(70, titleY + 18); ctx.lineTo(w - 70, titleY + 18); ctx.stroke()

    // ── 标题 ──
    ctx.font = '600 34px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'center'
    ctx.fillText('道 性 自 察', w / 2, titleY)

    // ── 小篆装饰符 ──
    ctx.font = '16px serif'
    ctx.fillStyle = 'rgba(212, 175, 55, 0.35)'
    ctx.fillText('☰', w / 2 - 100, titleY)
    ctx.fillText('☷', w / 2 + 100, titleY)

    // ── 正文内容 ──
    ctx.font = '26px serif'
    ctx.fillStyle = '#e8e0d5'
    ctx.textAlign = 'center'
    var textLines = wrapText(ctx, data.text || '', w - 140)
    var textY = 170
    for (var k = 0; k < textLines.length; k++) {
      ctx.fillText(textLines[k], w / 2, textY)
      textY += 42
    }

    // ── 来源信息（居中放大） ──
    var infoY = Math.max(textY + 50, h - 220)
    ctx.font = '600 28px serif'
    ctx.fillStyle = '#d4c8a8'
    ctx.textAlign = 'center'
    ctx.fillText(data.sourceName || '', w / 2, infoY)
    ctx.font = '22px sans-serif'
    ctx.fillStyle = '#a09888'
    ctx.fillText(data.date || '', w / 2, infoY + 38)

    // ── 底部分隔线 ──
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(70, h - 145); ctx.lineTo(w - 70, h - 145); ctx.stroke()

    // ── 小程序码 ──
    var codeSize = 72
    var codeX = w / 2 - codeSize / 2
    var codeY = h - 135
    try {
      var codeSrcs = [
        '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
        '/subpackages/portrait-assets/images/personality-portraits/index.png'
      ]
      var codeImg = null
      for (var s = 0; s < codeSrcs.length; s++) {
        try { codeImg = await loadImage(canvas, codeSrcs[s]); break } catch (e) {}
      }
      if (codeImg) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2 + 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(codeImg, codeX, codeY, codeSize, codeSize)
        ctx.restore()
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('扫码体验「道性自察」', w / 2, codeY + codeSize + 20)
      } else {
        ctx.font = '16px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
      }
    } catch (e) {
      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#7a6e62'
      ctx.textAlign = 'center'
      ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
    }
  }
}

/**
 * Template: 道性人格分享卡
 * data: { typeName, typeCode, description }
 */
function tplPersonality(data) {
  return async function (ctx, w, h, dpr, canvas) {
    var bg = ctx.createLinearGradient(0, 0, w * 0.3, h)
    bg.addColorStop(0, '#1f1840')
    bg.addColorStop(0.4, '#17122e')
    bg.addColorStop(1, '#0d0a18')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)'
    ctx.lineWidth = 1
    drawRoundRect(ctx, 36, 36, w - 72, h - 72, 18)
    ctx.stroke()

    var cs = 28
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(36, 36 + cs); ctx.lineTo(36, 36); ctx.lineTo(36 + cs, 36); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w - 36 - cs, 36); ctx.lineTo(w - 36, 36); ctx.lineTo(w - 36, 36 + cs); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(36, h - 36 - cs); ctx.lineTo(36, h - 36); ctx.lineTo(36 + cs, h - 36); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w - 36 - cs, h - 36); ctx.lineTo(w - 36, h - 36); ctx.lineTo(w - 36, h - 36 - cs); ctx.stroke()

    ctx.font = 'bold 72px sans-serif'
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)'
    ctx.textAlign = 'center'
    ctx.fillText(data.typeCode || '', w / 2, 180)

    ctx.font = '600 40px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.fillText(data.typeName || '', w / 2, 300)

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(100, 320); ctx.lineTo(w - 100, 320); ctx.stroke()

    ctx.font = '24px sans-serif'
    ctx.fillStyle = '#c4b8a8'
    var lines = wrapText(ctx, data.description || '', w - 140)
    var y = 370
    for (var k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], w / 2, y)
      y += 38
    }

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
    ctx.beginPath(); ctx.moveTo(70, h - 145); ctx.lineTo(w - 70, h - 145); ctx.stroke()

    var codeSize = 68
    var codeX = w / 2 - codeSize / 2
    var codeY = h - 130
    try {
      var codeImg = null
      var srcs = [
        '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
        '/subpackages/portrait-assets/images/personality-portraits/index.png'
      ]
      for (var s = 0; s < srcs.length; s++) {
        try { codeImg = await loadImage(canvas, srcs[s]); break } catch (e) {}
      }
      if (codeImg) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2 + 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(codeImg, codeX, codeY, codeSize, codeSize)
        ctx.restore()
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('扫码体验「道性自察」', w / 2, codeY + codeSize + 18)
      } else {
        ctx.font = '16px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
      }
    } catch (e) {
      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#7a6e62'
      ctx.textAlign = 'center'
      ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
    }
  }
}

/**
 * Template: 成就分享卡
 * data: { achieveName, achieveDesc, unlockedCount, total }
 */
function tplAchieve(data) {
  return async function (ctx, w, h, dpr, canvas) {
    // ── 背景 ──
    var bg = ctx.createLinearGradient(0, 0, w * 0.3, h)
    bg.addColorStop(0, '#1f1840')
    bg.addColorStop(0.5, '#17122e')
    bg.addColorStop(1, '#0d0a18')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // ── 顶部光晕 ──
    var topGlow = ctx.createRadialGradient(w / 2, 120, 20, w / 2, 120, 200)
    topGlow.addColorStop(0, 'rgba(212, 175, 55, 0.12)')
    topGlow.addColorStop(1, 'rgba(212, 175, 55, 0)')
    ctx.fillStyle = topGlow
    ctx.fillRect(0, 0, w, 350)

    // ── 双框 ──
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)'
    ctx.lineWidth = 1
    drawRoundRect(ctx, 36, 36, w - 72, h - 72, 18)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.10)'
    drawRoundRect(ctx, 42, 42, w - 84, h - 84, 15)
    ctx.stroke()

    // ── 角花 ──
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
    ctx.lineWidth = 1.5
    var cs = 28
    ctx.beginPath(); ctx.moveTo(36, 36 + cs); ctx.lineTo(36, 36); ctx.lineTo(36 + cs, 36); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w - 36 - cs, 36); ctx.lineTo(w - 36, 36); ctx.lineTo(w - 36, 36 + cs); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(36, h - 36 - cs); ctx.lineTo(36, h - 36); ctx.lineTo(36 + cs, h - 36); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w - 36 - cs, h - 36); ctx.lineTo(w - 36, h - 36); ctx.lineTo(w - 36, h - 36 - cs); ctx.stroke()

    // ── 勋章图标 ──
    ctx.font = '72px sans-serif'
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'center'
    ctx.fillText('🏆', w / 2, 180)

    // ── 成就标题 ──
    ctx.font = '600 34px sans-serif'
    ctx.fillStyle = '#e8d4a8'
    ctx.fillText(data.achieveName || '', w / 2, 260)

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(100, 280); ctx.lineTo(w - 100, 280); ctx.stroke()

    // ── 描述 ──
    ctx.font = '22px sans-serif'
    ctx.fillStyle = '#b0a898'
    var lines = wrapText(ctx, data.achieveDesc || '', w - 140)
    var y = 330
    for (var k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], w / 2, y)
      y += 36
    }

    // ── 进度 ──
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#908878'
    ctx.fillText('已解锁 ' + (data.unlockedCount || 0) + ' / ' + (data.total || 0) + ' 项成就', w / 2, h - 200)

    // ── 底部分隔 ──
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'
    ctx.beginPath(); ctx.moveTo(70, h - 145); ctx.lineTo(w - 70, h - 145); ctx.stroke()

    // ── 小程序码 ──
    var codeSize = 68
    var codeX = w / 2 - codeSize / 2
    var codeY = h - 130
    try {
      var codeImg = null
      var srcs = [
        '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
        '/subpackages/portrait-assets/images/personality-portraits/index.png'
      ]
      for (var s = 0; s < srcs.length; s++) {
        try { codeImg = await loadImage(canvas, srcs[s]); break } catch (e) {}
      }
      if (codeImg) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2 + 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(codeX + codeSize / 2, codeY + codeSize / 2, codeSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(codeImg, codeX, codeY, codeSize, codeSize)
        ctx.restore()
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('扫码体验「道性自察」', w / 2, codeY + codeSize + 18)
      } else {
        ctx.font = '16px sans-serif'
        ctx.fillStyle = '#7a6e62'
        ctx.textAlign = 'center'
        ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
      }
    } catch (e) {
      ctx.font = '16px sans-serif'
      ctx.fillStyle = '#7a6e62'
      ctx.textAlign = 'center'
      ctx.fillText('来自「道性自察」小程序', w / 2, h - 55)
    }
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
