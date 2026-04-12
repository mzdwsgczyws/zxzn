/**
 * 道性十六型：动/静、刚/柔、散/聚、显/藏
 *
 * 每题 5 个选项，按倾向程度分配权重：
 *   选项 1 — 强 A 端（权重 1.0 : 0.0）
 *   选项 2 — 偏 A 端（权重 0.75 : 0.25）
 *   选项 3 — 中性 / 不确定（权重 0.5 : 0.5）
 *   选项 4 — 偏 B 端（权重 0.25 : 0.75）
 *   选项 5 — 强 B 端（权重 0.0 : 1.0）
 *
 * 计分后得到四维比例 [dong, gang, san, xian] ∈ [0,1]，与 16 型质心最近邻匹配。
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
 * 36 题，每题 5 个选项 options[]。
 * 每个 option: { label: string, w: { [key]: number } }
 *   w 中 key 为 dong/jing/gang/rou/san/ju/xian/cang，值为该选项对该端的贡献权重。
 *   强 A 端 = 1.0:0.0 | 偏 A = 0.75:0.25 | 中性 = 0.5:0.5 | 偏 B = 0.25:0.75 | 强 B = 0.0:1.0
 */
const QUESTIONS = [
  // ═══════════ 动/静 (dj) 题 1–9 ═══════════
  {
    id: 1, text: '约好晨跑那天下起雨来，你多半会？', dim: 'dj',
    options: [
      { label: '立刻换装去健身房或跑楼梯，不能断', w: { dong: 1.0 } },
      { label: '改去室内做点简单运动补上', w: { dong: 0.75, jing: 0.25 } },
      { label: '看雨大不大再决定，没太强偏好', w: { dong: 0.5, jing: 0.5 } },
      { label: '大概率休息，但心里会记着明天补', w: { dong: 0.25, jing: 0.75 } },
      { label: '顺势休息，改天再说', w: { jing: 1.0 } }
    ]
  },
  {
    id: 2, text: '第一次到陌生城市出差，傍晚有一小段空档，你更可能？', dim: 'dj',
    options: [
      { label: '查好攻略直奔当地特色街区逛一圈', w: { dong: 1.0 } },
      { label: '出门随便走两条街感受一下', w: { dong: 0.75, jing: 0.25 } },
      { label: '看心情，可能出去也可能不出去', w: { dong: 0.5, jing: 0.5 } },
      { label: '在酒店附近散散步，不走远', w: { dong: 0.25, jing: 0.75 } },
      { label: '待在酒店整理次日事、看会儿剧', w: { jing: 1.0 } }
    ]
  },
  {
    id: 3, text: '工作群里突然有人@全体说「很急」，你通常会？', dim: 'dj',
    options: [
      { label: '秒回并主动问需要什么帮助', w: { dong: 1.0 } },
      { label: '先回一句正在看，能插手就先动', w: { dong: 0.75, jing: 0.25 } },
      { label: '点开看一眼，视情况决定回不回', w: { dong: 0.5, jing: 0.5 } },
      { label: '先判断是不是自己的事再决定', w: { dong: 0.25, jing: 0.75 } },
      { label: '忙完手头的再看，急的事自然会找到我', w: { jing: 1.0 } }
    ]
  },
  {
    id: 4, text: '做饭做到一半发现少一味调料，你更常？', dim: 'dj',
    options: [
      { label: '下楼或叫个外卖马上补上，菜不能将就', w: { dong: 1.0 } },
      { label: '先看看邻居能不能借一点', w: { dong: 0.75, jing: 0.25 } },
      { label: '想想有没有替代品，有就换没有再说', w: { dong: 0.5, jing: 0.5 } },
      { label: '用冰箱里别的凑合代替', w: { dong: 0.25, jing: 0.75 } },
      { label: '不放也行，少一味无所谓', w: { jing: 1.0 } }
    ]
  },
  {
    id: 5, text: '长假最后一天下午，返程路上你更倾向？', dim: 'dj',
    options: [
      { label: '一大早就出发，绝不冒堵车风险', w: { dong: 1.0 } },
      { label: '提早动身，怕堵在路上', w: { dong: 0.75, jing: 0.25 } },
      { label: '看实时路况再定出发时间', w: { dong: 0.5, jing: 0.5 } },
      { label: '不太着急，下午慢慢走', w: { dong: 0.25, jing: 0.75 } },
      { label: '笃悠悠待到傍晚再走也行', w: { jing: 1.0 } }
    ]
  },
  {
    id: 6, text: '玩剧本杀时你拿到一条关键线索，你更可能？', dim: 'dj',
    options: [
      { label: '当场说出来推剧情，越快越好', w: { dong: 1.0 } },
      { label: '找个合适时机抛出来引导讨论', w: { dong: 0.75, jing: 0.25 } },
      { label: '看场上气氛，该说就说', w: { dong: 0.5, jing: 0.5 } },
      { label: '先记在心里，多看几轮再提', w: { dong: 0.25, jing: 0.75 } },
      { label: '藏着不说，等别人自己发现', w: { jing: 1.0 } }
    ]
  },
  {
    id: 7, text: '听说常去的那家店下周要歇业，你更可能？', dim: 'dj',
    options: [
      { label: '今天就去，还要叫上朋友一起', w: { dong: 1.0 } },
      { label: '这周末一定再去吃一趟', w: { dong: 0.75, jing: 0.25 } },
      { label: '有空就去，没空也不勉强', w: { dong: 0.5, jing: 0.5 } },
      { label: '心里惦记一下，但不一定专门跑一趟', w: { dong: 0.25, jing: 0.75 } },
      { label: '记在心里，难过一下就算了', w: { jing: 1.0 } }
    ]
  },
  {
    id: 8, text: '取咖啡时前面有人打电话很慢，队伍不动，你更常？', dim: 'dj',
    options: [
      { label: '直接提醒对方让一让，后面排着队呢', w: { dong: 1.0 } },
      { label: '轻声提醒后面还有人排队', w: { dong: 0.75, jing: 0.25 } },
      { label: '看情况，等太久可能会说一声', w: { dong: 0.5, jing: 0.5 } },
      { label: '刷会儿手机，多等一会儿', w: { dong: 0.25, jing: 0.75 } },
      { label: '无所谓，不急这几分钟', w: { jing: 1.0 } }
    ]
  },
  {
    id: 9, text: '学一样完全陌生的技能（比如乐器），你更习惯？', dim: 'dj',
    options: [
      { label: '拿到手就开始摸索，边玩边学', w: { dong: 1.0 } },
      { label: '先摸一摸、弹两下再找教程', w: { dong: 0.75, jing: 0.25 } },
      { label: '教程和实操穿插着来', w: { dong: 0.5, jing: 0.5 } },
      { label: '先把基础说明看完再上手练', w: { dong: 0.25, jing: 0.75 } },
      { label: '系统学完理论再动手，不想走弯路', w: { jing: 1.0 } }
    ]
  },
  // ═══════════ 刚/柔 (gr) 题 10–18 ═══════════
  {
    id: 10, text: '合租室友总把袜子丢进公用洗衣机，你更可能？', dim: 'gr',
    options: [
      { label: '当面严肃说清楚，不改就换室友', w: { gang: 1.0 } },
      { label: '贴条或直接说清楚卫生规则', w: { gang: 0.75, rou: 0.25 } },
      { label: '先暗示一下，不行再正式提', w: { gang: 0.5, rou: 0.5 } },
      { label: '自己多洗一遍，少起冲突', w: { gang: 0.25, rou: 0.75 } },
      { label: '算了，各人有各人的习惯', w: { rou: 1.0 } }
    ]
  },
  {
    id: 11, text: '看电影时邻座小声剧透，你更可能？', dim: 'gr',
    options: [
      { label: '直接说请不要剧透，语气坚定', w: { gang: 1.0 } },
      { label: '提醒他别说了，大家都要看', w: { gang: 0.75, rou: 0.25 } },
      { label: '看对方态度，太过分就说一声', w: { gang: 0.5, rou: 0.5 } },
      { label: '忍一下，继续看自己的', w: { gang: 0.25, rou: 0.75 } },
      { label: '戴上耳机或换个座，不想起冲突', w: { rou: 1.0 } }
    ]
  },
  {
    id: 12, text: '课上老师讲的内容你确定有一处不严谨，你更可能？', dim: 'gr',
    options: [
      { label: '当堂举手指出，学术问题不该含糊', w: { gang: 1.0 } },
      { label: '下课单独去问或指出', w: { gang: 0.75, rou: 0.25 } },
      { label: '看情况，如果影响理解就提一下', w: { gang: 0.5, rou: 0.5 } },
      { label: '记在心里，回去对照书自己分辨', w: { gang: 0.25, rou: 0.75 } },
      { label: '可能是我理解有误，不多想了', w: { rou: 1.0 } }
    ]
  },
  {
    id: 13, text: '分组作业里有人明显划水，你更可能？', dim: 'gr',
    options: [
      { label: '在群里点名说清楚各自任务和后果', w: { gang: 1.0 } },
      { label: '把分工和截止时间说清楚', w: { gang: 0.75, rou: 0.25 } },
      { label: '私下提醒一次，不行再公开说', w: { gang: 0.5, rou: 0.5 } },
      { label: '自己多做一点，换小组太平', w: { gang: 0.25, rou: 0.75 } },
      { label: '默默补上，大家都不容易', w: { rou: 1.0 } }
    ]
  },
  {
    id: 14, text: '朋友说你的新发型「不太适合你」，你更可能？', dim: 'gr',
    options: [
      { label: '直接说我觉得挺好，审美各有不同', w: { gang: 1.0 } },
      { label: '问清楚哪里不好再决定换不换', w: { gang: 0.75, rou: 0.25 } },
      { label: '听听意见，但不一定改', w: { gang: 0.5, rou: 0.5 } },
      { label: '笑笑说我就喜欢这样', w: { gang: 0.25, rou: 0.75 } },
      { label: '嗯嗯好的，下次换个试试', w: { rou: 1.0 } }
    ]
  },
  {
    id: 15, text: '拼车司机明显绕了一点路，多收几块钱，你更可能？', dim: 'gr',
    options: [
      { label: '截图导航投诉，原则问题不让步', w: { gang: 1.0 } },
      { label: '指出导航，请按合理路线走', w: { gang: 0.75, rou: 0.25 } },
      { label: '提一句绕路了，看司机怎么说', w: { gang: 0.5, rou: 0.5 } },
      { label: '金额不大就算了，别吵架', w: { gang: 0.25, rou: 0.75 } },
      { label: '无所谓，到了就行', w: { rou: 1.0 } }
    ]
  },
  {
    id: 16, text: '亲戚饭桌上拿别人家孩子成绩来比较，你更可能？', dim: 'gr',
    options: [
      { label: '认真反驳，这种比较不合适', w: { gang: 1.0 } },
      { label: '直接说每个孩子节奏不一样', w: { gang: 0.75, rou: 0.25 } },
      { label: '看场合，适当回应几句', w: { gang: 0.5, rou: 0.5 } },
      { label: '打圆场夸两句，把话题岔开', w: { gang: 0.25, rou: 0.75 } },
      { label: '笑笑不接话，吃自己的菜', w: { rou: 1.0 } }
    ]
  },
  {
    id: 17, text: '店家结账时少找了你几块钱，你更可能？', dim: 'gr',
    options: [
      { label: '当场核对账单，一分不差', w: { gang: 1.0 } },
      { label: '当场点清，请对方补上', w: { gang: 0.75, rou: 0.25 } },
      { label: '金额大就说，小就看心情', w: { gang: 0.5, rou: 0.5 } },
      { label: '块八毛就算了', w: { gang: 0.25, rou: 0.75 } },
      { label: '完全不在意这点零头', w: { rou: 1.0 } }
    ]
  },
  {
    id: 18, text: '父母催婚催得紧，你更常？', dim: 'gr',
    options: [
      { label: '严肃谈一次，划清边界', w: { gang: 1.0 } },
      { label: '坦诚讲自己的节奏和底线', w: { gang: 0.75, rou: 0.25 } },
      { label: '有时认真说，有时也敷衍', w: { gang: 0.5, rou: 0.5 } },
      { label: '打哈哈混过去，少伤和气', w: { gang: 0.25, rou: 0.75 } },
      { label: '顺着说好好好，反正他们开心就行', w: { rou: 1.0 } }
    ]
  },
  // ═══════════ 散/聚 (sj) 题 19–27 ═══════════
  {
    id: 19, text: '写报告写到一半，邮箱连弹三封新邮件，你更可能？', dim: 'sj',
    options: [
      { label: '全部点开处理完再回来写', w: { san: 1.0 } },
      { label: '扫一眼标题，要紧的先回一句', w: { san: 0.75, ju: 0.25 } },
      { label: '看标题判断，紧急的回，不急的待会儿', w: { san: 0.5, ju: 0.5 } },
      { label: '开勿扰，把这一段写完再说', w: { san: 0.25, ju: 0.75 } },
      { label: '完全不看，写完整篇再统一处理', w: { ju: 1.0 } }
    ]
  },
  {
    id: 20, text: '手机桌面上 App 小红点一堆，你更常？', dim: 'sj',
    options: [
      { label: '一个个全部点开清掉才舒服', w: { san: 1.0 } },
      { label: '习惯顺手一个个点开清掉', w: { san: 0.75, ju: 0.25 } },
      { label: '重要的清一下，其他随缘', w: { san: 0.5, ju: 0.5 } },
      { label: '只处理聊天和支付，别的随缘', w: { san: 0.25, ju: 0.75 } },
      { label: '完全无视，小红点不影响我', w: { ju: 1.0 } }
    ]
  },
  {
    id: 21, text: '相册一年没整理，照片几千张，你更觉得？', dim: 'sj',
    options: [
      { label: '无所谓，想看随手翻就好', w: { san: 1.0 } },
      { label: '滑着翻也挺好，像翻日记', w: { san: 0.75, ju: 0.25 } },
      { label: '偶尔整理一下，但不强求', w: { san: 0.5, ju: 0.5 } },
      { label: '会抽半天按时间或事件归档', w: { san: 0.25, ju: 0.75 } },
      { label: '必须分类归档，乱了找不到', w: { ju: 1.0 } }
    ]
  },
  {
    id: 22, text: '同一天朋友约了三场聚会，你更可能？', dim: 'sj',
    options: [
      { label: '三场全去，赶场也开心', w: { san: 1.0 } },
      { label: '能赶几场赶几场', w: { san: 0.75, ju: 0.25 } },
      { label: '去两场，留点时间给自己', w: { san: 0.5, ju: 0.5 } },
      { label: '选一场聚透，其余改天', w: { san: 0.25, ju: 0.75 } },
      { label: '只去最想去的一场，其余全推', w: { ju: 1.0 } }
    ]
  },
  {
    id: 23, text: '背单词/学语言时，你更习惯？', dim: 'sj',
    options: [
      { label: '同时用好几个 App 和方法，哪个有趣用哪个', w: { san: 1.0 } },
      { label: '换几个 App 轮着来，保持新鲜感', w: { san: 0.75, ju: 0.25 } },
      { label: '主要用一个，偶尔换换口味', w: { san: 0.5, ju: 0.5 } },
      { label: '一本词书或一个课跟到底', w: { san: 0.25, ju: 0.75 } },
      { label: '只用一种方法，深入吃透', w: { ju: 1.0 } }
    ]
  },
  {
    id: 24, text: '书架上未拆封的书越堆越多时，你更常？', dim: 'sj',
    options: [
      { label: '继续买，书多是好事', w: { san: 1.0 } },
      { label: '看到想买的还是会买，总有一天看', w: { san: 0.75, ju: 0.25 } },
      { label: '稍微控制一下，但遇到好书还是忍不住', w: { san: 0.5, ju: 0.5 } },
      { label: '控制先读完手头的再进新书', w: { san: 0.25, ju: 0.75 } },
      { label: '严格一本读完再买下一本', w: { ju: 1.0 } }
    ]
  },
  {
    id: 25, text: '午休只有二十分钟，你更可能？', dim: 'sj',
    options: [
      { label: '刷视频、回消息、吃零食同时进行', w: { san: 1.0 } },
      { label: '刷几条短视频再趴一会儿', w: { san: 0.75, ju: 0.25 } },
      { label: '看心情，有时刷手机有时闭眼', w: { san: 0.5, ju: 0.5 } },
      { label: '闭目养神或单纯趴桌', w: { san: 0.25, ju: 0.75 } },
      { label: '什么都不做，安静休息', w: { ju: 1.0 } }
    ]
  },
  {
    id: 26, text: '规划「一年要读的书」，你更倾向？', dim: 'sj',
    options: [
      { label: '不列计划，遇到什么读什么', w: { san: 1.0 } },
      { label: '先列一长串，能读几本算几本', w: { san: 0.75, ju: 0.25 } },
      { label: '列个大概范围，灵活调整', w: { san: 0.5, ju: 0.5 } },
      { label: '先定三本读完，再列下一批', w: { san: 0.25, ju: 0.75 } },
      { label: '严格按计划一本本推进', w: { ju: 1.0 } }
    ]
  },
  {
    id: 27, text: '同时在追三部剧都在更新，你更可能？', dim: 'sj',
    options: [
      { label: '三部轮着追，还可能再开新剧', w: { san: 1.0 } },
      { label: '三部轮着追，都别落下', w: { san: 0.75, ju: 0.25 } },
      { label: '主追一两部，第三部随缘', w: { san: 0.5, ju: 0.5 } },
      { label: '一部追平再开下一部', w: { san: 0.25, ju: 0.75 } },
      { label: '只追一部，看完再说', w: { ju: 1.0 } }
    ]
  },
  // ═══════════ 显/藏 (xz) 题 28–36 ═══════════
  {
    id: 28, text: '公司年会抽到你上台领奖，你更可能？', dim: 'xz',
    options: [
      { label: '大方上台，顺便讲两句感言', w: { xian: 1.0 } },
      { label: '自然走过去，简单说两句', w: { xian: 0.75, cang: 0.25 } },
      { label: '上去领了就好，不多不少', w: { xian: 0.5, cang: 0.5 } },
      { label: '心里有点紧张，但还是会去', w: { xian: 0.25, cang: 0.75 } },
      { label: '心里更希望有人代领或快一点结束', w: { cang: 1.0 } }
    ]
  },
  {
    id: 29, text: '自己默默坚持跑步三个月，你更可能？', dim: 'xz',
    options: [
      { label: '发朋友圈记录，也鼓励别人一起', w: { xian: 1.0 } },
      { label: '偶尔发一条记录，给自己打气', w: { xian: 0.75, cang: 0.25 } },
      { label: '朋友问起会说，但不主动提', w: { xian: 0.5, cang: 0.5 } },
      { label: '从不发，跑给自己看就行', w: { xian: 0.25, cang: 0.75 } },
      { label: '连身边人都不知道我在跑步', w: { cang: 1.0 } }
    ]
  },
  {
    id: 30, text: '心里有件烦心事一时过不去，你更常？', dim: 'xz',
    options: [
      { label: '找好几个朋友倾诉，说出来就好了', w: { xian: 1.0 } },
      { label: '找信任的人喝一杯、说一说', w: { xian: 0.75, cang: 0.25 } },
      { label: '看情况，有时说有时自己扛', w: { xian: 0.5, cang: 0.5 } },
      { label: '自己消化，写写日记或去运动', w: { xian: 0.25, cang: 0.75 } },
      { label: '闷在心里，过几天自然就淡了', w: { cang: 1.0 } }
    ]
  },
  {
    id: 31, text: '新买的鞋被同事注意到并夸好看，你更可能？', dim: 'xz',
    options: [
      { label: '开心地聊起来，分享链接和穿搭心得', w: { xian: 1.0 } },
      { label: '顺着聊两句哪里买的、脚感', w: { xian: 0.75, cang: 0.25 } },
      { label: '说声谢谢，简单回应', w: { xian: 0.5, cang: 0.5 } },
      { label: '谢谢带过，把话题轻轻岔开', w: { xian: 0.25, cang: 0.75 } },
      { label: '有点不自在，希望别人别注意到', w: { cang: 1.0 } }
    ]
  },
  {
    id: 32, text: '会上领导方案你有不同看法，你更可能？', dim: 'xz',
    options: [
      { label: '当场详细阐述自己的方案', w: { xian: 1.0 } },
      { label: '当场简短表态', w: { xian: 0.75, cang: 0.25 } },
      { label: '看氛围，合适就说不合适就等', w: { xian: 0.5, cang: 0.5 } },
      { label: '散会后私聊或写邮件说明', w: { xian: 0.25, cang: 0.75 } },
      { label: '不说了，执行就好', w: { cang: 1.0 } }
    ]
  },
  {
    id: 33, text: '老同学聚会上被提起一件童年糗事，你更可能？', dim: 'xz',
    options: [
      { label: '自己主动加料讲，逗大家开心', w: { xian: 1.0 } },
      { label: '一起哈哈当段子讲', w: { xian: 0.75, cang: 0.25 } },
      { label: '笑笑配合，不深聊', w: { xian: 0.5, cang: 0.5 } },
      { label: '有点尴尬，希望快点翻篇', w: { xian: 0.25, cang: 0.75 } },
      { label: '很不舒服，想赶紧换话题', w: { cang: 1.0 } }
    ]
  },
  {
    id: 34, text: '做了个特别离谱的梦，早上醒来你更可能？', dim: 'xz',
    options: [
      { label: '发条动态分享，配上搞笑评论', w: { xian: 1.0 } },
      { label: '当笑话讲给身边人听', w: { xian: 0.75, cang: 0.25 } },
      { label: '有人聊天时可能顺嘴提一下', w: { xian: 0.5, cang: 0.5 } },
      { label: '醒了就忘，不值得一提', w: { xian: 0.25, cang: 0.75 } },
      { label: '从不跟人说自己的梦', w: { cang: 1.0 } }
    ]
  },
  {
    id: 35, text: '有一笔自己的「小金库」计划（比如旅行基金），你更可能？', dim: 'xz',
    options: [
      { label: '和家人朋友都聊聊，一起规划', w: { xian: 1.0 } },
      { label: '和伴侣或家人透明商量怎么存', w: { xian: 0.75, cang: 0.25 } },
      { label: '跟最亲近的人提一下就好', w: { xian: 0.5, cang: 0.5 } },
      { label: '自己有数就行，不必事事摊开', w: { xian: 0.25, cang: 0.75 } },
      { label: '完全保密，这是我自己的事', w: { cang: 1.0 } }
    ]
  },
  {
    id: 36, text: '别人夸你「最近瘦了」，你更可能？', dim: 'xz',
    options: [
      { label: '开心分享自己的减肥方法和心得', w: { xian: 1.0 } },
      { label: '开心接话，多聊几句', w: { xian: 0.75, cang: 0.25 } },
      { label: '谢谢，简单回应一下', w: { xian: 0.5, cang: 0.5 } },
      { label: '说声谢谢，不想多聊身材话题', w: { xian: 0.25, cang: 0.75 } },
      { label: '有点不好意思，赶紧转移话题', w: { cang: 1.0 } }
    ]
  }
]

function dist2(a, b) {
  let s = 0
  for (let i = 0; i < 4; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return s
}

/**
 * 计分：遍历每题，根据用户所选选项的 w 权重累加到对应维度计数器。
 * answers: { [questionId]: optionIndex (0–4) }
 *
 * 兼容旧版 'a'/'b'/'n' 格式：a→0, b→4, n→2
 */
function calculatePersonality(answers) {
  const count = { dong: 0, jing: 0, gang: 0, rou: 0, san: 0, ju: 0, xian: 0, cang: 0 }
  QUESTIONS.forEach((q) => {
    let v = answers[q.id]
    if (v == null) return
    // 兼容旧版字符串格式
    if (v === 'a') v = 0
    else if (v === 'b') v = 4
    else if (v === 'n') v = 2
    const idx = typeof v === 'number' ? v : parseInt(v, 10)
    if (isNaN(idx) || idx < 0 || idx >= q.options.length) return
    const w = q.options[idx].w
    Object.keys(w).forEach((k) => {
      count[k] = (count[k] || 0) + w[k]
    })
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
