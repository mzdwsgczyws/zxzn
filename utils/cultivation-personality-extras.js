/**
 * 自修分析页：在通用规则外，为十六型各补 2 条可区分建议（与 lottery 语料不逐字重复意群）
 */
const EX = {
  0: [
    { id: 'pe0a', title: '开势的收绳', adjust: '把「开」控制在单一场景：一场会议只定一个可交付。', reason: '阳行开势者易同时开局过多，用场景边界防耗散。' },
    { id: 'pe0b', title: '局间换气', adjust: '两局之间，冷水洗脸或开窗三十秒，防气血一直顶在脑上。', reason: '外动偏强时，身体需要一个「局间收」。' }
  ],
  1: [
    { id: 'pe1a', title: '阵地的柔性沟通', adjust: '推进不变，但用「你觉得哪一步最卡」问一句。', reason: '定势者目标清晰，补一点对方视角可减反弹。' },
    { id: 'pe1b', title: '阶段碑', adjust: '在日历标「阶段小庆」，不等到终局才许自己好受。', reason: '防长期攻坚无回馈感。' }
  ],
  2: [
    { id: 'pe2a', title: '应变的单管', adjust: '微信只置顶一个主对话，其余一律不红点提示。', reason: '流应者易碎屏；单管能减切换税。' },
    { id: 'pe2b', title: '收束一句话', adjust: '每天睡前写一句：今日最对的一件事（不必大）。', reason: '为飘着的应变提供落点。' }
  ],
  3: [
    { id: 'pe3a', title: '日课不加项', adjust: '本周只保既有日课，不新增；若心痒新习惯，下月再说。', reason: '流归人自我要求高，防「优化成瘾」。' },
    { id: 'pe3b', title: '复盘三行', adjust: '复盘固定三行：事实 / 身体 / 明日一事。', reason: '把条理落在纸上，不留在脑子里空转。' }
  ],
  4: [
    { id: 'pe4a', title: '谋定的时限沙漏', adjust: '设 25 分钟只谋一事，闹铃一响就执行或搁置。', reason: '阴守外放易思过量；时限防溺水。' },
    { id: 'pe4b', title: '对一人说不清单', adjust: '本周对最低伤害的一人练习拒绝一句，不解释三章。', reason: '外放需借小事练边界。' }
  ],
  5: [
    { id: 'pe5a', title: '知行合一的一件恶', adjust: '选拖延最久的小恶，今日反面只做五分钟。', reason: '定元人易理念重；落到微行为破虚妄。' },
    { id: 'pe5b', title: '义理落地尺', adjust: '把一条义理改写成可观察指标：如少一次怼人/多一度睡眠。', reason: '可测即不伤神。' }
  ],
  6: [
    { id: 'pe6a', title: '灵感入场券', adjust: '灵感写下后，必须配「明日十分钟」才有效，否则进冷藏。', reason: '流转者灵感多，防全接。' },
    { id: 'pe6b', title: '节律不辩论', adjust: '固定起床，不跟失眠辩论；起不来也坐起喝水三十秒。', reason: '以行为锚定情绪峰谷。' }
  ],
  7: [
    { id: 'pe7a', title: '退与避的尺', adjust: '拒绝后不当场反复解释；说一次就够。', reason: '归一者易内耗于解释给空气听。' },
    { id: 'pe7b', title: '两联结', adjust: '本周两次出门见自然物（树/河）各十分钟，不拍照也行。', reason: '防退藏到真空。' }
  ],
  8: [
    { id: 'pe8a', title: '蓄与发的合同', adjust: '本周只保一个「可爆发场景」，其他场合刻意七分力。', reason: '潜开者要省着火药。' },
    { id: 'pe8b', title: '说破一句', adjust: '对最信任的人说一句「其实我一直压着……」不必收尾漂亮。', reason: '防堰塞。' }
  ],
  9: [
    { id: 'pe9a', title: '显的练习赛', adjust: '每天只练「一句结论+一句原因」对外。', reason: '潜定者内核稳，要练短显。' },
    { id: 'pe9b', title: '停三秒', adjust: '被惹时先摸一下桌面，再决定说不说。', reason: '以触感打断自动化怼。' }
  ],
  10: [
    { id: 'pe10a', title: '探索回城点', adjust: '出门带「必须回家」闹钟，不凭心情加戏。', reason: '流形好探索，防收不回来。' },
    { id: 'pe10b', title: '体感到记录', adjust: '今日只记身体一处紧/松，不比昨天人格。', reason: '用体感接地，防空飘。' }
  ],
  11: [
    { id: 'pe11a', title: '交付给眼睛', adjust: '写的东西打印一页或导 PDF 换字体再看一遍。', reason: '归核人易细节过耗；换模态可停钻。' },
    { id: 'pe11b', title: '番茄的墙', adjust: '专注时段手机物理离开手够范围。', reason: '防证据搜集成瘾。' }
  ],
  12: [
    { id: 'pe12a', title: '肩背哨兵', adjust: '每小时一次肩外旋三下，不与人争效率。', reason: '外化坚者身体先扛，用微动作放压。' },
    { id: 'pe12b', title: '示弱的剧本', adjust: '预演一句「这次我需要帮助」对指定对象。', reason: '战略性示弱不是输。' }
  ],
  13: [
    { id: 'pe13a', title: '理到线头', adjust: '争论前写：对方在疼什么。写不出就先听。', reason: '定道者易在理上压人。' },
    { id: 'pe13b', title: '落地家务一', adjust: '把今天一条道理变成扫地/叠衣五分钟。', reason: '身体接地防玄思。' }
  ],
  14: [
    { id: 'pe14a', title: '感官单通道', adjust: '吃饭时不谈冲突；听乐时不刷屏。', reason: '游化敏者易过灌。' },
    { id: 'pe14b', title: '微冲突一句', adjust: '对可信任对象练习「我有点不舒服」不展开赏析。', reason: '防回避积压。' }
  ],
  15: [
    { id: 'pe15a', title: '息心计量', adjust: '今日屏时减 15 分钟即赢，不追求零屏。', reason: '守一者宜可测的减噪。' },
    { id: 'pe15b', title: '最小外出', adjust: '若整日未出门，在楼道站两分钟也算。', reason: '防气停滞。' }
  ]
}

function tagsFor(id) {
  if (id === 4 || id === 5 || id === 9 || id === 13) return ['emotion', 'energy']
  if (id === 0 || id === 1 || id === 8 || id === 12) return ['energy', 'body']
  if (id === 6 || id === 7 || id === 14 || id === 15) return ['emotion', 'screen']
  return ['energy', 'emotion']
}

/**
 * @returns {Array<{id,tags,title,adjust,reason}>}
 */
function getPersonalityExtraPlans(typeId) {
  if (typeId == null || typeId < 0 || typeId > 15) return []
  const arr = EX[typeId]
  if (!arr) return []
  return arr.map((e) => ({ ...e, tags: tagsFor(typeId) }))
}

module.exports = { getPersonalityExtraPlans, EX }
