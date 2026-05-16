/**
 * 公历↔农历转换（1900-2100）。
 * 数据源自香港天文台与紫金山天文台公历农历对照表，每年用一个整数压缩编码：
 *   bit 0-11: 各月大小（1=大月30天, 0=小月29天），从正月到十二月
 *   bit 12-15: 闰月月份（0=无闰月, 1-12=闰几月）
 *   bit 16: 闰月大小（1=30天, 0=29天）
 *   bit 20-23: 正月初一对应的公历月份 (1-2)
 *   bit 24-28: 正月初一对应的公历日 (1-31)
 */

var LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
]

var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function lunarYearDays(y) {
  var idx = y - 1900
  if (idx < 0 || idx >= LUNAR_INFO.length) return 354
  var info = LUNAR_INFO[idx]
  var sum = 0
  for (var i = 0x8000; i > 0x8; i >>= 1) {
    sum += (info & i) ? 30 : 29
  }
  sum += leapDays(y)
  return sum
}

function leapMonth(y) {
  var idx = y - 1900
  if (idx < 0 || idx >= LUNAR_INFO.length) return 0
  return LUNAR_INFO[idx] & 0xf
}

function leapDays(y) {
  if (leapMonth(y) === 0) return 0
  var idx = y - 1900
  return (LUNAR_INFO[idx] & 0x10000) ? 30 : 29
}

function monthDays(y, m) {
  var idx = y - 1900
  if (idx < 0 || idx >= LUNAR_INFO.length) return 30
  return (LUNAR_INFO[idx] & (0x10000 >> m)) ? 30 : 29
}

/**
 * 公历 → 农历
 * @param {number} solarYear
 * @param {number} solarMonth 1-12
 * @param {number} solarDay 1-31
 * @returns {{ lunarYear, lunarMonth, lunarDay, isLeap, yearGanIdx, yearZhiIdx }}
 */
function solarToLunar(solarYear, solarMonth, solarDay) {
  if (solarYear < 1900 || solarYear > 2100) {
    return { lunarYear: solarYear, lunarMonth: solarMonth, lunarDay: solarDay, isLeap: false, yearGanIdx: 0, yearZhiIdx: 0 }
  }
  var baseDate = new Date(1900, 0, 31)
  var objDate = new Date(solarYear, solarMonth - 1, solarDay)
  var offset = Math.floor((objDate - baseDate) / 86400000)

  var lunarYear = 1900
  var temp = 0
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    temp = lunarYearDays(lunarYear)
    offset -= temp
  }
  if (offset < 0) {
    offset += temp
    lunarYear--
  }

  var leap = leapMonth(lunarYear)
  var isLeap = false
  var lunarMonth = 1
  for (var i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i
      isLeap = true
      temp = leapDays(lunarYear)
    } else {
      temp = monthDays(lunarYear, i)
    }
    if (isLeap === true && i === (leap + 1)) {
      isLeap = false
    }
    offset -= temp
    if (!isLeap) lunarMonth++
  }
  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --lunarMonth
    }
  }
  if (offset < 0) {
    offset += temp
    --lunarMonth
  }
  var lunarDay = offset + 1

  var gIdx = (lunarYear - 4) % 10
  if (gIdx < 0) gIdx += 10
  var zIdx = (lunarYear - 4) % 12
  if (zIdx < 0) zIdx += 12

  return {
    lunarYear: lunarYear,
    lunarMonth: lunarMonth,
    lunarDay: lunarDay,
    isLeap: isLeap,
    yearGanIdx: gIdx,
    yearZhiIdx: zIdx
  }
}

function getLunarYearGan(lunarYear) {
  var i = (lunarYear - 4) % 10
  return i < 0 ? i + 10 : i
}

function getLunarYearZhi(lunarYear) {
  var i = (lunarYear - 4) % 12
  return i < 0 ? i + 12 : i
}

function getYearGanZhiStr(lunarYear) {
  return GAN[getLunarYearGan(lunarYear)] + ZHI[getLunarYearZhi(lunarYear)]
}

/**
 * 根据小时 (0-23) 返回时辰索引 (0=子 ... 11=亥)
 */
function hourToShichen(hour) {
  if (hour === 23 || hour === 0) return 0
  return Math.floor((hour + 1) / 2)
}

module.exports = {
  solarToLunar: solarToLunar,
  getLunarYearGan: getLunarYearGan,
  getLunarYearZhi: getLunarYearZhi,
  getYearGanZhiStr: getYearGanZhiStr,
  hourToShichen: hourToShichen,
  GAN: GAN,
  ZHI: ZHI
}
