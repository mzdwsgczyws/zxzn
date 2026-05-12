/**
 * 心象箴言建议决策树：综合等第、节气、建除、天气、年龄、性别、道性四维（可缺省），
 * 从多池候选中用稳定种子抽取 ≥5 条，避免每次完全相同。
 */

const { hashStr } = require('./fortune.js')
const { collectCorpusEntries, resolveUserTone } = require('./lottery-advice-corpus.js')
const KEYS = require('./storage-keys.js')

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickTemplate(templates, rnd) {
  return templates[Math.floor(rnd() * templates.length)]
}

function fillTpl(tpl, vars) {
  let s = tpl
  Object.keys(vars).forEach((k) => { s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]) })
  return s
}

function seasonBucket(jieqi) {
  const s = String(jieqi || '')
  if (/春|雨水|惊蛰|春分|清明|谷雨/.test(s)) return 'spring'
  if (/夏|小满|芒种|夏至|小暑|大暑/.test(s)) return 'summer'
  if (/秋|处暑|白露|秋分|寒露|霜降/.test(s)) return 'autumn'
  if (/冬|小雪|大雪|冬至|小寒|大寒/.test(s)) return 'winter'
  return 'neutral'
}

function ageBracket(age) {
  if (age == null || Number.isNaN(age)) return 'unknown'
  if (age < 18) return 'teen'
  if (age < 36) return 'youth'
  if (age < 55) return 'mid'
  return 'senior'
}

function weatherFlags(w) {
  if (!w) return { hot: false, cold: false, rain: false, clear: false, code: -1 }
  const code = w.code
  const t = w.tempC
  const rain = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].indexOf(code) >= 0
  const snow = [71, 73, 75].indexOf(code) >= 0
  const hot = t != null && t >= 30
  const cold = t != null && t <= 5
  const clear = [0, 1, 2].indexOf(code) >= 0 && !rain && !snow
  return { hot, cold, rain: rain || snow, clear, code }
}

function persFlags(pers) {
  if (!pers || !pers.scores) return null
  const s = pers.scores
  const dong = (s['动'] || 50) >= 55
  const gang = (s['刚'] || 50) >= 55
  const san = (s['散'] || 50) >= 55
  const xian = (s['显'] || 50) >= 55
  return { dong, gang, san, xian }
}

/**
 * 生成候选池（每条带 tag 便于去重优先级）
 */
function collectCandidates(ctx, rnd) {
  const out = []
  const {
    tier,
    jianchu,
    season,
    wf,
    ab,
    gender,
    pf,
    lotTitle,
    lotId = 0,
    wxDay = '',
    typeId = null,
    recentState,
    rhythmType,
    focusTags,
    personality,
    profile,
    userTone
  } = ctx
  const _rnd = typeof rnd === 'function' ? rnd : Math.random

  let catBoost = {}
  try {
    const fb = wx.getStorageSync(KEYS.ADVICE_FEEDBACK) || {}
    const liked = fb.likedCats || {}
    const disliked = fb.dislikedCats || {}
    Object.keys(liked).forEach(c => { catBoost[c] = (catBoost[c] || 0) + Math.min(liked[c], 3) })
    Object.keys(disliked).forEach(c => { catBoost[c] = (catBoost[c] || 0) - Math.min(disliked[c], 2) })
  } catch (e) {}

  const push = (cat, text, weight = 1) => {
    const boost = catBoost[cat] || 0
    const w = Math.max(1, weight + boost)
    for (let i = 0; i < w; i++) out.push({ cat, text })
  }

  /* —— 等第与建除 —— */
  if (tier === '上上' || tier === '上') {
    push('行动', '今日可着手一件拖了一阵、风险可控的小事，做完即停。', 2)
    push('情绪', '把好心情写下来或分享给一位信任的人，巩固正向反馈。', 1)
  }
  if (tier === '下' || tier === '下下') {
    push('行动', '大事缓办，先处理睡眠与饮食节律，再谈外务。', 2)
    push('情绪', '别对自己太狠，把"我必须"改成"我先试一步"。', 2)
    push('人际', '别冷战也别拉黑，有话简单说清楚就好。', 1)
  }
  if (tier === '中') {
    push('起居', '平常一日，把起床、吃饭、睡觉的节奏稳住就好。', 2)
  }

  if (jianchu === '破' || jianchu === '危') {
    push('事业', '检查一下合同、账单和消息记录，别让小问题变大。', 2)
  }
  if (jianchu === '成' || jianchu === '开') {
    push('事业', '适合开始一个小目标（7 天内能完成的那种）。', 2)
  }
  if (jianchu === '闭' || jianchu === '收') {
    push('行动', '收拾一下零碎的事，关掉多余的标签页和群消息 2 小时。', 2)
  }

  /* —— 节气季节（模板变量化） —— */
  if (season === 'spring') {
    push('起居', pickTemplate([
      '晨起可在窗边活动约十分钟，提神即可，不必赶场。',
      '春日宜早起，窗边伸展几分钟，迎着晨光开始一天。',
      '趁春光好，起床后在阳台站几分钟，唤醒身体再出门。'
    ], _rnd), 2)
    push('饮食', pickTemplate([
      '多喝温水，少空腹喝浓茶。',
      '春天宜温饮，空腹少碰浓茶与冰饮。',
      '晨起一杯温水比浓茶更养胃。'
    ], _rnd), 1)
  }
  if (season === 'summer') {
    push('起居', pickTemplate([
      '午间可小憩十五分钟左右，下午更有精神。',
      '中午试试十五分钟短休，比硬撑到傍晚效率高。',
      '午后留一刻钟闭眼时间，给大脑降降温。'
    ], _rnd), 2)
    push('饮食', pickTemplate([
      '饮食清淡些，瓜果适量，冷饮别连杯。',
      '夏日瓜果虽好，冰饮连灌伤脾胃，适可而止。',
      '天热多补水，少喝冰的，温凉白开最稳妥。'
    ], _rnd), 2)
  }
  if (season === 'autumn') {
    push('起居', pickTemplate([
      '早晚温差大，出门带件薄外套。',
      '秋意渐浓，薄外套随身备着，比感冒后补救省事。',
      '早出晚归温差明显，多一件外套少一分风险。'
    ], _rnd), 2)
    push('情绪', pickTemplate([
      '随笔写几句心情，比硬撑聚会更轻松。',
      '秋天容易多愁，不妨写几行字释放，不必逢人倾诉。',
      '情绪低沉时写下来比闷着好，三五行即可。'
    ], _rnd), 1)
  }
  if (season === 'winter') {
    push('起居', pickTemplate([
      '尽量早睡，晚间少做大汗运动。',
      '冬日宜早卧，晚间剧烈运动反而影响入睡。',
      '天冷早睡是最简单的养生，晚间散步代替跑步即可。'
    ], _rnd), 2)
    push('饮食', pickTemplate([
      '热汤热粥适量，少熬夜加餐重油。',
      '冬天一碗热粥比深夜外卖实在，少给身体加负担。',
      '温热饮食养胃，宵夜重油不如一杯热牛奶。'
    ], _rnd), 1)
  }

  /* —— 天气（模板变量化） —— */
  if (wf.rain) {
    push('行动', pickTemplate([
      '出门多留点时间，电子设备防潮；心情也别跟着阴天一起低落。',
      '雨天路滑多留余量，心情也别跟天气一起阴沉。',
      '下雨天少赶路，到得从容比到得准时更重要。'
    ], _rnd), 2)
    push('起居', pickTemplate([
      '开窗通风，站起来拉伸一下，别让肩膀僵了。',
      '雨天闷在屋里久了，站起来伸展几分钟活动活动。',
      '潮湿天气容易犯困，开窗换换气比喝咖啡管用。'
    ], _rnd), 1)
  }
  if (wf.hot) {
    push('起居', pickTemplate([
      '避开正午暴晒，补水适量；心烦时先凉快下来再办事。',
      '高温天先喝水再办事，头脑清醒比硬撑效率高。',
      '热到心烦时找个阴凉处待五分钟，情绪会自然回落。'
    ], _rnd), 2)
    push('人际', pickTemplate([
      '高温易躁，回复消息前默念三秒。',
      '天热脾气短，开口前缓三秒，少说后悔的话。',
      '大热天少做激烈讨论，约到凉快的时候再聊。'
    ], _rnd), 1)
  }
  if (wf.cold) {
    push('起居', pickTemplate([
      '热身后再锻炼，关节部位注意保暖。',
      '天冷出门先暖身，膝盖脖子别受凉。',
      '冷天运动前多热身两分钟，身体暖了再发力。'
    ], _rnd), 2)
    push('饮食', pickTemplate([
      '温热饮品适量，忌空腹久处寒风。',
      '冷天喝杯热水暖胃，比空着肚子吹风强。',
      '寒冷天气一杯温饮就是对身体的善意。'
    ], _rnd), 1)
  }
  if (wf.clear && !wf.rain) {
    push('行动', pickTemplate([
      '天气不错时，户外步行二十分钟左右，换换空气。',
      '好天气别浪费，出门走走比刷手机更提神。',
      '晴天是免费的能量补给，散步二十分钟即可。'
    ], _rnd), 2)
  }

  /* —— 年龄 —— */
  if (ab === 'teen') {
    push('学业', '用番茄钟拆作业，先完成最小一块再玩手机。', 2)
  }
  if (ab === 'youth') {
    push('事业', '今天只盯一个主要目标，别被假忙碌带跑了。', 2)
  }
  if (ab === 'mid') {
    push('起居', '找个时间和家人好好聊聊，只听不教。', 2)
    push('事业', '本周只抓 3 件事：1 件必须做完，2 件可以推迟。', 1)
  }
  if (ab === 'senior') {
    push('起居', '站起来、弯腰都慢一点，防头晕；适当晒晒太阳。', 2)
    push('情绪', '少看负面新闻，换成听点轻音乐。', 1)
  }

  /* —— 性别（仅作生活习惯向提示，避免刻板） —— */
  if (gender === 'female') {
    push('起居', '注意冷暖变化，不舒服就少社交，别硬撑。', 1)
  }
  if (gender === 'male') {
    push('情绪', '试试用一句话说出自己的感受，别只想着怎么解决问题。', 1)
  }

  /* —— 个人化（仅输出陈述，不暴露推断依据） —— */
  if (pf) {
    if (pf.dong) {
      push('行动', '给手头每件事设一个结束时间，到点就收。', 2)
    } else {
      push('行动', '抽空快走或爬楼梯十分钟，身体热起来再做事。', 2)
    }
    if (pf.gang) {
      push('人际', '开口前先复述一遍对方的意思，再说你的看法。', 2)
    } else {
      push('人际', '今天可以清楚讲一次你的需要，不必全程迁就。', 2)
    }
    if (pf.san) {
      push('事业', '清单里只留三件最重要的，其余先记到「以后再说」本。', 2)
    } else {
      push('事业', '留半小时给一件与绩效无关的爱好，纯放松。', 1)
    }
    if (pf.xian) {
      push('情绪', '累了就减少应酬式聊天，留点时间自己待着。', 1)
    } else {
      push('情绪', '找信任的人随便聊几句近况，心里会松一点。', 1)
    }
  } else {
    push('日常', '照常过即可，多留意身体和心情的小信号。', 2)
  }

  if (recentState === 'low') {
    push('情绪', '少做重大决定，先把睡眠与一餐正经饭稳住。', 2)
    push('起居', '晒十分钟自然光或散步，比硬撑社交更回血。', 1)
  }
  if (recentState === 'high') {
    push('行动', '把多余精力用在一件拖延已久的小事上，做完就停。', 2)
  }
  if (recentState === 'mid') {
    push('日常', '保持节奏即可，不必强行加码或强行放松。', 1)
  }

  if (rhythmType === 'regular') {
    push('起居', '作息稳定的时候，把最需要集中精力的事放在固定时间做。', 1)
  }
  if (rhythmType === 'late_early') {
    push('起居', '晚睡还得早起的话，别空腹喝浓茶咖啡；中午眯一会儿比硬撑强。', 2)
  }
  if (rhythmType === 'night') {
    push('起居', '晚间少刷短视频，睡前一小时光线调暗、少争论。', 2)
  }
  if (rhythmType === 'early') {
    push('起居', '晨起留十分钟缓冲，空腹少灌浓茶咖啡。', 1)
  }
  if (rhythmType === 'irregular') {
    push('起居', '尽量固定一顿主餐时间，给身体一个小锚点。', 2)
  }

  const ft = Array.isArray(focusTags) ? focusTags : []
  if (ft.indexOf('work') >= 0) {
    push('事业', '列出今日三件要务，先做最费脑的那一件。', 2)
  }
  if (ft.indexOf('relation') >= 0) {
    push('人际', '有话直说但语气温和，避免让对方猜你的态度。', 2)
  }
  if (ft.indexOf('health') >= 0) {
    push('起居', '久坐四十分钟起身一次，喝水别久憋。', 2)
  }
  if (ft.indexOf('study') >= 0) {
    push('学业', '今日只攻坚一个概念，学完用自己的话复述一遍。', 2)
  }
  if (ft.indexOf('finance') >= 0) {
    push('事业', '扫一眼近期一笔支出是否可延后，减少冲动消费。', 1)
  }
  if (ft.indexOf('family') >= 0) {
    push('人际', '给家人一条简短问候，表达在场即可，不必长聊。', 2)
  }
  if (ft.indexOf('rest') >= 0) {
    push('情绪', '留出半小时完全脱离工作消息，纯休息或发呆。', 2)
  }

  if (lotTitle) {
    push('行动参考', '今日修身与做事各选一件小的去落实，不必贪多。', 1)
  }

  /* —— 签象 / 日五行 / 等第 / 道性 大语料（与上下文精确匹配，高区分度）—— */
  try {
    collectCorpusEntries({
      lotId,
      wxDay,
      tier,
      typeId,
      personality,
      profile,
      recentState,
      userTone
    }).forEach((item) => {
      push(item.cat, item.text, 1)
    })
  } catch (e) {}

  /* —— 五行雷达联动（如有近期自修记录） —— */
  try {
    const feRecords = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    if (feRecords.length >= 3) {
      const { computeFiveElements } = require('./five-elements-chart.js')
      const feProfile = wx.getStorageSync(KEYS.USER_PROFILE) || {}
      const fePers = wx.getStorageSync(KEYS.PERSONALITY_RESULT) || null
      const fe = computeFiveElements(feRecords, feProfile, fePers)
      if (fe && fe.hasData) {
        const sorted = fe.rows.slice().sort((a, b) => b.value - a.value)
        const high = sorted[0]
        const low = sorted[sorted.length - 1]
        const FE_HIGH_TIPS = {
          '金': '最近心情偏低落，今天试着少回忆烦心事，写一件还不错的小事。',
          '木': '最近容易发火，快走 10 分钟或拉伸一下释放紧张感。',
          '水': '最近太累了，先把觉睡够，大事明天再说。',
          '火': '最近刷屏太多了，试试睡前 1 小时关掉短视频。',
          '土': '最近想太多，把想法写成一个最小行动，做完就停。'
        }
        const FE_LOW_TIPS = {
          '金': '最近表达太少了，试试深呼吸或读一段喜欢的文字。',
          '木': '最近不太想动，出门走走或做一件简单的小事。',
          '水': '最近休息不够，安排一段什么都不做的纯休息时间。',
          '火': '最近缺点活力，选一件喜欢的小事投入 20 分钟。',
          '土': '最近节奏有点乱，固定一餐饭的时间给自己一个小锚点。'
        }
        if (high.value >= 62 && FE_HIGH_TIPS[high.name]) {
          push('自修', FE_HIGH_TIPS[high.name], 2)
        }
        if (low.value <= 38 && FE_LOW_TIPS[low.name]) {
          push('自修', FE_LOW_TIPS[low.name], 2)
        }
      }
    }
  } catch (e) {}

  /* —— 跨日趋势感知（连续恶化/改善检测） —— */
  try {
    const trendRecords = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    if (trendRecords.length >= 3) {
      const recent = trendRecords.slice(-5)
      const tAvg = (key) => {
        const xs = recent.map((r) => Number(r[key])).filter((n) => !Number.isNaN(n))
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
      }
      const tStreak = (key, pred) => {
        let n = 0
        for (let si = recent.length - 1; si >= 0; si--) {
          const v = Number(recent[si][key])
          if (Number.isNaN(v)) break
          if (pred(v)) n++
          else break
        }
        return n
      }
      const poorSleep = tStreak('sleepHours', (v) => v < 6.5)
      if (poorSleep >= 3) {
        push('起居', `已经连续 ${poorSleep} 天没睡够了，今天先把睡觉时间稳住，大事明天再说。`, 3)
      }
      const highAnger = tStreak('angerCount', (v) => v >= 3)
      if (highAnger >= 3) {
        push('情绪', `最近 ${highAnger} 天容易发火，回消息前先深呼吸 3 次，晚上别吵架。`, 2)
      }
      const lowRecovery = tStreak('recoveryScore', (v) => v <= 2)
      if (lowRecovery >= 3) {
        push('起居', `连续 ${lowRecovery} 天觉得没恢复过来，给自己 15 分钟彻底休息一下。`, 2)
      }
      const highDrain = tStreak('drainScore', (v) => v >= 4)
      if (highDrain >= 3) {
        push('行动', `已经累了 ${highDrain} 天了，砍掉一件不重要的事，只做最重要的。`, 2)
      }
      const avgSleep = tAvg('sleepHours')
      const avgRecovery = tAvg('recoveryScore')
      if (avgSleep != null && avgSleep >= 7 && avgRecovery != null && avgRecovery >= 3.5) {
        push('日常', '最近睡得不错、恢复也行，保持这个节奏，把精力花在最重要的事上。', 2)
      }
    }
  } catch (e) {}

  /* —— 时段感知建议 —— */
  const curHour = new Date().getHours()
  if (curHour >= 5 && curHour < 9) {
    push('起居', '晨间留十分钟缓冲再出门，空腹别灌浓茶咖啡。', 2)
    push('行动', '上午精力最佳，把最费脑的一件事排在第一位。', 1)
  } else if (curHour >= 9 && curHour < 13) {
    push('事业', '上午专注时段，手机静音处理一件核心任务。', 1)
    push('起居', '久坐满四十分钟起身倒杯水，活动肩颈。', 1)
  } else if (curHour >= 13 && curHour < 17) {
    push('起居', '午后犯困可小憩十五分钟，比硬撑效率更高。', 2)
    push('饮食', '下午茶适量，少喝含糖饮料，温水更解乏。', 1)
  } else if (curHour >= 17 && curHour < 21) {
    push('行动', '傍晚收工后散步二十分钟，切换身心状态。', 2)
    push('人际', '晚间适合一次轻松对话，不谈工作、只聊近况。', 1)
  } else {
    push('起居', '夜间调暗灯光，睡前一小时远离短视频和争论。', 2)
    push('情绪', '睡前可数息三分钟或写一句今日收获，帮助安神。', 2)
  }

  /* —— 保底池 —— */
  const fallback = [
    { cat: '起居', text: '睡前 30 分钟调暗灯光，减少短视频滑动。' },
    { cat: '饮食', text: '吃饭七分饱就好，慢慢嚼别着急。' },
    { cat: '情绪', text: '心里烦时，先写下来，再去做一件最小的事。' },
    { cat: '人际', text: '发一条真诚感谢给最近帮过你的人，不求回复。' },
    { cat: '事业', text: '用 25 分钟只处理一件琐事，做完即停。' },
    { cat: '行动', text: '整理桌面或手机首屏，降低启动阻力。' },
    { cat: '日常', text: '今日对自己少下结论，多留意当下就好。' },
    { cat: '起居', text: '喝水设闹钟，每小时一小口也比暴饮好。' }
  ]
  fallback.forEach((f) => push(f.cat, f.text, 1))

  return out
}

function normalizeAvoidTexts(avoidAdviceTexts) {
  if (!avoidAdviceTexts) return new Set()
  if (avoidAdviceTexts instanceof Set) return avoidAdviceTexts
  const arr = Array.isArray(avoidAdviceTexts) ? avoidAdviceTexts : []
  const s = new Set()
  arr.forEach((x) => {
    const t = String(x || '').trim()
    if (t) s.add(t)
  })
  return s
}

/**
 * 贪心选取：优先不与上一条同 cat、优先避开上一轮抽签出现过的正文；
 * 候选不足时逐级放宽，保证尽量凑满 need。
 */
function uniquePick(list, rnd, need, avoidAdviceTexts) {
  const avoid = normalizeAvoidTexts(avoidAdviceTexts)
  const seen = new Set()
  const res = []
  const shuffled = list.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = t
  }

  while (res.length < need) {
    const lastCat = res.length ? res[res.length - 1].cat : null
    const candidates = shuffled.filter((it) => !seen.has(it.text))
    if (!candidates.length) break

    const tierA = candidates.filter((it) => (!lastCat || it.cat !== lastCat) && !avoid.has(it.text))
    const tierB = candidates.filter((it) => !lastCat || it.cat !== lastCat)
    const tierC = candidates.filter((it) => !avoid.has(it.text))
    const pools = [tierA, tierB, tierC, candidates]
    let pool = null
    for (let p = 0; p < pools.length; p++) {
      if (pools[p].length) {
        pool = pools[p]
        break
      }
    }
    const pick = pool[Math.floor(rnd() * pool.length)]
    seen.add(pick.text)
    res.push(pick)
  }
  return res
}

function buildDataDrivenAdvice(ctx) {
  try {
    const records = wx.getStorageSync(KEYS.TRACK_RECORDS) || []
    if (records.length < 3) return null
    const recent = records.slice(-5)
    const tAvg = (key) => {
      const xs = recent.map(r => Number(r[key])).filter(n => !Number.isNaN(n))
      return xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null
    }
    const avgSleep = tAvg('sleepHours')
    const avgScreen = tAvg('screenHours')
    const avgRecovery = tAvg('recoveryScore')
    const avgDrain = tAvg('drainScore')
    const avgAnger = tAvg('angerCount')
    const n = recent.length

    if (avgSleep != null && avgSleep < 6.5) {
      return {
        cat: '起居', 
        text: `你近 ${n} 天平均睡眠仅 ${avgSleep}h，今天试试提前 30 分钟放下手机。`,
        reason: `近 ${n} 天平均 ${avgSleep}h`,
        microAction: '今晚提前 30 分钟放下手机'
      }
    }
    if (avgScreen != null && avgScreen > 6) {
      return {
        cat: '行动',
        text: `你近 ${n} 天日均屏幕 ${avgScreen}h，试试午后用 20 分钟散步替代刷手机。`,
        reason: `近 ${n} 天日均 ${avgScreen}h`,
        microAction: '午后散步 20 分钟替代刷手机'
      }
    }
    if (avgRecovery != null && avgRecovery <= 2.5) {
      return {
        cat: '起居',
        text: `你近 ${n} 天恢复感均值仅 ${avgRecovery}，给自己 15 分钟彻底休息。`,
        reason: `恢复感均值 ${avgRecovery}/5`,
        microAction: '安排 15 分钟纯休息'
      }
    }
    if (avgDrain != null && avgDrain >= 4) {
      return {
        cat: '行动',
        text: `你近 ${n} 天耗竭感均值 ${avgDrain}，砍掉一件不重要的事。`,
        reason: `耗竭感均值 ${avgDrain}/5`,
        microAction: '砍掉今天一件不重要的事'
      }
    }
    if (avgAnger != null && avgAnger >= 3) {
      return {
        cat: '情绪',
        text: `你近 ${n} 天日均发火 ${avgAnger} 次，回消息前试试深呼吸 3 次。`,
        reason: `日均 ${avgAnger} 次`,
        microAction: '回消息前深呼吸 3 次'
      }
    }
    return null
  } catch (e) {
    return null
  }
}

function deriveMicroAction(cat, text, rnd) {
  const MAP = {
    '起居': ['早睡 30 分钟', '站起来拉伸 5 分钟', '午休 15 分钟'],
    '行动': ['快走 10 分钟', '整理桌面 5 分钟', '完成一件拖延的小事'],
    '情绪': ['深呼吸 3 次', '写下一件好事', '听一首喜欢的歌'],
    '人际': ['发一条真诚感谢', '认真听一个人说话', '给家人一个问候'],
    '饮食': ['喝一杯温水', '午餐七分饱', '少喝一杯冷饮'],
    '事业': ['番茄钟 25 分钟', '只盯一个主目标', '列出今日三件事'],
    '学业': ['专注学 25 分钟', '用自己的话复述', '拆一个小概念'],
    '日常': ['记一件做完的事', '留 10 分钟发呆', '少看负面新闻'],
    '自修': ['记录今日状态', '翻看本周变化', '完成一个微行动']
  }
  const options = MAP[cat] || MAP['日常']
  return options[Math.floor(rnd() * options.length)]
}

/**
 * @returns {{ lines: string[], structured: Array<{cat:string,text:string,reason:string,microAction:string}> }}
 */
function computeLotteryAdvices(input) {
  const {
    dateStr,
    lotId,
    tier,
    lotTitle,
    almanac,
    weather,
    age,
    gender,
    personality,
    wxDay,
    typeId,
    recentState,
    rhythmType,
    focusTags,
    profile,
    avoidAdviceTexts
  } = input

  const wf = weatherFlags(weather)
  const ab = ageBracket(age)
  const pf = persFlags(personality)
  const season = seasonBucket(almanac && almanac.jieqi)
  const jianchu = (almanac && almanac.jianchu) || '平'

  const genderKey = gender === 'male' || gender === 'female' ? gender : 'unknown'
  const persKey = pf ? `${pf.dong ? 1 : 0}${pf.gang ? 1 : 0}${pf.san ? 1 : 0}${pf.xian ? 1 : 0}` : 'na'
  const rs = recentState != null ? String(recentState) : 'na'
  const rh = rhythmType != null ? String(rhythmType) : 'na'
  const ft =
    Array.isArray(focusTags) && focusTags.length ? focusTags.slice().sort().join(',') : 'na'
  const wday = wxDay != null && wxDay !== '' ? String(wxDay) : 'na'
  const tId = typeId != null && !Number.isNaN(Number(typeId)) ? Number(typeId) : 'na'
  const userTone = resolveUserTone({ personality, profile, recentState })
  const et = profile && profile.emotionTendency != null ? String(profile.emotionTendency) : 'na'
  const seed = hashStr(
    `${dateStr}|${lotId}|${tier}|${almanac && almanac.jieqi}|${jianchu}|${wf.code}|${age}|${genderKey}|${persKey}|${rs}|${rh}|${ft}|wx${wday}|ty${tId}|ut${userTone}|et${et}`
  )
  const rnd = mulberry32(seed)

  const ctx = {
    tier,
    jianchu,
    season,
    wf,
    ab,
    gender: genderKey,
    pf,
    lotTitle,
    lotId: lotId != null ? Number(lotId) : 0,
    wxDay: wday === 'na' ? '' : wday,
    typeId: tId === 'na' ? null : tId,
    recentState,
    rhythmType,
    focusTags,
    personality,
    profile,
    userTone
  }
  const pool = collectCandidates(ctx, rnd)
  const need = 8
  const allPicked = uniquePick(pool, rnd, need, avoidAdviceTexts)

  const dataAdvice = buildDataDrivenAdvice(ctx)
  const topPicked = allPicked.slice(0, 3)
  if (dataAdvice && topPicked.length >= 2) {
    topPicked[topPicked.length - 1] = dataAdvice
  }

  const structured = topPicked.map((p, i) => ({
    cat: p.cat,
    text: p.text,
    reason: p.reason || '',
    microAction: p.microAction || deriveMicroAction(p.cat, p.text, rnd),
  }))

  const lines = structured.map((s, i) => `${i + 1}. ${s.text}`)
  const result = {
    lines: lines.length >= 2 ? lines : lines.concat(['2. 今日把作息摆在第一位，外事能缓则缓。', '3. 记下一件已经做完的小事，给自己一点认可。']),
    structured
  }
  return result
}

module.exports = { computeLotteryAdvices, seasonBucket, ageBracket, weatherFlags, buildDataDrivenAdvice, deriveMicroAction }
