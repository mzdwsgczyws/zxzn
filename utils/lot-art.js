/**
 * 灵签画意：使用微信小程序旧版 Canvas API（wx.createCanvasContext），
 * 与 canvas-id 配合；避免 type="2d" 在部分基础库下合成失败只显示黑色。
 * 颜色一律 rgb/rgba。
 */

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(100, s)) / 100
  const light = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const hp = hue / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hp >= 0 && hp < 1) {
    r1 = c
    g1 = x
  } else if (hp < 2) {
    r1 = x
    g1 = c
  } else if (hp < 3) {
    g1 = c
    b1 = x
  } else if (hp < 4) {
    g1 = x
    b1 = c
  } else if (hp < 5) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }
  const m = light - c / 2
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  return `rgb(${r},${g},${b})`
}

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

function drawCornerMarksWx(ctx, w, h, id) {
  const rnd = mulberry32(id * 10007 + 17)
  const s = Math.min(w, h) * 0.08
  const corners = [
    [18, 18],
    [w - 18, 18],
    [18, h - 18],
    [w - 18, h - 18]
  ]
  ctx.save()
  ctx.setStrokeStyle('rgba(212, 175, 55, 0.55)')
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
 * @param {{ id: number, title: string, tierLabel?: string }} lot
 */
function drawLotArtWx(ctx, w, h, lot) {
  const id = lot.id != null ? lot.id : 0
  const title = lot.title || '签'
  const titleLen = Array.from(title).length

  const hue1 = (id * 53) % 360
  const hue2 = (hue1 + 28 + (id % 9) * 12) % 360
  const hue3 = (hue1 + 180 + (id % 5) * 7) % 360

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, hslToRgb(hue1, 44, 22))
  bg.addColorStop(0.45, hslToRgb(hue2, 38, 15))
  bg.addColorStop(1, hslToRgb(hue3, 42, 10))
  ctx.setFillStyle(bg)
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.setGlobalAlpha(0.18)
  ctx.setStrokeStyle('rgb(232, 224, 210)')
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
    ctx.setFillStyle(rnd() > 0.5 ? 'rgba(212,175,55,0.55)' : 'rgba(140, 160, 185, 0.45)')
    ctx.fill()
  }
  ctx.restore()

  drawCornerMarksWx(ctx, w, h, id)

  wxStrokeRoundRect(ctx, 8, 8, w - 16, h - 16, 12, 'rgba(212, 175, 55, 0.75)', 2.5)
  wxStrokeRoundRect(ctx, 14, 14, w - 28, h - 28, 8, 'rgba(245, 240, 232, 0.35)', 1.2)

  const cx = w / 2
  const cy = h * 0.46
  const r = Math.min(w, h) * 0.24
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.setFillStyle('rgba(30, 35, 55, 0.35)')
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.setStrokeStyle('rgba(212, 175, 55, 0.85)')
  ctx.setLineWidth(2.5)
  ctx.stroke()

  const fontSize = Math.max(
    10,
    titleLen <= 1 ? Math.min(w, h) * 0.26 : titleLen === 2 ? Math.min(w, h) * 0.2 : Math.min(w, h) * 0.13
  )

  ctx.setFillStyle('rgb(252, 248, 240)')
  ctx.setFontSize(Math.floor(fontSize))
  ctx.setTextAlign('center')
  ctx.setTextBaseline('middle')
  ctx.fillText(title, cx, cy)

  const sub = `${lot.tierLabel || ''} · 第${id + 1}签`
  ctx.setFontSize(Math.max(10, Math.floor(Math.min(w, h) * 0.062)))
  ctx.setFillStyle('rgb(212, 175, 55)')
  ctx.fillText(sub, cx, h * 0.8)
}

module.exports = { drawLotArtWx }
