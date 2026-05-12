/**
 * 量化×意象：近窗统计 + 评分卡 + 可解释规则，生成带理由的自修建议（非医疗）。
 * 输入：按日期升序的 records；可选 personality（道性结果）、profile（档案）、priorities（用户勾选的重点 id 列表）。
 */

const { getPersonalityExtraPlans } = require('./cultivation-personality-extras.js')
const { computeFiveElements } = require('./five-elements-chart.js')

const WINDOW = 7

function avg(records, key) {
  const xs = records.map((r) => Number(r[key])).filter((n) => !Number.isNaN(n))
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function tailStreakAsc(records, key, pred) {
  let n = 0
  for (let i = records.length - 1; i >= 0; i--) {
    const v = records[i][key]
    if (v == null || Number.isNaN(Number(v))) break
    if (pred(Number(v))) n++
    else break
  }
  return n
}

const PHASE_LABELS = {
  si: '想得多',
  dong: '跑得多',
  yan: '说得多',
  jing: '安静独处',
  za: '切换频繁'
}

function dominantPhase(last) {
  const counts = {}
  last.forEach((r) => {
    const p = r.phaseMode
    if (!p || !PHASE_LABELS[p]) return
    counts[p] = (counts[p] || 0) + 1
  })
  let best = null
  let bestN = 0
  Object.keys(counts).forEach((k) => {
    if (counts[k] > bestN) {
      bestN = counts[k]
      best = k
    }
  })
  return best && bestN >= Math.ceil(last.length * 0.45) ? { id: best, n: bestN, label: PHASE_LABELS[best] } : null
}

function concernSleep(avgSleep) {
  if (avgSleep == null) return 0
  if (avgSleep < 5.5) return 55
  if (avgSleep < 6.5) return 38
  if (avgSleep < 7) return 22
  return 0
}

function concernAnger(avgA) {
  if (avgA == null) return 0
  return Math.min(50, avgA * 14)
}

function concernWorry(avgW) {
  if (avgW == null) return 0
  return Math.min(50, Math.max(0, (avgW - 2) * 8))
}

function concernScreen(avgS) {
  if (avgS == null) return 0
  return Math.min(50, Math.max(0, (avgS - 4) * 7))
}

function concernWalk(avgW) {
  if (avgW == null) return 0
  return avgW < 15 ? 40 : avgW < 25 ? 22 : 0
}

function concernCalm(avgC) {
  if (avgC == null) return 0
  return avgC < 8 ? 35 : avgC < 15 ? 18 : 0
}

function concernRecovery(avgR) {
  if (avgR == null) return 0
  return Math.min(50, Math.max(0, (3.2 - avgR) * 18))
}

function concernDrain(avgD) {
  if (avgD == null) return 0
  return Math.min(50, Math.max(0, (avgD - 2.8) * 16))
}

function concernSocial(avgSo) {
  if (avgSo == null) return 0
  return Math.min(45, Math.max(0, (avgSo - 2.5) * 12))
}

function concernBlankVsScreen(avgBlank, avgScreen) {
  if (avgBlank == null || avgScreen == null) return 0
  if (avgScreen < 5) return 0
  if (avgBlank < 8) return Math.min(40, (avgScreen - 5) * 6)
  return 0
}

function yinYangReadout(last, av) {
  const yinParts = []
  const yangParts = []
  let yinScore = 0
  let yangScore = 0
  if (av.sleepHours != null) {
    const s = Math.min(1, av.sleepHours / 8)
    yinScore += s * 0.28
    yinParts.push(`平均睡 ${av.sleepHours.toFixed(1)} 小时`)
  }
  if (av.recoveryScore != null) {
    yinScore += (av.recoveryScore / 5) * 0.22
    yinParts.push(`精力恢复打分 ${av.recoveryScore.toFixed(1)}/5`)
  }
  if (av.calmMinutes != null) {
    yinScore += Math.min(1, av.calmMinutes / 25) * 0.2
    yinParts.push(`静坐冥想约 ${Math.round(av.calmMinutes)} 分钟`)
  }
  if (av.blankMinutes != null) {
    yinScore += Math.min(1, av.blankMinutes / 25) * 0.18
    yinParts.push(`放空时间约 ${Math.round(av.blankMinutes)} 分钟`)
  }
  if (av.miniActionDoneRatio != null) {
    yinScore += av.miniActionDoneRatio * 0.12
    yinParts.push(`${Math.round(av.miniActionDoneRatio * 100)}% 的天数完成了小事`)
  }

  if (av.angerCount != null) {
    yangScore += Math.min(1, av.angerCount / 4) * 0.22
    yangParts.push(`平均每天生气 ${av.angerCount.toFixed(1)} 次`)
  }
  if (av.worryCount != null) {
    yangScore += Math.min(1, av.worryCount / 10) * 0.2
    yangParts.push(`平均每天烦心 ${av.worryCount.toFixed(1)} 次`)
  }
  if (av.screenHours != null) {
    yangScore += Math.min(1, av.screenHours / 10) * 0.22
    yangParts.push(`每天刷屏 ${av.screenHours.toFixed(1)} 小时`)
  }
  if (av.drainScore != null) {
    yangScore += (av.drainScore / 5) * 0.2
    yangParts.push(`疲劳程度 ${av.drainScore.toFixed(1)}/5`)
  }
  if (av.socialLoad != null) {
    yangScore += Math.min(1, av.socialLoad / 5) * 0.16
    yangParts.push(`社交强度 ${av.socialLoad.toFixed(1)}/5`)
  }

  const diff = yinScore - yangScore
  let headline
  if (diff > 0.12) headline = '最近恢复做得不错，消耗不算大，状态还行。'
  else if (diff < -0.12) headline = '最近消耗比恢复多，建议多给自己留点休息时间。'
  else headline = '消耗和恢复差不多持平，可以做点小调整看看效果。'

  const detail = [yinParts.length ? `恢复方面：${yinParts.join('；')}。` : '', yangParts.length ? `消耗方面：${yangParts.join('；')}。` : '']
    .filter(Boolean)
    .join('')

  return { headline, detail: detail || '部分数据还没记全，多记几天分析会更准。', yinScore, yangScore }
}

function profileHooks(profile) {
  const hooks = []
  if (!profile || typeof profile !== 'object') return hooks
  if (profile.recentState === 'low') hooks.push({ tag: 'energy', note: '你之前填的状态偏疲惫' })
  if (profile.rhythmType === 'regular') hooks.push({ tag: 'sleep', note: '你的作息比较规律' })
  if (profile.rhythmType === 'late_early') hooks.push({ tag: 'sleep', note: '你是晚睡早起型，注意别欠太多睡眠' })
  if (profile.rhythmType === 'early') hooks.push({ tag: 'sleep', note: '你习惯早起' })
  if (profile.rhythmType === 'irregular') hooks.push({ tag: 'sleep', note: '你的作息不太规律' })
  if (profile.rhythmType === 'night') hooks.push({ tag: 'sleep', note: '你是夜猫子型' })
  const ft = profile.focusTags
  if (Array.isArray(ft)) {
    if (ft.includes('health')) hooks.push({ tag: 'body', note: '你关注身体健康' })
    if (ft.includes('work')) hooks.push({ tag: 'emotion', note: '你关注工作状态' })
    if (ft.includes('relation')) hooks.push({ tag: 'emotion', note: '你关注人际关系' })
  }
  return hooks
}

function personalityHooks(pers) {
  const hooks = []
  if (!pers || !pers.scores) return hooks
  const s = pers.scores
  if (typeof s.散 === 'number' && s.散 >= 58) hooks.push({ tag: 'emotion', note: '你容易分心，注意力不太集中' })
  if (typeof s.动 === 'number' && s.动 >= 58) hooks.push({ tag: 'energy', note: '你停不下来，小心过度消耗' })
  if (typeof s.刚 === 'number' && s.刚 >= 58) hooks.push({ tag: 'emotion', note: '你比较刚硬，可以多放松一下' })
  if (typeof s.显 === 'number' && s.显 >= 58) hooks.push({ tag: 'screen', note: '你比较外向活跃，晚上可以收一收' })
  return hooks
}

function buildCandidates(ctx) {
  const { last, av, domPhase, streaks, persHooks, profHooks, priorities, personality } = ctx
  const priSet = new Set(priorities || [])
  const windowLabel = `近 ${last.length} 天`

  const boost = (tags, base) => {
    let m = base
    tags.forEach((t) => {
      if (priSet.has(t)) m *= 1.28
    })
    persHooks.forEach((h) => {
      if (tags.includes(h.tag)) m *= 1.08
    })
    profHooks.forEach((h) => {
      if (tags.includes(h.tag)) m *= 1.06
    })
    return m
  }

  const c = []

  const pid = personality && personality.typeId != null ? personality.typeId : null
  if (pid != null) {
    getPersonalityExtraPlans(pid).forEach((e) => {
      c.push({
        id: e.id,
        tags: e.tags,
        score: boost(e.tags, 19),
        title: e.title,
        adjust: e.adjust,
        reason: e.reason
      })
    })
  }

  if (concernSleep(av.sleepHours) > 15) {
    const tags = ['sleep']
    const r0 = `${windowLabel}平均只睡了 ${av.sleepHours.toFixed(1)} 小时，有点少`
    c.push({
      id: 'sleep_anchor',
      tags,
      score: boost(tags, 40 + concernSleep(av.sleepHours)),
      title: '固定上床时间',
      adjust: '每天在差不多的时间上床，睡前半小时别看手机；与其早起不如先睡够。',
      reason: `${r0}。${streaks.poorSleep >= 3 ? `已经连续 ${streaks.poorSleep} 天睡得少了，先把睡眠稳住。` : ''}`
    })
  }

  if (concernRecovery(av.recoveryScore) > 12 || (av.recoveryScore != null && streaks.lowRecovery >= 3)) {
    const tags = ['energy']
    const tail = streaks.lowRecovery >= 3 ? `已经连续 ${streaks.lowRecovery} 天觉得没恢复过来。` : ''
    c.push({
      id: 'recovery_micro',
      tags,
      score: boost(tags, 36 + concernRecovery(av.recoveryScore)),
      title: '给自己充个电',
      adjust: '每天留 10-15 分钟真正的休息（散散步、发发呆、泡个澡），手机调静音。',
      reason: `${windowLabel}精力恢复只有 ${av.recoveryScore != null ? av.recoveryScore.toFixed(1) : '—'}/5 分。${tail}`
    })
  }

  if (concernDrain(av.drainScore) > 12 || streaks.highDrain >= 3) {
    const tags = ['energy']
    c.push({
      id: 'drain_trim',
      tags,
      score: boost(tags, 38 + concernDrain(av.drainScore)),
      title: '少做一件事',
      adjust: '今天找一件可以不做的事砍掉，只保留最重要的一件。',
      reason: `${windowLabel}疲劳程度 ${av.drainScore != null ? av.drainScore.toFixed(1) : '—'}/5 分。${streaks.highDrain >= 3 ? `已经连续 ${streaks.highDrain} 天很累了。` : ''}`
    })
  }

  if (concernAnger(av.angerCount) > 18) {
    const tags = ['emotion']
    c.push({
      id: 'anger_log',
      tags,
      score: boost(tags, 34 + concernAnger(av.angerCount)),
      title: '生气了就写下来',
      adjust: '生气时写两句：发生了什么 + 身体什么感觉。先别想谁对谁错，每天最多回顾一次。',
      reason: `${windowLabel}平均每天生气 ${av.angerCount.toFixed(1)} 次，有点频繁。`
    })
  }

  if (concernWorry(av.worryCount) > 15) {
    const tags = ['emotion']
    c.push({
      id: 'worry_slot',
      tags,
      score: boost(tags, 32 + concernWorry(av.worryCount)),
      title: '专门留时间想烦心事',
      adjust: '每天固定 15 分钟集中处理烦心事；其他时间先记下来，告诉自己"等会儿再想"。',
      reason: `${windowLabel}平均每天烦心 ${av.worryCount.toFixed(1)} 次。`
    })
  }

  if (concernScreen(av.screenHours) > 10) {
    const tags = ['screen']
    c.push({
      id: 'screen_after_meal',
      tags,
      score: boost(tags, 30 + concernScreen(av.screenHours)),
      title: '饭后一小时不刷手机',
      adjust: '选一顿饭后 60 分钟不看短视频和游戏，改成散步或闭眼休息。',
      reason: `${windowLabel}每天刷屏 ${av.screenHours.toFixed(1)} 小时。`
    })
  }

  if (concernBlankVsScreen(av.blankMinutes, av.screenHours) > 15) {
    const tags = ['screen', 'energy']
    c.push({
      id: 'wuwei_blank',
      tags,
      score: boost(tags, 28 + concernBlankVsScreen(av.blankMinutes, av.screenHours)),
      title: '每天发呆 5 分钟',
      adjust: '每天留 5 分钟什么都不做，看看窗外或发发呆，不用追求"有用"。',
      reason: `刷屏时间多但放空时间只有 ${av.blankMinutes != null ? Math.round(av.blankMinutes) : '—'} 分钟，需要一些纯休息。`
    })
  }

  if (concernWalk(av.walkMinutes) > 15) {
    const tags = ['body']
    c.push({
      id: 'walk_light',
      tags,
      score: boost(tags, 26 + concernWalk(av.walkMinutes)),
      title: '多走一走',
      adjust: '每天多走 10-15 分钟，速度随意，散散步就行。',
      reason: `${windowLabel}平均只走了 ${av.walkMinutes != null ? Math.round(av.walkMinutes) : '—'} 分钟，有点少。`
    })
  }

  if (concernCalm(av.calmMinutes) > 15) {
    const tags = ['energy', 'emotion']
    c.push({
      id: 'calm_breath',
      tags,
      score: boost(tags, 26 + concernCalm(av.calmMinutes)),
      title: '试试 5 分钟静坐',
      adjust: '设个闹钟，闭眼感受呼吸，走神了就拉回来，不用想太多。',
      reason: `${windowLabel}静坐冥想平均只有 ${av.calmMinutes != null ? Math.round(av.calmMinutes) : '—'} 分钟。`
    })
  }

  if (concernSocial(av.socialLoad) > 12) {
    const tags = ['emotion', 'energy']
    c.push({
      id: 'social_buffer',
      tags,
      score: boost(tags, 24 + concernSocial(av.socialLoad)),
      title: '社交前后缓一缓',
      adjust: '重要社交前后各留 10 分钟独处缓冲；试着拒绝一个不必要的邀约。',
      reason: `${windowLabel}社交强度 ${av.socialLoad.toFixed(1)}/5 分，有点多了。`
    })
  }

  if (domPhase) {
    const phaseAdvice = {
      si: {
        title: '想太多——动起来',
        adjust: '把反复想的事写成一个最小的行动，做完就停；配合走走路或拉伸一下。',
        reason: `${windowLabel}有 ${domPhase.n} 天都在"${domPhase.label}"，容易脑袋空转，动一动更好。`
      },
      dong: {
        title: '忙太多——留点空',
        adjust: '每天留 15 分钟什么都不安排；晚上少做一件"顺手"的事。',
        reason: `${windowLabel}有 ${domPhase.n} 天都在"${domPhase.label}"，一直忙容易忽略自己累了。`
      },
      yan: {
        title: '说太多——听一听',
        adjust: '选一个小时少解释，该说的一句话说完，剩下时间多听。',
        reason: `${windowLabel}有 ${domPhase.n} 天都在"${domPhase.label}"，说多了也是消耗。`
      },
      jing: {
        title: '太安静——出去聊聊',
        adjust: '每天花 5 分钟和人说说话（发消息或见面），不用深聊。',
        reason: `${windowLabel}有 ${domPhase.n} 天都在"${domPhase.label}"，适当和外界连接一下更好。`
      },
      za: {
        title: '太杂了——抓住重点',
        adjust: '早上只写 3 件最重要的事，其他的放到明天；切换事情前深呼吸一下。',
        reason: `${windowLabel}有 ${domPhase.n} 天都在"${domPhase.label}"，来回切换很消耗精力。`
      }
    }
    const pa = phaseAdvice[domPhase.id]
    if (pa) {
      c.push({
        id: `phase_${domPhase.id}`,
        tags: ['emotion', 'energy'],
        score: boost(['emotion'], 22),
        title: pa.title,
        adjust: pa.adjust,
        reason: pa.reason
      })
    }
  }

  if (persHooks.length) {
    const h = persHooks[0]
    c.push({
      id: 'pers_tail',
      tags: [h.tag],
      score: boost([h.tag], 18),
      title: '结合你的个人特点',
      adjust: persHooks.some((x) => x.tag === 'emotion')
        ? '列出 3 件重要的事，其他的放一放；睡前想想今天怎么样。'
        : '把"休息"写进日程里，别等到有空才休息。',
      reason: `根据你的测试结果：${persHooks.map((x) => x.note).join('；')}。`
    })
  }

  // 五行失衡联动建议
  if (ctx._fiveElements && ctx._fiveElements.hasData) {
    const fe = ctx._fiveElements
    const sorted = fe.rows.slice().sort((a, b) => b.value - a.value)
    const high = sorted[0]
    const low = sorted[sorted.length - 1]
    const FE_ADVICE = {
      '金': { tags: ['emotion'], title: '情绪低落偏多', adjust: '别反复回想遗憾的事；睡前写一件今天还不错的小事。' },
      '木': { tags: ['emotion'], title: '容易上火发脾气', adjust: '快走或拉伸 10 分钟释放紧张感；生气时先深呼吸三次再说话。' },
      '水': { tags: ['energy'], title: '身体透支比较多', adjust: '晚上少做消耗大的事，先保证睡够 7 小时；好好吃一顿热饭。' },
      '火': { tags: ['screen', 'energy'], title: '太浮躁了', adjust: '睡前 1 小时关掉短视频；用 5 分钟闭眼深呼吸代替刷手机。' },
      '土': { tags: ['emotion'], title: '想太多没行动', adjust: '把反复想的事写成一个最小行动，做完就停；少坐着发愁。' }
    }
    const FE_LOW = {
      '金': { tags: ['emotion'], title: '需要多表达自己', adjust: '练习深呼吸或读一段喜欢的文字；和朋友聊聊最近怎么样。' },
      '木': { tags: ['body'], title: '需要多活动一下', adjust: '多出去走 15 分钟；做一件小而简单的事，找回行动力。' },
      '水': { tags: ['energy'], title: '需要好好休息', adjust: '安排一段什么都不做的纯休息；喝杯热水坐 5 分钟。' },
      '火': { tags: ['energy'], title: '需要找点乐子', adjust: '选一件喜欢的小事投入 20 分钟；和朋友轻松聊聊。' },
      '土': { tags: ['emotion'], title: '需要稳定节奏', adjust: '固定一餐饭的时间当作每天的锚点；写下 3 件确定要做的小事。' }
    }
    if (high.value >= 65 && FE_ADVICE[high.name]) {
      const a = FE_ADVICE[high.name]
      c.push({
        id: 'fe_high_' + high.name,
        tags: a.tags,
        score: boost(a.tags, 30 + (high.value - 65) * 0.6),
        title: a.title,
        adjust: a.adjust,
        reason: `${windowLabel}「${high.name}」指标达到 ${high.value} 分，偏高。`
      })
    }
    if (low.value <= 35 && FE_LOW[low.name]) {
      const a = FE_LOW[low.name]
      c.push({
        id: 'fe_low_' + low.name,
        tags: a.tags,
        score: boost(a.tags, 28 + (35 - low.value) * 0.5),
        title: a.title,
        adjust: a.adjust,
        reason: `${windowLabel}「${low.name}」指标只有 ${low.value} 分，偏低。`
      })
    }
  }

  const uniq = []
  const seen = new Set()
  c.sort((a, b) => b.score - a.score)
  c.forEach((item) => {
    if (seen.has(item.id)) return
    seen.add(item.id)
    uniq.push(item)
  })

  return uniq.slice(0, 8)
}

function analyzeRecords(records, ctx = {}) {
  const last = records.slice(-WINDOW)
  if (!last.length) {
    return {
      title: '还没有足够数据',
      lines: ['请先记录至少一天的数据，再来看建议。'],
      focus: [],
      recommendations: [],
      modules: null,
      meta: { windowDays: 0, disclaimer: '本分析为自我观察辅助，持续困扰时请寻求专业帮助。' }
    }
  }

  const miniDone = last.filter((r) => r.miniActionDone).length
  const av = {
    sleepHours: avg(last, 'sleepHours'),
    angerCount: avg(last, 'angerCount'),
    worryCount: avg(last, 'worryCount'),
    screenHours: avg(last, 'screenHours'),
    walkMinutes: avg(last, 'walkMinutes'),
    calmMinutes: avg(last, 'calmMinutes'),
    recoveryScore: avg(last, 'recoveryScore'),
    drainScore: avg(last, 'drainScore'),
    socialLoad: avg(last, 'socialLoad'),
    blankMinutes: avg(last, 'blankMinutes'),
    miniActionDoneRatio: last.length ? miniDone / last.length : 0
  }

  const streaks = {
    poorSleep: tailStreakAsc(last, 'sleepHours', (v) => v < 6.5),
    lowRecovery: tailStreakAsc(last, 'recoveryScore', (v) => v <= 2),
    highDrain: tailStreakAsc(last, 'drainScore', (v) => v >= 4)
  }

  const yy = yinYangReadout(last, av)
  const domPhase = dominantPhase(last)
  const persHooks = personalityHooks(ctx.personality)
  const profHooks = profileHooks(ctx.profile)

  let fe = null
  try {
    fe = computeFiveElements(records, ctx.profile, ctx.personality)
  } catch (e) {}

  const recommendations = buildCandidates({
    last,
    av,
    domPhase,
    streaks,
    persHooks,
    profHooks,
    personality: ctx.personality,
    priorities: ctx.priorities,
    _fiveElements: fe
  })

  const lines = []
  lines.push(yy.headline)
  if (yy.detail) lines.push(yy.detail)
  if (domPhase) {
    lines.push(`最近的状态：${domPhase.label}居多（${domPhase.n}/${last.length} 天），可以试试做点相反的事平衡一下。`)
  }
  if (!recommendations.length) {
    lines.push('各项指标看起来还不错，继续保持记录，每周对比看看趋势。')
  }

  lines.push('提示：以上建议仅供参考，如果情绪或睡眠问题持续困扰你，建议寻求专业帮助。')

  const focus = recommendations.slice(0, 4).map((r) => `${r.title}：${r.adjust.split('。')[0]}。`)

  const ranked = recommendations.map((r, i) => ({
    priority: i + 1,
    title: r.title,
    adjust: r.adjust,
    reason: r.reason
  }))

  return {
    title: `最近 ${last.length} 天的改善建议`,
    lines,
    focus: focus.length ? focus : ['继续保持记录习惯'],
    recommendations: ranked,
    modules: {
      yinyang: { headline: yy.headline, detail: yy.detail },
      phase: domPhase
        ? { headline: `日常状态：${domPhase.label}`, detail: `有 ${domPhase.n} 天是这个状态，可以试试做点不一样的事调节。` }
        : { headline: '日常状态', detail: '最近每天做的事比较杂，可以每天选一个主要状态方便看趋势。' },
      wuwei: {
        headline: '放空与休息',
        detail:
          av.blankMinutes != null && av.screenHours != null && av.blankMinutes < 10 && av.screenHours > 5
            ? '刷屏时间多但放空太少，试试每天 5 分钟什么都不做，纯发呆。'
            : '休息和刷屏的比例还行；如果觉得一直在忙却越来越累，就留点纯休息时间。'
      }
    },
    meta: {
      windowDays: last.length,
      disclaimer: '以上仅供参考，不是医疗诊断；如果不舒服持续加重，请咨询专业人士。'
    }
  }
}

function computeWeekOverWeek(records) {
  if (!Array.isArray(records) || records.length < 7) return null
  const sorted = records.slice().sort((a, b) => (a.date > b.date ? 1 : -1))
  const thisWeek = sorted.slice(-7)
  const prevWeek = sorted.slice(-14, -7)
  if (prevWeek.length < 3) return null

  const wavg = (arr, key) => {
    const xs = arr.map(r => Number(r[key])).filter(n => !Number.isNaN(n))
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
  }

  const metrics = ['sleepHours', 'recoveryScore', 'drainScore', 'angerCount', 'screenHours', 'walkMinutes']
  const labels = {
    sleepHours: '睡眠',
    recoveryScore: '恢复感',
    drainScore: '耗竭感',
    angerCount: '易怒次数',
    screenHours: '屏幕时间',
    walkMinutes: '步行'
  }
  const units = {
    sleepHours: 'h',
    recoveryScore: '',
    drainScore: '',
    angerCount: '次',
    screenHours: 'h',
    walkMinutes: '分钟'
  }
  const betterWhenHigher = { sleepHours: true, recoveryScore: true, walkMinutes: true }

  const changes = []
  metrics.forEach(key => {
    const cur = wavg(thisWeek, key)
    const prev = wavg(prevWeek, key)
    if (cur == null || prev == null) return
    const diff = +(cur - prev).toFixed(1)
    if (Math.abs(diff) < 0.1) return
    const isHigherBetter = !!betterWhenHigher[key]
    const improved = isHigherBetter ? diff > 0 : diff < 0
    changes.push({
      key,
      label: labels[key],
      unit: units[key],
      cur: +cur.toFixed(1),
      prev: +prev.toFixed(1),
      diff,
      improved,
      arrow: diff > 0 ? '↑' : '↓',
      text: `${labels[key]} ${diff > 0 ? '+' : ''}${diff}${units[key]}`
    })
  })

  const improvements = changes.filter(c => c.improved)
  const regressions = changes.filter(c => !c.improved)

  return {
    hasData: changes.length > 0,
    changes,
    improvements,
    regressions,
    summary: improvements.length > 0
      ? `本周有 ${improvements.length} 项指标改善`
      : regressions.length > 0
        ? `本周有 ${regressions.length} 项指标需关注`
        : ''
  }
}

module.exports = {
  analyzeRecords,
  PHASE_LABELS,
  computeWeekOverWeek,
  TRACK_FOCUS_OPTIONS: [
    { id: 'sleep', label: '睡眠' },
    { id: 'emotion', label: '情绪' },
    { id: 'energy', label: '精力' },
    { id: 'screen', label: '刷屏与放空' },
    { id: 'body', label: '运动' }
  ]
}
