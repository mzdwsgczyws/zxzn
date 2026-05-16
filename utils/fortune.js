/**
 * 综合今日心象签号种子。
 *
 * 签号决策优先级：
 *   1. 有完整出生数据 → 梅花易数起卦，卦象直接映射 lotId（周易卦序）
 *   2. 出生数据不全   → hashStr fallback（向后兼容）
 *
 * 返回值新增 meihua（梅花卦象）、ziwei（紫微命宫）、guaQi（卦气旺衰）。
 */

var meihuaEngine = require('./meihua-yishu.js')
var ziweiEngine = require('./ziwei-lite.js')
var yijingEngine = require('./yijing-hexagram.js')

function hashStr(s) {
  var h = 2166136261
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 日干支推算。基准：2000-01-01 = 甲辰日（天干偏移 0，地支偏移 4）。
 */
function getGanZhiDaySeed(y, m, d) {
  var base = new Date(2000, 0, 1)
  var cur = new Date(y, m - 1, d)
  var days = Math.floor((cur - base) / 86400000)
  var gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  var zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  var wx = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
  var ig = (((days % 10) + 10) % 10)
  var iz = (((days + 4) % 12) + 12) % 12
  return { gz: gan[ig] + zhi[iz], wxDay: wx[ig], ganIdx: ig, zhiIdx: iz }
}

/**
 * @param {object} options
 * @param {boolean} [options.hasPersonality]
 * @param {string} [options.gender]
 * @param {string} [options.jieqi]
 * @param {string} [options.jianchu]
 * @param {number|null} [options.weatherCode]
 * @param {number} [options.birthYear]
 * @param {number} [options.birthMonth]
 * @param {number} [options.birthDay]
 * @param {number|null} [options.birthHour] 0-11 时辰
 */
function buildFortuneMeta(options) {
  var now = options.now || new Date()
  var y = now.getFullYear()
  var mo = now.getMonth() + 1
  var d = now.getDate()
  var dateStr = y + '-' + mo + '-' + d
  var dayGZ = getGanZhiDaySeed(y, mo, d)
  var gz = dayGZ.gz
  var wxDay = dayGZ.wxDay

  var hasPersonality = !!options.hasPersonality
  var typeId = hasPersonality && options.personalityTypeId != null ? options.personalityTypeId : 'na'
  var age = options.age != null && !Number.isNaN(Number(options.age)) ? Number(options.age) : 'na'
  var bmNum = Number(options.birthMonth)
  var birthMonth = options.birthMonth != null && !Number.isNaN(bmNum) ? bmNum : 'na'
  var lat = options.lat != null ? Math.round(options.lat * 100) : 0
  var lng = options.lng != null ? Math.round(options.lng * 100) : 0
  var gender = options.gender === 'male' || options.gender === 'female' ? options.gender : 'na'
  var jieqi = options.jieqi != null ? String(options.jieqi) : ''
  var jianchu = options.jianchu != null ? String(options.jianchu) : ''

  var recentState = options.recentState != null ? String(options.recentState) : 'na'
  var rhythmType = options.rhythmType != null ? String(options.rhythmType) : 'na'
  var focusJoined = Array.isArray(options.focusTags) && options.focusTags.length
    ? options.focusTags.slice().sort().join(',') : 'na'

  var birthYear = options.birthYear != null ? Number(options.birthYear) : null
  var birthDay = options.birthDay != null ? Number(options.birthDay) : null
  var birthHour = options.birthHour != null ? Number(options.birthHour) : null

  var hasBirthFull = birthYear && birthMonth !== 'na' && birthDay
  var meihua = null
  var ziwei = null
  var guaQi = null
  var lotId

  if (hasBirthFull) {
    meihua = meihuaEngine.castMeihua(now, {
      birthYear: birthYear,
      birthMonth: typeof birthMonth === 'number' ? birthMonth : bmNum,
      birthDay: birthDay,
      birthHour: birthHour
    })

    var hexIdx = yijingEngine.hexagramIdFromGua(meihua.upperGua, meihua.lowerGua)
    lotId = hexIdx

    guaQi = yijingEngine.getGuaQi(hexIdx, jieqi)

    ziwei = ziweiEngine.getZiweiBasic(
      birthYear,
      typeof birthMonth === 'number' ? birthMonth : bmNum,
      birthDay,
      birthHour,
      gender
    )
  } else {
    var seed = hashStr(
      dateStr + '|t' + typeId + '|p' + (hasPersonality ? 1 : 0) + '|g' + gender +
      '|a' + age + '|bm' + birthMonth + '|jq' + jieqi + '|jc' + jianchu +
      '|wx' + wxDay + '|' + lat + ',' + lng + '|rs' + recentState + '|rh' + rhythmType + '|ft' + focusJoined
    )
    lotId = seed % 64

    guaQi = yijingEngine.getGuaQi(lotId, jieqi)
  }

  var ziweiPalace = '命宫'
  var todayPalaceInfo = null
  if (ziwei) {
    todayPalaceInfo = ziweiEngine.getTodayPalace(ziwei.mingGongZhi, now)
    ziweiPalace = todayPalaceInfo.palaceName
  }

  var blurb = buildBlurb(gz, wxDay, jieqi, jianchu, meihua, ziwei, guaQi, todayPalaceInfo, options.weatherCode)

  return {
    dateStr: dateStr,
    lotId: lotId,
    gz: gz,
    wxDay: wxDay,
    bagua: meihua ? meihua.upperGuaName : '',
    ziweiPalace: ziweiPalace,
    blurb: blurb,
    hasPersonality: hasPersonality,
    gender: gender,
    jieqi: jieqi,
    jianchu: jianchu,
    weatherCode: options.weatherCode != null ? options.weatherCode : null,
    weatherText: options.weatherText || '',
    meihua: meihua,
    ziwei: ziwei,
    guaQi: guaQi,
    todayPalace: todayPalaceInfo,
    usedMeihua: !!hasBirthFull
  }
}

function buildBlurb(gz, wxDay, jieqi, jianchu, meihua, ziwei, guaQi, todayPalace, weatherCode) {
  var parts = []
  parts.push('今日干支 ' + gz + '，日五行偏「' + wxDay + '」')

  if (meihua) {
    var hexMeta = yijingEngine.HEXAGRAM_META[yijingEngine.hexagramIdFromGua(meihua.upperGua, meihua.lowerGua)]
    var hexName = hexMeta ? hexMeta.name : meihua.guaFullName
    parts.push('梅花卦象「' + hexName + '」（' + meihua.upperGuaName + '上' + meihua.lowerGuaName + '下）')
    parts.push('体卦' + meihua.tiGuaName + meihua.tiWuxing + '、用卦' + meihua.yongGuaName + meihua.yongWuxing + '，' + meihua.label)
    parts.push('变卦「' + meihua.bianGuaName + '」、互卦「' + meihua.huGuaName + '」')
  }

  if (guaQi) {
    parts.push('卦气' + guaQi.label)
  }

  if (ziwei && todayPalace) {
    parts.push('紫微' + ziwei.wuxingJuName + '，命宫' + ziwei.mingGongGanZhi + '，今日流日落「' + todayPalace.palaceName + '」')
  }

  if (jieqi) parts.push('节气「' + jieqi + '」')
  if (jianchu) parts.push('建除「' + jianchu + '」')
  if (weatherCode != null && weatherCode !== '') parts.push('天气码 ' + weatherCode)

  return parts.join('；') + '。'
}

module.exports = { buildFortuneMeta: buildFortuneMeta, hashStr: hashStr, getGanZhiDaySeed: getGanZhiDaySeed }
