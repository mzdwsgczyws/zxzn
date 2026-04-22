/**
 * 量化×意象：近窗统计 + 评分卡 + 可解释规则，生成带理由的自修建议（非医疗）。
 * 输入：按日期升序的 records；可选 personality（道性结果）、profile（档案）、priorities（用户勾选的重点 id 列表）。
 */

const { getPersonalityExtraPlans } = require('./cultivation-personality-extras.js')

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
  si: '思多',
  dong: '动多',
  yan: '言多',
  jing: '静多',
  za: '杂/切换多'
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
    yinParts.push(`睡眠均量约 ${av.sleepHours.toFixed(1)}h`)
  }
  if (av.recoveryScore != null) {
    yinScore += (av.recoveryScore / 5) * 0.22
    yinParts.push(`主观恢复感均 ${av.recoveryScore.toFixed(1)}/5`)
  }
  if (av.calmMinutes != null) {
    yinScore += Math.min(1, av.calmMinutes / 25) * 0.2
    yinParts.push(`静坐/正念均 ${Math.round(av.calmMinutes)} 分`)
  }
  if (av.blankMinutes != null) {
    yinScore += Math.min(1, av.blankMinutes / 25) * 0.18
    yinParts.push(`主动留白均 ${Math.round(av.blankMinutes)} 分`)
  }
  if (av.miniActionDoneRatio != null) {
    yinScore += av.miniActionDoneRatio * 0.12
    yinParts.push(`微行动完成日占比 ${Math.round(av.miniActionDoneRatio * 100)}%`)
  }

  if (av.angerCount != null) {
    yangScore += Math.min(1, av.angerCount / 4) * 0.22
    yangParts.push(`怒/强烦均 ${av.angerCount.toFixed(1)} 次/日`)
  }
  if (av.worryCount != null) {
    yangScore += Math.min(1, av.worryCount / 10) * 0.2
    yangParts.push(`烦恼登记均 ${av.worryCount.toFixed(1)} 次/日`)
  }
  if (av.screenHours != null) {
    yangScore += Math.min(1, av.screenHours / 10) * 0.22
    yangParts.push(`娱乐屏均 ${av.screenHours.toFixed(1)}h/日`)
  }
  if (av.drainScore != null) {
    yangScore += (av.drainScore / 5) * 0.2
    yangParts.push(`耗竭感均 ${av.drainScore.toFixed(1)}/5`)
  }
  if (av.socialLoad != null) {
    yangScore += Math.min(1, av.socialLoad / 5) * 0.16
    yangParts.push(`社交负荷均 ${av.socialLoad.toFixed(1)}/5`)
  }

  const diff = yinScore - yangScore
  let headline
  if (diff > 0.12) headline = '近窗偏「收摄/滋养」一侧较足，支出信号相对温和。'
  else if (diff < -0.12) headline = '近窗「支出」信号偏强，宜有意识补一点留白与恢复。'
  else headline = '近窗阴（滋养）阳（支出）大致拉锯，可做小步微调观察反应。'

  const detail = [yinParts.length ? `滋养侧：${yinParts.join('；')}。` : '', yangParts.length ? `支出侧：${yangParts.join('；')}。` : '']
    .filter(Boolean)
    .join('')

  return { headline, detail: detail || '部分新字段尚未连续记录，补全后画像会更稳。', yinScore, yangScore }
}

function profileHooks(profile) {
  const hooks = []
  if (!profile || typeof profile !== 'object') return hooks
  if (profile.recentState === 'low') hooks.push({ tag: 'energy', note: '档案里近况偏低沉/易疲' })
  if (profile.rhythmType === 'irregular') hooks.push({ tag: 'sleep', note: '档案里作息自评不太规律' })
  if (profile.rhythmType === 'night') hooks.push({ tag: 'sleep', note: '档案里偏夜猫节律' })
  const ft = profile.focusTags
  if (Array.isArray(ft)) {
    if (ft.includes('health')) hooks.push({ tag: 'body', note: '档案关注健康' })
    if (ft.includes('work')) hooks.push({ tag: 'emotion', note: '档案关注工作' })
    if (ft.includes('relation')) hooks.push({ tag: 'emotion', note: '档案关注人际' })
  }
  return hooks
}

function personalityHooks(pers) {
  const hooks = []
  if (!pers || !pers.scores) return hooks
  const s = pers.scores
  if (typeof s.散 === 'number' && s.散 >= 58) hooks.push({ tag: 'emotion', note: '道性结果里「散」维偏高，注意力易碎' })
  if (typeof s.动 === 'number' && s.动 >= 58) hooks.push({ tag: 'energy', note: '道性结果里「动」维偏高，宜防过劳' })
  if (typeof s.刚 === 'number' && s.刚 >= 58) hooks.push({ tag: 'emotion', note: '道性结果里「刚」维偏高，可补柔性放松' })
  if (typeof s.显 === 'number' && s.显 >= 58) hooks.push({ tag: 'screen', note: '道性结果里「显」维偏高，晚间可向内收一收' })
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
    const r0 = `${windowLabel}平均睡眠约 ${av.sleepHours.toFixed(1)}h，低于常见舒适区`
    c.push({
      id: 'sleep_anchor',
      tags,
      score: boost(tags, 40 + concernSleep(av.sleepHours)),
      title: '固定睡眠锚点',
      adjust: '选固定就寝点（±30 分钟内），睡前 30 分钟减娱乐屏；比强行早起更优先。',
      reason: `${r0}。${streaks.poorSleep >= 3 ? `已连续 ${streaks.poorSleep} 天偏短，优先稳住就寝。` : ''}`
    })
  }

  if (concernRecovery(av.recoveryScore) > 12 || (av.recoveryScore != null && streaks.lowRecovery >= 3)) {
    const tags = ['energy']
    const tail = streaks.lowRecovery >= 3 ? `已连续 ${streaks.lowRecovery} 天恢复感偏低。` : ''
    c.push({
      id: 'recovery_micro',
      tags,
      score: boost(tags, 36 + concernRecovery(av.recoveryScore)),
      title: '补一小口「回血」',
      adjust: '每天安排 10–15 分钟完全不打折的休息（散步/发呆/热水澡），手机静音。',
      reason: `${windowLabel}主观恢复感均 ${av.recoveryScore != null ? av.recoveryScore.toFixed(1) : '—'}/5。${tail}`
    })
  }

  if (concernDrain(av.drainScore) > 12 || streaks.highDrain >= 3) {
    const tags = ['energy']
    c.push({
      id: 'drain_trim',
      tags,
      score: boost(tags, 38 + concernDrain(av.drainScore)),
      title: '削减隐性耗竭',
      adjust: '列出今日「可砍一刀」的一件低价值事务或社交；保留一条主线任务即可。',
      reason: `${windowLabel}耗竭感均 ${av.drainScore != null ? av.drainScore.toFixed(1) : '—'}/5。${streaks.highDrain >= 3 ? `已连续 ${streaks.highDrain} 天偏高。` : ''}`
    })
  }

  if (concernAnger(av.angerCount) > 18) {
    const tags = ['emotion']
    c.push({
      id: 'anger_log',
      tags,
      score: boost(tags, 34 + concernAnger(av.angerCount)),
      title: '怒气只记「事实+身体」',
      adjust: '触发时写两行：情境事实 + 身体感受；不写对错评判，每天最多复盘一次。',
      reason: `${windowLabel}生气/强烦均 ${av.angerCount.toFixed(1)} 次/日，偏高。`
    })
  }

  if (concernWorry(av.worryCount) > 15) {
    const tags = ['emotion']
    c.push({
      id: 'worry_slot',
      tags,
      score: boost(tags, 32 + concernWorry(av.worryCount)),
      title: '烦恼专用时段',
      adjust: '每天固定 15 分钟处理烦恼清单；其他时间只记关键词，告诉自己「已延后」。',
      reason: `${windowLabel}烦恼登记均 ${av.worryCount.toFixed(1)} 次/日。`
    })
  }

  if (concernScreen(av.screenHours) > 10) {
    const tags = ['screen']
    c.push({
      id: 'screen_after_meal',
      tags,
      score: boost(tags, 30 + concernScreen(av.screenHours)),
      title: '饭后一小时无娱乐屏',
      adjust: '任选一餐饭后 60 分钟不看短视频/游戏；可改为散步或闭目数息。',
      reason: `${windowLabel}娱乐屏均 ${av.screenHours.toFixed(1)}h/日。`
    })
  }

  if (concernBlankVsScreen(av.blankMinutes, av.screenHours) > 15) {
    const tags = ['screen', 'energy']
    c.push({
      id: 'wuwei_blank',
      tags,
      score: boost(tags, 28 + concernBlankVsScreen(av.blankMinutes, av.screenHours)),
      title: '无为留白（非优化时间）',
      adjust: '每天 5 分钟「什么都不为」的发呆/看窗外，不设 KPI，不算「productive」。',
      reason: `屏时偏高而主动留白仅约 ${av.blankMinutes != null ? Math.round(av.blankMinutes) : '—'} 分/日，宜补非功利空白。`
    })
  }

  if (concernWalk(av.walkMinutes) > 15) {
    const tags = ['body']
    c.push({
      id: 'walk_light',
      tags,
      score: boost(tags, 26 + concernWalk(av.walkMinutes)),
      title: '轻量走动收束',
      adjust: '每日增加 10–15 分钟步行，速度随意，当作「动中求静」。',
      reason: `${windowLabel}步行均 ${av.walkMinutes != null ? Math.round(av.walkMinutes) : '—'} 分/日，偏少。`
    })
  }

  if (concernCalm(av.calmMinutes) > 15) {
    const tags = ['energy', 'emotion']
    c.push({
      id: 'calm_breath',
      tags,
      score: boost(tags, 26 + concernCalm(av.calmMinutes)),
      title: '5 分钟呼吸静坐',
      adjust: '设闹钟，只观鼻息进出，走神就拉回，不求「空」。',
      reason: `${windowLabel}静坐/正念均 ${av.calmMinutes != null ? Math.round(av.calmMinutes) : '—'} 分/日。`
    })
  }

  if (concernSocial(av.socialLoad) > 12) {
    const tags = ['emotion', 'energy']
    c.push({
      id: 'social_buffer',
      tags,
      score: boost(tags, 24 + concernSocial(av.socialLoad)),
      title: '社交缓冲带',
      adjust: '高强度社交前后各留 10 分钟独处过渡；可拒绝一个非必要邀约试水。',
      reason: `${windowLabel}社交负荷均 ${av.socialLoad.toFixed(1)}/5，偏高。`
    })
  }

  if (domPhase) {
    const phaseAdvice = {
      si: {
        title: '思多：给脑子落地',
        adjust: '把反复想的事写成「下一步最小行动」一条，做完即停；配合短走或拉伸。',
        reason: `${windowLabel}以「${domPhase.label}」为主（${domPhase.n} 天），易脑力空转，需身体与单点行动锚定。`
      },
      dong: {
        title: '动多：强制留白',
        adjust: '每天锁 15 分钟日历空白，不填任务；晚间少一件「顺便」。',
        reason: `${windowLabel}以「${domPhase.label}」为主，事务堆叠易掩蔽疲劳信号。`
      },
      yan: {
        title: '言多：静音收摄',
        adjust: '选一小时「少解释」练习：必要信息一句说完；余时听为主。',
        reason: `${windowLabel}以「${domPhase.label}」为主，表达耗能上升时可向内收。`
      },
      jing: {
        title: '静多：轻量外连',
        adjust: '每日一次 5 分钟对外微互动（消息/见面），不求深聊，防过度内卷。',
        reason: `${windowLabel}以「${domPhase.label}」为主，可略补温和外连，避免僵闭。`
      },
      za: {
        title: '杂：单线锚定',
        adjust: '晨间只写「今日一线」三件，其余进延后清单；切换前先深呼吸一次。',
        reason: `${windowLabel}以「${domPhase.label}」为主，上下文切换成本高，宜减并行。`
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
      title: '结合道性结果的微调',
      adjust: persHooks.some((x) => x.tag === 'emotion')
        ? '用清单锚定三件要事，其他延后；晚间一句收束今日。'
        : '把「休息」写进日程而非剩什么算什么。',
      reason: `与测验档案交叉：${persHooks.map((x) => x.note).join('；')}。`
    })
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
      lines: ['请先记录至少一天的身心指标，再生成方案。'],
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

  const recommendations = buildCandidates({
    last,
    av,
    domPhase,
    streaks,
    persHooks,
    profHooks,
    personality: ctx.personality,
    priorities: ctx.priorities
  })

  const lines = []
  lines.push(yy.headline)
  if (yy.detail) lines.push(yy.detail)
  if (domPhase) {
    lines.push(`模态侧重：${domPhase.label}（${domPhase.n}/${last.length} 天），可做对应互补练习。`)
  }
  if (!recommendations.length) {
    lines.push('指标整体平稳，保持记录并每周对比趋势即可。')
  }

  lines.push('说明：本分析为自我观察辅助，情绪与睡眠持续困扰时请寻求专业帮助。')

  const focus = recommendations.slice(0, 4).map((r) => `${r.title}：${r.adjust.split('。')[0]}。`)

  const ranked = recommendations.map((r, i) => ({
    priority: i + 1,
    title: r.title,
    adjust: r.adjust,
    reason: r.reason
  }))

  return {
    title: `基于近 ${last.length} 天的自修方案（可解释评分）`,
    lines,
    focus: focus.length ? focus : ['继续保持记录习惯'],
    recommendations: ranked,
    modules: {
      yinyang: { headline: yy.headline, detail: yy.detail },
      phase: domPhase
        ? { headline: `模态：${domPhase.label}`, detail: `${domPhase.n} 天记录为该模态，可互补调节。` }
        : { headline: '模态', detail: '近窗模态分散或未标记，可每日选一项「今日主模态」便于趋势观察。' },
      wuwei: {
        headline: '无为 / 留白',
        detail:
          av.blankMinutes != null && av.screenHours != null && av.blankMinutes < 10 && av.screenHours > 5
            ? '屏时偏高而留白偏少，可试每日 5 分钟「无为」发呆，不设产出指标。'
            : '留白与屏幕比例尚可观察；若感到「一直在优化」却更累，刻意留一点非 KPI 时间。'
      }
    },
    meta: {
      windowDays: last.length,
      disclaimer: '非医疗诊断；若症状持续或加重，请咨询专业人士。'
    }
  }
}

module.exports = {
  analyzeRecords,
  PHASE_LABELS,
  TRACK_FOCUS_OPTIONS: [
    { id: 'sleep', label: '睡眠节律' },
    { id: 'emotion', label: '情绪与念头' },
    { id: 'energy', label: '精力与耗竭' },
    { id: 'screen', label: '屏幕与放空' },
    { id: 'body', label: '走动与身体' }
  ]
}
