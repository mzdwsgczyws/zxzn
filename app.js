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
      const info = wx.getSystemInfoSync()
      this.globalData.systemTheme = info.theme || 'light'
    } catch (e) {
      this.globalData.systemTheme = 'light'
    }
  },

  _loadDisplayFont() {
    wx.loadFontFace({
      global: true,
      family: 'DaoDisplay',
      source: 'url("https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/fonts/LXGWWenKai-Regular.woff2")',
      scopes: ['webview', 'native'],
      success: () => { this.globalData.fontLoaded = true },
      fail: () => { this.globalData.fontLoaded = false }
    })
  },

  globalData: {
    userProfile: null,
    systemTheme: 'light',
    fontLoaded: false
  }
})
