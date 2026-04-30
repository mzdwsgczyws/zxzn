/**
 * 综合今日心象箴言种子：日期、人格（可缺省）、年龄、性别、节气、天气码、干支、方位等。
 * 同机同日复测结果稳定；仅供文化娱乐与自我提醒。
 */

function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function getGanZhiDaySeed(y, m, d) {
  const base = new Date(2000, 0, 1)
  const cur = new Date(y, m - 1, d)
  const days = Math.floor((cur - base) / 86400000)
  const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const wx = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
  const ig = ((days % 10) + 10) % 10
  const iz = ((days % 12) + 12) % 12
  return {
    gz: gan[ig] + zhi[iz],
    wxDay: wx[ig]
  }
}

/**
 * @param {object} options
 * @param {boolean} [options.hasPersonality] 是否已测验
 * @param {string} [options.gender] male | female | unknown
 * @param {string} [options.jieqi] 节气名
 * @param {string} [options.jianchu] 建除
 * @param {number|null} [options.weatherCode] WMO
 */
function buildFortuneMeta(options) {
  const now = options.now || new Date()
  const y = now.getFullYear()
  const mo = now.getMonth() + 1
  const d = now.getDate()
  const dateStr = `${y}-${mo}-${d}`
  const { gz, wxDay } = getGanZhiDaySeed(y, mo, d)

  const hasPersonality = !!options.hasPersonality
  const typeId = hasPersonality && options.personalityTypeId != null ? options.personalityTypeId : 'na'
  const age = options.age != null && !Number.isNaN(Number(options.age)) ? Number(options.age) : 'na'
  const bmNum = Number(options.birthMonth)
  const birthMonth = options.birthMonth != null && !Number.isNaN(bmNum) ? bmNum : 'na'
  const lat = options.lat != null ? Math.round(options.lat * 1000) : 0
  const lng = options.lng != null ? Math.round(options.lng * 1000) : 0
  const gender = options.gender === 'male' || options.gender === 'female' ? options.gender : 'na'
  const jieqi = options.jieqi != null ? String(options.jieqi) : ''
  const jianchu = options.jianchu != null ? String(options.jianchu) : ''
  const weatherCode = options.weatherCode != null && options.weatherCode !== '' ? options.weatherCode : 'na'

  const recentState = options.recentState != null ? String(options.recentState) : 'na'
  const rhythmType = options.rhythmType != null ? String(options.rhythmType) : 'na'
  const focusJoined =
    Array.isArray(options.focusTags) && options.focusTags.length
      ? options.focusTags
          .slice()
          .sort()
          .join(',')
      : 'na'
  const lotStylePref = options.lotStylePref != null ? String(options.lotStylePref) : 'na'

  const ziweiHint = typeof birthMonth === 'number' ? (birthMonth + mo) % 12 : mo % 12
  const palaces = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母']
  const bagua = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'][((typeof typeId === 'number' ? typeId : gz.charCodeAt(0)) + d) % 8]

  const seed = hashStr(
    `${dateStr}|t${typeId}|p${hasPersonality ? 1 : 0}|g${gender}|a${age}|bm${birthMonth}|jq${jieqi}|jc${jianchu}|wc${weatherCode}|zw${ziweiHint}|bg${bagua}|wx${wxDay}|${lat},${lng}|rs${recentState}|rh${rhythmType}|ft${focusJoined}|sp${lotStylePref}`
  )
  const lotId = seed % 64

  const palaceName = palaces[ziweiHint]
  const blurb = `今日干支 ${gz}，日五行偏「${wxDay}」；节气参考「${jieqi || '表外'}」；建除「${jianchu || '—'}」；卦象参考 ${bagua}；斗数宫位提示「${palaceName}」（娱乐映射）。${
    options.weatherCode != null && options.weatherCode !== '' ? `天气码 ${options.weatherCode}。` : ''
  }`

  return {
    dateStr,
    lotId,
    gz,
    wxDay,
    bagua,
    ziweiPalace: palaceName,
    blurb,
    hasPersonality,
    gender,
    jieqi,
    jianchu,
    weatherCode: options.weatherCode != null ? options.weatherCode : null,
    weatherText: options.weatherText || ''
  }
}

module.exports = { buildFortuneMeta, hashStr, getGanZhiDaySeed }
