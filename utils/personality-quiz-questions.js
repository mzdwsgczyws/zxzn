/**
 * 道性测验题库：每题两择一 + 末项「都难选」由 personality.js 统一追加。
 * 设计原则：两栏均为日常可接受的惯常方式，不褒贬；尽量减少「很冲 / 很怂」措辞，用情境逼选偏好。
 * 计分在选项上用 1.0/1.0 对端累计，等效于 9 题二态投票，在比例上比四档更分散。
 */
module.exports = [
  // 动/静 1–9
  {
    id: 1,
    text: '平日晚间有空时，你更常是：',
    dim: 'dj',
    options: [
      { label: '主动排一点事做，出门见人或学点什么', w: { dong: 1.0 } },
      { label: '能歇就歇，宅着刷剧、发呆或随兴趣来', w: { jing: 1.0 } }
    ]
  },
  {
    id: 2,
    text: '面对一件你不太熟的新任务，你更习惯：',
    dim: 'dj',
    options: [
      { label: '先开个头做起来，在过程里再调整', w: { dong: 1.0 } },
      { label: '先查资料、问人，有谱了再动', w: { jing: 1.0 } }
    ]
  },
  {
    id: 3,
    text: '工作消息在非紧急时段一直弹，你更常：',
    dim: 'dj',
    options: [
      { label: '顺手就回了，省得堆着心里挂着', w: { dong: 1.0 } },
      { label: '先把手头这段做完，再整批看', w: { jing: 1.0 } }
    ]
  },
  {
    id: 4,
    text: '短假出门玩一天，你更偏：',
    dim: 'dj',
    options: [
      { label: '多跑几个点，哪怕赶一点也值', w: { dong: 1.0 } },
      { label: '少而精，留空白路上随心逛', w: { jing: 1.0 } }
    ]
  },
  {
    id: 5,
    text: '压力偏大那几天，你更常靠哪种方式缓一缓？',
    dim: 'dj',
    options: [
      { label: '找人吃饭聊天、动一动出点汗', w: { dong: 1.0 } },
      { label: '少社交，自己静一会、补觉或发呆', w: { jing: 1.0 } }
    ]
  },
  {
    id: 6,
    text: '学一样技能（如乐器、运动），你更对哪种节奏舒服？',
    dim: 'dj',
    options: [
      { label: '手先动起来，练着练着再补理论', w: { dong: 1.0 } },
      { label: '先把要领看懂听会，再系统练', w: { jing: 1.0 } }
    ]
  },
  {
    id: 7,
    text: '家里小东西坏了（比如水滴漏），你更常：',
    dim: 'dj',
    options: [
      { label: '能当天处理就处理掉，不想拖', w: { dong: 1.0 } },
      { label: '暂时能用就先用，有空再管', w: { jing: 1.0 } }
    ]
  },
  {
    id: 8,
    text: '不上班的早晨，你更常：',
    dim: 'dj',
    options: [
      { label: '到点会起，顺路买个早饭或动一动', w: { dong: 1.0 } },
      { label: '能睡就睡，不赶闹钟', w: { jing: 1.0 } }
    ]
  },
  {
    id: 9,
    text: '手上有几件事要推进时，你更常：',
    dim: 'dj',
    options: [
      { label: '几样轮换着来，都动着就不慌', w: { dong: 1.0 } },
      { label: '先啃完一样再开下一样，心更定', w: { jing: 1.0 } }
    ]
  },
  // 刚/柔 10–18
  {
    id: 10,
    text: '和熟人意见不合时，你更常：',
    dim: 'gr',
    options: [
      { label: '把不同点说直，就事论事', w: { gang: 1.0 } },
      { label: '先接情绪，再慢慢说到点上', w: { rou: 1.0 } }
    ]
  },
  {
    id: 11,
    text: '需要拒绝别人的请求时，你更常：',
    dim: 'gr',
    options: [
      { label: '说清「不行」的原因和底线', w: { gang: 1.0 } },
      { label: '语气软一点、找个台阶婉拒', w: { rou: 1.0 } }
    ]
  },
  {
    id: 12,
    text: '在群里被公开误会了一句，你更常：',
    dim: 'gr',
    options: [
      { label: '当场一两句把事实说清', w: { gang: 1.0 } },
      { label: '私聊说明或先冷一下再解释', w: { rou: 1.0 } }
    ]
  },
  {
    id: 13,
    text: '买的东西明显有小毛病但能用，你更常：',
    dim: 'gr',
    options: [
      { label: '会去找商家协商退换或说法', w: { gang: 1.0 } },
      { label: '不折腾了，心累不值得', w: { rou: 1.0 } }
    ]
  },
  {
    id: 14,
    text: '亲戚长辈替你定了一件小事，你更常：',
    dim: 'gr',
    options: [
      { label: '会说出自己更想要的、商量着改', w: { gang: 1.0 } },
      { label: '算了随他们，少争执', w: { rou: 1.0 } }
    ]
  },
  {
    id: 15,
    text: '同事在汇报里少写你一块功劳，你更常：',
    dim: 'gr',
    options: [
      { label: '会找机会说明一下事实', w: { gang: 1.0 } },
      { label: '心里记下，不急着当场撕破脸', w: { rou: 1.0 } }
    ]
  },
  {
    id: 16,
    text: '餐厅上错菜、金额不大，你更常：',
    dim: 'gr',
    options: [
      { label: '跟服务员说一下换/退', w: { gang: 1.0 } },
      { label: '将错就吃，不惹麻烦', w: { rou: 1.0 } }
    ]
  },
  {
    id: 17,
    text: '遇到觉得不公平的明文规则，你更常：',
    dim: 'gr',
    options: [
      { label: '想走正规渠道问清楚、争取改', w: { gang: 1.0 } },
      { label: '先照办，能忍则忍、韬光', w: { rou: 1.0 } }
    ]
  },
  {
    id: 18,
    text: '好友借钱拖着不还，你更常：',
    dim: 'gr',
    options: [
      { label: '会开口提还款和期限', w: { gang: 1.0 } },
      { label: '不好意思催太紧，自己消化', w: { rou: 1.0 } }
    ]
  },
  // 散/聚 19–27
  {
    id: 19,
    text: '写长材料时，邮件和弹窗在跳，你更常：',
    dim: 'sj',
    options: [
      { label: '分神回几条要紧的，再写', w: { san: 1.0 } },
      { label: '先关掉干扰，把这一段写顺', w: { ju: 1.0 } }
    ]
  },
  {
    id: 20,
    text: '未读红点和未读群消息，你更常：',
    dim: 'sj',
    options: [
      { label: '有手感就点一轮清', w: { san: 1.0 } },
      { label: '只留重要的，其他攒一批再处理', w: { ju: 1.0 } }
    ]
  },
  {
    id: 21,
    text: '一年要读/学的东西，你更常：',
    dim: 'sj',
    options: [
      { label: '多开几条线，兴趣来了换着来', w: { san: 1.0 } },
      { label: '先盯住一两样做透再换', w: { ju: 1.0 } }
    ]
  },
  {
    id: 22,
    text: '吃饭时不赶时间，你更常：',
    dim: 'sj',
    options: [
      { label: '下饭吃视频或八卦，多线程', w: { san: 1.0 } },
      { label: '专心吃，手机放一边', w: { ju: 1.0 } }
    ]
  },
  {
    id: 23,
    text: '业余爱好，你更常：',
    dim: 'sj',
    options: [
      { label: '好几个都玩一点，不钻太深', w: { san: 1.0 } },
      { label: '长期只盯一样练下去', w: { ju: 1.0 } }
    ]
  },
  {
    id: 24,
    text: '日计划你更常：',
    dim: 'sj',
    options: [
      { label: '写一长条，能勾多少算多少', w: { san: 1.0 } },
      { label: '只写今天三件，做完再写', w: { ju: 1.0 } }
    ]
  },
  {
    id: 25,
    text: '读公众号或论文，你更常：',
    dim: 'sj',
    options: [
      { label: '多开标签，跳着读接起来', w: { san: 1.0 } },
      { label: '一篇关一篇，读完再开下篇', w: { ju: 1.0 } }
    ]
  },
  {
    id: 26,
    text: '家里家务/整理，你更常：',
    dim: 'sj',
    options: [
      { label: '想哪出是哪出，见缝插针', w: { san: 1.0 } },
      { label: '固定顺序或区域，成套路', w: { ju: 1.0 } }
    ]
  },
  {
    id: 27,
    text: '脑子里冒新想法时，你更常：',
    dim: 'sj',
    options: [
      { label: '能试就试一点，不憋', w: { san: 1.0 } },
      { label: '先写下来，等有空再想周全', w: { ju: 1.0 } }
    ]
  },
  // 显/藏 28–36
  {
    id: 28,
    text: '做成一件你挺得意的事，你更常：',
    dim: 'xz',
    options: [
      { label: '会跟熟人说一声，一起乐一下', w: { xian: 1.0 } },
      { label: '自己知道就好，不特意宣扬', w: { cang: 1.0 } }
    ]
  },
  {
    id: 29,
    text: '心里难受那几天，你更常：',
    dim: 'xz',
    options: [
      { label: '找信任的人讲一讲、散一散', w: { xian: 1.0 } },
      { label: '自己慢慢消化，少跟人细说', w: { cang: 1.0 } }
    ]
  },
  {
    id: 30,
    text: '有一样拿得出手的技能或爱好，你更常：',
    dim: 'xz',
    options: [
      { label: '愿意在人前玩一把、亮一手', w: { xian: 1.0 } },
      { label: '喜欢私下玩，不主动表演', w: { cang: 1.0 } }
    ]
  },
  {
    id: 31,
    text: '被当面夸了你一句，你更常：',
    dim: 'xz',
    options: [
      { label: '顺着聊几句、气氛热一点', w: { xian: 1.0 } },
      { label: '谢谢带过，不展开长聊', w: { cang: 1.0 } }
    ]
  },
  {
    id: 32,
    text: '社交里发生活动态，你更常：',
    dim: 'xz',
    options: [
      { label: '想发就发，当记录', w: { xian: 1.0 } },
      { label: '少发或只发大节点', w: { cang: 1.0 } }
    ]
  },
  {
    id: 33,
    text: '和不熟的人同坐，你更常：',
    dim: 'xz',
    options: [
      { label: '找点话题怕冷场', w: { xian: 1.0 } },
      { label: '对方开口再接，不硬聊', w: { cang: 1.0 } }
    ]
  },
  {
    id: 34,
    text: '一个想法还在琢磨没定型，你更常：',
    dim: 'xz',
    options: [
      { label: '先拎出来跟人说、碰一碰', w: { xian: 1.0 } },
      { label: '想清再开口，少半场讨论', w: { cang: 1.0 } }
    ]
  },
  {
    id: 35,
    text: '身材、收入这类话题，你更常：',
    dim: 'xz',
    options: [
      { label: '熟人问起会聊几句实在的', w: { xian: 1.0 } },
      { label: '能不谈就不谈、绕开', w: { cang: 1.0 } }
    ]
  },
  {
    id: 36,
    text: '和伴侣/家人谈钱、储蓄这类安排，你更常：',
    dim: 'xz',
    options: [
      { label: '摊开了讲数字、一起定', w: { xian: 1.0 } },
      { label: '各管一摊，不事事细说', w: { cang: 1.0 } }
    ]
  }
]
