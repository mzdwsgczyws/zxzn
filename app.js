const usageAnalytics = require('./utils/usage-analytics.js')

App({
  onLaunch() {
    usageAnalytics.onAppLaunch()
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
