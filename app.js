const usageAnalytics = require('./utils/usage-analytics.js')
const { ensureLotArtFont } = require('./utils/lot-font.js')

App({
  onLaunch() {
    usageAnalytics.onAppLaunch()
    ensureLotArtFont()
  },

  onShow() {
    usageAnalytics.onAppShow()
  },

  onHide() {
    usageAnalytics.onAppHide()
  },

  globalData: {
    userProfile: null
  }
})
