/**
 * 道性十六型：动/静、刚/柔、散/聚、显/藏
 * 问卷计分后得到四维比例 [dong, gang, san, xian] ∈ [0,1]，与 16 型质心最近邻匹配
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
      '「定势」偏聚能攻坚。修行侧重点是「刚中有柔」，让坚持不变成僵化。'
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
      '「流」与「应变」适合在复杂环境中调适；量化修行上可记录「切换任务次数」观察是否过载。'
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
      '「潜开源」是内聚外发；修行上宜区分「隐忍」与「压抑」。'
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
    figure: '徐霞客',
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
    figure: '李时珍',
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
    figure: '左宗棠',
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
    figure: '周敦颐',
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
    figure: '王维',
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
      '「守一」非躺平，而是减噪；量化修行建议从睡眠与屏幕时间开始。'
  }
]

const QUESTIONS = [
  { id: 1, text: '遇到突发状况，你更倾向？', dim: 'dj', a: { label: '先动手处理或联系他人', key: 'dong' }, b: { label: '先站一边看清局面', key: 'jing' } },
  { id: 2, text: '周末安排通常？', dim: 'dj', a: { label: '临时起意出门或约人', key: 'dong' }, b: { label: '提前想好再少量行动', key: 'jing' } },
  { id: 3, text: '学习新技能时？', dim: 'dj', a: { label: '边做边学', key: 'dong' }, b: { label: '先系统看资料再练', key: 'jing' } },
  { id: 4, text: '被人误解时？', dim: 'dj', a: { label: '尽快解释或行动证明', key: 'dong' }, b: { label: '先冷一冷再想怎么说', key: 'jing' } },
  { id: 5, text: '工作压力上来时？', dim: 'dj', a: { label: '加快速度多线程推进', key: 'dong' }, b: { label: '先列清单减干扰再动', key: 'jing' } },
  { id: 6, text: '旅行时你更享受？', dim: 'dj', a: { label: '打卡与体验紧凑行程', key: 'dong' }, b: { label: '慢走细看少量点', key: 'jing' } },
  { id: 7, text: '做决定的速度？', dim: 'dj', a: { label: '多数情况较快拍板', key: 'dong' }, b: { label: '倾向多想一想', key: 'jing' } },
  { id: 8, text: '空闲时身体状态？', dim: 'dj', a: { label: '坐不住，想动一动', key: 'dong' }, b: { label: '可以安静很久', key: 'jing' } },
  { id: 9, text: '团队分歧时你更？', dim: 'gr', a: { label: '坚持己见并推动结论', key: 'gang' }, b: { label: '照顾气氛寻求折中', key: 'rou' } },
  { id: 10, text: '被批评时第一反应？', dim: 'gr', a: { label: '辩解或逐条回应', key: 'gang' }, b: { label: '先听完再消化', key: 'rou' } },
  { id: 11, text: '规则与人情冲突时？', dim: 'gr', a: { label: '优先规则与原则', key: 'gang' }, b: { label: '看情境弹性处理', key: 'rou' } },
  { id: 12, text: '竞争场合？', dim: 'gr', a: { label: '想赢、敢争', key: 'gang' }, b: { label: '能退则退、重和谐', key: 'rou' } },
  { id: 13, text: '对「对错」的态度？', dim: 'gr', a: { label: '黑白分明很重要', key: 'gang' }, b: { label: '灰度与语境更重要', key: 'rou' } },
  { id: 14, text: '表达不同意时？', dim: 'gr', a: { label: '直接点明', key: 'gang' }, b: { label: '委婉铺垫', key: 'rou' } },
  { id: 15, text: '面对强势的人？', dim: 'gr', a: { label: '不怵，敢顶回去', key: 'gang' }, b: { label: '先避让再找机会', key: 'rou' } },
  { id: 16, text: '自我要求？', dim: 'gr', a: { label: '标准高、对自己也硬', key: 'gang' }, b: { label: '允许自己松一点', key: 'rou' } },
  { id: 17, text: '同时段任务多？', dim: 'sj', a: { label: '并行切换多个事项', key: 'san' }, b: { label: '尽量一件做完再下一件', key: 'ju' } },
  { id: 18, text: '桌面与房间？', dim: 'sj', a: { label: '东西多但能找到', key: 'san' }, b: { label: '喜欢整洁有固定位置', key: 'ju' } },
  { id: 19, text: '兴趣爱好？', dim: 'sj', a: { label: '好多样都想试试', key: 'san' }, b: { label: '少数几样深耕', key: 'ju' } },
  { id: 20, text: '思绪特点？', dim: 'sj', a: { label: '联想多、跳得快', key: 'san' }, b: { label: '一条线想到底', key: 'ju' } },
  { id: 21, text: '花钱习惯？', dim: 'sj', a: { label: '分散在小确幸上', key: 'san' }, b: { label: '集中在大件或储蓄', key: 'ju' } },
  { id: 22, text: '社交能量？', dim: 'sj', a: { label: '多场子切换不累', key: 'san' }, b: { label: '少量深聊更舒服', key: 'ju' } },
  { id: 23, text: '信息输入？', dim: 'sj', a: { label: '刷很多源、广撒网', key: 'san' }, b: { label: '固定几个高质量渠道', key: 'ju' } },
  { id: 24, text: '在陌生聚会？', dim: 'xz', a: { label: '容易主动搭话', key: 'xian' }, b: { label: '先观察再开口', key: 'cang' } },
  { id: 25, text: '成就与心情？', dim: 'xz', a: { label: '愿意发朋友圈或说出来', key: 'xian' }, b: { label: '自己知道就好', key: 'cang' } },
  { id: 26, text: '遇到困难？', dim: 'xz', a: { label: '会找人商量或求助', key: 'xian' }, b: { label: '先自己扛一阵', key: 'cang' } },
  { id: 27, text: '穿衣风格？', dim: 'xz', a: { label: '希望被注意到一点', key: 'xian' }, b: { label: '低调舒适为主', key: 'cang' } },
  { id: 28, text: '工作成果展示？', dim: 'xz', a: { label: '该显就显', key: 'xian' }, b: { label: '默默做完就好', key: 'cang' } },
  { id: 29, text: '情绪波动时？', dim: 'xz', a: { label: '表情语气容易看出来', key: 'xian' }, b: { label: '外表尽量平静', key: 'cang' } },
  { id: 30, text: '长期目标？', dim: 'xz', a: { label: '愿意对外宣告以督促自己', key: 'xian' }, b: { label: '放在心里慢慢做', key: 'cang' } }
]

function dist2(a, b) {
  let s = 0
  for (let i = 0; i < 4; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return s
}

function calculatePersonality(answers) {
  const count = { dong: 0, jing: 0, gang: 0, rou: 0, san: 0, ju: 0, xian: 0, cang: 0 }
  QUESTIONS.forEach((q) => {
    const v = answers[q.id]
    if (!v) return
    const side = v === 'a' ? q.a.key : q.b.key
    count[side] = (count[side] || 0) + 1
  })
  const dong = count.dong + count.jing > 0 ? count.dong / (count.dong + count.jing) : 0.5
  const gang = count.gang + count.rou > 0 ? count.gang / (count.gang + count.rou) : 0.5
  const san = count.san + count.ju > 0 ? count.san / (count.san + count.ju) : 0.5
  const xian = count.xian + count.cang > 0 ? count.xian / (count.xian + count.cang) : 0.5
  const vec = [dong, gang, san, xian]

  let best = 0
  let bestD = Infinity
  PERSONALITY_TYPES.forEach((t, i) => {
    const d = dist2(vec, t.vector)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })

  const type = PERSONALITY_TYPES[best]
  return {
    ...type,
    typeId: type.id,
    typeName: type.name,
    vector: vec,
    scores: {
      动: Math.round(dong * 100),
      刚: Math.round(gang * 100),
      散: Math.round(san * 100),
      显: Math.round(xian * 100)
    }
  }
}

function getTypeById(id) {
  return PERSONALITY_TYPES.find((t) => t.id === id) || PERSONALITY_TYPES[0]
}

module.exports = {
  QUESTIONS,
  PERSONALITY_TYPES,
  calculatePersonality,
  getTypeById
}
