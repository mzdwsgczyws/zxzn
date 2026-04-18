/**
 * 心象箴言配图：使用微信小程序旧版 Canvas API（wx.createCanvasContext），
 * 与 canvas-id 配合；避免 type="2d" 在部分基础库下合成失败只显示黑色。
 * 颜色一律 rgb/rgba；背景与装饰按等第配色；卦名与副标题用系统默认字体（简体）。
 */

function wxStrokeRoundRect(ctx, x, y, rw, rh, radius, color, lw) {
  const r = Math.min(radius, rw / 2, rh / 2)
  ctx.setStrokeStyle(color)
  ctx.setLineWidth(lw)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + rw - r, y)
  ctx.arc(x + rw - r, y + r, r, -Math.PI / 2, 0)
  ctx.lineTo(x + rw, y + rh - r)
  ctx.arc(x + rw - r, y + rh - r, r, 0, Math.PI / 2)
  ctx.lineTo(x + r, y + rh)
  ctx.arc(x + r, y + rh - r, r, Math.PI / 2, Math.PI)
  ctx.lineTo(x, y + r)
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  ctx.closePath()
  ctx.stroke()
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 按等第配色：上上金、上红、中蓝、下灰、下下黑 */
function getTierTheme(tier) {
  const t = tier || '中'
  if (t === '上上') {
    return {
      bg0: 'rgb(56, 46, 24)',
      bg1: 'rgb(92, 74, 34)',
      bg2: 'rgb(38, 32, 18)',
      wave: 'rgba(255, 240, 200, 0.2)',
      dotA: 'rgba(255, 215, 120, 0.5)',
      dotB: 'rgba(190, 155, 70, 0.42)',
      corner: 'rgba(235, 200, 100, 0.58)',
      borderOuter: 'rgba(218, 185, 95, 0.88)',
      borderInner: 'rgba(250, 238, 210, 0.38)',
      moonFill: 'rgba(35, 30, 18, 0.42)',
      moonStroke: 'rgba(218, 175, 55, 0.9)',
      title: 'rgb(255, 252, 240)',
      sub: 'rgb(232, 200, 110)'
    }
  }
  if (t === '上') {
    return {
      bg0: 'rgb(68, 22, 28)',
      bg1: 'rgb(108, 32, 42)',
      bg2: 'rgb(48, 16, 22)',
      wave: 'rgba(255, 210, 215, 0.18)',
      dotA: 'rgba(255, 120, 130, 0.45)',
      dotB: 'rgba(180, 70, 85, 0.4)',
      corner: 'rgba(240, 130, 140, 0.55)',
      borderOuter: 'rgba(230, 110, 120, 0.88)',
      borderInner: 'rgba(255, 220, 225, 0.32)',
      moonFill: 'rgba(45, 18, 22, 0.45)',
      moonStroke: 'rgba(235, 100, 115, 0.9)',
      title: 'rgb(255, 245, 246)',
      sub: 'rgb(255, 160, 168)'
    }
  }
  if (t === '下') {
    return {
      bg0: 'rgb(50, 52, 56)',
      bg1: 'rgb(72, 74, 78)',
      bg2: 'rgb(40, 42, 46)',
      wave: 'rgba(220, 225, 230, 0.12)',
      dotA: 'rgba(160, 168, 178, 0.38)',
      dotB: 'rgba(110, 118, 128, 0.35)',
      corner: 'rgba(170, 176, 186, 0.5)',
      borderOuter: 'rgba(150, 156, 165, 0.78)',
      borderInner: 'rgba(230, 232, 235, 0.22)',
      moonFill: 'rgba(28, 30, 34, 0.5)',
      moonStroke: 'rgba(165, 172, 182, 0.82)',
      title: 'rgb(242, 244, 248)',
      sub: 'rgb(185, 190, 198)'
    }
  }
  if (t === '下下') {
    return {
      bg0: 'rgb(8, 8, 10)',
      bg1: 'rgb(20, 20, 24)',
      bg2: 'rgb(4, 4, 6)',
      wave: 'rgba(120, 120, 128, 0.08)',
      dotA: 'rgba(70, 70, 78, 0.35)',
      dotB: 'rgba(45, 45, 50, 0.32)',
      corner: 'rgba(90, 90, 98, 0.45)',
      borderOuter: 'rgba(75, 75, 82, 0.7)',
      borderInner: 'rgba(160, 160, 168, 0.15)',
      moonFill: 'rgba(0, 0, 0, 0.35)',
      moonStroke: 'rgba(100, 100, 108, 0.75)',
      title: 'rgb(218, 218, 222)',
      sub: 'rgb(130, 132, 138)'
    }
  }
  /* 中 */
  return {
    bg0: 'rgb(22, 40, 72)',
    bg1: 'rgb(34, 62, 108)',
    bg2: 'rgb(16, 30, 55)',
    wave: 'rgba(180, 210, 255, 0.14)',
    dotA: 'rgba(120, 185, 255, 0.42)',
    dotB: 'rgba(80, 130, 200, 0.38)',
    corner: 'rgba(130, 185, 245, 0.52)',
    borderOuter: 'rgba(110, 175, 245, 0.85)',
    borderInner: 'rgba(220, 235, 255, 0.28)',
    moonFill: 'rgba(18, 28, 48, 0.48)',
    moonStroke: 'rgba(120, 185, 255, 0.88)',
    title: 'rgb(240, 248, 255)',
    sub: 'rgb(150, 200, 255)'
  }
}

function drawCornerMarksWx(ctx, w, h, id, strokeColor) {
  const rnd = mulberry32(id * 10007 + 17)
  const s = Math.min(w, h) * 0.08
  const corners = [
    [18, 18],
    [w - 18, 18],
    [18, h - 18],
    [w - 18, h - 18]
  ]
  ctx.save()
  ctx.setStrokeStyle(strokeColor || 'rgba(212, 175, 55, 0.55)')
  ctx.setLineWidth(2)
  corners.forEach(([cx, cy], i) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rnd() - 0.5) * 0.4 + i * 0.2)
    ctx.beginPath()
    ctx.moveTo(-s * 0.4, 0)
    ctx.lineTo(s * 0.4, 0)
    ctx.moveTo(0, -s * 0.4)
    ctx.lineTo(0, s * 0.4)
    ctx.stroke()
    ctx.restore()
  })
  ctx.restore()
}

/**
 * @param {WechatMiniprogram.CanvasContext} ctx wx.createCanvasContext 返回值
 * @param {number} w 与 canvas 样式宽一致的逻辑像素
 * @param {number} h 与 canvas 样式高一致的逻辑像素
 * @param {{ id: number, title: string, tierLabel?: string, tier?: string }} lot
 */
function drawLotArtWx(ctx, w, h, lot) {
  const id = lot.id != null ? lot.id : 0
  const title = lot.title || '箴'
  const titleLen = Array.from(title).length
  const theme = getTierTheme(lot.tier)

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, theme.bg0)
  bg.addColorStop(0.48, theme.bg1)
  bg.addColorStop(1, theme.bg2)
  ctx.setFillStyle(bg)
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.setGlobalAlpha(0.18)
  ctx.setStrokeStyle(theme.wave)
  ctx.setLineWidth(1.2)
  const lines = 10 + (id % 6)
  for (let i = 0; i < lines; i++) {
    const y0 = (h / lines) * i + ((id * 17) % 13)
    ctx.beginPath()
    ctx.moveTo(0, y0)
    for (let x = 0; x <= w; x += 8) {
      ctx.lineTo(x, y0 + Math.sin((x + id * 31) * 0.04) * (4 + (id % 5)))
    }
    ctx.stroke()
  }
  ctx.restore()

  const rnd = mulberry32(id * 7919 + (title.charCodeAt(0) || 0))
  ctx.save()
  ctx.setGlobalAlpha(0.22)
  for (let n = 0; n < 8 + (id % 5); n++) {
    const cx = rnd() * w
    const cy = rnd() * h
    const rr = 4 + rnd() * 20
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.setFillStyle(rnd() > 0.5 ? theme.dotA : theme.dotB)
    ctx.fill()
  }
  ctx.restore()

  drawCornerMarksWx(ctx, w, h, id, theme.corner)

  wxStrokeRoundRect(ctx, 8, 8, w - 16, h - 16, 12, theme.borderOuter, 2.5)
  wxStrokeRoundRect(ctx, 14, 14, w - 28, h - 28, 8, theme.borderInner, 1.2)

  const cx = w / 2
  const cy = h * 0.46
  const r = Math.min(w, h) * 0.24
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.setFillStyle(theme.moonFill)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.setStrokeStyle(theme.moonStroke)
  ctx.setLineWidth(2.5)
  ctx.stroke()

  const fontSize = Math.max(
    10,
    titleLen <= 1 ? Math.min(w, h) * 0.26 : titleLen === 2 ? Math.min(w, h) * 0.2 : Math.min(w, h) * 0.13
  )
  const titlePx = Math.floor(fontSize)
  const subPx = Math.max(10, Math.floor(Math.min(w, h) * 0.062))

  ctx.setFillStyle(theme.title)
  ctx.setTextAlign('center')
  ctx.setTextBaseline('middle')
  ctx.setFontSize(titlePx)
  ctx.fillText(title, cx, cy)

  const sub = `${lot.tierLabel || ''} · 第${id + 1}条`
  ctx.setFillStyle(theme.sub)
  ctx.setFontSize(subPx)
  ctx.fillText(sub, cx, h * 0.8)
}

module.exports = { drawLotArtWx }
