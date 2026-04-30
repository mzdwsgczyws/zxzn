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

function maxDrawStreak(drawsSorted, pred) {
  let cur = 0
  let best = 0
  drawsSorted.forEach((d) => {
    if (pred(d.tier)) {
      cur++
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  })
  return best
}

function buildAchievementState(draws) {
  const sorted = [...draws].sort((a, b) => a.ts - b.ts)
  const firstByLot = {}
  sorted.forEach((d) => {
    const id = d.lotId | 0
    if (firstByLot[id] === undefined) firstByLot[id] = d.ts
  })
  const tiersSeen = {}
  sorted.forEach((d) => {
    tiersSeen[d.tier] = true
  })
  const lotCounts = {}
  sorted.forEach((d) => {
    const id = d.lotId | 0
    lotCounts[id] = (lotCounts[id] || 0) + 1
  })
  const rep = dayRepTierMap(sorted)
  const upperLotIds = getLotIdsByTier('上上')
  const lowerLotIds = getLotIdsByTier('下下')
  const hasAllShangshangLots = upperLotIds.every((id) => firstByLot[id] !== undefined)
  const hasAllXiaxiaLots = lowerLotIds.every((id) => firstByLot[id] !== undefined)
  const uniqueLots = Object.keys(firstByLot).length
  const maxSameLot = Math.max(0, ...Object.values(lotCounts))

  return {
    draws: sorted,
    drawCount: sorted.length,
    firstByLot,
    tiersSeen,
    lotCounts,
    rep,
    hasAllShangshangLots,
    hasAllXiaxiaLots,
    uniqueLots,
    maxSameLot,
    calendarUpperRun: maxCalendarTierRun(rep, isUpperTier),
    calendarLowerRun: maxCalendarTierRun(rep, isLowerTier),
    drawDayStreak: maxDrawDayStreak(sorted),
    drawUpperStreak: maxDrawStreak(sorted, isUpperTier),
    drawLowerStreak: maxDrawStreak(sorted, isLowerTier),
    allMiddleLong: sorted.length >= 8 && sorted.every((d) => d.tier === '中')
  }
}

const ACHIEVEMENT_DEFS = [
  {
    id: 'first_draw',
    name: '初启心象',
    subtitle: '第一次成功生成一条心象箴言',
    accent: 'gold',
    test: (s) => s.drawCount >= 1,
    comment: '第一次收录完成！展馆里多了一条时间戳——以后每次生成都会留在这里。',
    commentLocked: '去首页轻触开始并完成一次摇动，成就就从这里亮起。'
  },
  {
    id: 'draws_10',
    name: '十次心象',
    subtitle: '累计生成满 10 次',
    accent: 'violet',
    test: (s) => s.drawCount >= 10,
    comment: '十次下来，你对这些句子应该已经有点「脸熟」了——习惯记录本身就是收获。',
    commentLocked: '再多生成几次，累计到十次就能解锁。'
  },
  {
    id: 'draws_30',
    name: '三十昼夜',
    subtitle: '累计生成满 30 次',
    accent: 'violet',
    test: (s) => s.drawCount >= 30,
    comment: '三十次坚持打卡，像在做一本私人情绪手账——节奏比单次结果更重要。',
    commentLocked: '细水长流，次数到了自然解锁。'
  },
  {
    id: 'first_shangshang',
    name: '首遇「上上」',
    subtitle: '曾得到过「上上」等第',
    accent: 'gold',
    test: (s) => !!s.tiersSeen['上上'],
    comment: '第一次遇到「上上」档——开心几秒就好，接下来照旧把小事做完。',
    commentLocked: '多试几天，等第分布里会出现「上上」。'
  },
  {
    id: 'first_xiaxia',
    name: '首遇「下下」',
    subtitle: '曾得到过「下下」等第',
    accent: 'slate',
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
    test: (s) => s.calendarUpperRun >= 3,
    comment: '连续三天档位偏高——心情不错时更要把脚落在地上，别一次塞太多任务。',
    commentLocked: '让连续几个日历日都落在「上」或「上上」档，就能点亮。'
  },
  {
    id: 'calendar_3_lower',
    name: '三日砺心',
    subtitle: '连续三个日历日均为下或下下',
    accent: 'slate',
    test: (s) => s.calendarLowerRun >= 3,
    comment:
      '连续几天档位偏低？先照顾睡眠和饮食，把节奏放慢——句子只是在帮你喊停。',
    commentLocked: '若连续多日落在低位档，记得对自己温柔一点。'
  },
  {
    id: 'streak_draw_upper3',
    name: '连中三元',
    subtitle: '连续三次生成均为上或上上',
    accent: 'gold',
    test: (s) => s.drawUpperStreak >= 3,
    comment: '三连高位！趁热把一件小事收尾，但别一口气开太多新坑。',
    commentLocked: '连续三次生成都落在「上」或「上上」档即可解锁。'
  },
  {
    id: 'streak_draw_lower3',
    name: '逆风三连',
    subtitle: '连续三次生成均为下或下下',
    accent: 'slate',
    test: (s) => s.drawLowerStreak >= 3,
    comment: '三连低位……出门晒晒太阳、走十分钟，比盯着屏幕反复想更管用。',
    commentLocked: '（但愿用不上）连续三次落在低位档时出现。'
  },
  {
    id: 'collect_all_shangshang',
    name: '上上圆满',
    subtitle: '全部 8 条「上上」档条目各至少见过一次',
    accent: 'gold',
    test: (s) => s.hasAllShangshangLots,
    comment: '八种「上上」档都收录齐了——可以悄悄得意一下，然后继续过平常日子。',
    commentLocked: '把八种不同的「上上」档条目各遇到一次即可解锁。'
  },
  {
    id: 'collect_all_xiaxia',
    name: '下下通鉴',
    subtitle: '全部 6 条「下下」档条目各至少见过一次',
    accent: 'slate',
    test: (s) => s.hasAllXiaxiaLots,
    comment: '六种「下下」档都见过了——像集齐一套稀有贴纸，接下来该换换心情啦。',
    commentLocked: '六种「下下」档条目各见一次即可解锁。'
  },
  {
    id: 'full_64',
    name: '六十四象',
    subtitle: '64 条条目全部至少生成过一次',
    accent: 'gold',
    test: (s) => s.uniqueLots >= 64,
    comment: '六十四条全收录！这是耐心与好奇叠出来的勋章，值得给自己点个赞。',
    commentLocked: '每多一条新条目，就离「全图鉴」更近一步。'
  },
  {
    id: 'five_tiers',
    name: '五档皆尝',
    subtitle: '五种等第都曾出现过',
    accent: 'blue',
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
    subtitle: '同一条目至少生成过两次',
    accent: 'amber',
    test: (s) => s.maxSameLot >= 2,
    comment: '又抽到同一条？也许是提醒你别忘了上次读到时的那点心意。',
    commentLocked: '同一条目再次出现时会解锁。'
  },
  {
    id: 'triple_same_lot',
    name: '三见故知',
    subtitle: '同一条目至少生成过三次',
    accent: 'amber',
    test: (s) => s.maxSameLot >= 3,
    comment: '同一条连着三次露面——像便签贴在冰箱上：这件事，该认真看一眼了。',
    commentLocked: '同一条目第三次出现时会解锁，留意反复出现的标题。'
  },
  {
    id: 'week_draw_streak',
    name: '七日不断',
    subtitle: '连续 7 个日历日都有生成记录',
    accent: 'rose',
    test: (s) => s.drawDayStreak >= 7,
    comment: '连续一周天天打开——仪式感很足，也记得留几天完全不看，给大脑留白。',
    commentLocked: '连续七个日历日，每天都有生成记录即可。'
  },
  {
    id: 'unique_16',
    name: '十六初象',
    subtitle: '至少生成过 16 种不同条目',
    accent: 'blue',
    test: (s) => s.uniqueLots >= 16,
    comment: '十六条不重复——图鉴正在变厚，剩下的慢慢逛就好。',
    commentLocked: '多遇到不同条目，种类凑满十六就能点亮。'
  },
  {
    id: 'middle_master',
    name: '中庸达人',
    subtitle: '累计至少 8 次生成，且全部为「中」',
    accent: 'blue',
    test: (s) => s.allMiddleLong,
    comment: '八连「中」！稳得像节拍器——偶尔也可以故意「跑调」一下换换心情。',
    commentLocked: '连续很多次都落在「中」档——佛系玩家专属彩蛋。'
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
  const list = ACHIEVEMENT_DEFS.map((def) => {
    const unlocked = def.test(s)
    return {
      id: def.id,
      name: def.name,
      subtitle: def.subtitle,
      accent: def.accent,
      unlocked,
      comment: unlocked ? def.comment : def.commentLocked || '继续抽取心象箴言，条件满足时会自动解锁。'
    }
  })
  const unlockedCount = list.filter((x) => x.unlocked).length
  return { list, unlockedCount, total: list.length }
}

module.exports = {
  loadHistoryRaw,
  appendLotteryDraw,
  getFirstUnlockListSorted,
  formatDateTime,
  computeAchievements
}
