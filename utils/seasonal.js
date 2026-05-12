/**
 * 节气与传统节日数据，用于签文上下文和首页装饰。
 * 节气日期为近似值（公历），实际可能偏差 1-2 天。
 */

const SOLAR_TERMS = [
  { name: '小寒', month: 1, day: 5, hint: '寒未深而始凝，万物蛰伏蓄力' },
  { name: '大寒', month: 1, day: 20, hint: '一年中至冷之时，静待转阳' },
  { name: '立春', month: 2, day: 4, hint: '万物始生，一元复始' },
  { name: '雨水', month: 2, day: 19, hint: '春雨润物，冰雪消融' },
  { name: '惊蛰', month: 3, day: 6, hint: '春雷初响，蛰虫始振' },
  { name: '春分', month: 3, day: 21, hint: '昼夜均分，阴阳平衡之际' },
  { name: '清明', month: 4, day: 5, hint: '天清地明，万物显现' },
  { name: '谷雨', month: 4, day: 20, hint: '雨生百谷，春播之时' },
  { name: '立夏', month: 5, day: 6, hint: '万物繁茂，由春入夏' },
  { name: '小满', month: 5, day: 21, hint: '万物小得盈满，未及太过' },
  { name: '芒种', month: 6, day: 6, hint: '有芒之种当种，收获与播种交替' },
  { name: '夏至', month: 6, day: 21, hint: '日长之极，阳盛而阴始生' },
  { name: '小暑', month: 7, day: 7, hint: '暑气初升，热而未极' },
  { name: '大暑', month: 7, day: 23, hint: '一年最热之时，宜静心避躁' },
  { name: '立秋', month: 8, day: 7, hint: '暑去凉来，收敛之始' },
  { name: '处暑', month: 8, day: 23, hint: '暑气消退，秋意渐浓' },
  { name: '白露', month: 9, day: 8, hint: '夜凉生露，阴气渐重' },
  { name: '秋分', month: 9, day: 23, hint: '秋季之中，昼夜再次均分' },
  { name: '寒露', month: 10, day: 8, hint: '露寒而凝，深秋已至' },
  { name: '霜降', month: 10, day: 23, hint: '初霜始降，万物萧瑟' },
  { name: '立冬', month: 11, day: 7, hint: '冬季开始，万物归藏' },
  { name: '小雪', month: 11, day: 22, hint: '初雪将至，天寒地冻' },
  { name: '大雪', month: 12, day: 7, hint: '雪盛之时，冬意正浓' },
  { name: '冬至', month: 12, day: 22, hint: '阴极而阳生，一阳复始' }
]

const FESTIVALS = [
  { name: '春节', lunar: true, month: 1, day: 1, hint: '万象更新，辞旧迎新', greet: '新春吉祥' },
  { name: '元宵', lunar: true, month: 1, day: 15, hint: '月圆灯明，团圆喜庆', greet: '元宵安康' },
  { name: '清明', lunar: false, month: 4, day: 5, hint: '慎终追远，天清地明', greet: '' },
  { name: '端午', lunar: true, month: 5, day: 5, hint: '驱邪避毒，正气充盈', greet: '端午安康' },
  { name: '中秋', lunar: true, month: 8, day: 15, hint: '月满人团圆，秋收之喜', greet: '中秋安康' },
  { name: '重阳', lunar: true, month: 9, day: 9, hint: '登高望远，敬老祈寿', greet: '重阳安康' },
  { name: '冬至', lunar: false, month: 12, day: 22, hint: '阴极而阳生，一阳复始', greet: '冬至安康' }
]

/**
 * Get the current or nearest solar term for a given date.
 * Returns the term whose date is closest to (and not more than 15 days past) the given date.
 */
function getCurrentSolarTerm(date) {
  const d = date || new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()

  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const t = SOLAR_TERMS[i]
    if (t.month === m && Math.abs(day - t.day) <= 7) {
      return t
    }
  }

  let best = null
  let bestDist = 999
  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const t = SOLAR_TERMS[i]
    const tDate = new Date(d.getFullYear(), t.month - 1, t.day)
    const diff = (d - tDate) / 86400000
    if (diff >= 0 && diff < bestDist && diff <= 15) {
      bestDist = diff
      best = t
    }
  }
  return best
}

/**
 * Check if today matches a traditional festival (solar calendar ones only).
 * Lunar festivals need a lunar calendar library; we include them for reference
 * but only match solar ones (清明, 冬至) by default.
 */
function getTodayFestival(date) {
  const d = date || new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return FESTIVALS.find(f => !f.lunar && f.month === m && Math.abs(day - f.day) <= 1) || null
}

/**
 * Build a seasonal context string for lottery advice injection.
 */
function getSeasonalContext(date) {
  const term = getCurrentSolarTerm(date)
  const festival = getTodayFestival(date)
  const parts = []
  if (term) parts.push(`当前节气「${term.name}」：${term.hint}`)
  if (festival) {
    parts.push(`今日临近「${festival.name}」：${festival.hint}`)
    if (festival.greet) parts.push(festival.greet)
  }
  return {
    term,
    festival,
    contextLine: parts.join('；') || '',
    idleHint: term ? `${term.name} · ${term.hint}` : ''
  }
}

module.exports = {
  SOLAR_TERMS,
  FESTIVALS,
  getCurrentSolarTerm,
  getTodayFestival,
  getSeasonalContext
}
