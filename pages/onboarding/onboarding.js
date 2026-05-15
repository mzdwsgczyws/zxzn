const KEYS = require('../../utils/storage-keys.js')

Page({
  data: {
    current: 0,
    slides: [
      {
        icon: '月',
        title: '道性自察 · 量化自修',
        body: '将道教文化意象与量化自观察结合，以工程诚实面对自己，以道家智慧提醒勿被指标反噬。'
      },
      {
        icon: '签',
        title: '摇签 · 测验 · 记录',
        body: '每日心象箴言、道性十六型测验、量化自修记录——三位一体的自我觉察工具。'
      },
      {
        icon: '本',
        title: '数据仅存本机',
        body: '所有记录仅存于您的手机微信账号沙箱内，不上传任何服务器。本工具仅供文化参照与自我观察，非医疗或命理断言。'
      },
      {
        icon: '启',
        title: '准备好了？',
        body: '可以先快速体验摇签，也可以先完善个人档案以获得更精准的箴言匹配。'
      }
    ]
  },

  onSwiperChange(e) {
    this.setData({ current: e.detail.current })
  },

  startQuick() {
    this._markDone()
    wx.reLaunch({ url: '/pages/index/index' })
  },

  startProfile() {
    this._markDone()
    wx.reLaunch({ url: '/pages/profile/profile?expand=1' })
  },

  skip() {
    this._markDone()
    wx.reLaunch({ url: '/pages/index/index' })
  },

  _markDone() {
    try {
      wx.setStorageSync(KEYS.ONBOARDING_DONE, true)
    } catch (e) {}
  }
})
