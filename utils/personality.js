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

const QUESTIONS = [
  { id: 1, text: '约好晨跑那天下起雨来，你多半会？', dim: 'dj', a: { label: '改去室内或找别的运动补上', key: 'dong' }, b: { label: '顺势休息，改天再说', key: 'jing' } },
  { id: 2, text: '第一次到陌生城市出差，傍晚有一小段空档，你更可能？', dim: 'dj', a: { label: '出门随便走两条街感受一下', key: 'dong' }, b: { label: '待在酒店整理次日事、看会儿剧', key: 'jing' } },
  { id: 3, text: '工作群里突然有人@全体说「很急」，你通常会？', dim: 'dj', a: { label: '先回一句正在看，能插手就先动', key: 'dong' }, b: { label: '先判断是不是自己的事再决定回不回复', key: 'jing' } },
  { id: 4, text: '做饭做到一半发现少一味调料，你更常？', dim: 'dj', a: { label: '下楼或叫个外卖马上补上', key: 'dong' }, b: { label: '用冰箱里别的代替，能成菜就行', key: 'jing' } },
  { id: 5, text: '长假最后一天下午，返程路上你更倾向？', dim: 'dj', a: { label: '提早动身，怕堵在路上', key: 'dong' }, b: { label: '笃悠悠待到傍晚再走也行', key: 'jing' } },
  { id: 6, text: '玩剧本杀时你拿到一条关键线索，你更可能？', dim: 'dj', a: { label: '当场说出来推剧情', key: 'dong' }, b: { label: '先记在心里，多看几轮再提', key: 'jing' } },
  { id: 7, text: '听说常去的那家店下周要歇业，你更可能？', dim: 'dj', a: { label: '这周末一定再去吃一趟', key: 'dong' }, b: { label: '记在心里，难过一下就算了', key: 'jing' } },
  { id: 8, text: '取咖啡时前面有人打电话很慢，队伍不动，你更常？', dim: 'dj', a: { label: '轻声提醒后面还有人排队', key: 'dong' }, b: { label: '刷会儿手机，多等一会儿', key: 'jing' } },
  { id: 9, text: '学一样完全陌生的技能（比如乐器），你更习惯？', dim: 'dj', a: { label: '先摸一摸、弹两下再找教程', key: 'dong' }, b: { label: '先把基础说明看完再上手练', key: 'jing' } },
  { id: 10, text: '合租室友总把袜子丢进公用洗衣机，你更可能？', dim: 'gr', a: { label: '贴条或直接说清楚卫生规则', key: 'gang' }, b: { label: '自己多洗一遍，少起冲突', key: 'rou' } },
  { id: 11, text: '看电影时邻座小声剧透，你更可能？', dim: 'gr', a: { label: '提醒他别说了，大家都要看', key: 'gang' }, b: { label: '忍一下，继续看自己的', key: 'rou' } },
  { id: 12, text: '课上老师讲的内容你确定有一处不严谨，你更可能？', dim: 'gr', a: { label: '下课单独去问或指出', key: 'gang' }, b: { label: '记在心里，回去对照书自己分辨', key: 'rou' } },
  { id: 13, text: '分组作业里有人明显划水，你更可能？', dim: 'gr', a: { label: '把分工和截止时间说清楚', key: 'gang' }, b: { label: '自己多做一点，换小组太平', key: 'rou' } },
  { id: 14, text: '朋友说你的新发型「不太适合你」，你更可能？', dim: 'gr', a: { label: '问清楚哪里不好再决定换不换', key: 'gang' }, b: { label: '笑笑说我就喜欢这样', key: 'rou' } },
  { id: 15, text: '拼车司机明显绕了一点路，多收几块钱，你更可能？', dim: 'gr', a: { label: '指出导航，请按合理路线走', key: 'gang' }, b: { label: '金额不大就算了，别吵架', key: 'rou' } },
  { id: 16, text: '亲戚饭桌上拿别人家孩子成绩来比较，你更可能？', dim: 'gr', a: { label: '直接说每个孩子节奏不一样', key: 'gang' }, b: { label: '打圆场夸两句，把话题岔开', key: 'rou' } },
  { id: 17, text: '店家结账时少找了你几块钱，你更可能？', dim: 'gr', a: { label: '当场点清，请对方补上', key: 'gang' }, b: { label: '块八毛就算了', key: 'rou' } },
  { id: 18, text: '父母催婚催得紧，你更常？', dim: 'gr', a: { label: '坦诚讲自己的节奏和底线', key: 'gang' }, b: { label: '打哈哈混过去，少伤和气', key: 'rou' } },
  { id: 19, text: '写报告写到一半，邮箱连弹三封新邮件，你更可能？', dim: 'sj', a: { label: '扫一眼标题，要紧的先回一句', key: 'san' }, b: { label: '开勿扰，把这一段写完再说', key: 'ju' } },
  { id: 20, text: '手机桌面上 App 小红点一堆，你更常？', dim: 'sj', a: { label: '习惯顺手一个个点开清掉', key: 'san' }, b: { label: '只处理聊天和支付，别的随缘', key: 'ju' } },
  { id: 21, text: '相册一年没整理，照片几千张，你更觉得？', dim: 'sj', a: { label: '滑着翻也挺好，像翻日记', key: 'san' }, b: { label: '会抽半天按时间或事件归档', key: 'ju' } },
  { id: 22, text: '同一天朋友约了三场聚会，你更可能？', dim: 'sj', a: { label: '能赶几场赶几场', key: 'san' }, b: { label: '选一场聚透，其余改天', key: 'ju' } },
  { id: 23, text: '背单词/学语言时，你更习惯？', dim: 'sj', a: { label: '换几个 App 轮着来，保持新鲜感', key: 'san' }, b: { label: '一本词书或一个课跟到底', key: 'ju' } },
  { id: 24, text: '书架上未拆封的书越堆越多时，你更常？', dim: 'sj', a: { label: '看到想买的还是会买，总有一天看', key: 'san' }, b: { label: '控制先读完手头的再进新书', key: 'ju' } },
  { id: 25, text: '午休只有二十分钟，你更可能？', dim: 'sj', a: { label: '刷几条短视频再趴一会儿', key: 'san' }, b: { label: '闭目养神或单纯趴桌', key: 'ju' } },
  { id: 26, text: '规划「一年要读的书」，你更倾向？', dim: 'sj', a: { label: '先列一长串，能读几本算几本', key: 'san' }, b: { label: '先定三本读完，再列下一批', key: 'ju' } },
  { id: 27, text: '同时在追三部剧都在更新，你更可能？', dim: 'sj', a: { label: '三部轮着追，都别落下', key: 'san' }, b: { label: '一部追平再开下一部', key: 'ju' } },
  { id: 28, text: '公司年会抽到你上台领奖，你更可能？', dim: 'xz', a: { label: '自然走过去，简单说两句', key: 'xian' }, b: { label: '心里更希望有人代领或快一点结束', key: 'cang' } },
  { id: 29, text: '自己默默坚持跑步三个月，你更可能？', dim: 'xz', a: { label: '偶尔发一条记录，给自己打气', key: 'xian' }, b: { label: '从不发，跑给自己看就行', key: 'cang' } },
  { id: 30, text: '心里有件烦心事一时过不去，你更常？', dim: 'xz', a: { label: '找信任的人喝一杯、说一说', key: 'xian' }, b: { label: '自己消化，写写日记或去运动', key: 'cang' } },
  { id: 31, text: '新买的鞋被同事注意到并夸好看，你更可能？', dim: 'xz', a: { label: '顺着聊两句哪里买的、脚感', key: 'xian' }, b: { label: '谢谢带过，把话题轻轻岔开', key: 'cang' } },
  { id: 32, text: '会上领导方案你有不同看法，你更可能？', dim: 'xz', a: { label: '当场简短表态', key: 'xian' }, b: { label: '散会后私聊或写邮件说明', key: 'cang' } },
  { id: 33, text: '老同学聚会上被提起一件童年糗事，你更可能？', dim: 'xz', a: { label: '一起哈哈当段子讲', key: 'xian' }, b: { label: '有点尴尬，希望快点翻篇', key: 'cang' } },
  { id: 34, text: '做了个特别离谱的梦，早上醒来你更可能？', dim: 'xz', a: { label: '当笑话讲给身边人听', key: 'xian' }, b: { label: '醒了就忘，不值得一提', key: 'cang' } },
  { id: 35, text: '有一笔自己的「小金库」计划（比如旅行基金），你更可能？', dim: 'xz', a: { label: '和伴侣或家人透明商量怎么存', key: 'xian' }, b: { label: '自己有数就行，不必事事摊开', key: 'cang' } },
  { id: 36, text: '别人夸你「最近瘦了」，你更可能？', dim: 'xz', a: { label: '开心接话，多聊几句', key: 'xian' }, b: { label: '说声谢谢，不想多聊身材话题', key: 'cang' } }
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
    if (v === 'n') {
      // 中性选项：两侧各加 0.5，不偏向任何一端
      count[q.a.key] = (count[q.a.key] || 0) + 0.5
      count[q.b.key] = (count[q.b.key] || 0) + 0.5
      return
    }
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
