/**
 * 紫微斗数简排：命宫/身宫安置、五虎遁宫干、纳音五行局、十二宫、今日流日宫位。
 * 不排 108 颗星曜（属完整紫微应用范畴），仅提供与抽签权重相关的核心信息。
 *
 * 输入：出生农历年/月/时辰/性别。
 * 算法依据：《紫微斗数全书》安星诀 + 五虎遁年起月诀。
 */

var lunar = require('./lunar-calendar.js')

var GAN = lunar.GAN
var ZHI = lunar.ZHI

var PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母']

/**
 * 宫位→箴言领域映射
 */
var PALACE_DOMAIN = {
  '命宫': 'self',
  '兄弟': 'family',
  '夫妻': 'relation',
  '子女': 'family',
  '财帛': 'finance',
  '疾厄': 'health',
  '迁移': 'work',
  '交友': 'relation',
  '官禄': 'work',
  '田宅': 'family',
  '福德': 'rest',
  '父母': 'family'
}

/**
 * 五虎遁：年干 → 寅宫天干索引。
 * 甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅
 */
var WUHU_DUN = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]

/**
 * 纳音五行表：60 甲子 → 五行局。
 * 索引 = (ganIdx * 12 + zhiIdx) % 60（注意与传统六十甲子序一致需特殊映射）
 * 五行局: 2=水二局, 3=木三局, 4=金四局, 5=土五局, 6=火六局
 */
var NAYIN_TABLE = [
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3,
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3,
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3,
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3,
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3,
  4, 4, 6, 6, 5, 5, 2, 2, 3, 3
]

var WUXING_JU_NAMES = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' }

/**
 * 计算纳音五行局。
 * @param {number} ganIdx 天干索引 0-9
 * @param {number} zhiIdx 地支索引 0-11
 * @returns {number} 2/3/4/5/6
 */
function nayinWuxingJu(ganIdx, zhiIdx) {
  var jiazi = (ganIdx % 10) * 6 + Math.floor(zhiIdx / 2)
  var idx = jiazi % 30
  var group = Math.floor(idx / 5)
  var cycle = [4, 6, 5, 2, 3, 4]
  return cycle[group] || 4
}

/**
 * 安命宫。
 * 顺月逆时：正月从寅起，顺数到出生月；再从该宫逆数到出生时辰。
 * @param {number} lunarMonth 农历月 1-12
 * @param {number} hourZhi 时辰地支索引 0-11 (子=0)
 * @returns {number} 命宫地支索引 0-11
 */
function calcMingGong(lunarMonth, hourZhi) {
  var monthPos = (lunarMonth + 1) % 12
  var mingZhi = ((monthPos - hourZhi) % 12 + 12) % 12
  return mingZhi
}

/**
 * 安身宫。
 * 顺月顺时。
 */
function calcShenGong(lunarMonth, hourZhi) {
  var monthPos = (lunarMonth + 1) % 12
  return (monthPos + hourZhi) % 12
}

/**
 * 推算命宫天干（五虎遁）。
 * @param {number} yearGanIdx 年干索引 0-9
 * @param {number} mingGongZhi 命宫地支索引 0-11
 * @returns {number} 命宫天干索引 0-9
 */
function calcMingGongGan(yearGanIdx, mingGongZhi) {
  var yinGan = WUHU_DUN[yearGanIdx]
  var offset = ((mingGongZhi - 2) % 12 + 12) % 12
  return (yinGan + offset) % 10
}

/**
 * 排十二宫。从命宫起逆时针排列。
 * @param {number} mingGongZhi 命宫地支索引
 * @param {number} yearGanIdx 年干索引
 * @returns {Array<{name, zhiIdx, zhiName, ganIdx, ganName, ganZhi}>}
 */
function arrangePalaces(mingGongZhi, yearGanIdx) {
  var palaces = []
  for (var i = 0; i < 12; i++) {
    var zhiIdx = ((mingGongZhi - i) % 12 + 12) % 12
    var ganIdx = calcMingGongGan(yearGanIdx, zhiIdx)
    palaces.push({
      name: PALACE_NAMES[i],
      zhiIdx: zhiIdx,
      zhiName: ZHI[zhiIdx],
      ganIdx: ganIdx,
      ganName: GAN[ganIdx],
      ganZhi: GAN[ganIdx] + ZHI[zhiIdx],
      domain: PALACE_DOMAIN[PALACE_NAMES[i]] || 'self'
    })
  }
  return palaces
}

/**
 * 核心排盘函数。
 * @param {number} birthYear 公历出生年
 * @param {number} birthMonth 公历出生月
 * @param {number} birthDay 公历出生日
 * @param {number|null} birthHour 出生时辰 0-11，null 时默认子时
 * @param {string} gender 'male'|'female'|'unknown'
 */
function getZiweiBasic(birthYear, birthMonth, birthDay, birthHour, gender) {
  if (!birthYear || !birthMonth) return null

  var bLunar = lunar.solarToLunar(birthYear, birthMonth, birthDay || 1)
  var yearGanIdx = bLunar.yearGanIdx
  var yearZhiIdx = bLunar.yearZhiIdx
  var lunarMonth = bLunar.lunarMonth
  var hourZhi = (birthHour != null) ? birthHour : 0

  var mingGongZhi = calcMingGong(lunarMonth, hourZhi)
  var shenGongZhi = calcShenGong(lunarMonth, hourZhi)

  var mingGanIdx = calcMingGongGan(yearGanIdx, mingGongZhi)

  var wuxingJu = nayinWuxingJu(mingGanIdx, mingGongZhi)

  var palaces = arrangePalaces(mingGongZhi, yearGanIdx)

  return {
    mingGongZhi: mingGongZhi,
    mingGongName: ZHI[mingGongZhi],
    mingGongGanZhi: GAN[mingGanIdx] + ZHI[mingGongZhi],
    shenGongZhi: shenGongZhi,
    shenGongName: ZHI[shenGongZhi],
    wuxingJu: wuxingJu,
    wuxingJuName: WUXING_JU_NAMES[wuxingJu] || '未知',
    yearGanZhi: GAN[yearGanIdx] + ZHI[yearZhiIdx],
    palaces: palaces,
    gender: gender
  }
}

/**
 * 今日流日宫位：当日地支与命宫地支的相对位置。
 * @param {number} mingGongZhi 命宫地支索引
 * @param {Date} now 当前日期
 * @returns {{ palaceName, domain, palaceIndex }}
 */
function getTodayPalace(mingGongZhi, now) {
  if (mingGongZhi == null) return { palaceName: '命宫', domain: 'self', palaceIndex: 0 }

  var y = now.getFullYear()
  var m = now.getMonth() + 1
  var d = now.getDate()
  var base = new Date(2000, 0, 1)
  var cur = new Date(y, m - 1, d)
  var days = Math.floor((cur - base) / 86400000)
  var dayZhi = (((days + 4) % 12) + 12) % 12

  var palaceIndex = ((mingGongZhi - dayZhi) % 12 + 12) % 12
  var palaceName = PALACE_NAMES[palaceIndex]
  var domain = PALACE_DOMAIN[palaceName] || 'self'

  return {
    palaceName: palaceName,
    domain: domain,
    palaceIndex: palaceIndex,
    dayZhiName: ZHI[dayZhi]
  }
}

module.exports = {
  getZiweiBasic: getZiweiBasic,
  getTodayPalace: getTodayPalace,
  PALACE_NAMES: PALACE_NAMES,
  PALACE_DOMAIN: PALACE_DOMAIN
}
