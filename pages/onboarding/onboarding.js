const KEYS = require('../../utils/storage-keys.js')

Page({
  data: {
    current: 0,
    /** 安卓（尤其 MIUI）上 swiper 必须写死高度，flex:1 常得到 0 高度 */
    swiperHeightPx: 520,
    statusBarPx: 0,
    slides: [
      {
        icon: '☽',
        title: '道性自察 · 量化自修',
        body: '将道教文化意象与量化自修结合，以工程诚实面对自己，以道家智慧提醒勿被指标反噬。'
      },
      {
        icon: '◇',
        title: '摇签 · 测验 · 记录',
        body: '每日心象箴言、道性十六型测验、量化自修记录——三位一体的自我觉察工具。'
      },
      {
        icon: '▣',
        title: '数据仅存本机',
        body: '所有记录仅存于您的手机微信账号沙箱内，不上传任何服务器。本工具仅供文化参照与自我观察，非医疗或命理断言。'
      },
      {
        icon: '✦',
        title: '准备好了？',
        body: '可以先快速体验摇签，也可以先完善个人档案以获得更精准的箴言匹配。'
      }
    ]
  },

  onLoad() {
    this._layoutSwiper()
  },

  onShow() {
    this._layoutSwiper()
  },

  onReady() {
    this._layoutSwiper()
  },

  _layoutSwiper() {
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const sb = win.statusBarHeight || 0
      let safeBottom = 0
      if (win.safeAreaInsets) safeBottom = win.safeAreaInsets.bottom || 0
      else if (win.safeArea && win.screenHeight) {
        safeBottom = Math.max(0, win.screenHeight - win.safeArea.bottom)
      }
      const rpx2px = win.windowWidth / 750
      const bottomBlockPx = 300 * rpx2px
      const h = Math.floor(win.windowHeight - sb - bottomBlockPx - safeBottom)
      this.setData({
        statusBarPx: sb,
        swiperHeightPx: Math.max(280, h)
      })
    } catch (e) { console.warn('onboarding:layoutSwiper', e) }
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
    } catch (e) { console.warn('onboarding:markDone', e) }
  }
})
