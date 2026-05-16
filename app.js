const usageAnalytics = require('./utils/usage-analytics.js')

App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: 'prod-3gfos7n3a3e061a4' })
    }
    usageAnalytics.onAppLaunch()
    this._initTheme()
    this._loadDisplayFont()
  },

  onShow() {
    usageAnalytics.onAppShow()
  },

  onHide() {
    usageAnalytics.onAppHide()
  },

  onThemeChange(res) {
    this.globalData.systemTheme = res.theme || 'light'
  },

  _initTheme() {
    try {
      const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync()
      this.globalData.systemTheme = info.theme || 'light'
    } catch (e) {
      this.globalData.systemTheme = 'light'
    }
  },

  /** 外链字体 CDN 已失效；样式表已配置 Songti 等系统衬线回退 */
  _loadDisplayFont() {
    this.globalData.fontLoaded = false
  },

  globalData: {
    userProfile: null,
    systemTheme: 'light',
    fontLoaded: false
  }
})
