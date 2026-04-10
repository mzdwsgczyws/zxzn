/**
 * 灵签抽签历史：每次出签追加一条，供灵签展馆 / 成就展馆使用。
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
    name: '初入签筒',
    subtitle: '第一次成功求签',
    accent: 'gold',
    test: (s) => s.drawCount >= 1,
    comment:
      '恭喜你第一次摇动灵签！展馆的灯从此为你亮了一盏——以后每一次缘分都会写进这里。',
    commentLocked: '去首页摇一支签，成就就从这里开始啦。'
  },
  {
    id: 'draws_10',
    name: '十签之约',
    subtitle: '累计抽签满 10 次',
    accent: 'violet',
    test: (s) => s.drawCount >= 10,
    comment: '十次求问，十次回响。你已经是个老熟客了，签筒都记得你的手感。',
    commentLocked: '再抽几次，签缘攒满十位数就能解锁。'
  },
  {
    id: 'draws_30',
    name: '三十昼夜',
    subtitle: '累计抽签满 30 次',
    accent: 'violet',
    test: (s) => s.drawCount >= 30,
    comment: '三十签下来，运势曲线都快能画成心电图了——坚持本身就是一种答案。',
    commentLocked: '细水长流，签数到了自然解锁。'
  },
  {
    id: 'first_shangshang',
    name: '首遇上上',
    subtitle: '曾抽到过「上上」等第',
    accent: 'gold',
    test: (s) => !!s.tiersSeen['上上'],
    comment: '第一支上上签到手！今日宜开心三秒，再该干嘛干嘛——好运也要配行动呀。',
    commentLocked: '上上签在等你，多来几日缘分到了就遇见。'
  },
  {
    id: 'first_xiaxia',
    name: '首遇下下',
    subtitle: '曾抽到过「下下」等第',
    accent: 'slate',
    test: (s) => !!s.tiersSeen['下下'],
    comment:
      '哇，下下签也让你遇见了？别慌，签文是提醒不是判决，喝杯热水压压惊，明天又是新卦。',
    commentLocked: '这条成就……解锁了再告诉你评语（坏笑）。'
  },
  {
    id: 'calendar_3_upper',
    name: '三日祥云',
    subtitle: '连续三个「日历日」抽到上或上上',
    accent: 'rose',
    test: (s) => s.calendarUpperRun >= 3,
    comment: '连续三天签运都在高位飘，像是老天爷连发三个赞——记得别飘太高，脚踏实地更稳。',
    commentLocked: '试着让连续几天都抽到上签，祥云成就就会出现。'
  },
  {
    id: 'calendar_3_lower',
    name: '三日砺心',
    subtitle: '连续三个「日历日」抽到下或下下',
    accent: 'slate',
    test: (s) => s.calendarLowerRun >= 3,
    comment:
      '你可真是太「稳」了——连续三天都不太轻松？不过苦尽会甘来，签文只是让你慢下来自检一下。',
    commentLocked: '这条成就希望你永远别解锁……但若解锁了，说明你真的需要抱抱自己。'
  },
  {
    id: 'streak_draw_upper3',
    name: '连中三元',
    subtitle: '连续三次抽签均为上或上上',
    accent: 'gold',
    test: (s) => s.drawUpperStreak >= 3,
    comment: '三连高位！手气热得像刚开锅的汤圆——趁热打铁，但别贪多哦。',
    commentLocked: '连续三次抽签都拿到上签，就能召唤这条成就。'
  },
  {
    id: 'streak_draw_lower3',
    name: '逆风三连',
    subtitle: '连续三次抽签均为下或下下',
    accent: 'slate',
    test: (s) => s.drawLowerStreak >= 3,
    comment: '三连低位……签筒是不是在跟你开玩笑？去晒晒太阳、走两步，换换手气。',
    commentLocked: '（希望你用不上）连续三次下签时解锁。'
  },
  {
    id: 'collect_all_shangshang',
    name: '上上圆满',
    subtitle: '集齐全部 8 种「上上」卦签（各至少见过一次）',
    accent: 'gold',
    test: (s) => s.hasAllShangshangLots,
    comment: '八种上上全齐！你是签王本王了，建议低调炫耀，别让朋友眼红。',
    commentLocked: '把八种不同的上上签都抽到过一遍，展馆会为你放小烟花。'
  },
  {
    id: 'collect_all_xiaxia',
    name: '下下通鉴',
    subtitle: '集齐全部 6 种「下下」卦签',
    accent: 'slate',
    test: (s) => s.hasAllXiaxiaLots,
    comment: '六种下下都见过了……全集通关！接下来该转运了，我掐指一算你是后期型选手。',
    commentLocked: '六种下下签各见一次——集邮癖的黑暗版。'
  },
  {
    id: 'full_64',
    name: '六十四缘',
    subtitle: '六十四卦签全部至少抽到过一次',
    accent: 'gold',
    test: (s) => s.uniqueLots >= 64,
    comment: '六十四签全图鉴！周易在你面前都得鞠个躬——这是耐心与缘分的双重勋章。',
    commentLocked: '路还长，但每多一支新签，你就离「圆满」更近一步。'
  },
  {
    id: 'five_tiers',
    name: '五档皆尝',
    subtitle: '五种等第都抽到过',
    accent: 'blue',
    test: (s) =>
      !!s.tiersSeen['上上'] &&
      !!s.tiersSeen['上'] &&
      !!s.tiersSeen['中'] &&
      !!s.tiersSeen['下'] &&
      !!s.tiersSeen['下下'],
    comment: '酸甜苦辣咸（签版）全尝过了，人生样本齐全，可以写回忆录第一章。',
    commentLocked: '多抽签，把五种等第都体验一遍。'
  },
  {
    id: 'repeat_lot',
    name: '故签重来',
    subtitle: '同一支签抽到至少两次',
    accent: 'amber',
    test: (s) => s.maxSameLot >= 2,
    comment: '又见面了老熟人！签文复读不是bug，是提醒你别忘了上次悟到的那句。',
    commentLocked: '同一卦再来一次时解锁——缘分会轮回。'
  },
  {
    id: 'triple_same_lot',
    name: '三见故知',
    subtitle: '同一支签抽到至少三次',
    accent: 'amber',
    test: (s) => s.maxSameLot >= 3,
    comment: '三连撞签！宇宙在对你按喇叭：这件事，真的要上心啦。',
    commentLocked: '同一支签第三次出现时解锁，留意那个反复出现的卦名。'
  },
  {
    id: 'week_draw_streak',
    name: '七日不断',
    subtitle: '连续 7 个日历日都有抽签记录',
    accent: 'rose',
    test: (s) => s.drawDayStreak >= 7,
    comment: '整整一周天天问签，仪式感拉满——记得也给生活留点「无签日」喘口气。',
    commentLocked: '连续七天，每天都要来抽一签哦。'
  },
  {
    id: 'unique_16',
    name: '十六初缘',
    subtitle: '至少抽到过 16 种不同的签',
    accent: 'blue',
    test: (s) => s.uniqueLots >= 16,
    comment: '十六卦初识，签筒里的朋友圈正在扩容——继续探索剩下四十八位网友。',
    commentLocked: '多抽不同的签，种类凑满十六就能点亮。'
  },
  {
    id: 'middle_master',
    name: '中庸达人',
    subtitle: '至少 8 次抽签全部为「中」',
    accent: 'blue',
    test: (s) => s.allMiddleLong,
    comment: '八连「中」！你这是在走极致中庸路线吗？稳得像秤砣，偶尔也可以冲动一下。',
    commentLocked: '连续很多次都抽到「中」签——难度不低，佛系玩家专属。'
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
        name: lot.name || `${d.title}·第${(d.lotId | 0) + 1}签`,
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
      comment: unlocked ? def.comment : def.commentLocked || '继续抽签，缘分到了自然解锁。'
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
