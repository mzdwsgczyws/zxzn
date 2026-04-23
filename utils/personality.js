/**
 * 道性十六型：动/静、刚/柔、散/聚、显/藏
 *
 * 测验为「两择一 + 难选」：每题两栏为惯常、等价的日常风格（见 personality-quiz-questions.js），
 * 避免四档时集中在「偏 A/偏 B」、极端档无人敢选；计分为两对端 1.0/1.0 累计，同维 9 题等效 9 次表态。
 * 第 3 项「都难选」略向 B 端（静/柔/聚/藏）给弱分；未答题按 0.5:0.5 无信息，并可叠提前交卷轻偏置。
 *
 * 计分后得到四维比例 [dong, gang, san, xian] ∈ [0,1]；归型用 **四轴 0.5 分箱 → 2⁴ 格** 与 16 型做**双射**（见 PATTERN_TO_TYPE_ID），
 * 避免「软质心最近邻」导致中位人物型过度集中；极端角点固定对照 0000↔陈抟、1111↔刘邦，其余格按理想角点与类型的距离贪心配对。
 */

const PERSONALITY_TYPES = [
  {
    id: 0,
    name: '阳行开势型',
    figure: '刘邦',
    vector: [0.88, 0.82, 0.86, 0.9],
    summary: '你当前更接近在变化中主动开局、敢闯敢试的状态。',
    traits: ['行动启动快', '适应不确定性强', '外显能量足'],
    risks: ['容易铺得太开', '节奏起伏大时需防耗散'],
    advice: ['重要事项设「收束点」', '每日留片刻静坐复盘'],
    detail:
      '「行」主外动，「开势」重破局。宜在进取中养一点静气，使势能有归处。历史形象取意于善聚人、善借势而行，非宿命论对应。'
  },
  {
    id: 1,
    name: '阳行定势型',
    figure: '朱元璋',
    vector: [0.86, 0.84, 0.28, 0.88],
    summary: '你当前更接近目标清晰、推进坚决、善于巩固阵地的状态。',
    traits: ['执行力强', '重视规则与阶段目标', '外显主导'],
    risks: ['刚性过强时易忽视柔性沟通'],
    advice: ['大事前多问一句「他者视角」', '每周一次柔性社交或艺术放松'],
    detail:
      '「定势」偏聚能攻坚。自修侧重点是「刚中有柔」，让坚持不变成僵化。'
  },
  {
    id: 2,
    name: '阳流应变型',
    figure: '苏轼',
    vector: [0.82, 0.32, 0.85, 0.86],
    summary: '你当前更接近灵动变通、以柔化刚、在流动中寻找机会的状态。',
    traits: ['反应快', '表达外显', '不喜死板'],
    risks: ['散度偏高时注意力易碎片化'],
    advice: ['用清单锚定三件要事', '晚间简短日记收束思绪'],
    detail:
      '「流」与「应变」适合在复杂环境中调适；量化自修上可记录「切换任务次数」观察是否过载。'
  },
  {
    id: 3,
    name: '阳流归元型',
    figure: '曾国藩',
    vector: [0.78, 0.35, 0.26, 0.84],
    summary: '你当前更接近外显而内求条理、以日课沉淀心性的状态。',
    traits: ['能自律复盘', '刚柔并济倾向', '重长期积累'],
    risks: ['自我要求高时易焦虑'],
    advice: ['允许「完成比完美重要」', '睡眠与运动写入日课'],
    detail:
      '「归元」强调把散乱经验收回身心节奏；适合用行为记录做温和的自我观察。'
  },
  {
    id: 4,
    name: '阴守外放型',
    figure: '诸葛亮',
    vector: [0.72, 0.68, 0.42, 0.48],
    summary: '你当前更接近外显担当、内里审慎、谋定而后动的状态。',
    traits: ['责任感强', '思虑较深', '对外仍保持行动力'],
    risks: ['思虑过多时消耗心神'],
    advice: ['设定「决策时限」', '用小步实验降低内耗'],
    detail:
      '「阴守」非消极，而是内稳外应；宜防过度用脑，以息心之法调节。'
  },
  {
    id: 5,
    name: '阴守定元型',
    figure: '王阳明',
    vector: [0.7, 0.72, 0.34, 0.46],
    summary: '你当前更接近内守宗旨、知行合一取向的状态。',
    traits: ['自省能力强', '重视义理与原则', '情绪相对稳定'],
    risks: ['理念与现实摩擦时易郁结'],
    advice: ['身体活动与社交同样重要', '把「知」落到可测的小行为'],
    detail:
      '适合将「致良知」转化为每日可量化习惯（睡眠、怒气次数等），以数观心而非以数缚心。'
  },
  {
    id: 6,
    name: '阴观流转型',
    figure: '李白',
    vector: [0.68, 0.28, 0.88, 0.44],
    summary: '你当前更接近感性丰沛、意象流动、外显而富有想象的状态。',
    traits: ['灵感多', '情感表达强', '不喜拘束'],
    risks: ['作息与节奏易漂移'],
    advice: ['固定起床时间比固定入睡更易坚持', '情绪高峰后安排缓冲时段'],
    detail:
      '「观流转」宜借记录情绪峰值时段，找到属于自己的节律。'
  },
  {
    id: 7,
    name: '阴观归一型',
    figure: '陶渊明',
    vector: [0.58, 0.32, 0.22, 0.42],
    summary: '你当前更接近向内观照、简欲、重精神自主的状态。',
    traits: ['喜独处思考', '对浮华保持距离', '内心标准清晰'],
    risks: ['过度退藏可能影响必要社交支持'],
    advice: ['每周至少两次高质量联结', '用自然行走补足「气」的流通'],
    detail:
      '「归一」重在简与定；量化记录可帮助观察「退」与「避」是否适度。'
  },
  {
    id: 8,
    name: '阳潜开源型',
    figure: '韩信',
    vector: [0.86, 0.78, 0.84, 0.18],
    summary: '你当前更接近内敛蓄势、关键时刻爆发的行动型。',
    traits: ['善谋长线', '不喜张扬却敢担当', '破局能力强'],
    risks: ['压抑过久需防情绪堰塞'],
    advice: ['定期倾诉或书写释放', '强项场景主动争取舞台'],
    detail:
      '「潜开源」是内聚外发；自修上宜区分「隐忍」与「压抑」。'
  },
  {
    id: 9,
    name: '阳潜定核型',
    figure: '张良',
    vector: [0.8, 0.86, 0.24, 0.14],
    summary: '你当前更接近深藏若虚、以静制动、内核极稳的状态。',
    traits: ['判断冷静', '少言多思', '善抓关键'],
    risks: ['过度抽离可能错过表达窗口'],
    advice: ['重要关系里练习简短表达感受', '用小目标训练「适度显」'],
    detail:
      '「定核」宜配一点「显」的练习，使内在清明能被他者理解。'
  },
  {
    id: 10,
    name: '阳潜流形型',
    figure: '玄奘',
    vector: [0.84, 0.26, 0.88, 0.16],
    summary: '你当前更接近内敛而好探索、以行走与体验扩展认知的状态。',
    traits: ['好奇心强', '身体与空间感重要', '不喜空谈'],
    risks: ['探索欲强时忽略恢复'],
    advice: ['把恢复写进行程表', '用步数/户外活动时长作温和指标'],
    detail:
      '「流形」可走可测之路：行旅、自然、动手类活动有助归位。'
  },
  {
    id: 11,
    name: '阳潜归核型',
    figure: '司马迁',
    vector: [0.76, 0.38, 0.22, 0.12],
    summary: '你当前更接近沉潜钻研、以实证与积累成学的状态。',
    traits: ['耐心细致', '重证据与细节', '少炫耀'],
    risks: ['易陷入过度完美主义'],
    advice: ['设定交付节点', '番茄钟等工具保护专注边界'],
    detail:
      '「归核」与量化记录天然契合：用数据看见进步曲线即可减焦虑。'
  },
  {
    id: 12,
    name: '阴潜外化型',
    figure: '岳飞',
    vector: [0.38, 0.7, 0.48, 0.1],
    summary: '你当前更接近外刚内韧、先难后获、善于承压的状态。',
    traits: ['意志坚定', '能扛事', '表达偏节制'],
    risks: ['硬扛身体信号'],
    advice: ['怒气与烦恼次数纳入日记', '学会「战略性示弱」'],
    detail:
      '「外化」需防只在事上硬撑；身心指标是真实的「仪表盘」。'
  },
  {
    id: 13,
    name: '阴潜定道型',
    figure: '朱熹',
    vector: [0.28, 0.8, 0.26, 0.08],
    summary: '你当前更接近内求理路、清静自守、重品格与义理的状态。',
    traits: ['自律', '喜读书与抽象思考', '情绪内敛'],
    risks: ['易与社会节奏脱节感'],
    advice: ['每周一次轻量社交', '把道理落成一件具体家务或运动'],
    detail:
      '「定道」可与「太极图式」的阴阳消长联想：行为记录即观消长。'
  },
  {
    id: 14,
    name: '阴潜游化型',
    figure: '曹雪芹',
    vector: [0.32, 0.24, 0.82, 0.12],
    summary: '你当前更接近内秀、审美与意境敏感、在静中流动的状态。',
    traits: ['感知细腻', '喜艺术与自然', '不喜冲突'],
    risks: ['回避冲突可能积压'],
    advice: ['用非暴力沟通模板练一句表达', '音乐/书画作情绪出口'],
    detail:
      '「游化」重在气化于艺；记录「愉悦分钟数」可增自我滋养。'
  },
  {
    id: 15,
    name: '阴潜守一型',
    figure: '陈抟',
    vector: [0.18, 0.22, 0.14, 0.08],
    summary: '你当前更接近深藏简欲、守一、重睡眠与息心的状态。',
    traits: ['喜简静', '内守力强', '对外部评价相对淡'],
    risks: ['动力不足时需防停滞'],
    advice: ['最小可行行动：每天 10 分钟户外', '用睡眠时长与质量作第一指标'],
    detail:
      '「守一」非躺平，而是减噪；量化自修建议从睡眠与屏幕时间开始。'
  }
]

/**
 * pattern = (动≥0.5) + (刚≥0.5)<<1 + (散≥0.5)<<2 + (显≥0.5)<<3，取值 0..15
 * 值表示「十六人格 id」（与 PERSONALITY_TYPES 下标一致）；双射使随机独立四比特下各型先验等概。
 * 0x0=0000 陈抟、0xF=1111 刘邦为固定，其余 14 格按与理想角点 (0.08/0.92) 距离贪心配满 16 型。
 */
const PATTERN_TO_TYPE_ID = [15, 11, 13, 9, 14, 10, 12, 8, 7, 3, 1, 5, 2, 6, 4, 0]

const _QUESTION_RAW = require('./personality-quiz-questions.js')

/**
 * 「都难选」项：在当题对应维度上略向 B 端（静/柔/聚/藏）收，表示回避强表态
 */
function neitherOptionW(dim) {
  if (dim === 'dj') return { dong: 0.42, jing: 0.58 }
  if (dim === 'gr') return { gang: 0.42, rou: 0.58 }
  if (dim === 'sj') return { san: 0.42, ju: 0.58 }
  if (dim === 'xz') return { xian: 0.42, cang: 0.58 }
  return { dong: 0.5, jing: 0.5 }
}

/** 提前交卷/旧版 n：该题在维度上无信息，按 0.5:0.5 计入 */
function dimNeutralW(dim) {
  if (dim === 'dj') return { dong: 0.5, jing: 0.5 }
  if (dim === 'gr') return { gang: 0.5, rou: 0.5 }
  if (dim === 'sj') return { san: 0.5, ju: 0.5 }
  if (dim === 'xz') return { xian: 0.5, cang: 0.5 }
  return { dong: 0.5, jing: 0.5 }
}

const QUESTIONS = _QUESTION_RAW.map((q) => ({
  ...q,
  options: [
    ...q.options,
    { label: '都难选', w: neitherOptionW(q.dim) }
  ]
}))

/** 提前结束测验：在原始计分上叠一点「求结果、少纠缠」的轻偏置（动/显略升） */
const EARLY_EXIT_BIAS = { dong: 0.2, jing: 0.08, xian: 0.16, cang: 0.1 }

/**
 * 计分：每题 0/1 为两栏之一，2 为「都难选」；加总后比例即四维。
 * meta.earlyExit：未答题按该维 0.5:0.5 无信息 + EARLY_EXIT_BIAS
 * 兼容：'a'→0 'b'→1 'n'→无信息；曾用多档(3–5)的 index 会折叠到 0/1/2
 */
function calculatePersonality(answers, meta) {
  const earlyExit = meta && meta.earlyExit === true
  const count = { dong: 0, jing: 0, gang: 0, rou: 0, san: 0, ju: 0, xian: 0, cang: 0 }
  let neitherCount = 0

  QUESTIONS.forEach((q) => {
    let v = answers[q.id]
    if (v == null) {
      if (earlyExit) {
        const w0 = dimNeutralW(q.dim)
        Object.keys(w0).forEach((k) => {
          count[k] = (count[k] || 0) + w0[k]
        })
      }
      return
    }
    if (v === 'a') v = 0
    else if (v === 'b') v = 1
    else if (v === 'n') {
      const w0 = dimNeutralW(q.dim)
      Object.keys(w0).forEach((k) => {
        count[k] = (count[k] || 0) + w0[k]
      })
      return
    }
    let idx = typeof v === 'number' ? v : parseInt(v, 10)
    if (isNaN(idx)) return
    if (idx > 2) {
      if (idx === 3) idx = 1
      else if (idx === 4 || idx === 5) idx = 2
      else return
    }
    if (idx < 0 || idx >= q.options.length) return
    if (idx === 2) neitherCount += 1
    const w = q.options[idx].w
    Object.keys(w).forEach((k) => {
      count[k] = (count[k] || 0) + w[k]
    })
  })

  if (earlyExit) {
    Object.keys(EARLY_EXIT_BIAS).forEach((k) => {
      count[k] = (count[k] || 0) + EARLY_EXIT_BIAS[k]
    })
  }

  const dong = count.dong + count.jing > 0 ? count.dong / (count.dong + count.jing) : 0.5
  const gang = count.gang + count.rou > 0 ? count.gang / (count.gang + count.rou) : 0.5
  const san = count.san + count.ju > 0 ? count.san / (count.san + count.ju) : 0.5
  const xian = count.xian + count.cang > 0 ? count.xian / (count.xian + count.cang) : 0.5
  let vec = [dong, gang, san, xian]

  // 「都不想选」较多时，向偏阴、偏收的中质心略贴近（避免与强极端型硬贴）
  if (neitherCount > 0) {
    const blend = Math.min(0.14, neitherCount * 0.006)
    const target = [0.44, 0.4, 0.45, 0.38]
    vec = vec.map((v, i) => v * (1 - blend) + target[i] * blend)
  }

  const p =
    (vec[0] >= 0.5 ? 1 : 0) |
    (vec[1] >= 0.5 ? 2 : 0) |
    (vec[2] >= 0.5 ? 4 : 0) |
    (vec[3] >= 0.5 ? 8 : 0)
  const best = PATTERN_TO_TYPE_ID[p]

  const type = PERSONALITY_TYPES[best]
  return {
    ...type,
    typeId: type.id,
    typeName: type.name,
    vector: vec,
    neitherCount,
    earlyExit: !!earlyExit,
    scores: {
      动: Math.round(vec[0] * 100),
      刚: Math.round(vec[1] * 100),
      散: Math.round(vec[2] * 100),
      显: Math.round(vec[3] * 100)
    }
  }
}

function getTypeById(id) {
  return PERSONALITY_TYPES.find((t) => t.id === id) || PERSONALITY_TYPES[0]
}

module.exports = {
  QUESTIONS,
  PERSONALITY_TYPES,
  PATTERN_TO_TYPE_ID,
  calculatePersonality,
  getTypeById
}
