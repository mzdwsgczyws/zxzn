/**
 * 抽签「思考模式」展示：把纳入 fortune 种子的可读字段列出，
 * 说明当日条目由多项上下文汇合后经哈希落定卦序，非随手随机。
 * 不展示拼接种子串或哈希中间值（产品口径）。
 */

const RECENT_MAP = {
  low: '近况偏低沉 / 易疲',
  mid: '近况平稳',
  high: '近况较充沛 / 偏积极'
}

const RHYTHM_MAP = {
  early: '作息偏早起',
  night: '作息偏夜猫',
  irregular: '作息不太规律'
}

const STYLE_MAP = {
  brief: '释义偏好：简练',
  rich: '释义偏好：详尽',
  classical: '释义偏好：略偏文言感',
  plain: '释义偏好：白话分行'
}

const FOCUS_MAP = {
  work: '工作',
  relation: '人际',
  health: '健康',
  study: '学业',
  finance: '财务',
  family: '家庭',
  rest: '休息放松'
}

function formatDateCn(dateStr) {
  const parts = String(dateStr || '').split('-').map((x) => parseInt(x, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return dateStr || '—'
  return `${parts[0]} 年 ${parts[1]} 月 ${parts[2]} 日`
}

function fmtGender(gender) {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return '未指定（按占位参与运算）'
}

function fmtAge(age) {
  const n = Number(age)
  if (age == null || age === '' || Number.isNaN(n)) return '未填（占位参与）'
  return `${n} 岁`
}

function fmtBirthMonth(bm) {
  const n = Number(bm)
  if (bm == null || bm === '' || Number.isNaN(n)) return '未填'
  return `${n} 月`
}

function fmtFocusTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return '未选（占位参与）'
  const labels = tags.map((id) => FOCUS_MAP[id] || id).filter(Boolean)
  return labels.length ? labels.join('、') : '未选（占位参与）'
}

/**
 * @returns {{ rows: { label: string, value: string }[], footnote: string }}
 */
function buildLotteryThinkingView(meta, profile, hasPersonality, pers, lat, lng) {
  const rows = []

  rows.push({
    label: '历法锚点',
    value: `${formatDateCn(meta.dateStr)} · 干支 ${meta.gz} · 日五行偏「${meta.wxDay}」`
  })

  rows.push({
    label: '黄历参照',
    value: `节气「${meta.jieqi || '—'}」· 建除「${meta.jianchu || '—'}」`
  })

  rows.push({
    label: '卦象 · 宫位意象',
    value: `八卦参考「${meta.bagua}」·「${meta.ziweiPalace}」（文化映射，非宿命断言）`
  })

  const hasWmo =
    meta.weatherCode != null &&
    meta.weatherCode !== '' &&
    String(meta.weatherCode) !== 'na'
  if (hasWmo) {
    const tail = meta.weatherText ? ` · ${meta.weatherText}` : ''
    rows.push({
      label: '天气特征码',
      value: `WMO ${meta.weatherCode}${tail}`
    })
  } else {
    const hasCoord = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
    const weatherMsg = hasCoord
      ? '本次未取到有效天气码（网络或未返回），运算按缺省天气参与'
      : '未请求（档案地区未解析到坐标）'
    rows.push({
      label: '天气特征码',
      value: weatherMsg
    })
  }

  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    rows.push({
      label: '地区锚点（粗略）',
      value: `纬度约 ${Number(lat).toFixed(2)}° · 经度约 ${Number(lng).toFixed(2)}°（用于天气与种子）`
    })
  } else {
    rows.push({
      label: '地区锚点（粗略）',
      value: '无坐标 · 天气不参与当日运算'
    })
  }

  rows.push({
    label: '道性分型',
    value:
      hasPersonality && pers && pers.typeName
        ? `${pers.typeName}（维度假象量化参与）`
        : '未测验 · 以中性占位参与分型键'
  })

  rows.push({
    label: '档案画像',
    value: `${fmtGender(profile.gender)} · ${fmtAge(profile.age)} · 出生月 ${fmtBirthMonth(profile.birthMonth)}`
  })

  const rs = profile.recentState != null ? RECENT_MAP[String(profile.recentState)] : null
  const rh = profile.rhythmType != null ? RHYTHM_MAP[String(profile.rhythmType)] : null
  const sp = profile.lotStylePref != null ? STYLE_MAP[String(profile.lotStylePref)] : null
  const ctxParts = []
  if (rs) ctxParts.push(rs)
  if (rh) ctxParts.push(rh)
  ctxParts.push(fmtFocusTags(profile.focusTags))
  if (sp) ctxParts.push(sp)
  rows.push({
    label: '箴言上下文',
    value: ctxParts.length ? ctxParts.join(' · ') : '均未填 · 均以占位参与运算'
  })

  const footnote =
    '以上字段按固定规则汇合为单一指纹，映射到六十四卦之一；同一自然日、同一档案与环境上下文下结果稳定，并非无序抽签。仅供文化自察与行动参考。'

  return { rows, footnote }
}

module.exports = { buildLotteryThinkingView }
