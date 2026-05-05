/**
 * 业务存储键（固定字符串）。
 *
 * 用户隔离：本小程序未接云开发/自有后端，数据使用 wx.setStorage，键名不含 openid。
 * 微信客户端会按「当前登录的微信账号」隔离本地 Storage，因此同一台手机上
 * 账号 A 与账号 B 的自修记录、个人档案、测验结果、今日心象箴言等互不混用；
 * 同一账号下次打开小程序，数据仍在，直至用户清理小程序缓存/数据或卸载重装。
 *
 * 局限：数据仅存本机该账号沙箱，换机登录同一微信不会自动同步；若需跨设备或防卸载丢失，需接入云开发或后端并按用户 id 读写。
 */
module.exports = {
  PERSONALITY_RESULT: 'personalityResult_v1',
  TRACK_RECORDS: 'trackRecords_v1',
  /** 自修页勾选的重点维度 id 列表（最多 3 项），用于加权排序建议 */
  TRACK_PRIORITIES: 'trackPriorities_v1',
  LOTTERY_TODAY: 'lotteryToday_v2',
  /** 每次成功抽取后追加一条，供展馆与成就统计 */
  LOTTERY_HISTORY: 'lotteryHistory_v1',
  /** 上一轮心象建议纯文本列表，用于降低与下次抽签重复感（仅存本机） */
  LOTTERY_ADVICE_RECENT: 'lotteryAdviceRecent_v1',
  USER_PROFILE: 'userProfile_v2',
  /** 本地使用统计（短键 JSON），见 utils/usage-analytics.js */
  USAGE_STATS: 'usageStats_v1',
  /** 首页「量化×修道」提示条是否已关闭或已点阅（读过后不再自动弹出） */
  THEORY_INTRO_BANNER_DISMISSED: 'theoryIntroBannerDismissed_v1',
  /** 每日打卡：连续天数、累计天数、最后打卡日本地字符串，见 utils/checkin.js */
  CHECKIN_STATE: 'checkinState_v1'
}
