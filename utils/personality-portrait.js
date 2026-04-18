/**
 * 道性十六型 · 意象肖像（程序绘制）
 * 风格：中国画墨色晕染 + 少量赛博霓虹线路；每型配色与构图略有差异。
 * 与第三方站点头像无素材关联，仅为产品内原创示意。
 */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 每型主色：水墨底 + 赛博点缀 */
const TYPE_PALETTES = [
  { paper0: '#2a241c', paper1: '#151210', mist: 'rgba(90, 75, 55, 0.35)', neon: 'rgba(0, 230, 255, 0.65)', neon2: 'rgba(255, 106, 213, 0.4)' },
  { paper0: '#252218', paper1: '#120f0c', mist: 'rgba(85, 70, 50, 0.38)', neon: 'rgba(120, 255, 200, 0.55)', neon2: 'rgba(255, 180, 60, 0.45)' },
  { paper0: '#2c2218', paper1: '#14110e', mist: 'rgba(100, 80, 60, 0.32)', neon: 'rgba(180, 140, 255, 0.6)', neon2: 'rgba(0, 220, 240, 0.4)' },
  { paper0: '#231f1a', paper1: '#0e0c0a', mist: 'rgba(70, 65, 55, 0.4)', neon: 'rgba(255, 220, 100, 0.5)', neon2: 'rgba(100, 200, 255, 0.45)' },
  { paper0: '#1e2228', paper1: '#0d1014', mist: 'rgba(60, 75, 90, 0.35)', neon: 'rgba(0, 200, 255, 0.7)', neon2: 'rgba(200, 120, 255, 0.35)' },
  { paper0: '#242018', paper1: '#100e0b', mist: 'rgba(95, 85, 65, 0.33)', neon: 'rgba(255, 140, 80, 0.55)', neon2: 'rgba(80, 255, 220, 0.4)' },
  { paper0: '#281e22', paper1: '#120d10', mist: 'rgba(100, 60, 80, 0.3)', neon: 'rgba(255, 100, 180, 0.55)', neon2: 'rgba(120, 220, 255, 0.45)' },
  { paper0: '#1a2218', paper1: '#0b0f0c', mist: 'rgba(55, 75, 55, 0.38)', neon: 'rgba(160, 255, 120, 0.5)', neon2: 'rgba(255, 200, 80, 0.35)' },
  { paper0: '#221a24', paper1: '#0f0c12', mist: 'rgba(80, 55, 90, 0.34)', neon: 'rgba(0, 255, 200, 0.6)', neon2: 'rgba(255, 80, 160, 0.4)' },
  { paper0: '#241c20', paper1: '#100c0e', mist: 'rgba(90, 65, 75, 0.32)', neon: 'rgba(220, 100, 255, 0.55)', neon2: 'rgba(100, 255, 240, 0.4)' },
  { paper0: '#1c2224', paper1: '#0a0e10', mist: 'rgba(55, 70, 80, 0.36)', neon: 'rgba(80, 180, 255, 0.65)', neon2: 'rgba(255, 220, 140, 0.4)' },
  { paper0: '#252016', paper1: '#100e0a', mist: 'rgba(95, 80, 50, 0.35)', neon: 'rgba(255, 200, 60, 0.55)', neon2: 'rgba(0, 240, 200, 0.45)' },
  { paper0: '#201c22', paper1: '#0d0b0f', mist: 'rgba(75, 65, 85, 0.33)', neon: 'rgba(255, 120, 200, 0.5)', neon2: 'rgba(120, 255, 180, 0.45)' },
  { paper0: '#1a1e22', paper1: '#090b0e', mist: 'rgba(50, 60, 75, 0.37)', neon: 'rgba(150, 220, 255, 0.6)', neon2: 'rgba(255, 150, 100, 0.4)' },
  { paper0: '#221e18', paper1: '#0e0c0a', mist: 'rgba(88, 75, 60, 0.34)', neon: 'rgba(255, 240, 100, 0.5)', neon2: 'rgba(200, 100, 255, 0.45)' },
  { paper0: '#1e2024', paper1: '#0c0d10', mist: 'rgba(65, 70, 85, 0.35)', neon: 'rgba(100, 255, 255, 0.55)', neon2: 'rgba(255, 100, 120, 0.4)' }
]

function drawInkBlob(ctx, cx, cy, rx, ry, rot, fill) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.beginPath()
  ctx.scale(1, ry / rx)
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.setFillStyle(fill)
  ctx.fill()
  ctx.restore()
}

function drawCyberBracket(ctx, x, y, s, color) {
  ctx.setStrokeStyle(color)
  ctx.setLineWidth(1.5)
  ctx.beginPath()
  ctx.moveTo(x + s, y)
  ctx.lineTo(x, y)
  ctx.lineTo(x, y + s)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + s, y + s * 2)
  ctx.lineTo(x, y + s * 2)
  ctx.lineTo(x, y + s)
  ctx.stroke()
}

/**
 * @param {WechatMiniprogram.CanvasContext} ctx
 * @param {number} x 区域左上角
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} typeId 0–15
 */
function drawPersonalityPortraitWx(ctx, x, y, w, h, typeId) {
  const tid = typeId >= 0 && typeId <= 15 ? typeId : 0
  const pal = TYPE_PALETTES[tid]
  const rnd = mulberry32(7919 + tid * 97)

  const cx = x + w / 2
  const cy = y + h / 2

  const bg = ctx.createLinearGradient(x, y, x + w, y + h)
  bg.addColorStop(0, pal.paper0)
  bg.addColorStop(1, pal.paper1)
  ctx.setFillStyle(bg)
  ctx.fillRect(x, y, w, h)

  ctx.setGlobalAlpha(0.5)
  for (let i = 0; i < 6; i++) {
    const bx = x + rnd() * w
    const by = y + rnd() * h
    const rr = 8 + rnd() * 28
    drawInkBlob(ctx, bx, by, rr, rr * (0.6 + rnd() * 0.5), rnd() * 0.5, pal.mist)
  }
  ctx.setGlobalAlpha(1)

  const scale = Math.min(w, h) / 200
  const headR = (22 + (tid % 4)) * scale
  const bodyRx = (38 + (tid % 5) * 2) * scale
  const bodyRy = (48 + (tid % 3) * 3) * scale
  const lean = (rnd() - 0.5) * 0.12

  ctx.save()
  ctx.translate(cx, cy + h * 0.06)
  ctx.rotate(lean)

  ctx.setFillStyle('rgba(35, 32, 28, 0.92)')
  ctx.beginPath()
  ctx.save()
  ctx.translate(0, bodyRy * 0.35)
  ctx.scale(bodyRx, bodyRy)
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.setFillStyle('rgba(55, 48, 42, 0.75)')
  ctx.beginPath()
  ctx.save()
  ctx.translate(0, -bodyRy * 0.25)
  ctx.scale(headR * 1.05, headR * 1.08)
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.setStrokeStyle('rgba(20, 18, 16, 0.85)')
  ctx.setLineWidth(2 * scale)
  ctx.beginPath()
  ctx.save()
  ctx.translate(0, -bodyRy * 0.25)
  ctx.scale(headR, headR)
  ctx.arc(0, 0, 1, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.setStrokeStyle('rgba(15, 14, 12, 0.5)')
  ctx.setLineWidth(1.2 * scale)
  ctx.beginPath()
  ctx.moveTo(-bodyRx * 0.3, -headR * 0.5)
  ctx.quadraticCurveTo(-bodyRx * 1.1, bodyRy * 0.2, -bodyRx * 0.85, bodyRy * 0.9)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(bodyRx * 0.3, -headR * 0.5)
  ctx.quadraticCurveTo(bodyRx * 1.05, bodyRy * 0.15, bodyRx * 0.8, bodyRy * 0.85)
  ctx.stroke()

  ctx.restore()

  const gridN = 5 + (tid % 4)
  ctx.setStrokeStyle(pal.neon)
  ctx.setLineWidth(1)
  ctx.setGlobalAlpha(0.85)
  for (let n = 0; n < gridN; n++) {
    const x0 = x + rnd() * w * 0.85
    const y0 = y + rnd() * h * 0.85
    const len = 20 + rnd() * (Math.min(w, h) * 0.35)
    const horiz = rnd() > 0.5
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    if (horiz) ctx.lineTo(x0 + len, y0)
    else ctx.lineTo(x0, y0 + len)
    ctx.stroke()
    if (rnd() > 0.55) {
      ctx.setFillStyle(pal.neon2)
      ctx.beginPath()
      ctx.arc(horiz ? x0 + len : x0, horiz ? y0 : y0 + len, 2.5 * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.setStrokeStyle(pal.neon)
    }
  }
  ctx.setGlobalAlpha(1)

  const bs = Math.min(w, h) * 0.12
  drawCyberBracket(ctx, x + 6, y + 6, bs, pal.neon)
  ctx.save()
  ctx.translate(x + w - 6, y + 6)
  ctx.scale(-1, 1)
  drawCyberBracket(ctx, 0, 0, bs, pal.neon)
  ctx.restore()

  ctx.setStrokeStyle('rgba(212, 175, 55, 0.35)')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(x + w * 0.15, y + h * 0.88)
  ctx.lineTo(x + w * 0.85, y + h * 0.88)
  ctx.stroke()
}

module.exports = {
  drawPersonalityPortraitWx,
  TYPE_PALETTES
}
