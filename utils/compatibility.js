/**
 * 道性十六型 性格匹配度算法
 *
 * 输入：两组四维分数 { 动, 刚, 散, 显 }，各 0-100
 * 输出：{ score, label, analysis, tips }
 *
 * 维度匹配逻辑：
 *   动/静、刚/柔 — 互补加分（一高一低 = opposites attract）
 *   散/聚、显/隐 — 同向加分（同高或同低 = 节奏同频）
 */

const DIMS = ['动', '刚', '散', '显']

const DIM_PAIR_LABEL = {
  动: ['动', '静'],
  刚: ['刚', '柔'],
  散: ['散', '聚'],
  显: ['显', '隐']
}

const LABELS = [
  { min: 90, text: '天作之合' },
  { min: 75, text: '互补共修' },
  { min: 55, text: '同道共行' },
  { min: 40, text: '磨合修炼' },
  { min: 0, text: '相敬如宾' }
]

function clamp(lo, hi, v) {
  return v < lo ? lo : v > hi ? hi : v
}

function isHigh(v) { return v > 60 }
function isLow(v) { return v < 40 }

/**
 * @param {{ 动: number, 刚: number, 散: number, 显: number }} scoresA
 * @param {{ 动: number, 刚: number, 散: number, 显: number }} scoresB
 * @returns {{ score: number, label: string, analysis: string, tips: string[] }}
 */
function computeCompatibility(scoresA, scoresB) {
  let totalBonus = 0
  let totalPenalty = 0
  const agreeDims = []
  const differDims = []

  DIMS.forEach(function (dim) {
    const a = scoresA[dim] || 0
    const b = scoresB[dim] || 0
    const diff = Math.abs(a - b)

    if (dim === '动' || dim === '刚') {
      // 互补维度：差异大反而好
      if (isHigh(a) && isLow(b) || isLow(a) && isHigh(b)) {
        totalBonus += 12
        agreeDims.push(dim)
      } else if (diff > 40) {
        totalBonus += 6
        agreeDims.push(dim)
      } else if (diff < 15) {
        totalPenalty += 4
        differDims.push(dim)
      }
    } else {
      // 同向维度（散/聚、显/隐）：同方向更好
      if ((isHigh(a) && isHigh(b)) || (isLow(a) && isLow(b))) {
        totalBonus += 12
        agreeDims.push(dim)
      } else if (diff < 15) {
        totalBonus += 6
        agreeDims.push(dim)
      } else if (diff > 40) {
        totalPenalty += 4
        differDims.push(dim)
      }
    }
  })

  var avgDiff = DIMS.reduce(function (sum, dim) {
    return sum + Math.abs((scoresA[dim] || 0) - (scoresB[dim] || 0))
  }, 0) / DIMS.length

  var baseScore = 100 - avgDiff * 0.8
  var score = clamp(0, 100, Math.round(baseScore + totalBonus - totalPenalty))

  var label = LABELS[LABELS.length - 1].text
  for (var i = 0; i < LABELS.length; i++) {
    if (score >= LABELS[i].min) {
      label = LABELS[i].text
      break
    }
  }

  var analysis = buildAnalysis(scoresA, scoresB, agreeDims, differDims, score)
  var tips = buildTips(scoresA, scoresB, agreeDims, differDims)

  return { score: score, label: label, analysis: analysis, tips: tips }
}

function descDim(dim, val) {
  var pair = DIM_PAIR_LABEL[dim]
  return val > 60 ? '偏' + pair[0] : val < 40 ? '偏' + pair[1] : pair[0] + pair[1] + '均衡'
}

function buildAnalysis(a, b, agreeDims, differDims, score) {
  var sentences = []

  if (agreeDims.length >= 3) {
    sentences.push('两人在多个维度上形成良好共振，整体能量互通性强。')
  } else if (agreeDims.length >= 1) {
    var agreeDesc = agreeDims.map(function (d) {
      return DIM_PAIR_LABEL[d][0] + '/' + DIM_PAIR_LABEL[d][1]
    }).join('、')
    sentences.push('在' + agreeDesc + '维度上契合度较高，容易产生默契。')
  }

  if (differDims.length >= 2) {
    var differDesc = differDims.map(function (d) {
      return DIM_PAIR_LABEL[d][0] + '/' + DIM_PAIR_LABEL[d][1]
    }).join('、')
    sentences.push('在' + differDesc + '维度上存在张力，需要双方有意识地磨合与理解。')
  } else if (differDims.length === 1) {
    var d = differDims[0]
    sentences.push(DIM_PAIR_LABEL[d][0] + '/' + DIM_PAIR_LABEL[d][1] + '维度的差异可能带来小摩擦，但也是互相学习的窗口。')
  }

  if (sentences.length === 0) {
    if (score >= 75) {
      sentences.push('两人气场相近又有微妙互补，相处起来既舒适又有新鲜感。')
    } else {
      sentences.push('整体匹配度适中，关系的深度取决于双方的沟通意愿与成长方向。')
    }
  }

  return sentences.join('')
}

function buildTips(a, b, agreeDims, differDims) {
  var tips = []

  var hasComplementDong = (a['动'] > 60 && b['动'] < 40) || (a['动'] < 40 && b['动'] > 60)
  var hasComplementGang = (a['刚'] > 60 && b['刚'] < 40) || (a['刚'] < 40 && b['刚'] > 60)
  var sanConflict = Math.abs((a['散'] || 0) - (b['散'] || 0)) > 35
  var xianConflict = Math.abs((a['显'] || 0) - (b['显'] || 0)) > 35

  if (hasComplementDong) {
    tips.push('一方好动一方偏静，可约定「各自时间」与「共同行动时间」轮替，既给空间也有交集。')
  }
  if (hasComplementGang) {
    tips.push('刚柔互补是优势，但决策时先让「柔」方充分表达，再由「刚」方落定，避免一方长期妥协。')
  }
  if (sanConflict) {
    tips.push('散/聚节奏不同步时，试着用共享清单同步进度，减少「你太随意/你太死板」的误解。')
  }
  if (xianConflict) {
    tips.push('显/隐差异大时，高显方可适度为对方留出低调空间，高隐方偶尔主动分享感受。')
  }

  if (tips.length === 0) {
    tips.push('定期交流彼此当前的节奏感受，保持关系的弹性。')
    tips.push('在对方擅长的维度上适当「让位」，让合作自然分工。')
  }

  return tips.slice(0, 3)
}

module.exports = { computeCompatibility }
