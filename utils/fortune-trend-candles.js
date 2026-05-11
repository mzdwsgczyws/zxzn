/**
 * 按日签文等第绘制层级柱状示意图（视觉隐喻，非证券交易、非行情推断）。
 * Y 轴按本期最高/最低自适应缩放并留白，衔接多日层级变化；配色仅为界面习惯。
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

/** 首根用模板绝对价位；之后每根开盘价衔接上一根收盘价，涨跌与影线形状沿用模板 */
function chainedOHLCFromTier(tier, prevClose) {
  const t = tierToOHLC(tier)
  if (prevClose == null) {
    return { open: t.open, high: t.high, low: t.low, close: t.close }
  }
  const open = prevClose
  const close = open + (t.close - t.open)
  const refBodyTop = Math.max(t.open, t.close)
  const refBodyBot = Math.min(t.open, t.close)
  const upperWick = t.high - refBodyTop
  const lowerWick = refBodyBot - t.low
  const high = Math.max(open, close) + upperWick
  const low = Math.min(open, close) - lowerWick
  return { open, high, low, close }
}

/** 按日期顺序生成连贯 OHLC（不设价位上下限，交由 Y 轴缩放容纳） */
function buildChainedBars(series) {
  const bars = []
  let prevClose = null
  for (let i = 0; i < series.length; i++) {
    const b = chainedOHLCFromTier(series[i].tier, prevClose)
    bars.push(b)
    prevClose = b.close
  }
  return bars
}

/** 取本期可见名义价位区间，上下留白比例接近行情图 */
function computeVisibleRange(bars) {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]
    lo = Math.min(lo, b.low)
    hi = Math.max(hi, b.high)
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { yMin: 0, yMax: 1 }
  }
  const span = hi - lo
  const padRatio = 0.08
  const pad = span > 1e-12 ? Math.max(span * padRatio, span * 0.025) : Math.max(Math.abs(hi) * 0.06, 0.04)
  return { yMin: lo - pad, yMax: hi + pad }
}

function formatAxisPrice(p) {
  return Number.isFinite(p) ? p.toFixed(2) : ''
}

const COLOR_BULL = '#c62828'
const COLOR_BULL_WICK = '#8e0000'
const COLOR_BEAR = '#2e7d32'
const COLOR_BEAR_WICK = '#1b5e20'
const COLOR_GRID = 'rgba(109, 93, 74, 0.12)'
const COLOR_AXIS = '#9a8b7a'

/** p 越高越靠近画布上沿 */
function priceToY(p, top, innerH, yMin, yMax) {
  const den = yMax - yMin
  if (!(den > 0)) return top + innerH / 2
  const t = (p - yMin) / den
  const clamped = Math.min(1, Math.max(0, t))
  return top + (1 - clamped) * innerH
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
  const padR = 38
  const plotRight = Math.max(padX + 20, width - padR)
  const innerW = Math.max(10, plotRight - padX)
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

  const bars = buildChainedBars(series)
  const { yMin, yMax } = computeVisibleRange(bars)

  const n = series.length
  const slotW = innerW / n
  const candleW = Math.max(3, Math.min(11, slotW * 0.42))

  ctx.setStrokeStyle(COLOR_GRID)
  ctx.setLineWidth(1)
  for (let k = 0; k <= 4; k++) {
    const price = yMax - (k / 4) * (yMax - yMin)
    const gy = priceToY(price, padT, innerH, yMin, yMax)
    ctx.beginPath()
    ctx.moveTo(padX, gy)
    ctx.lineTo(padX + innerW, gy)
    ctx.stroke()
  }

  ctx.setFillStyle(COLOR_AXIS)
  ctx.setFontSize(9)
  ctx.setTextAlign('right')
  for (let k = 0; k <= 4; k++) {
    const price = yMax - (k / 4) * (yMax - yMin)
    const gy = priceToY(price, padT, innerH, yMin, yMax)
    ctx.fillText(formatAxisPrice(price), width - 4, gy + 3)
  }

  for (let i = 0; i < n; i++) {
    const { open, high, low, close } = bars[i]
    const cx = padX + (i + 0.5) * slotW
    const yHigh = priceToY(high, padT, innerH, yMin, yMax)
    const yLow = priceToY(low, padT, innerH, yMin, yMax)
    const yOpen = priceToY(open, padT, innerH, yMin, yMax)
    const yClose = priceToY(close, padT, innerH, yMin, yMax)
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
  chainedOHLCFromTier,
  buildChainedBars,
  computeVisibleRange,
  paintFortuneCandles,
  shortenDateLabel
}
