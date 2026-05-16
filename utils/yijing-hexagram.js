/**
 * 周易六十四卦元数据：八宫归属、五行属性、卦气旺衰。
 * 提供上下卦 → 周易卦序（lots-data.js 索引）的映射。
 *
 * 先天八卦编号（梅花易数用）：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
 * 八宫五行：乾兑→金, 坎→水, 艮坤→土, 震巽→木, 离→火
 */

/**
 * 64 卦按周易卦序排列，与 lots-data.js 索引对应。
 * 每条: [上卦先天数, 下卦先天数, 所属宫, 宫五行, 卦名]
 * 上下卦先天数: 乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
 */
var HEXAGRAM_META = [
  { upper: 1, lower: 1, gong: '乾', gongWx: '金', name: '乾' },
  { upper: 8, lower: 8, gong: '坤', gongWx: '土', name: '坤' },
  { upper: 6, lower: 4, gong: '坎', gongWx: '水', name: '屯' },
  { upper: 7, lower: 6, gong: '艮', gongWx: '土', name: '蒙' },
  { upper: 6, lower: 1, gong: '坎', gongWx: '水', name: '需' },
  { upper: 1, lower: 6, gong: '乾', gongWx: '金', name: '讼' },
  { upper: 8, lower: 6, gong: '坤', gongWx: '土', name: '师' },
  { upper: 6, lower: 8, gong: '坎', gongWx: '水', name: '比' },
  { upper: 5, lower: 1, gong: '巽', gongWx: '木', name: '小畜' },
  { upper: 1, lower: 2, gong: '乾', gongWx: '金', name: '履' },
  { upper: 8, lower: 1, gong: '坤', gongWx: '土', name: '泰' },
  { upper: 1, lower: 8, gong: '乾', gongWx: '金', name: '否' },
  { upper: 1, lower: 3, gong: '乾', gongWx: '金', name: '同人' },
  { upper: 3, lower: 1, gong: '离', gongWx: '火', name: '大有' },
  { upper: 8, lower: 7, gong: '坤', gongWx: '土', name: '谦' },
  { upper: 4, lower: 8, gong: '震', gongWx: '木', name: '豫' },
  { upper: 2, lower: 4, gong: '兑', gongWx: '金', name: '随' },
  { upper: 7, lower: 5, gong: '艮', gongWx: '土', name: '蛊' },
  { upper: 8, lower: 2, gong: '坤', gongWx: '土', name: '临' },
  { upper: 5, lower: 8, gong: '巽', gongWx: '木', name: '观' },
  { upper: 3, lower: 4, gong: '离', gongWx: '火', name: '噬嗑' },
  { upper: 7, lower: 3, gong: '艮', gongWx: '土', name: '贲' },
  { upper: 7, lower: 8, gong: '艮', gongWx: '土', name: '剥' },
  { upper: 8, lower: 4, gong: '坤', gongWx: '土', name: '复' },
  { upper: 1, lower: 4, gong: '乾', gongWx: '金', name: '无妄' },
  { upper: 7, lower: 1, gong: '艮', gongWx: '土', name: '大畜' },
  { upper: 7, lower: 4, gong: '艮', gongWx: '土', name: '颐' },
  { upper: 2, lower: 5, gong: '兑', gongWx: '金', name: '大过' },
  { upper: 6, lower: 6, gong: '坎', gongWx: '水', name: '坎' },
  { upper: 3, lower: 3, gong: '离', gongWx: '火', name: '离' },
  { upper: 2, lower: 7, gong: '兑', gongWx: '金', name: '咸' },
  { upper: 4, lower: 5, gong: '震', gongWx: '木', name: '恒' },
  { upper: 1, lower: 7, gong: '乾', gongWx: '金', name: '遁' },
  { upper: 4, lower: 1, gong: '震', gongWx: '木', name: '大壮' },
  { upper: 3, lower: 8, gong: '离', gongWx: '火', name: '晋' },
  { upper: 8, lower: 3, gong: '坤', gongWx: '土', name: '明夷' },
  { upper: 5, lower: 3, gong: '巽', gongWx: '木', name: '家人' },
  { upper: 3, lower: 2, gong: '离', gongWx: '火', name: '睽' },
  { upper: 6, lower: 7, gong: '坎', gongWx: '水', name: '蹇' },
  { upper: 4, lower: 6, gong: '震', gongWx: '木', name: '解' },
  { upper: 7, lower: 2, gong: '艮', gongWx: '土', name: '损' },
  { upper: 5, lower: 4, gong: '巽', gongWx: '木', name: '益' },
  { upper: 2, lower: 1, gong: '兑', gongWx: '金', name: '夬' },
  { upper: 1, lower: 5, gong: '乾', gongWx: '金', name: '姤' },
  { upper: 2, lower: 8, gong: '兑', gongWx: '金', name: '萃' },
  { upper: 8, lower: 5, gong: '坤', gongWx: '土', name: '升' },
  { upper: 2, lower: 6, gong: '兑', gongWx: '金', name: '困' },
  { upper: 6, lower: 5, gong: '坎', gongWx: '水', name: '井' },
  { upper: 2, lower: 3, gong: '兑', gongWx: '金', name: '革' },
  { upper: 3, lower: 5, gong: '离', gongWx: '火', name: '鼎' },
  { upper: 4, lower: 4, gong: '震', gongWx: '木', name: '震' },
  { upper: 7, lower: 7, gong: '艮', gongWx: '土', name: '艮' },
  { upper: 5, lower: 7, gong: '巽', gongWx: '木', name: '渐' },
  { upper: 4, lower: 2, gong: '震', gongWx: '木', name: '归妹' },
  { upper: 4, lower: 3, gong: '震', gongWx: '木', name: '丰' },
  { upper: 3, lower: 7, gong: '离', gongWx: '火', name: '旅' },
  { upper: 5, lower: 5, gong: '巽', gongWx: '木', name: '巽' },
  { upper: 2, lower: 2, gong: '兑', gongWx: '金', name: '兑' },
  { upper: 5, lower: 6, gong: '巽', gongWx: '木', name: '涣' },
  { upper: 6, lower: 2, gong: '坎', gongWx: '水', name: '节' },
  { upper: 5, lower: 2, gong: '巽', gongWx: '木', name: '中孚' },
  { upper: 4, lower: 7, gong: '震', gongWx: '木', name: '小过' },
  { upper: 6, lower: 3, gong: '坎', gongWx: '水', name: '既济' },
  { upper: 3, lower: 6, gong: '离', gongWx: '火', name: '未济' }
]

/**
 * 上下卦先天数 → 周易卦序索引 (0-63) 的查找表。
 * 键: 'upper_lower'，值: lots-data index
 */
var GUA_TO_INDEX = {}
for (var i = 0; i < 64; i++) {
  var h = HEXAGRAM_META[i]
  GUA_TO_INDEX[h.upper + '_' + h.lower] = i
}

/**
 * 从梅花上下卦先天数映射到 lots-data 索引。
 * @param {number} upperGuaNum 上卦先天数 1-8
 * @param {number} lowerGuaNum 下卦先天数 1-8
 * @returns {number} 0-63，未找到返回 0
 */
function hexagramIdFromGua(upperGuaNum, lowerGuaNum) {
  var key = upperGuaNum + '_' + lowerGuaNum
  var idx = GUA_TO_INDEX[key]
  return idx != null ? idx : 0
}

/**
 * 节气→季节映射
 */
var JIEQI_SEASON = {
  '立春': '春', '雨水': '春', '惊蛰': '春', '春分': '春', '清明': '春', '谷雨': '春',
  '立夏': '夏', '小满': '夏', '芒种': '夏', '夏至': '夏', '小暑': '夏', '大暑': '夏',
  '立秋': '秋', '处暑': '秋', '白露': '秋', '秋分': '秋', '寒露': '秋', '霜降': '秋',
  '立冬': '冬', '小雪': '冬', '大雪': '冬', '冬至': '冬', '小寒': '冬', '大寒': '冬'
}

function jieqiToSeason(jieqi) {
  if (!jieqi) {
    var m = new Date().getMonth() + 1
    if (m >= 2 && m <= 4) return '春'
    if (m >= 5 && m <= 7) return '夏'
    if (m >= 8 && m <= 10) return '秋'
    return '冬'
  }
  return JIEQI_SEASON[jieqi] || '春'
}

/**
 * 卦气旺衰：五行在当前季节的旺相休囚死状态。
 *
 * 春：木旺 火相 水休 金囚 土死
 * 夏：火旺 土相 木休 水囚 金死
 * 秋：金旺 水相 土休 火囚 木死
 * 冬：水旺 木相 金休 土囚 火死
 * （四季月土旺的变体此处简化，并入对应季节）
 */
var QI_TABLE = {
  '春': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '夏': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '秋': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '冬': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' }
}

var QI_SCORE = { '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2 }

/**
 * 获取卦的卦气旺衰状态。
 * @param {number} hexagramIdx 0-63
 * @param {string} [jieqi] 节气名
 * @returns {{ state, score, label, season, gongWx }}
 */
function getGuaQi(hexagramIdx, jieqi) {
  var meta = HEXAGRAM_META[hexagramIdx] || HEXAGRAM_META[0]
  var season = jieqiToSeason(jieqi)
  var qiMap = QI_TABLE[season] || QI_TABLE['春']
  var state = qiMap[meta.gongWx] || '休'
  var score = QI_SCORE[state] || 0
  var label = meta.gongWx + '在' + season + '令为「' + state + '」'
  return {
    state: state,
    score: score,
    label: label,
    season: season,
    gongWx: meta.gongWx,
    gong: meta.gong,
    name: meta.name
  }
}

module.exports = {
  HEXAGRAM_META: HEXAGRAM_META,
  hexagramIdFromGua: hexagramIdFromGua,
  getGuaQi: getGuaQi,
  jieqiToSeason: jieqiToSeason,
  GUA_TO_INDEX: GUA_TO_INDEX
}
