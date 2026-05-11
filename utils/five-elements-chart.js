/**
 * 五行五边形雷达：把近窗自填记录加权为「五行–五脏–情志」意象分数（非诊断）。
 *
 * ── 概念依据（便于核对，优先采用维基百科等综述性条目）──
 * 1) Wuxing（五行/五运）：https://en.wikipedia.org/wiki/Wuxing_(Chinese_philosophy)
 *    英文常译 “Five Elements”，但条目说明其更重「过程、变化、质」而非西方四元素式的
 *    静态物质；在医学等领域中用作分类框架。
 * 2) Traditional Chinese medicine（中医学模型）：https://en.wikipedia.org/wiki/Traditional_Chinese_medicine
 *    条目给出五行与 zàng-fǔ 的配属：木–肝/胆，火–心/小肠，土–脾/胃，金–肺/大肠，水–肾/膀胱；
 *    并提到「七情」等内因可伤及脏腑功能；同时强调 TCM 的「脏腑」多为功能系统，与西医解剖器官
 *    不必一一等同。
 * 3) Stress (biology)（应激生物学）：https://en.wikipedia.org/wiki/Stress_(biology)
 *    条目概述心理应激激活交感–肾上腺与 HPA 轴、皮质醇等，对心血管、代谢、免疫、认知等多系统
 *    产生影响。本模块将「耗竭感、睡眠不足、易怒、屏刺激」等视作一般性慢性应激负荷的代理量，
 *    仅用于在「火/水」等轴上形成可解释的加权，不断言具体内分泌指标或器官损伤。
 *
 * 情志 → 五行轴（与教材常见「五志」表述一致，见上述 TCM 条目及大量二手综述）：
 * 怒 → 木（肝），思/虑 → 土（脾），忧悲 → 金（肺），恐 → 水（肾），喜/亢奋类 → 火（心）。
 * 小程序无「喜」单字段，用火轴代理：睡眠不足、屏幕刺激、主观耗竭等偏交感–觉醒负荷。
 *
 * 顶点顺序顺时针自正上起：金、木、水、火、土（与界面文案一致）。
 */

const WINDOW = 7

/** 供设置页或调试展示：参考文献（维基百科稳定条目，非医疗建议） */
const REFERENCE_WIKI = {
  wuxing: 'https://en.wikipedia.org/wiki/Wuxing_(Chinese_philosophy)',
  tcm: 'https://en.wikipedia.org/wiki/Traditional_Chinese_medicine',
  stress: 'https://en.wikipedia.org/wiki/Stress_(biology)'
}

/** 自修页底部小字（静态说明 + 免责）；动态一句仍用 compute 返回的 hint */
const RADAR_FOOTER_LINES = [
  '五行雷达：自正上顺时针为 金 → 木 → 水 → 火 → 土。',
  '计分参照维基百科「Wuxing (Chinese philosophy)」「Traditional Chinese medicine」「Stress (biology)」等综述；TCM 脏腑为功能模型，不等于西医解剖器官。',
  '本页分数与图形仅供自我观察，非中医辨证、非医疗诊断，亦不构成对未来的断言。情绪或睡眠持续困扰时请寻求专业帮助。',
  '参考文献：' +
    REFERENCE_WIKI.wuxing +
    ' · ' +
    REFERENCE_WIKI.tcm +
    ' · ' +
    REFERENCE_WIKI.stress
]

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x))
}

function avg(records, key) {
  const xs = records.map((r) => Number(r[key])).filter((n) => !Number.isNaN(n))
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function phaseRatio(last, id) {
  if (!last.length) return 0
  const n = last.filter((r) => r.phaseMode === id).length
  return n / last.length
}

/** 线性归一：x 落在 [a,b] 映到 [0,1]；缺省返回 neutral */
function norm(x, a, b, neutral) {
  const nu = neutral != null ? neutral : 0.45
  if (x == null || Number.isNaN(Number(x))) return nu
  return clamp((Number(x) - a) / (b - a || 1), 0, 1)
}

function roundScore(x) {
  return Math.round(clamp(x, 8, 96))
}

function emptyHint() {
  return (
    '尚无记录：五轴为均衡示意。有数据后按近 7 天自填项更新。' +
    '概念框架参见维基百科「Wuxing (Chinese philosophy)」「Traditional Chinese medicine」等综述条目；非辨证。'
  )
}

function dataHint(n) {
  return (
    `基于近 ${n} 天记录加权。` +
    '五行–脏腑对应取自维基百科「Traditional Chinese medicine」藏象综述；' +
    '怒/思/忧/恐与睡眠、耗竭等代理量参照常见教材五志分类及「Stress (biology)」应激多系统影响，' +
    '仅为自我观察隐喻，TCM 脏腑≠解剖器官，不能替代诊疗。'
  )
}

/**
 * @param {object[]} recordsAsc 按日期升序
 * @param {object} profile 档案（可选 recentState）
 * @param {object} personality 道性结果（可选 scores）
 */
function computeFiveElements(recordsAsc, profile, personality) {
  const last = recordsAsc.slice(-WINDOW)
  if (!last.length) {
    return {
      hasData: false,
      windowDays: 0,
      jin: 50,
      mu: 50,
      shui: 50,
      huo: 50,
      tu: 50,
      hint: emptyHint(),
      ref: REFERENCE_WIKI,
      rows: [
        { name: '金', value: 50, tip: '社交压力、情绪低落' },
        { name: '木', value: 50, tip: '容易发火、运动太少' },
        { name: '水', value: 50, tip: '身体疲惫、精力透支' },
        { name: '火', value: 50, tip: '刷屏太多、睡眠不足' },
        { name: '土', value: 50, tip: '想太多、闷在心里' }
      ]
    }
  }

  const anger = avg(last, 'angerCount')
  const worry = avg(last, 'worryCount')
  const screen = avg(last, 'screenHours')
  const walk = avg(last, 'walkMinutes')
  const sleepH = avg(last, 'sleepHours')
  const recovery = avg(last, 'recoveryScore')
  const drain = avg(last, 'drainScore')
  const social = avg(last, 'socialLoad')
  const blank = avg(last, 'blankMinutes')

  const rSi = phaseRatio(last, 'si')
  const rJing = phaseRatio(last, 'jing')
  const rYan = phaseRatio(last, 'yan')

  let internalWorry = 0.4
  if (worry != null && anger != null) {
    const denom = Math.max(0.8, anger + 1)
    internalWorry = clamp((worry + 0.3) / denom / 4, 0, 1)
  }

  // 木·肝：在志为怒（TCM 综述）；条达受阻侧用少动、思多略辅（肝郁常见表述，仍为隐喻）
  let mu =
    32 +
    32 * norm(anger, 0, 4.5) +
    12 * (1 - norm(walk, 8, 48, 0.38)) +
    10 * rSi

  // 火·心：教材在志为喜；无「喜」字段时用睡眠不足、娱乐屏、耗竭作交感–觉醒负荷代理（Stress 生物学条目）
  let huo =
    30 +
    20 * (1 - norm(sleepH, 5.2, 7.4)) +
    18 * norm(screen, 2.2, 8.5) +
    16 * norm(drain, 2.4, 5) +
    8 * norm(anger, 3, 10) * norm(drain, 2.8, 5)

  // 土·脾：在志为思；烦恼、思多/静多、内敛、留白少
  let tu =
    30 +
    20 * norm(worry, 0, 10) +
    14 * rSi +
    12 * rJing +
    12 * internalWorry +
    10 * (1 - norm(blank, 0, 28, 0.35))

  // 金·肺：在志为忧悲；用恢复偏低、烦闷登记作「低沉」代理；言多、社交作「声、锋」代理
  let jin =
    30 +
    20 * (1 - norm(recovery, 2, 4.6)) +
    14 * norm(worry, 0, 9) +
    16 * rYan +
    14 * norm(social, 0, 4.5)

  // 水·肾：在志为恐；用耗竭、恢复极低、睡眠过少作「恐/失守/底虚」代理（不等同西医肾脏内分泌）
  let shui =
    30 +
    22 * norm(drain, 2.5, 5) +
    18 * (1 - norm(recovery, 1.4, 4.2)) +
    14 * (1 - norm(sleepH, 4.8, 7.2)) +
    8 * norm(worry, 5, 14)

  if (profile && profile.recentState === 'low') {
    jin += 7 + 5 * (1 - norm(recovery, 2, 4))
    shui += 6 + 4 * norm(drain, 2, 5)
  }

  /** 档案作息：轻量偏移意象分（非诊断） */
  if (profile && profile.rhythmType === 'regular') {
    tu += 5
    shui += 3
  }
  if (profile && profile.rhythmType === 'late_early') {
    shui += 8
    huo += 5
    jin += 4
  }
  if (profile && profile.rhythmType === 'early') {
    mu += 4
    tu += 2
  }
  if (profile && profile.rhythmType === 'night') {
    huo += 6
    shui += 4
  }
  if (profile && profile.rhythmType === 'irregular') {
    tu += 4
    huo += 4
  }

  if (personality && personality.scores) {
    const s = personality.scores
    if (typeof s.刚 === 'number') jin += (s.刚 - 50) * 0.06
    if (typeof s.散 === 'number') mu += (s.散 - 50) * 0.05
    if (typeof s.动 === 'number') huo += (s.动 - 50) * 0.05
    if (typeof s.显 === 'number') huo += (s.显 - 50) * 0.04
  }

  jin = roundScore(jin)
  mu = roundScore(mu)
  shui = roundScore(shui)
  huo = roundScore(huo)
  tu = roundScore(tu)

  const rows = [
    { name: '金', value: jin, tip: '恢复不够、心情低落、社交消耗大' },
    { name: '木', value: mu, tip: '容易生气、运动太少、想太多' },
    { name: '水', value: shui, tip: '精力透支、睡得少、身体疲惫' },
    { name: '火', value: huo, tip: '睡眠不足、刷屏多、内心浮躁' },
    { name: '土', value: tu, tip: '烦心事多、一个人闷着、缺少释放' }
  ]

  return {
    hasData: true,
    windowDays: last.length,
    jin,
    mu,
    shui,
    huo,
    tu,
    hint: dataHint(last.length),
    ref: REFERENCE_WIKI,
    rows
  }
}

const WX_COLORS = [
  { key: 'jin',  main: '#C9B037', glow: 'rgba(201,176,55,0.45)',  stroke: 'rgba(160,140,40,0.85)',  label: '金' },
  { key: 'mu',   main: '#2E7D32', glow: 'rgba(46,125,50,0.45)',   stroke: 'rgba(30,100,35,0.85)',   label: '木' },
  { key: 'shui', main: '#1565C0', glow: 'rgba(21,101,192,0.45)',  stroke: 'rgba(15,80,160,0.85)',   label: '水' },
  { key: 'huo',  main: '#C62828', glow: 'rgba(198,40,40,0.45)',   stroke: 'rgba(165,30,30,0.85)',   label: '火' },
  { key: 'tu',   main: '#8D6E63', glow: 'rgba(141,110,99,0.45)',  stroke: 'rgba(110,85,75,0.85)',   label: '土' }
]

function vertexXY(cx, cy, r, i) {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function drawDashedLine(ctx, x0, y0, x1, y1, dash, gap) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len
  const uy = dy / len
  let d = 0
  ctx.beginPath()
  while (d < len) {
    const s = d
    const e = Math.min(d + dash, len)
    ctx.moveTo(x0 + ux * s, y0 + uy * s)
    ctx.lineTo(x0 + ux * e, y0 + uy * e)
    d = e + gap
  }
  ctx.stroke()
}

/**
 * 旧版 Canvas API：渐变填充 + 五行配色 + 发光数据点 + 分层网格。
 * @param fe computeFiveElements 的完整返回值（含 jin…tu）
 * @param prevFe 上一窗口的五行结果（可选，用于历史对比叠加）
 */
function drawFiveRadar(canvasId, pageOrComp, rect, fe, prevFe) {
  const width = rect.width
  const height = rect.height
  if (width < 10 || height < 10) return

  const ctx = wx.createCanvasContext(canvasId, pageOrComp)
  const cx = width / 2
  const cy = height / 2
  const R = Math.min(width, height) * 0.38

  // -- 背景：中心暖白径向渐变 --
  const bgGrd = ctx.createCircularGradient(cx, cy, R * 1.35)
  bgGrd.addColorStop(0, 'rgba(255, 252, 245, 1)')
  bgGrd.addColorStop(1, 'rgba(245, 240, 232, 1)')
  ctx.setFillStyle(bgGrd)
  ctx.fillRect(0, 0, width, height)

  // -- 同心五边形网格（5 层） --
  for (let level = 1; level <= 5; level++) {
    const r = (R * level) / 5
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const p = vertexXY(cx, cy, r, i % 5)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()
    if (level === 5) {
      ctx.setStrokeStyle('rgba(93, 84, 72, 0.5)')
      ctx.setLineWidth(1.4)
    } else {
      const alpha = 0.15 + level * 0.08
      ctx.setStrokeStyle('rgba(180, 170, 155, ' + alpha + ')')
      ctx.setLineWidth(0.5)
    }
    ctx.stroke()
  }

  // -- 辐射线：虚线，颜色随五行 --
  for (let i = 0; i < 5; i++) {
    const p = vertexXY(cx, cy, R, i)
    ctx.setStrokeStyle(WX_COLORS[i].glow)
    ctx.setLineWidth(0.7)
    drawDashedLine(ctx, cx, cy, p.x, p.y, 4, 3)
  }

  // -- 历史对比多边形（上周，如有） --
  if (prevFe && prevFe.hasData) {
    const prevVals = [prevFe.jin, prevFe.mu, prevFe.shui, prevFe.huo, prevFe.tu]
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const t = clamp(prevVals[i] / 100, 0, 1)
      const rr = R * (0.18 + 0.82 * t)
      const p = vertexXY(cx, cy, rr, i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()
    ctx.setFillStyle('rgba(160, 155, 145, 0.1)')
    ctx.fill()
    ctx.setStrokeStyle('rgba(140, 130, 120, 0.35)')
    ctx.setLineWidth(1.2)
    ctx.setLineDash([4, 3], 0)
    ctx.stroke()
    ctx.setLineDash([], 0)
  }

  // -- 当前数据多边形：径向渐变填充 --
  const vals = [fe.jin, fe.mu, fe.shui, fe.huo, fe.tu]
  const dataGrd = ctx.createCircularGradient(cx, cy, R * 0.85)
  dataGrd.addColorStop(0, 'rgba(63, 81, 181, 0.06)')
  dataGrd.addColorStop(0.6, 'rgba(63, 81, 181, 0.18)')
  dataGrd.addColorStop(1, 'rgba(48, 63, 159, 0.32)')
  ctx.beginPath()
  const dataPoints = []
  for (let i = 0; i < 5; i++) {
    const t = clamp(vals[i] / 100, 0, 1)
    const rr = R * (0.18 + 0.82 * t)
    const p = vertexXY(cx, cy, rr, i)
    dataPoints.push(p)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.setFillStyle(dataGrd)
  ctx.fill()
  ctx.setStrokeStyle('rgba(40, 53, 147, 0.88)')
  ctx.setLineWidth(2.2)
  ctx.stroke()

  // -- 顶点发光圆点（五行专属色） --
  for (let i = 0; i < 5; i++) {
    const dp = dataPoints[i]
    const c = WX_COLORS[i]
    ctx.setShadow(0, 0, 10, c.glow)
    ctx.beginPath()
    ctx.arc(dp.x, dp.y, 5, 0, Math.PI * 2)
    ctx.setFillStyle(c.main)
    ctx.fill()
    ctx.setShadow(0, 0, 0, 'transparent')
    ctx.beginPath()
    ctx.arc(dp.x, dp.y, 5, 0, Math.PI * 2)
    ctx.setStrokeStyle('rgba(255,255,255,0.85)')
    ctx.setLineWidth(1.2)
    ctx.stroke()
  }

  // -- 标签：五行色圆底 + 白字 + 分值 --
  const labelR = R + 22
  const circR = Math.max(11, Math.floor(Math.min(width, height) / 26))
  const fontSize = Math.max(11, Math.floor(circR * 0.9))
  const valFontSize = Math.max(9, fontSize - 3)
  for (let i = 0; i < 5; i++) {
    const p = vertexXY(cx, cy, labelR, i)
    const c = WX_COLORS[i]
    ctx.setShadow(0, 2, 6, c.glow)
    ctx.beginPath()
    ctx.arc(p.x, p.y, circR, 0, Math.PI * 2)
    ctx.setFillStyle(c.main)
    ctx.fill()
    ctx.setShadow(0, 0, 0, 'transparent')
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.setFontSize(fontSize)
    ctx.setFillStyle('#fff')
    ctx.fillText(c.label, p.x, p.y)
    ctx.setFontSize(valFontSize)
    ctx.setFillStyle(c.stroke)
    ctx.fillText(String(vals[i]), p.x, p.y + circR + valFontSize * 0.7)
  }

  ctx.draw()
}

/**
 * 计算偏移窗口的五行结果（用于历史对比）。
 * @param {number} windowOffset 0 = 最近 WINDOW 天，1 = 再往前 WINDOW 天
 */
function computeFiveElementsWithOffset(recordsAsc, profile, personality, windowOffset) {
  const offset = windowOffset || 0
  const end = recordsAsc.length - offset * WINDOW
  if (end <= 0) return null
  const slice = recordsAsc.slice(0, end)
  return computeFiveElements(slice, profile, personality)
}

module.exports = {
  computeFiveElements,
  computeFiveElementsWithOffset,
  drawFiveRadar,
  WINDOW,
  WX_COLORS,
  REFERENCE_WIKI,
  RADAR_FOOTER_LINES
}
