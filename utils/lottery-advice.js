/**
 * 心象箴言建议决策树：综合等第、节气、建除、天气、年龄、性别、道性四维（可缺省），
 * 从多池候选中用稳定种子抽取 ≥5 条，避免每次完全相同。
 */

const { hashStr } = require('./fortune.js')
const { collectCorpusEntries, resolveUserTone } = require('./lottery-advice-corpus.js')

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
function collectCandidates(ctx) {
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

  const push = (cat, text, weight = 1) => {
    for (let i = 0; i < weight; i++) out.push({ cat, text })
  }

  /* —— 等第与建除 —— */
  if (tier === '上上' || tier === '上') {
    push('行动', '今日可着手一件拖了一阵、风险可控的小事，做完即停。', 2)
    push('情绪', '把好心情写下来或分享给一位信任的人，巩固正向反馈。', 1)
  }
  if (tier === '下' || tier === '下下') {
    push('行动', '大事缓办，先处理睡眠与饮食节律，再谈外务。', 2)
    push('情绪', '降低自我攻击，把「我必须」改成「我可以先试一步」。', 2)
    push('人际', '避免冷战与拉黑式沟通，宁可简短说清楚边界。', 1)
  }
  if (tier === '中') {
    push('起居', '平常一日，把起床、吃饭、睡觉的节奏稳住就好。', 2)
  }

  if (jianchu === '破' || jianchu === '危') {
    push('事业', '检查合同、账单、消息记录三处细节，防微杜渐。', 2)
  }
  if (jianchu === '成' || jianchu === '开') {
    push('事业', '适合开启短周期目标（7 天内可验收）的一小步。', 2)
  }
  if (jianchu === '闭' || jianchu === '收') {
    push('行动', '收束碎片任务，关闭多余标签页与群通知 2 小时。', 2)
  }

  /* —— 节气季节 —— */
  if (season === 'spring') {
    push('起居', '晨起可在窗边活动约十分钟，提神即可，不必赶场。', 2)
    push('饮食', '多喝温水，少空腹喝浓茶。', 1)
  }
  if (season === 'summer') {
    push('起居', '午间可小憩十五分钟左右，下午更有精神。', 2)
    push('饮食', '饮食清淡些，瓜果适量，冷饮别连杯。', 2)
  }
  if (season === 'autumn') {
    push('起居', '早晚温差大，出门带件薄外套。', 2)
    push('情绪', '随笔写几句心情，比硬撑聚会更轻松。', 1)
  }
  if (season === 'winter') {
    push('起居', '尽量早睡，晚间少做大汗运动。', 2)
    push('饮食', '热汤热粥适量，少熬夜加餐重油。', 1)
  }

  /* —— 天气 —— */
  if (wf.rain) {
    push('行动', '出行预留缓冲时间，电子设备防潮；情绪上防「闷气」。', 2)
    push('起居', '室内通风除湿，适度拉伸，防肩颈僵。', 1)
  }
  if (wf.hot) {
    push('起居', '避开正午暴晒，补水适量；心烦时先凉快下来再办事。', 2)
    push('人际', '高温易躁，回复消息前默念三秒。', 1)
  }
  if (wf.cold) {
    push('起居', '热身后再锻炼，关节部位注意保暖。', 2)
    push('饮食', '温热饮品适量，忌空腹久处寒风。', 1)
  }
  if (wf.clear && !wf.rain) {
    push('行动', '天气不错时，户外步行二十分钟左右，换换空气。', 2)
  }

  /* —— 年龄 —— */
  if (ab === 'teen') {
    push('学业', '用番茄钟拆作业，先完成最小一块再玩手机。', 2)
  }
  if (ab === 'youth') {
    push('事业', '今日只盯一个主目标，拒绝「多线程虚荣忙碌」。', 2)
  }
  if (ab === 'mid') {
    push('起居', '安排一次与家人的高质量对话，不谈教只倾听。', 2)
    push('事业', '梳理本周三件事：一件必须成，两件可推迟。', 1)
  }
  if (ab === 'senior') {
    push('起居', '起身、弯腰放慢，防体位性低血压；晒太阳适度。', 2)
    push('情绪', '减少负面新闻摄入时长，改听舒缓音频。', 1)
  }

  /* —— 性别（仅作生活习惯向提示，避免刻板） —— */
  if (gender === 'female') {
    push('起居', '关注体感温差与休息节奏，不适则减少强撑社交。', 1)
  }
  if (gender === 'male') {
    push('情绪', '练习用一句话表达感受，而非只讲解决方案。', 1)
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

  /* —— 保底池 —— */
  const fallback = [
    { cat: '起居', text: '睡前 30 分钟调暗灯光，减少短视频滑动。' },
    { cat: '饮食', text: '正餐七分饱，细嚼慢咽数到 20 下再咽第一口。' },
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

function uniquePick(list, rnd, need) {
  const seen = new Set()
  const res = []
  const shuffled = list.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = t
  }
  for (let k = 0; k < shuffled.length && res.length < need; k++) {
    const item = shuffled[k]
    const key = item.text
    if (!seen.has(key)) {
      seen.add(key)
      res.push(item)
    }
  }
  return res
}

/**
 * @returns { string[] } 至少 5 条，通常 6–8 条
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
    profile
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
  const pool = collectCandidates(ctx)
  const need = 8
  const picked = uniquePick(pool, rnd, need)
  const lines = picked.map((p, i) => `${i + 1}. ${p.text}`)
  return lines.length >= 5
    ? lines
    : lines.concat(['5. 今日把作息摆在第一位，外事能缓则缓。', '6. 记下一件已经做完的小事，给自己一点认可。'])
}

module.exports = { computeLotteryAdvices, seasonBucket, ageBracket, weatherFlags }
