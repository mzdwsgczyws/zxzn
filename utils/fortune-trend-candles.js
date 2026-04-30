/**
 * 按日签文等第绘制示意 K 线（视觉隐喻，非证券交易）。
 * A 股配色习惯：阳线（收涨）偏红，阴线（收跌）偏绿。
 */

function tierToOHLC(tier) {
  switch (String(tier || '')) {
    case '上上':
      return { open: 0.34, close: 0.91, high: 0.96, low: 0.3 }
    case '上':
      return { open: 0.46, close: 0.73, high: 0.78, low: 0.43 }
    case '中':
      return { open: 0.515, close: 0.505, high: 0.6, low: 0.44 }
    case '下':
      return { open: 0.67, close: 0.43, high: 0.7, low: 0.4 }
    case '下下':
      return { open: 0.8, close: 0.13, high: 0.83, low: 0.09 }
    default:
      return { open: 0.5, close: 0.5, high: 0.56, low: 0.44 }
  }
}

const COLOR_BULL = '#c62828'
const COLOR_BULL_WICK = '#8e0000'
const COLOR_BEAR = '#2e7d32'
const COLOR_BEAR_WICK = '#1b5e20'
const COLOR_GRID = 'rgba(109, 93, 74, 0.12)'
const COLOR_AXIS = '#9a8b7a'

function priceToY(p, top, innerH) {
  return top + (1 - p) * innerH
}

/**
 * @param {CanvasContext} ctx wx.createCanvasContext
 * @param {number} width px
 * @param {number} height px
 * @param {{ tier: string }[]} series 按日期升序
 */
function paintFortuneCandles(ctx, width, height, series) {
  ctx.clearRect(0, 0, width, height)
  ctx.setFillStyle('#faf7f0')
  ctx.fillRect(0, 0, width, height)

  const padT = 14
  const padB = 34
  const padX = 10
  const innerW = Math.max(10, width - padX * 2)
  const innerH = Math.max(10, height - padT - padB)

  if (!series || !series.length) {
    ctx.setFillStyle('#9a8b7a')
    ctx.setFontSize(13)
    ctx.setTextAlign('center')
    ctx.fillText('暂无按日抽签记录', width / 2, height / 2 - 10)
    ctx.fillText('在首页摇动生成心象箴言后将在此汇总', width / 2, height / 2 + 12)
    ctx.setTextAlign('left')
    return
  }

  const n = series.length
  const slotW = innerW / n
  const candleW = Math.max(3, Math.min(11, slotW * 0.42))

  ctx.setStrokeStyle(COLOR_GRID)
  ctx.setLineWidth(1)
  for (let g = 0; g <= 4; g++) {
    const gy = padT + (innerH * g) / 4
    ctx.beginPath()
    ctx.moveTo(padX, gy)
    ctx.lineTo(padX + innerW, gy)
    ctx.stroke()
  }

  for (let i = 0; i < n; i++) {
    const { open, high, low, close } = tierToOHLC(series[i].tier)
    const cx = padX + (i + 0.5) * slotW
    const yHigh = priceToY(high, padT, innerH)
    const yLow = priceToY(low, padT, innerH)
    const yOpen = priceToY(open, padT, innerH)
    const yClose = priceToY(close, padT, innerH)
    const bodyTop = Math.min(yOpen, yClose)
    const bodyBot = Math.max(yOpen, yClose)
    let bodyH = bodyBot - bodyTop
    const isBull = close >= open
    if (bodyH < 2) bodyH = 2

    const wickColor = isBull ? COLOR_BULL_WICK : COLOR_BEAR_WICK
    ctx.setStrokeStyle(wickColor)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(cx, yHigh)
    ctx.lineTo(cx, yLow)
    ctx.stroke()

    const fill = isBull ? COLOR_BULL : COLOR_BEAR
    ctx.setFillStyle(fill)
    ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH)
    ctx.setStrokeStyle(isBull ? COLOR_BULL_WICK : COLOR_BEAR_WICK)
    ctx.strokeRect(cx - candleW / 2, bodyTop, candleW, bodyH)
  }

  ctx.setFillStyle(COLOR_AXIS)
  ctx.setFontSize(10)
  ctx.setTextAlign('center')
  const labelStep = Math.max(1, Math.ceil(n / 6))
  for (let i = 0; i < n; i += labelStep) {
    const cx = padX + (i + 0.5) * slotW
    const lab = shortenDateLabel(series[i].dateStr)
    ctx.fillText(lab, cx, height - 12)
  }
  if ((n - 1) % labelStep !== 0) {
    const last = n - 1
    const cx = padX + (last + 0.5) * slotW
    ctx.fillText(shortenDateLabel(series[last].dateStr), cx, height - 12)
  }
  ctx.setTextAlign('left')
}

function shortenDateLabel(dateStr) {
  const parts = String(dateStr || '').split('-').map((x) => parseInt(x, 10))
  if (parts.length < 3 || parts.some((x) => Number.isNaN(x))) return dateStr || ''
  return `${parts[1]}/${parts[2]}`
}

module.exports = {
  tierToOHLC,
  paintFortuneCandles,
  shortenDateLabel
}
