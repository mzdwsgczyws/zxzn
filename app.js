const usageAnalytics = require('./utils/usage-analytics.js')
const KEYS = require('./utils/storage-keys.js')

App({
  onLaunch() {
    usageAnalytics.onAppLaunch()
    this._initTheme()
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
      const info = wx.getSystemInfoSync()
      this.globalData.systemTheme = info.theme || 'light'
    } catch (e) {
      this.globalData.systemTheme = 'light'
    }
  },

  globalData: {
    userProfile: null,
    systemTheme: 'light'
  }
})
