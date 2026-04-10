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
        { name: '金', value: 50, tip: '肺（忧悲）· 言声、社交锋度' },
        { name: '木', value: 50, tip: '肝（怒）· 郁滞与少动' },
        { name: '水', value: 50, tip: '肾（恐）· 耗竭、根基感' },
        { name: '火', value: 50, tip: '心（亢奋）· 屏刺激、缺眠' },
        { name: '土', value: 50, tip: '脾（思）· 思虑内守' }
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
    { name: '金', value: jin, tip: '肺（忧悲）· 恢复低、烦闷、言多社交' },
    { name: '木', value: mu, tip: '肝（怒）· 易怒、少动、思多郁象' },
    { name: '水', value: shui, tip: '肾（恐）· 耗竭、睡眠少、底虚感' },
    { name: '火', value: huo, tip: '心（亢奋）· 缺眠、屏刺激、躁动耗竭' },
    { name: '土', value: tu, tip: '脾（思）· 烦恼、思静、闷中少泄' }
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

/**
 * 旧版 Canvas API 绘制五边形雷达（canvas-id）
 * @param {string} canvasId
 * @param {Page|Component} pageOrComp
 * @param {{ width: number, height: number }} rect boundingClientRect
 * @param {{ jin:number, mu:number, shui:number, huo:number, tu:number }} scores
 */
function drawFiveRadar(canvasId, pageOrComp, rect, scores) {
  const width = rect.width
  const height = rect.height
  if (width < 10 || height < 10) return

  const ctx = wx.createCanvasContext(canvasId, pageOrComp)
  const cx = width / 2
  const cy = height / 2 + 4
  const R = Math.min(width, height) * 0.34

  ctx.setFillStyle('rgb(252, 250, 246)')
  ctx.fillRect(0, 0, width, height)

  for (let level = 1; level <= 5; level++) {
    const r = (R * level) / 5
    ctx.beginPath()
    for (let i = 0; i <= 5; i++) {
      const angle = -Math.PI / 2 + ((i % 5) * 2 * Math.PI) / 5
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.setStrokeStyle(level === 5 ? 'rgba(93, 84, 72, 0.42)' : 'rgba(210, 200, 186, 0.5)')
    ctx.setLineWidth(level === 5 ? 1.1 : 0.55)
    ctx.stroke()
  }

  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle))
    ctx.setStrokeStyle('rgba(200, 192, 178, 0.4)')
    ctx.setLineWidth(0.5)
    ctx.stroke()
  }

  const vals = [scores.jin, scores.mu, scores.shui, scores.huo, scores.tu]
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const t = clamp(vals[i] / 100, 0, 1)
    const rr = R * (0.2 + 0.8 * t)
    const x = cx + rr * Math.cos(angle)
    const y = cy + rr * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.setFillStyle('rgba(57, 73, 171, 0.22)')
  ctx.fill()
  ctx.setStrokeStyle('rgba(40, 53, 147, 0.88)')
  ctx.setLineWidth(2)
  ctx.stroke()

  const names = ['金', '木', '水', '火', '土']
  ctx.setFontSize(Math.max(11, Math.floor(width / 28)))
  ctx.setFillStyle('#3e3428')
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    const lr = R + 16
    const x = cx + lr * Math.cos(angle)
    const y = cy + lr * Math.sin(angle)
    ctx.fillText(names[i], x - 6, y + 4)
  }

  ctx.draw()
}

module.exports = {
  computeFiveElements,
  drawFiveRadar,
  WINDOW,
  REFERENCE_WIKI
}
