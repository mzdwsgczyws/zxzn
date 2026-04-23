/**
 * 一次性模拟：随机答题下 16 型分布，检测是否某型明显易中
 * 运行：node utils/_sim_quiz_distribution.js
 */
const { calculatePersonality, QUESTIONS, PERSONALITY_TYPES, PATTERN_TO_TYPE_ID } = require('./personality.js')

function randomAnswers() {
  const a = {}
  QUESTIONS.forEach((q) => {
    a[q.id] = Math.random() < 0.5 ? 0 : 1
  })
  return a
}

function biasedAnswers(p0) {
  const a = {}
  QUESTIONS.forEach((q) => {
    a[q.id] = Math.random() < p0 ? 0 : 1
  })
  return a
}

function runMonteCarlo(name, n, genAnswers) {
  const hist = {}
  for (let i = 0; i < 16; i++) hist[i] = 0
  for (let k = 0; k < n; k++) {
    const r = calculatePersonality(genAnswers(), {})
    hist[r.typeId] = (hist[r.typeId] || 0) + 1
  }
  const entries = Object.entries(hist)
    .map(([id, c]) => ({
      id: Number(id),
      c,
      pct: ((c / n) * 100).toFixed(2),
      figure: PERSONALITY_TYPES[Number(id)].figure
    }))
    .sort((a, b) => b.c - a.c)
  const maxPct = (entries[0].c / n) * 100
  const entropy = -entries.reduce((s, e) => {
    if (e.c === 0) return s
    const p = e.c / n
    return s + p * Math.log2(p)
  }, 0)
  const maxEntropy = Math.log2(16)
  console.log('\n=== ' + name + ' (n=' + n + ') ===')
  console.log('熵/最大熵:', entropy.toFixed(3), '/', maxEntropy.toFixed(3), '  归一:', (entropy / maxEntropy).toFixed(3))
  console.log('最高占比:', entries[0].figure, entries[0].pct + '%')
  entries.slice(0, 8).forEach((e) => {
    console.log('  ', e.figure.padEnd(4), e.pct + '%', 'id=' + e.id)
  })
  return { hist, entries, maxPct }
}

const n = 30000
runMonteCarlo('纯随机 0/1（每题 p=0.5）', n, randomAnswers)

runMonteCarlo('轻微偏 A（每题 p(选第一栏)=0.55）', n, () => biasedAnswers(0.55))

runMonteCarlo('轻微偏 B（每题 p(选第一栏)=0.45）', n, () => biasedAnswers(0.45))

// 全难选
const allNeither = {}
QUESTIONS.forEach((q) => {
  allNeither[q.id] = 2
})
const rAllN = calculatePersonality(allNeither, {})
console.log('\n=== 极端：36 题全「都难选」===')
console.log('结果:', rAllN.figure, rAllN.typeName, 'vector', rAllN.vector.map((x) => x.toFixed(3)))

// 网格：每维 k 题选 0、9-k 题选 1（同维内前 k 题 0 后 9-k 题 1）— 粗看各维端点
console.log('\n=== 角点：每维全 0 或全 1（二择 only）===')
function cornerPattern(dj, gr, sj, xz) {
  const a = {}
  const val = { dj, gr, sj, xz }
  const byDim = {
    dj: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    gr: [10, 11, 12, 13, 14, 15, 16, 17, 18],
    sj: [19, 20, 21, 22, 23, 24, 25, 26, 27],
    xz: [28, 29, 30, 31, 32, 33, 34, 35, 36]
  }
  for (const dim of ['dj', 'gr', 'sj', 'xz']) {
    byDim[dim].forEach((id) => {
      a[id] = val[dim]
    })
  }
  return a
}
;[
  { name: '四维全 0(第一栏)', p: { dj: 0, gr: 0, sj: 0, xz: 0 } },
  { name: '四维全 1(第二栏)', p: { dj: 1, gr: 1, sj: 1, xz: 1 } },
  { name: '动0 其1', p: { dj: 0, gr: 1, sj: 1, xz: 1 } },
  { name: '动1 其0', p: { dj: 1, gr: 0, sj: 0, xz: 0 } }
].forEach(({ name, p }) => {
  const r = calculatePersonality(cornerPattern(p.dj, p.gr, p.sj, p.xz), {})
  console.log(name, '->', r.figure, r.vector.map((x) => x.toFixed(2)).join(','))
})

// 对照：四维 U(0,1) 用当前「分箱 + 双射」应接近各型 6.25%
function typeIdFromVector(vec) {
  const p =
    (vec[0] >= 0.5 ? 1 : 0) |
    (vec[1] >= 0.5 ? 2 : 0) |
    (vec[2] >= 0.5 ? 4 : 0) |
    (vec[3] >= 0.5 ? 8 : 0)
  return PATTERN_TO_TYPE_ID[p]
}
{
  const h = {}
  for (let i = 0; i < 16; i++) h[i] = 0
  for (let k = 0; k < 50000; k++) {
    const vec = [Math.random(), Math.random(), Math.random(), Math.random()]
    h[typeIdFromVector(vec)]++
  }
  const top = Object.entries(h)
    .map(([id, c]) => ({ id: Number(id), c, figure: PERSONALITY_TYPES[Number(id)].figure, pct: ((c / 50000) * 100).toFixed(2) }))
    .sort((a, b) => b.c - a.c)
  console.log('\n=== 对照：U(0,1) 四分箱 + 双射（n=50000，理论每型~6.25%）===')
  top.forEach((e) => console.log('  ', e.figure, e.pct + '%'))
}

