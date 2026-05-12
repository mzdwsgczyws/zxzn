/**
 * 心象箴言抽取历史：每次生成后追加一条，供心象展馆 / 成就展馆使用。
 */

const KEYS = require('./storage-keys.js')
const { getLotById, getLotIdsByTier } = require('./lots.js')

function loadHistoryRaw() {
  try {
    const raw = wx.getStorageSync(KEYS.LOTTERY_HISTORY)
    if (raw && Array.isArray(raw.draws)) {
      return { version: 1, draws: raw.draws }
    }
  } catch (e) {}
  return { version: 1, draws: [] }
}

function appendLotteryDraw(entry) {
  try {
    const raw = loadHistoryRaw()
    raw.version = 1
    raw.draws.push({
      ts: entry.ts != null ? entry.ts : Date.now(),
      dateStr: String(entry.dateStr || ''),
      lotId: entry.lotId | 0,
      tier: String(entry.tier || '中'),
      title: String(entry.title || '')
    })
    wx.setStorageSync(KEYS.LOTTERY_HISTORY, raw)
  } catch (e) {}
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

function formatDateTime(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function parseDayTime(dateStr) {
  const parts = String(dateStr).split('-').map(Number)
  if (parts.length < 3 || parts.some((x) => Number.isNaN(x))) return NaN
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
}

function isUpperTier(t) {
  return t === '上上' || t === '上'
}
function isLowerTier(t) {
  return t === '下' || t === '下下'
}

function dayRepTierMap(draws) {
  const byDay = {}
  draws.forEach((d) => {
    if (!byDay[d.dateStr]) byDay[d.dateStr] = []
    byDay[d.dateStr].push(d)
  })
  const rep = {}
  Object.keys(byDay).forEach((day) => {
    const last = byDay[day].slice().sort((a, b) => b.ts - a.ts)[0]
    rep[day] = last.tier
  })
  return rep
}

/** 每个自然日只保留当日最后一次抽取（同日多次只计一日），按日期升序 */
function dailyRepresentativeDraws(draws) {
  const byDay = {}
  draws.forEach((d) => {
    const day = d.dateStr
    if (!day) return
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(d)
  })
  const days = Object.keys(byDay).sort((a, b) => parseDayTime(a) - parseDayTime(b))
  return days.map((dateStr) => {
    const arr = byDay[dateStr].slice().sort((a, b) => b.ts - a.ts)
    return arr[0]
  })
}

function maxCalendarTierRun(rep, pred) {
  const days = Object.keys(rep).sort((a, b) => parseDayTime(a) - parseDayTime(b))
  let best = 0
  let cur = 0
  let prevTs = null
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    if (!pred(rep[day])) {
      cur = 0
      prevTs = null
      continue
    }
    const t = parseDayTime(day)
    if (Number.isNaN(t)) continue
    if (prevTs != null && t - prevTs === 86400000) cur++
    else cur = 1
    prevTs = t
    best = Math.max(best, cur)
  }
  return best
}

function maxDrawDayStreak(draws) {
  const seen = {}
  draws.forEach((d) => {
    seen[d.dateStr] = true
  })
  const times = Object.keys(seen)
    .map((s) => parseDayTime(s))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b)
  let best = 0
  let cur = 0
  let prev = null
  for (let i = 0; i < times.length; i++) {
    const t = times[i]
    if (prev != null && t - prev === 86400000) cur++
    else cur = 1
    prev = t
    best = Math.max(best, cur)
  }
  return best
}

function buildAchievementState(draws) {
  const sorted = [...draws].sort((a, b) => a.ts - b.ts)
  const dailyLast = dailyRepresentativeDraws(draws)
  const drawDayCount = dailyLast.length

  const firstByLot = {}
  sorted.forEach((d) => {
    const id = d.lotId | 0
    if (firstByLot[id] === undefined) firstByLot[id] = d.ts
  })

  const tiersSeen = {}
  sorted.forEach((d) => {
    tiersSeen[d.tier] = true
  })

  /** 同一条目在多少个「不同自然日」出现过（同日多次只计一日） */
  const lotDaySets = {}
  sorted.forEach((d) => {
    const id = d.lotId | 0
    const day = d.dateStr
    if (!day) return
    if (!lotDaySets[id]) lotDaySets[id] = new Set()
    lotDaySets[id].add(day)
  })
  const lotDayCountList = Object.keys(lotDaySets).map((k) => lotDaySets[k].size)
  const maxSameLot = lotDayCountList.length ? Math.max(...lotDayCountList) : 0

  const rep = dayRepTierMap(sorted)
  const upperLotIds = getLotIdsByTier('上上')
  const lowerLotIds = getLotIdsByTier('下下')
  const hasAllShangshangLots = upperLotIds.every((id) => firstByLot[id] !== undefined)
  const hasAllXiaxiaLots = lowerLotIds.every((id) => firstByLot[id] !== undefined)
  const uniqueLots = Object.keys(firstByLot).length

  const calendarUpperRun = maxCalendarTierRun(rep, isUpperTier)
  const calendarLowerRun = maxCalendarTierRun(rep, isLowerTier)

  return {
    draws: sorted,
    /** 有抽签的自然日数（同日多次只计一日） */
    drawCount: drawDayCount,
    firstByLot,
    tiersSeen,
    rep,
    hasAllShangshangLots,
    hasAllXiaxiaLots,
    uniqueLots,
    maxSameLot,
    calendarUpperRun,
    calendarLowerRun,
    drawDayStreak: maxDrawDayStreak(sorted),
    /** 与日历连续上等第一致：按自然日末抽等第 */
    drawUpperStreak: calendarUpperRun,
    drawLowerStreak: calendarLowerRun,
    allMiddleLong: dailyLast.length >= 8 && dailyLast.every((d) => d.tier === '中')
  }
}

const ACHIEVEMENT_DEFS = [
  {
    id: 'first_draw',
    name: '初启心象',
    subtitle: '第一次在自然日留下抽签记录',
    accent: 'gold',
    stars: 1,
    test: (s) => s.drawCount >= 1,
    comment: '第一次收录完成！展馆里多了一条时间戳——以后每个「抽签日」都会留在这里。',
    commentLocked: '去首页轻触开始并完成一次摇动，成就就从这里亮起。'
  },
  {
    id: 'draws_10',
    name: '十次心象',
    subtitle: '累计满 10 个有抽签的自然日（同日多次只计一日）',
    accent: 'violet',
    stars: 2,
    test: (s) => s.drawCount >= 10,
    comment: '十个不同的日子都有记录——节奏比同一天里反复摇更重要。',
    commentLocked: '跨越多日抽签，累计十个「抽签日」即可解锁（同一天只算一次）。'
  },
  {
    id: 'draws_30',
    name: '三十昼夜',
    subtitle: '累计满 30 个有抽签的自然日（同日多次只计一日）',
    accent: 'violet',
    stars: 3,
    test: (s) => s.drawCount >= 30,
    comment: '三十个抽签日坚持下来，像在做一本按日历翻页的私人手账。',
    commentLocked: '细水长流，累计三十个「抽签日」即可（同一天只算一次）。'
  },
  {
    id: 'first_shangshang',
    name: '首遇「上上」',
    subtitle: '曾得到过「上上」等第',
    accent: 'gold',
    stars: 1,
    test: (s) => !!s.tiersSeen['上上'],
    comment: '第一次遇到「上上」档——开心几秒就好，接下来照旧把小事做完。',
    commentLocked: '多试几天，等第分布里会出现「上上」。'
  },
  {
    id: 'first_xiaxia',
    name: '首遇「下下」',
    subtitle: '曾得到过「下下」等第',
    accent: 'slate',
    stars: 1,
    test: (s) => !!s.tiersSeen['下下'],
    comment:
      '「下下」档也碰上了？把它当语气偏重的提醒就好，喝口水、睡一觉，明天重新翻页。',
    commentLocked: '解锁后再来看这条的碎碎念。'
  },
  {
    id: 'calendar_3_upper',
    name: '三日晴心',
    subtitle: '连续三个日历日均为上或上上',
    accent: 'rose',
    stars: 2,
    test: (s) => s.calendarUpperRun >= 3,
    comment: '连续三天档位偏高——心情不错时更要把脚落在地上，别一次塞太多任务。',
    commentLocked: '让连续几个日历日都落在「上」或「上上」档，就能点亮。'
  },
  {
    id: 'calendar_3_lower',
    name: '三日砺心',
    subtitle: '连续三个日历日均为下或下下',
    accent: 'slate',
    stars: 2,
    test: (s) => s.calendarLowerRun >= 3,
    comment:
      '连续几天档位偏低？先照顾睡眠和饮食，把节奏放慢——句子只是在帮你喊停。',
    commentLocked: '若连续多日落在低位档，记得对自己温柔一点。'
  },
  {
    id: 'streak_draw_upper3',
    name: '连中三元',
    subtitle: '连续三个日历日的末次抽签均为上或上上',
    accent: 'gold',
    stars: 2,
    test: (s) => s.drawUpperStreak >= 3,
    comment: '三个连续「抽签日」末抽都在高位——趁热把一件小事收尾，别一口气开太多新坑。',
    commentLocked: '连续三个日历日、每日以最后一次抽签为准，均为「上」或「上上」档即可解锁。'
  },
  {
    id: 'streak_draw_lower3',
    name: '逆风三连',
    subtitle: '连续三个日历日的末次抽签均为下或下下',
    accent: 'slate',
    stars: 2,
    test: (s) => s.drawLowerStreak >= 3,
    comment: '三个连续「抽签日」末抽都在低位……出门晒晒太阳、走十分钟，比盯着屏幕反复想更管用。',
    commentLocked: '（但愿用不上）连续三个日历日末抽均为「下」或「下下」档时出现。'
  },
  {
    id: 'collect_all_shangshang',
    name: '上上圆满',
    subtitle: '全部 8 条「上上」档条目各至少见过一次',
    accent: 'gold',
    stars: 3,
    test: (s) => s.hasAllShangshangLots,
    comment: '八种「上上」档都收录齐了——可以悄悄得意一下，然后继续过平常日子。',
    commentLocked: '把八种不同的「上上」档条目各遇到一次即可解锁。'
  },
  {
    id: 'collect_all_xiaxia',
    name: '下下通鉴',
    subtitle: '全部 6 条「下下」档条目各至少见过一次',
    accent: 'slate',
    stars: 3,
    test: (s) => s.hasAllXiaxiaLots,
    comment: '六种「下下」档都见过了——像集齐一套稀有贴纸，接下来该换换心情啦。',
    commentLocked: '六种「下下」档条目各见一次即可解锁。'
  },
  {
    id: 'full_64',
    name: '六十四象',
    subtitle: '64 条条目全部至少生成过一次',
    accent: 'gold',
    stars: 5,
    test: (s) => s.uniqueLots >= 64,
    comment: '六十四条全收录！这是耐心与好奇叠出来的勋章，值得给自己点个赞。',
    commentLocked: '每多一条新条目，就离「全图鉴」更近一步。'
  },
  {
    id: 'five_tiers',
    name: '五档皆尝',
    subtitle: '五种等第都曾出现过',
    accent: 'blue',
    stars: 1,
    test: (s) =>
      !!s.tiersSeen['上上'] &&
      !!s.tiersSeen['上'] &&
      !!s.tiersSeen['中'] &&
      !!s.tiersSeen['下'] &&
      !!s.tiersSeen['下下'],
    comment: '五个档位都见过了——像尝遍五味，样本齐了，观察会更有趣。',
    commentLocked: '多生成几次，把五种等第都体验一遍。'
  },
  {
    id: 'repeat_lot',
    name: '故象重来',
    subtitle: '同一条目在不少于两个自然日出现过（同日多次只计一日）',
    accent: 'amber',
    stars: 1,
    test: (s) => s.maxSameLot >= 2,
    comment: '在不同日子里又遇见同一条——也许是提醒你别忘了上次读到时的那点心意。',
    commentLocked: '同一条目在另外一个日历日再出现时解锁（同一天内重复摇动不计入）。'
  },
  {
    id: 'triple_same_lot',
    name: '三见故知',
    subtitle: '同一条目在不少于三个自然日出现过',
    accent: 'amber',
    stars: 2,
    test: (s) => s.maxSameLot >= 3,
    comment: '三个不同的抽签日都遇见它——像便签贴在冰箱上：这件事，该认真看一眼了。',
    commentLocked: '同一条目在第三个独立的日历日再出现时解锁。'
  },
  {
    id: 'week_draw_streak',
    name: '七日不断',
    subtitle: '连续 7 个日历日都有生成记录',
    accent: 'rose',
    stars: 2,
    test: (s) => s.drawDayStreak >= 7,
    comment: '连续一周天天打开——仪式感很足，也记得留几天完全不看，给大脑留白。',
    commentLocked: '连续七个日历日，每天都有生成记录即可。'
  },
  {
    id: 'unique_16',
    name: '十六初象',
    subtitle: '至少生成过 16 种不同条目',
    accent: 'blue',
    stars: 2,
    test: (s) => s.uniqueLots >= 16,
    comment: '十六条不重复——图鉴正在变厚，剩下的慢慢逛就好。',
    commentLocked: '多遇到不同条目，种类凑满十六就能点亮。'
  },
  {
    id: 'middle_master',
    name: '中庸达人',
    subtitle: '不少于 8 个抽签日，且每日末次抽签均为「中」',
    accent: 'blue',
    stars: 4,
    test: (s) => s.allMiddleLong,
    comment: '八个「抽签日」末抽都在「中」档！稳得像节拍器——偶尔也可以故意「跑调」一下换换心情。',
    commentLocked: '累计八个及以上自然日，且每日以最后一次抽签为准均为「中」档——佛系玩家专属彩蛋。'
  },
  {
    id: 'checkin_7',
    name: '周不断',
    subtitle: '连续打卡 7 天',
    accent: 'green',
    stars: 1,
    test: (s) => s.checkinStreak >= 7 || s.checkinTotal >= 7,
    comment: '连续七天都来打卡了——习惯的种子已经扎根。',
    commentLocked: '连续打卡 7 天即可解锁。'
  },
  {
    id: 'checkin_21',
    name: '习惯养成',
    subtitle: '连续打卡 21 天',
    accent: 'green',
    stars: 2,
    test: (s) => s.checkinStreak >= 21 || s.checkinTotal >= 21,
    comment: '二十一天足以养成一个小习惯——这份坚持已经说明了一切。',
    commentLocked: '连续打卡 21 天即可解锁。'
  },
  {
    id: 'checkin_30',
    name: '月如一',
    subtitle: '累计打卡 30 天',
    accent: 'gold',
    stars: 3,
    test: (s) => s.checkinTotal >= 30,
    comment: '三十天的记录，像一本小小的日记本。',
    commentLocked: '累计打卡 30 天即可解锁。'
  },
  {
    id: 'checkin_100',
    name: '百念如一',
    subtitle: '累计打卡 100 天',
    accent: 'gold',
    stars: 4,
    test: (s) => s.checkinTotal >= 100,
    comment: '百日修行——你比绝大多数人都更了解自己。',
    commentLocked: '累计打卡 100 天即可解锁。'
  },
  {
    id: 'checkin_365',
    name: '岁月为证',
    subtitle: '累计打卡 365 天',
    accent: 'rose',
    stars: 5,
    test: (s) => s.checkinTotal >= 365,
    comment: '一整年的坚持，时间是最好的见证者。',
    commentLocked: '累计打卡 365 天即可解锁。'
  }
]

function getFirstUnlockListSorted() {
  const raw = loadHistoryRaw()
  const sorted = [...raw.draws].sort((a, b) => a.ts - b.ts)
  const first = {}
  sorted.forEach((d) => {
    const id = d.lotId | 0
    if (first[id] == null) first[id] = d
  })
  return Object.keys(first)
    .map((k) => {
      const d = first[k]
      const lot = getLotById(d.lotId)
      return {
        lotId: d.lotId | 0,
        title: d.title || lot.title,
        name: lot.name || `${d.title}·第${(d.lotId | 0) + 1}条`,
        tier: d.tier,
        ts: d.ts,
        dateTimeLabel: formatDateTime(d.ts),
        dateStr: d.dateStr
      }
    })
    .sort((a, b) => a.ts - b.ts)
}

function computeAchievements() {
  const raw = loadHistoryRaw()
  const s = buildAchievementState(raw.draws)
  try {
    const checkinState = wx.getStorageSync(KEYS.CHECKIN_STATE) || {}
    s.checkinStreak = checkinState.streak || 0
    s.checkinTotal = checkinState.totalDays || 0
  } catch (e) {
    s.checkinStreak = 0
    s.checkinTotal = 0
  }
  const list = ACHIEVEMENT_DEFS.map((def, idx) => {
    const unlocked = def.test(s)
    return {
      id: def.id,
      name: def.name,
      subtitle: def.subtitle,
      accent: def.accent,
      stars: def.stars || 1,
      unlocked,
      _idx: idx,
      comment: unlocked ? def.comment : def.commentLocked || '继续抽取心象箴言，条件满足时会自动解锁。'
    }
  })
  list.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return a._idx - b._idx
  })
  const unlockedCount = list.filter((x) => x.unlocked).length
  return { list, unlockedCount, total: list.length }
}

function getDailyTrendSeries() {
  const raw = loadHistoryRaw()
  const draws = [...raw.draws].sort((a, b) => a.ts - b.ts)
  if (!draws.length) return []
  const byDay = {}
  draws.forEach((d) => {
    const day = d.dateStr
    if (!day) return
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(d)
  })
  const days = Object.keys(byDay).sort((a, b) => parseDayTime(a) - parseDayTime(b))
  return days.map((dateStr) => {
    const arr = byDay[dateStr].slice().sort((a, b) => b.ts - a.ts)
    const last = arr[0]
    return {
      dateStr,
      ts: last.ts,
      lotId: last.lotId | 0,
      tier: String(last.tier || '中'),
      title: String(last.title || '')
    }
  })
}

module.exports = {
  loadHistoryRaw,
  appendLotteryDraw,
  getFirstUnlockListSorted,
  formatDateTime,
  computeAchievements,
  getDailyTrendSeries
}
