/**
 * 梅花易数起卦引擎。
 * 采用「时间 + 命数」混合起卦法：融合当前农历时间（天时）与用户出生命数（人命），
 * 使同一时刻不同人得到不同卦象，符合梅花"心数"传统。
 *
 * 先天八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8
 * 八卦五行：乾兑→金, 离→火, 震巽→木, 坎→水, 艮坤→土
 */

var lunar = require('./lunar-calendar.js')

var GUA_NAMES = ['', '乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
var GUA_WUXING = ['', '金', '金', '火', '木', '木', '水', '土', '土']
var WUXING_LIST = ['金', '木', '水', '火', '土']

var GUA_YINYANG = [
  [],
  [1, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 0]
]

/**
 * 五行生克关系矩阵。
 * shengke[a][b] 表示 a 对 b 的关系:
 *   'sheng' = a 生 b, 'ke' = a 克 b, 'bihe' = 比和,
 *   'bei_sheng' = a 被 b 生, 'bei_ke' = a 被 b 克
 */
var WX_IDX = { '金': 0, '木': 1, '水': 2, '火': 3, '土': 4 }
var SHENG_ORDER = [2, 1, 3, 4, 0]

function wxRelation(tiWx, yongWx) {
  if (tiWx === yongWx) return 'bihe'
  var ti = WX_IDX[tiWx]
  var yo = WX_IDX[yongWx]
  if (ti == null || yo == null) return 'bihe'
  if (SHENG_ORDER[ti] === yo) return 'ti_sheng_yong'
  if (SHENG_ORDER[yo] === ti) return 'yong_sheng_ti'
  var keOrder = [1, 4, 3, 0, 2]
  if (keOrder[ti] === yo) return 'ti_ke_yong'
  if (keOrder[yo] === ti) return 'yong_ke_ti'
  return 'bihe'
}

function shengkeScore(rel) {
  switch (rel) {
    case 'yong_sheng_ti': return 3
    case 'bihe': return 2
    case 'ti_ke_yong': return 1
    case 'ti_sheng_yong': return -1
    case 'yong_ke_ti': return -3
    default: return 0
  }
}

function shengkeLabel(rel) {
  switch (rel) {
    case 'yong_sheng_ti': return '用生体·大吉'
    case 'bihe': return '体用比和·吉'
    case 'ti_ke_yong': return '体克用·小吉'
    case 'ti_sheng_yong': return '体生用·泄气'
    case 'yong_ke_ti': return '用克体·凶'
    default: return '未定'
  }
}

function numToGua(n) {
  var r = n % 8
  return r === 0 ? 8 : r
}

function numToYao(n) {
  var r = n % 6
  return r === 0 ? 6 : r
}

/**
 * 将上卦(1-8)和下卦(1-8)组成6爻
 * 爻序从下到上: [初爻, 二爻, 三爻, 四爻, 五爻, 上爻]
 * 下卦提供初爻到三爻，上卦提供四爻到上爻
 */
function buildYaoArray(upperGuaNum, lowerGuaNum) {
  var lower = GUA_YINYANG[lowerGuaNum] || [0, 0, 0]
  var upper = GUA_YINYANG[upperGuaNum] || [0, 0, 0]
  return [lower[0], lower[1], lower[2], upper[0], upper[1], upper[2]]
}

/**
 * 从6爻数组反推上下卦编号
 */
function yaoToGuaNums(yao) {
  function trigramNum(a, b, c) {
    for (var i = 1; i <= 8; i++) {
      var g = GUA_YINYANG[i]
      if (g[0] === a && g[1] === b && g[2] === c) return i
    }
    return 8
  }
  var lower = trigramNum(yao[0], yao[1], yao[2])
  var upper = trigramNum(yao[3], yao[4], yao[5])
  return { upper: upper, lower: lower }
}

/**
 * 变卦：在动爻位置翻转阴阳
 */
function calcBianGua(upperGuaNum, lowerGuaNum, movingLine) {
  var yao = buildYaoArray(upperGuaNum, lowerGuaNum)
  var idx = movingLine - 1
  yao[idx] = yao[idx] === 1 ? 0 : 1
  return yaoToGuaNums(yao)
}

/**
 * 互卦：取本卦2-4爻为下卦，3-5爻为上卦
 */
function calcHuGua(upperGuaNum, lowerGuaNum) {
  var yao = buildYaoArray(upperGuaNum, lowerGuaNum)
  var huLower = [yao[1], yao[2], yao[3]]
  var huUpper = [yao[2], yao[3], yao[4]]
  function trigramNum(a, b, c) {
    for (var i = 1; i <= 8; i++) {
      var g = GUA_YINYANG[i]
      if (g[0] === a && g[1] === b && g[2] === c) return i
    }
    return 8
  }
  return {
    upper: trigramNum(huUpper[0], huUpper[1], huUpper[2]),
    lower: trigramNum(huLower[0], huLower[1], huLower[2])
  }
}

/**
 * 起卦主函数。
 * @param {Date} now 当前时间
 * @param {object} birthData 出生数据
 * @param {number} [birthData.birthYear] 公历出生年
 * @param {number} [birthData.birthMonth] 公历出生月
 * @param {number} [birthData.birthDay] 公历出生日
 * @param {number|null} [birthData.birthHour] 出生时辰 0-11 (子-亥), null=不详
 * @returns {object} 卦象详情
 */
function castMeihua(now, birthData) {
  var y = now.getFullYear()
  var m = now.getMonth() + 1
  var d = now.getDate()
  var h = now.getHours()

  var nowLunar = lunar.solarToLunar(y, m, d)
  var nowYearZhi = nowLunar.yearZhiIdx + 1
  var nowMonth = nowLunar.lunarMonth
  var nowDay = nowLunar.lunarDay
  var nowHourZhi = lunar.hourToShichen(h) + 1

  var personalNum = 0
  var hasBirth = false
  if (birthData && birthData.birthYear && birthData.birthMonth && birthData.birthDay) {
    var bLunar = lunar.solarToLunar(birthData.birthYear, birthData.birthMonth, birthData.birthDay)
    var bYearZhi = bLunar.yearZhiIdx + 1
    var bMonth = bLunar.lunarMonth
    var bDay = bLunar.lunarDay
    var bHourZhi = (birthData.birthHour != null) ? (birthData.birthHour + 1) : 1
    personalNum = bYearZhi + bMonth + bDay + bHourZhi
    hasBirth = true
  }

  var upperSum = nowYearZhi + nowMonth + nowDay + personalNum
  var lowerSum = nowYearZhi + nowMonth + nowDay + nowHourZhi + personalNum
  var yaoSum = lowerSum

  var upperGuaNum = numToGua(upperSum)
  var lowerGuaNum = numToGua(lowerSum)
  var movingLine = numToYao(yaoSum)

  var tiGua, yongGua
  if (movingLine >= 1 && movingLine <= 3) {
    yongGua = lowerGuaNum
    tiGua = upperGuaNum
  } else {
    yongGua = upperGuaNum
    tiGua = lowerGuaNum
  }

  var tiWuxing = GUA_WUXING[tiGua]
  var yongWuxing = GUA_WUXING[yongGua]
  var rel = wxRelation(tiWuxing, yongWuxing)

  var bianGua = calcBianGua(upperGuaNum, lowerGuaNum, movingLine)
  var huGua = calcHuGua(upperGuaNum, lowerGuaNum)

  var bianRel = wxRelation(tiWuxing, GUA_WUXING[bianGua.upper] || GUA_WUXING[bianGua.lower] || tiWuxing)

  var guaFullName = GUA_NAMES[upperGuaNum] + GUA_NAMES[lowerGuaNum]
  var upperLabel = GUA_NAMES[upperGuaNum] + '(' + GUA_WUXING[upperGuaNum] + ')'
  var lowerLabel = GUA_NAMES[lowerGuaNum] + '(' + GUA_WUXING[lowerGuaNum] + ')'

  return {
    upperGua: upperGuaNum,
    lowerGua: lowerGuaNum,
    upperGuaName: GUA_NAMES[upperGuaNum],
    lowerGuaName: GUA_NAMES[lowerGuaNum],
    guaFullName: guaFullName,
    upperLabel: upperLabel,
    lowerLabel: lowerLabel,
    movingLine: movingLine,
    tiGua: tiGua,
    yongGua: yongGua,
    tiGuaName: GUA_NAMES[tiGua],
    yongGuaName: GUA_NAMES[yongGua],
    tiWuxing: tiWuxing,
    yongWuxing: yongWuxing,
    relation: rel,
    score: shengkeScore(rel),
    label: shengkeLabel(rel),
    bianGua: bianGua,
    bianGuaName: GUA_NAMES[bianGua.upper] + GUA_NAMES[bianGua.lower],
    huGua: huGua,
    huGuaName: GUA_NAMES[huGua.upper] + GUA_NAMES[huGua.lower],
    hasBirthData: hasBirth,
    lunarInfo: { year: nowLunar.lunarYear, month: nowMonth, day: nowDay, hourZhi: nowHourZhi - 1 }
  }
}

module.exports = {
  castMeihua: castMeihua,
  GUA_NAMES: GUA_NAMES,
  GUA_WUXING: GUA_WUXING,
  GUA_YINYANG: GUA_YINYANG,
  wxRelation: wxRelation,
  shengkeScore: shengkeScore,
  shengkeLabel: shengkeLabel
}
